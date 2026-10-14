/* ==========================================================================
 * Maps: 20 examples, simple to advanced (Leaflet)
 * ========================================================================== */
(() => {
  const SYD = [-33.87, 151.21];
  const km = m => (m / 1000).toFixed(1) + " km";
  const legend = items => `<div class="ax-ctl ax-small">${items.map(([c, l]) => `<span class="ax-row" style="gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:${c}"></span>${l}</span>`).join("")}</div>`;

  /* Points scattered around Sydney for density examples */
  function cloud(n, seed, spread = 0.35) {
    const r = D.rng(seed), hubs = [[-33.87, 151.21], [-33.82, 151.0], [-33.95, 151.15], [-33.75, 151.25]];
    return Array.from({ length: n }, () => {
      const h = hubs[Math.floor(r() * hubs.length)], g = () => (r() + r() + r() - 1.5) * spread * 0.4;
      return [h[0] + g(), h[1] + g(), r()];
    });
  }

  /* Wobbly route between two points */
  function route(a, b, n, seed) {
    const r = D.rng(seed);
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1), wob = Math.sin(t * Math.PI) * 0.08;
      return [a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 0.02 + wob, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 0.02];
    });
  }

  AX.section("maps", [
    {
      title: "Single Marker",
      level: 1,
      desc: "One location pinned on a map. The simplest way to show where an asset is.",
      render(b) {
        const m = AX.map(b, { center: SYD, zoom: 12, height: 260 });
        L.marker(SYD).addTo(m).bindPopup("<strong>Sydney Plant</strong><br>42 devices").openPopup();
      }
    },
    {
      title: "Markers with Popups",
      level: 1,
      desc: "All sites as markers. Click any marker for its details.",
      render(b) {
        const m = AX.map(b, { height: 260 });
        D.sites.forEach(s => {
          const devs = D.devices.filter(d => d.site === s.name);
          L.marker([s.lat, s.lng]).addTo(m).bindPopup(`<strong>${s.name}</strong><br>${s.region} · ${devs.length} devices<br>${devs.filter(d => d.status !== "Online").length} need attention`);
        });
      }
    },
    {
      title: "Status-Coloured Markers",
      level: 1,
      desc: "Each device coloured by status, so problem areas are visible without clicking anything.",
      render(b) {
        b.innerHTML = legend(Object.entries(AX.STATUS_COLOR).map(([s, c]) => [c, s]));
        const m = AX.map(b, { center: SYD, zoom: 10, height: 240 });
        D.devices.filter(d => d.siteId === "SYD" || d.siteId === "NEW").forEach(d =>
          L.marker([d.lat, d.lng], { icon: AX.dot(AX.STATUS_COLOR[d.status]) }).addTo(m).bindTooltip(`${d.id} · ${d.status}`));
        m.fitBounds(D.devices.filter(d => d.siteId === "SYD").map(d => [d.lat, d.lng]), { padding: [20, 20] });
      }
    },
    {
      title: "Proportional Circles",
      level: 2,
      desc: "Circle size shows a value (total power per site), colour shows its share of alerts.",
      render(b) {
        const m = AX.map(b, { height: 280 });
        D.sites.forEach(s => {
          const devs = D.devices.filter(d => d.site === s.name);
          const kw = devs.reduce((a, d) => a + d.power, 0), alerts = devs.reduce((a, d) => a + d.alerts, 0);
          L.circleMarker([s.lat, s.lng], { radius: 5 + Math.sqrt(kw) * 1.1, color: alerts > 12 ? "#ef4444" : "#4f46e5", fillOpacity: 0.25, weight: 1.5 })
            .addTo(m).bindTooltip(`<strong>${s.name}</strong><br>${F.num(kw, 1)} kW · ${alerts} alerts`);
        });
      }
    },
    {
      title: "Basemap Switcher",
      level: 2,
      desc: "Switch between light, street, dark, terrain and satellite basemaps, and toggle overlay layers on and off.",
      render(b) {
        const m = AX.map(b, { base: null, center: [-34.5, 147], zoom: 5, height: 280 });
        const bases = { Light: AX.tiles("light"), Street: AX.tiles("street"), Dark: AX.tiles("dark"), Terrain: AX.tiles("topo"), Satellite: AX.tiles("satellite") };
        bases.Light.addTo(m);
        const sites = L.layerGroup(D.sites.map(s => L.marker([s.lat, s.lng]).bindTooltip(s.name))).addTo(m);
        const offline = L.layerGroup(D.devices.filter(d => d.status === "Offline").map(d => L.circleMarker([d.lat, d.lng], { radius: 7, color: "#ef4444" }).bindTooltip(d.id)));
        L.control.layers(bases, { Sites: sites, "Offline devices": offline }, { collapsed: false }).addTo(m);
      }
    },
    {
      title: "Marker Clustering",
      level: 2,
      desc: "400 points grouped into clusters that split apart as you zoom in. Keeps dense maps readable.",
      render(b) {
        const m = AX.map(b, { center: SYD, zoom: 9, height: 280 });
        const group = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
        cloud(400, 7).forEach(([lat, lng], i) => group.addLayer(L.marker([lat, lng]).bindPopup(`Meter M-${3000 + i}`)));
        m.addLayer(group);
      }
    },
    {
      title: "Heatmap Layer",
      level: 2,
      desc: "Density surface from 800 readings, weighted by intensity. Shows hot spots rather than individual points.",
      render(b) {
        const m = AX.map(b, { center: SYD, zoom: 10, height: 280 });
        L.heatLayer(cloud(800, 11), { radius: 22, blur: 18, maxZoom: 13, gradient: { 0.3: "#4f46e5", 0.55: "#0d9488", 0.75: "#f59e0b", 1: "#ef4444" } }).addTo(m);
      }
    },
    {
      title: "Status Filter",
      level: 2,
      desc: "Tick boxes show or hide devices by status, with live counts of what is on the map.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl">${Object.entries(AX.STATUS_COLOR).map(([s, c]) => `<label><input type="checkbox" value="${s}" checked> <span style="color:${c};font-weight:600">${s}</span> <span class="ax-muted">(${D.devices.filter(d => d.status === s).length})</span></label>`).join("")}</div>`);
        const m = AX.map(b, { height: 260 });
        const layers = {};
        Object.keys(AX.STATUS_COLOR).forEach(s => {
          layers[s] = L.layerGroup(D.devices.filter(d => d.status === s).map(d => L.marker([d.lat, d.lng], { icon: AX.dot(AX.STATUS_COLOR[s], 12) }).bindTooltip(`${d.id} · ${d.site}`))).addTo(m);
        });
        ctl.addEventListener("change", e => (e.target.checked ? layers[e.target.value].addTo(m) : layers[e.target.value].remove()));
      }
    },
    {
      title: "Search and Fly To",
      level: 2,
      desc: "Type a site or device name and the map flies to it and opens its popup.",
      render(b) {
        const items = [...D.sites.map(s => ({ label: s.name, ll: [s.lat, s.lng], zoom: 11, info: s.region })), ...D.devices.map(d => ({ label: `${d.id} ${d.name}`, ll: [d.lat, d.lng], zoom: 14, info: `${d.site} · ${d.status}` }))];
        const id = "ax-dl-" + Math.random().toString(36).slice(2);
        const ctl = AX.add(b, `<div class="ax-ctl"><input class="ax-input" list="${id}" placeholder="Search sites or devices..." style="flex:1" aria-label="Search"><datalist id="${id}">${items.map(i => `<option value="${i.label}">`).join("")}</datalist><button class="ax-btn ax-btn--primary">Go</button></div>`);
        const m = AX.map(b, { height: 250 });
        const markers = items.map(i => L.circleMarker(i.ll, { radius: 5, color: "#4f46e5" }).addTo(m).bindPopup(`<strong>${i.label}</strong><br>${i.info}`));
        const go = () => {
          const q = ctl.querySelector("input").value.toLowerCase(), i = items.findIndex(x => x.label.toLowerCase().includes(q));
          if (!q || i < 0) return AX.toast("No match found", "bad");
          m.flyTo(items[i].ll, items[i].zoom, { duration: 1.2 });
          m.once("moveend", () => markers[i].openPopup());
        };
        ctl.querySelector("button").addEventListener("click", go);
        ctl.querySelector("input").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
      }
    },
    {
      title: "Asset Route",
      level: 2,
      desc: "A vehicle's trip drawn as a line with start and end markers and the total distance travelled.",
      render(b) {
        const pts = route([-33.87, 151.21], [-32.93, 151.78], 40, 3);
        const info = AX.add(b, `<div class="ax-ctl ax-small"></div>`);
        const m = AX.map(b, { height: 260 });
        const line = L.polyline(pts, { color: "#4f46e5", weight: 4 }).addTo(m);
        L.marker(pts[0], { icon: AX.dot("#10b981", 16) }).addTo(m).bindTooltip("Start 06:10");
        L.marker(pts[pts.length - 1], { icon: AX.dot("#ef4444", 16) }).addTo(m).bindTooltip("End 08:42");
        m.fitBounds(line.getBounds(), { padding: [20, 20] });
        const dist = pts.slice(1).reduce((a, p, i) => a + m.distance(pts[i], p), 0);
        info.innerHTML = `<span class="ax-pill ax-pill--info">Truck T-14</span> ${km(dist)} · 2 h 32 min · avg ${(dist / 1000 / 2.53).toFixed(0)} km/h`;
      }
    },
    {
      title: "Geofence",
      level: 2,
      desc: "A boundary drawn on the map. Devices inside and outside are coloured and counted automatically.",
      render(b) {
        const fence = [[-33.78, 151.05], [-33.75, 151.28], [-33.93, 151.32], [-34.0, 151.1]];
        const info = AX.add(b, `<div class="ax-ctl ax-small"></div>`);
        const m = AX.map(b, { center: SYD, zoom: 10, height: 260 });
        L.polygon(fence, { color: "#4f46e5", fillOpacity: 0.08, dashArray: "6 4" }).addTo(m).bindTooltip("Metro zone");
        const inside = ([y, x]) => { let c = false; for (let i = 0, j = fence.length - 1; i < fence.length; j = i++) { const [yi, xi] = fence[i], [yj, xj] = fence[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
        let n = 0;
        const pts = cloud(60, 21, 0.6);
        pts.forEach(([lat, lng], i) => { const ok = inside([lat, lng]); n += ok; L.marker([lat, lng], { icon: AX.dot(ok ? "#10b981" : "#a1a1aa", 11) }).addTo(m).bindTooltip(`Asset A-${i + 1}: ${ok ? "inside" : "outside"}`); });
        info.innerHTML = `<span class="ax-pill ax-pill--good">${n} inside</span><span class="ax-pill" style="background:#f0f0f2">${pts.length - n} outside</span>`;
      }
    },
    {
      title: "Zone Shading",
      level: 2,
      desc: "Map divided into zones coloured by a value (consumption per zone) with a colour legend.",
      render(b) {
        const scale = ["#eef0ff", "#c7d2fe", "#818cf8", "#4f46e5", "#312e81"];
        const r = D.rng(41), m = AX.map(b, { center: [-33.87, 151.1], zoom: 10, height: 260 });
        for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) {
          const lat = -34.08 + i * 0.07, lng = 150.85 + j * 0.08, v = Math.round(r() * 100);
          L.rectangle([[lat, lng], [lat + 0.07, lng + 0.08]], { weight: 1, color: "#fff", fillColor: scale[Math.min(4, Math.floor(v / 20))], fillOpacity: 0.7 })
            .addTo(m).bindTooltip(`Zone ${String.fromCharCode(65 + i)}${j + 1}: ${v} MWh`);
        }
        const lg = L.control({ position: "bottomright" });
        lg.onAdd = () => AX.el(`<div style="background:#fff;padding:6px 8px;border-radius:6px;font-size:11px;box-shadow:0 1px 4px rgba(0,0,0,.2)">${scale.map((c, i) => `<div><span style="display:inline-block;width:12px;height:10px;background:${c};margin-right:5px"></span>${i * 20} to ${i * 20 + 20}</div>`).join("")}</div>`);
        lg.addTo(m);
      }
    },
    {
      title: "Radius Search",
      level: 3,
      desc: "Click anywhere to find devices within the chosen radius, listed nearest first.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl"><label>Radius <input type="range" min="2" max="40" value="10" aria-label="Radius km"></label><strong data-r>10 km</strong><span class="ax-small ax-muted">Click the map</span></div>`);
        const m = AX.map(b, { center: SYD, zoom: 9, height: 240 });
        const pts = cloud(150, 31, 0.8);
        pts.forEach(([lat, lng]) => L.circleMarker([lat, lng], { radius: 3, color: "#a1a1aa", weight: 1 }).addTo(m));
        const list = AX.add(b, `<ul class="ax-list ax-small" style="max-height:120px;overflow:auto;margin-top:8px"></ul>`);
        let circle, hits = L.layerGroup().addTo(m), centre = null;
        const run = () => {
          if (!centre) return;
          const rad = +ctl.querySelector("input").value * 1000;
          circle?.remove();
          circle = L.circle(centre, { radius: rad, color: "#4f46e5", fillOpacity: 0.08 }).addTo(m);
          hits.clearLayers();
          const found = pts.map(([lat, lng], i) => ({ i, d: m.distance(centre, [lat, lng]), ll: [lat, lng] })).filter(x => x.d <= rad).sort((a, z) => a.d - z.d);
          found.forEach(f => L.circleMarker(f.ll, { radius: 5, color: "#ef4444" }).addTo(hits));
          list.innerHTML = found.length ? found.slice(0, 20).map(f => `<li><span>Sensor S-${100 + f.i}</span><span class="ax-muted">${km(f.d)}</span></li>`).join("") + (found.length > 20 ? `<li class="ax-muted">and ${found.length - 20} more</li>` : "") : "<li class='ax-muted'>Nothing in range</li>";
          ctl.querySelector(".ax-small").textContent = `${found.length} found`;
        };
        m.on("click", e => { centre = e.latlng; run(); });
        ctl.querySelector("input").addEventListener("input", e => { ctl.querySelector("[data-r]").textContent = e.target.value + " km"; run(); });
      }
    },
    {
      title: "Distance Measure",
      level: 3,
      desc: "Click points on the map to draw a path. Shows each leg and the running total distance.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl"><strong data-t>0 km</strong><span class="ax-small ax-muted" data-n>Click the map to start</span><button class="ax-btn ax-btn--sm" data-undo style="margin-left:auto">Undo</button><button class="ax-btn ax-btn--sm" data-clear>Clear</button></div>`);
        const m = AX.map(b, { center: [-33.4, 151.2], zoom: 8, height: 260 });
        const pts = [], layer = L.layerGroup().addTo(m);
        const draw = () => {
          layer.clearLayers();
          let total = 0;
          pts.forEach((p, i) => {
            L.marker(p, { icon: AX.dot("#4f46e5", 12) }).addTo(layer);
            if (i) { const d = m.distance(pts[i - 1], p); total += d; L.polyline([pts[i - 1], p], { color: "#4f46e5", dashArray: "6 6" }).addTo(layer).bindTooltip(km(d), { permanent: true, direction: "center", className: "" }); }
          });
          ctl.querySelector("[data-t]").textContent = km(total);
          ctl.querySelector("[data-n]").textContent = pts.length ? `${pts.length} points, ${Math.max(0, pts.length - 1)} legs` : "Click the map to start";
        };
        m.on("click", e => { pts.push(e.latlng); draw(); });
        ctl.querySelector("[data-undo]").addEventListener("click", () => { pts.pop(); draw(); });
        ctl.querySelector("[data-clear]").addEventListener("click", () => { pts.length = 0; draw(); });
      }
    },
    {
      title: "Live Moving Assets",
      level: 3,
      desc: "Five vehicles update position every 2 seconds, leaving a fading trail. Click one to follow it.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl ax-small"><span class="ax-pill ax-pill--live">Live</span><span data-f>Click a vehicle to follow it</span><button class="ax-btn ax-btn--sm" data-stop hidden>Stop following</button></div>`);
        const m = AX.map(b, { center: SYD, zoom: 10, height: 270 });
        let follow = null;
        const fleet = Array.from({ length: 5 }, (_, i) => {
          const ll = [SYD[0] + (Math.random() - 0.5) * 0.3, SYD[1] + (Math.random() - 0.5) * 0.4];
          const v = { name: `Van V-${21 + i}`, ll, hd: Math.random() * Math.PI * 2, trail: [ll], color: AX.PALETTE[i] };
          v.line = L.polyline(v.trail, { color: v.color, weight: 3, opacity: 0.5 }).addTo(m);
          v.mk = L.marker(ll, { icon: AX.dot(v.color, 16) }).addTo(m).bindTooltip(v.name);
          v.mk.on("click", () => { follow = v; ctl.querySelector("[data-f]").textContent = `Following ${v.name}`; ctl.querySelector("[data-stop]").hidden = false; });
          return v;
        });
        ctl.querySelector("[data-stop]").addEventListener("click", e => { follow = null; e.target.hidden = true; ctl.querySelector("[data-f]").textContent = "Click a vehicle to follow it"; });
        AX.every(2000, () => fleet.forEach(v => {
          v.hd += (Math.random() - 0.5) * 0.8;
          v.ll = [v.ll[0] + Math.sin(v.hd) * 0.008, v.ll[1] + Math.cos(v.hd) * 0.01];
          v.trail = v.trail.concat([v.ll]).slice(-15);
          v.mk.setLatLng(v.ll);
          v.line.setLatLngs(v.trail);
          if (follow === v) m.panTo(v.ll);
        }), b);
      }
    },
    {
      title: "Route Playback",
      level: 3,
      desc: "Replay a recorded trip: play, pause, scrub the timeline and change speed. Shows time and speed at each point.",
      render(b) {
        const pts = route([-37.81, 144.96], [-38.15, 144.36], 120, 9);
        const t0 = Date.now() - 3 * D.HOUR, speeds = D.walk(120, { base: 62, vol: 6, min: 0, max: 100, seed: 4 });
        const ctl = AX.add(b, `<div class="ax-ctl"><button class="ax-btn ax-btn--primary" data-play style="width:70px">Play</button>
          <input type="range" min="0" max="${pts.length - 1}" value="0" style="flex:1" aria-label="Timeline">
          <select class="ax-select" aria-label="Speed"><option value="1">1x</option><option value="3" selected>3x</option><option value="8">8x</option></select></div>`);
        const info = AX.add(b, `<div class="ax-small" style="margin-bottom:8px"></div>`);
        const m = AX.map(b, { height: 250 });
        L.polyline(pts, { color: "#a1a1aa", weight: 3 }).addTo(m);
        const done = L.polyline([], { color: "#4f46e5", weight: 4 }).addTo(m);
        const car = L.marker(pts[0], { icon: AX.dot("#4f46e5", 18) }).addTo(m);
        m.fitBounds(pts, { padding: [20, 20] });
        const slider = ctl.querySelector("input[type=range]"), btn = ctl.querySelector("[data-play]");
        let i = 0, playing = false, acc = 0;
        const go = k => {
          i = k; slider.value = k; car.setLatLng(pts[k]); done.setLatLngs(pts.slice(0, k + 1));
          info.innerHTML = `<strong>${F.time(t0 + k * 90e3)}</strong> · ${Math.round(speeds[k])} km/h · point ${k + 1} of ${pts.length}`;
        };
        slider.addEventListener("input", () => go(+slider.value));
        btn.addEventListener("click", () => { playing = !playing; if (i >= pts.length - 1) go(0); btn.textContent = playing ? "Pause" : "Play"; });
        AX.every(100, () => {
          if (!playing) return;
          acc += +ctl.querySelector("select").value;
          if (acc < 3) return;
          acc = 0;
          if (i >= pts.length - 1) { playing = false; btn.textContent = "Play"; return; }
          go(i + 1);
        }, b);
        go(0);
      }
    },
    {
      title: "Map and Table Linked",
      level: 3,
      wide: true,
      desc: "Click a table row to locate it on the map, or click a marker to highlight its row. Two views, one selection.",
      render(b) {
        const devs = D.devices.filter(d => d.region === "NSW");
        const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:3fr 2fr;gap:12px"></div>`);
        const m = AX.map(AX.add(wrap, "<div></div>"), { height: 320 });
        const tbl = AX.add(wrap, `<div class="ax-table-wrap" style="max-height:320px"><table class="ax-table ax-table--hover ax-table--compact"><thead><tr><th>Device</th><th>Site</th><th>Status</th></tr></thead><tbody>${devs.map((d, i) => `<tr data-i="${i}" style="cursor:pointer"><td>${d.id}</td><td>${d.site.split(" ")[0]}</td><td>${AX.pill(d.status)}</td></tr>`).join("")}</tbody></table></div>`);
        const mks = devs.map((d, i) => L.marker([d.lat, d.lng], { icon: AX.dot(AX.STATUS_COLOR[d.status], 12) }).addTo(m).bindPopup(`<strong>${d.id}</strong> ${d.name}<br>${d.temp}°C · ${d.power} kW`).on("click", () => select(i, false)));
        m.fitBounds(devs.map(d => [d.lat, d.lng]), { padding: [20, 20] });
        const select = (i, fly) => {
          tbl.querySelectorAll("tr").forEach(tr => tr.classList.toggle("is-selected", tr.dataset.i === String(i)));
          const row = tbl.querySelector(`tr[data-i="${i}"]`);
          row.scrollIntoView({ block: "nearest" });
          if (fly) { m.flyTo(mks[i].getLatLng(), 13, { duration: 0.8 }); m.once("moveend", () => mks[i].openPopup()); }
        };
        tbl.addEventListener("click", e => { const tr = e.target.closest("tr[data-i]"); if (tr) select(+tr.dataset.i, true); });
      }
    },
    {
      title: "Time Slider",
      level: 3,
      desc: "Drag through the hours of the day, or press play, to watch readings change across every site.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl"><button class="ax-btn ax-btn--primary" style="width:70px">Play</button><input type="range" min="0" max="23" value="8" style="flex:1" aria-label="Hour"><strong data-h></strong></div>`);
        const m = AX.map(b, { height: 270 });
        const circles = D.sites.map((s, i) => ({ s, vals: D.wave(24, { base: 50, amp: 35, period: 24, noise: 6, seed: i + 3, phase: -6 + (s.lng - 140) / 15 }), c: L.circleMarker([s.lat, s.lng], { weight: 2 }).addTo(m) }));
        const slider = ctl.querySelector("input"), btn = ctl.querySelector("button");
        let playing = false;
        const draw = h => {
          ctl.querySelector("[data-h]").textContent = D.hours[h];
          circles.forEach(({ s, vals, c }) => {
            const v = Math.max(0, vals[h]);
            c.setRadius(4 + v / 4).setStyle({ color: v > 70 ? "#ef4444" : v > 40 ? "#f59e0b" : "#4f46e5", fillOpacity: 0.4 }).bindTooltip(`${s.name}: ${v.toFixed(0)} MW at ${D.hours[h]}`);
          });
        };
        slider.addEventListener("input", () => draw(+slider.value));
        btn.addEventListener("click", () => { playing = !playing; btn.textContent = playing ? "Pause" : "Play"; });
        AX.every(700, () => { if (playing) { slider.value = (+slider.value + 1) % 24; draw(+slider.value); } }, b);
        draw(8);
      }
    },
    {
      title: "Indoor Floor Plan",
      level: 3,
      desc: "A building floor plan instead of a world map. Rooms are shaded by temperature, sensors are clickable.",
      render(b) {
        const m = AX.map(b, { base: null, height: 290, options: { crs: L.CRS.Simple, minZoom: -1, maxZoom: 2, zoomSnap: 0.25, attributionControl: false } });
        const rooms = [["Office A", 0, 0, 40, 30], ["Office B", 40, 0, 80, 30], ["Meeting", 80, 0, 110, 30], ["Open plan", 0, 40, 70, 80], ["Server room", 70, 40, 90, 60], ["Kitchen", 90, 40, 110, 60], ["Store", 70, 60, 110, 80]];
        const r = D.rng(17), col = t => (t > 26 ? "#fca5a5" : t > 23 ? "#fcd34d" : t > 20 ? "#6ee7b7" : "#93c5fd");
        L.rectangle([[-5, -5], [85, 115]], { color: "#a1a1aa", weight: 3, fill: false }).addTo(m);
        L.rectangle([[30, 0], [40, 110]], { color: "#e4e4e7", weight: 0, fillColor: "#f4f4f5", fillOpacity: 1 }).addTo(m).bindTooltip("Corridor");
        rooms.forEach(([name, x0, y0, x1, y1]) => {
          const t = +(name === "Server room" ? 27.5 : 19 + r() * 7).toFixed(1);
          L.rectangle([[y0, x0], [y1, x1]], { color: "#d4d4d8", weight: 2, fillColor: col(t), fillOpacity: 0.45 }).addTo(m).bindTooltip(`${name}`, { permanent: true, direction: "center", className: "ax-room" });
          L.marker([(y0 + y1) / 2 - 6, (x0 + x1) / 2], { icon: AX.dot("#18181b", 10) }).addTo(m).bindPopup(`<strong>${name} sensor</strong><br>${t}°C · ${Math.round(35 + r() * 25)}% RH · CO₂ ${Math.round(450 + r() * 500)} ppm`);
        });
        m.fitBounds([[-5, -5], [85, 115]]);
        b.insertAdjacentHTML("beforeend", legend([["#93c5fd", "< 20°"], ["#6ee7b7", "20 to 23°"], ["#fcd34d", "23 to 26°"], ["#fca5a5", "> 26°"]]));
      }
    },
    {
      title: "Fleet Dashboard Map",
      level: 3,
      wide: true,
      desc: "Clustered devices with status filter and search. The KPI strip recalculates for whatever area is in view.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["", "All"], ["Online", "Online"], ["Warning", "Warning"], ["Offline", "Offline"]], "")}<input class="ax-input" placeholder="Filter by name, type or site..." style="flex:1;max-width:280px" aria-label="Filter"><button class="ax-btn" data-reset>Reset view</button></div>`);
        const kpis = AX.add(b, `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:8px"></div>`);
        const m = AX.map(b, { height: 330 });
        const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 40 }).addTo(m);
        let status = "", rows = [];
        const draw = () => {
          const q = ctl.querySelector("input").value.toLowerCase();
          rows = D.devices.filter(d => (!status || d.status === status) && (!q || `${d.id} ${d.name} ${d.type} ${d.site}`.toLowerCase().includes(q)));
          cluster.clearLayers();
          rows.forEach(d => cluster.addLayer(L.marker([d.lat, d.lng], { icon: AX.dot(AX.STATUS_COLOR[d.status], 13) }).bindPopup(`<strong>${d.id}</strong> ${d.name}<br>${d.site}<br>${AX.pill(d.status)} ${d.temp}°C · ${d.power} kW`)));
          stats();
        };
        const stats = () => {
          const bounds = m.getBounds(), vis = rows.filter(d => bounds.contains([d.lat, d.lng]));
          kpis.innerHTML = [["In view", vis.length], ["Online", vis.filter(d => d.status === "Online").length], ["Need attention", vis.filter(d => d.status !== "Online").length], ["Total kW", F.num(vis.reduce((a, d) => a + d.power, 0), 0)], ["Open alerts", vis.reduce((a, d) => a + d.alerts, 0)]]
            .map(([l, v]) => `<div style="background:var(--rv-bg);border-radius:7px;padding:6px 10px"><div class="ax-small ax-muted">${l}</div><strong style="font-size:16px">${v}</strong></div>`).join("");
        };
        m.on("moveend", stats);
        AX.onSeg(ctl.querySelector(".ax-seg"), v => { status = v; draw(); });
        ctl.querySelector("input").addEventListener("input", draw);
        ctl.querySelector("[data-reset]").addEventListener("click", () => m.setView([-29, 140], 4));
        draw();
      }
    }
  ]);
})();
