/* ==========================================================================
 * Additions matched to existing Rayven widget patterns: threshold tiles,
 * dumbbell, radial stacked bars, three-axis charts, map-based wind rose,
 * status-coloured clusters, geofence editor and an operational data table
 * ========================================================================== */
(() => {
  const HOUR = D.HOUR;
  const STATUS = AX.STATUS_COLOR;

  AX.extend("widgets", [
    {
      title: "Threshold Edge Tiles",
      level: 1,
      desc: "The last value received, with the tile tinted and edged by where it sits against its thresholds. Updates live.",
      render(b) {
        const tiles = [
          { n: "Tank level", u: "%", v: 64, warn: 80, crit: 90, dir: 1 }, { n: "Line pressure", u: "bar", v: 7.6, warn: 7, crit: 8, dir: 1 },
          { n: "Battery", u: "%", v: 18, warn: 30, crit: 15, dir: -1 }, { n: "Alarm count", u: "", v: 9, warn: 5, crit: 10, dir: 1 }
        ];
        const tone = t => { const hi = x => (t.dir > 0 ? t.v >= x : t.v <= x); return hi(t.crit) ? ["#ef4444", "#fef2f2"] : hi(t.warn) ? ["#f59e0b", "#fffbeb"] : ["#10b981", "#ecfdf5"]; };
        b.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>`;
        const grid = b.firstElementChild;
        const draw = () => {
          grid.innerHTML = tiles.map(t => {
            const [c, bg] = tone(t);
            return `<div style="background:${bg};border:1px solid ${c}33;border-left:4px solid ${c};border-radius:10px;padding:10px 12px;text-align:center;transition:background .4s">
              <div class="ax-small" style="color:var(--ink-2)">${t.n}</div>
              <div style="font-size:26px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${t.v}<span class="ax-kpi__unit">${t.u}</span></div>
              <div class="ax-small" style="color:var(--ink-3)">${t.dir > 0 ? "Warn ≥" : "Warn ≤"} ${t.warn} · Crit ${t.dir > 0 ? "≥" : "≤"} ${t.crit}</div></div>`;
          }).join("");
        };
        draw();
        AX.every(3000, () => {
          tiles.forEach(t => {
            const step = t.u === "bar" ? 0.3 : t.u === "" ? 2 : 6;
            t.v = +Math.max(0, t.v + (Math.random() - 0.5) * step * 2).toFixed(t.u === "bar" ? 1 : 0);
          });
          draw();
        }, b);
      }
    }
  ]);

  AX.extend("charts", [
    {
      title: "Dumbbell Chart",
      level: 2,
      desc: "Lowest and highest reading per item joined by a line, so the size of each swing stands out. The shaded band is the safe range.",
      render(b) {
        const rooms = ["Dispatch", "Bakery", "Produce", "Meat", "Dairy", "Frozen goods"].map((n, i) => {
          const r = D.rng(i + 9), lo = +(0.4 + r() * 2.6).toFixed(1), hi = +(lo + 1 + r() * 6).toFixed(1);
          return { n: `Cold Room ${i + 1} · ${n}`, lo, hi };
        }).sort((a, z) => (z.hi - z.lo) - (a.hi - a.lo));
        const over = rooms.filter(r => r.hi > 5).length;
        b.innerHTML = `<div class="ax-ctl"><span class="ax-pill ax-pill--${over ? "bad" : "good"}">${over ? `${over} room${over === 1 ? "" : "s"} went above 5 °C today` : "All rooms stayed in range"}</span></div>`;
        AX.chart(b, {
          legend: { top: 0, data: ["Lowest", "Highest"] },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => `${p[0].name}<br>Low ${rooms[p[0].dataIndex].lo} °C · High ${rooms[p[0].dataIndex].hi} °C<br>Swing ${(rooms[p[0].dataIndex].hi - rooms[p[0].dataIndex].lo).toFixed(1)} °C` },
          xAxis: { type: "value", name: "°C", min: 0, max: 10 }, yAxis: { type: "category", data: rooms.map(r => r.n), inverse: true, axisLabel: { fontSize: 11 } },
          series: [
            { type: "bar", stack: "d", data: rooms.map(r => r.lo), itemStyle: { color: "transparent" }, silent: true, barWidth: 2,
              markArea: { silent: true, itemStyle: { color: "rgba(79,70,229,.06)" }, label: { color: "#818cf8", fontSize: 10, position: "insideTop" }, data: [[{ name: "Safe 0 to 5 °C", xAxis: 0 }, { xAxis: 5 }]] } },
            { type: "bar", stack: "d", data: rooms.map(r => +(r.hi - r.lo).toFixed(1)), itemStyle: { color: "#d4d4d8", borderRadius: 0 }, barWidth: 2, silent: true },
            { type: "scatter", name: "Lowest", data: rooms.map(r => [r.lo, r.n]), symbolSize: 11, itemStyle: { color: "#0d9488" }, z: 5 },
            { type: "scatter", name: "Highest", data: rooms.map(r => ({ value: [r.hi, r.n], itemStyle: { color: r.hi > 5 ? "#ef4444" : "#4f46e5" } })), symbolSize: 11, itemStyle: { color: "#ef4444" }, z: 5 }
          ]
        }, 270);
      }
    },
    {
      title: "Radial Bar, Stacked",
      level: 2,
      desc: "Bars wrapped around a circle, one ring per site, stacked by sensor type. A compact way to compare totals and their mix.",
      render(b) {
        const sites = ["Warehouse", "Depot", "Site West", "Site East", "Site South", "Site North"];
        const types = [["Temperature", "#4f46e5"], ["Humidity", "#a5b4fc"], ["CO₂", "#0d9488"]];
        AX.chart(b, {
          legend: { right: 0, top: "middle", orient: "vertical" }, tooltip: { trigger: "item", formatter: p => `${p.name}<br>${p.seriesName}: ${p.value} readings` },
          polar: { radius: [24, "80%"], center: ["42%", "52%"] },
          angleAxis: { max: 1300, startAngle: 90, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
          radiusAxis: { type: "category", data: sites, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#52525b", fontSize: 10.5, interval: 0 }, z: 10 },
          series: types.map(([n, c], ti) => ({ type: "bar", name: n, coordinateSystem: "polar", stack: "s", color: c, roundCap: ti === 2, barCategoryGap: "30%",
            data: sites.map((_, si) => Math.round([380, 300, 220][ti] * (0.55 + si * 0.09) * (0.85 + D.rng(si * 3 + ti)() * 0.3))) }))
        }, 300);
      }
    }
  ]);

  AX.extend("timeseries", [
    {
      title: "Multiple Y-Axes",
      level: 2,
      desc: "Three series with different units, each on its own axis. Axis labels take the series colour so it's clear which scale to read.",
      render(b) {
        const n = 52, T = i => Date.now() - (n - 1 - i) * 15 * 60e3;
        const S = [
          ["Flow L/s", "#4f46e5", D.walk(n, { base: 38, vol: 9, min: 2, seed: 61 })],
          ["Level m", "#0d9488", Array.from({ length: n }, (_, i) => +(2 + 2.2 * Math.abs(Math.sin(i / 16))).toFixed(2))],
          ["Pump kW", "#f59e0b", Array.from({ length: n }, (_, i) => ((i % 18) < 11 ? 42 + (i % 3) : 0))]
        ];
        AX.chart(b, {
          legend: { top: 0 }, tooltip: { trigger: "axis" },
          grid: { left: 4, right: 70, top: 36, bottom: 4, containLabel: true },
          xAxis: { type: "time" },
          yAxis: S.map(([name, c], i) => ({ type: "value", name, position: i === 0 ? "left" : "right", offset: i === 2 ? 56 : 0, splitLine: { show: i === 0 },
            axisLine: { show: true, lineStyle: { color: c } }, axisLabel: { color: c }, nameTextStyle: { color: c } })),
          series: S.map(([name, c, v], i) => ({ type: "line", name, yAxisIndex: i, color: c, step: i === 2 ? "end" : false, data: v.map((x, j) => [T(j), x]), ...(i === 1 ? { areaStyle: {} } : {}) }))
        }, 260);
      }
    }
  ]);

  AX.extend("maps", [
    {
      title: "Status-Coloured Clusters",
      level: 2,
      desc: "Nearby devices group into clusters that take the colour of the most serious status inside, so a single critical device is never hidden.",
      render(b) {
        const rank = { Online: 0, Warning: 1, Offline: 2 }, names = { Online: "Normal", Warning: "Warning", Offline: "Critical" };
        const r = D.rng(222);
        const pts = Array.from({ length: 70 }, (_, i) => {
          const hub = [[-33.87, 151.21], [-33.79, 151.02], [-33.95, 151.13], [-33.72, 151.12], [-33.9, 150.9]][i % 5];
          const s = r() < 0.12 ? "Offline" : r() < 0.28 ? "Warning" : "Online";
          return { ll: [hub[0] + (r() - 0.5) * 0.08, hub[1] + (r() - 0.5) * 0.1], s, id: `DEV-${2000 + i}` };
        });
        const m = AX.map(b, { center: [-33.83, 151.06], zoom: 10, height: 320 });
        const group = L.markerClusterGroup({
          showCoverageOnHover: false, maxClusterRadius: 55,
          iconCreateFunction: cl => {
            const worst = cl.getAllChildMarkers().reduce((w, mk) => (rank[mk.options.s] > rank[w] ? mk.options.s : w), "Online"), c = STATUS[worst], n = cl.getChildCount();
            return L.divIcon({ className: "", iconSize: [36, 36], html: `<div style="width:36px;height:36px;border-radius:50%;background:${c}33;display:grid;place-items:center"><div style="width:26px;height:26px;border-radius:50%;background:${c};color:#fff;font:600 12px var(--font);display:grid;place-items:center;box-shadow:0 0 0 2px #fff">${n}</div></div>` });
          }
        });
        pts.forEach(p => group.addLayer(L.marker(p.ll, { icon: AX.dot(STATUS[p.s], 14), s: p.s }).bindPopup(`<strong>${p.id}</strong><br>${AX.pill(p.s)}`)));
        m.addLayer(group);
        const lg = L.control({ position: "bottomleft" });
        lg.onAdd = () => AX.el(`<div style="background:#fff;border-radius:9px;padding:5px 10px;font:500 11.5px var(--font);box-shadow:var(--shadow);display:flex;gap:12px">${Object.keys(rank).map(s => `<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${STATUS[s]};margin-right:5px"></span>${names[s]} (${pts.filter(p => p.s === s).length})</span>`).join("")}</div>`);
        lg.addTo(m);
      }
    },
    {
      title: "Wind Rose on a Map",
      level: 3,
      desc: "Wind direction and speed drawn over the site itself, on a street or satellite base. Click a speed band in the legend to hide it.",
      render(b) {
        const site = [-37.70, 145.06];
        const bands = [["0 to 2 m/s", "#c7d2fe"], ["2 to 4 m/s", "#a5b4fc"], ["4 to 6 m/s", "#818cf8"], ["6 to 8 m/s", "#4f46e5"], ["8 to 10 m/s", "#312e81"]];
        const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const r = D.rng(31), prevail = i => Math.exp(-((Math.min(Math.abs(i - 2.5), 16 - Math.abs(i - 2.5))) ** 2) / 4) + 0.08;
        const freq = dirs.map((_, i) => bands.map((_, bi) => +(prevail(i) * [2.2, 3, 2.6, 1.6, 0.8][bi] * (0.7 + r() * 0.6)).toFixed(2)));
        const hidden = new Set();
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["color", "Map"], ["satellite", "Satellite"]], "color")}<span class="ax-small" style="color:var(--ink-3)">Prevailing wind from the north-east</span></div>`);
        const m = AX.map(b, { center: site, zoom: 14, height: 340, base: null });
        const layers = { color: AX.tiles("color").addTo(m), satellite: AX.tiles("satellite") };
        const svgRose = () => {
          const S = 280, cx = S / 2, cy = S / 2, maxR = 108;
          const tot = freq.map(f => f.reduce((s, v, bi) => s + (hidden.has(bi) ? 0 : v), 0)), mx = Math.max(...freq.map(f => f.reduce((s, v) => s + v, 0)));
          const pt = (a, rr) => [cx + rr * Math.sin(a), cy - rr * Math.cos(a)];
          let wedges = "";
          freq.forEach((f, i) => {
            const a0 = ((i * 22.5 - 9) * Math.PI) / 180, a1 = ((i * 22.5 + 9) * Math.PI) / 180;
            let acc = 0;
            f.forEach((v, bi) => {
              if (hidden.has(bi)) return;
              const r0 = (acc / mx) * maxR, r1 = ((acc + v) / mx) * maxR;
              acc += v;
              const [x0, y0] = pt(a0, r1), [x1, y1] = pt(a1, r1), [x2, y2] = pt(a1, r0), [x3, y3] = pt(a0, r0);
              wedges += `<path d="M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3} Z" fill="${bands[bi][1]}" stroke="#fff" stroke-width=".6"><title>${dirs[i]} ${bands[bi][0]}: ${v}% of hours</title></path>`;
            });
          });
          const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((d, k) => {
            const [x, y] = pt((k * 45 * Math.PI) / 180, 128);
            return `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="#e4e4e7"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#18181b">${d}</text>`;
          }).join("");
          return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" style="font-family:var(--font);overflow:visible">
            <circle cx="${cx}" cy="${cy}" r="${maxR}" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.9)" stroke-width="1.2"/>
            <circle cx="${cx}" cy="${cy}" r="${maxR / 2}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1"/>${wedges}${labels}</svg>`;
        };
        const rose = L.marker(site, { interactive: false, icon: L.divIcon({ className: "", iconSize: [280, 280], iconAnchor: [140, 140], html: svgRose() }) }).addTo(m);
        const lg = L.control({ position: "bottomleft" });
        lg.onAdd = () => {
          const d = AX.el(`<div style="background:rgba(255,255,255,.94);border-radius:9px;padding:5px 8px;font:500 11.5px var(--font);box-shadow:var(--shadow);display:flex;gap:4px">${bands.map(([n, c], i) => `<button type="button" data-b="${i}" style="all:unset;cursor:pointer;padding:2px 6px;border-radius:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:5px"></span>${n}</button>`).join("")}</div>`);
          L.DomEvent.disableClickPropagation(d);
          d.addEventListener("click", e => {
            const btn = e.target.closest("[data-b]");
            if (!btn) return;
            const i = +btn.dataset.b;
            hidden.has(i) ? hidden.delete(i) : hidden.add(i);
            btn.style.opacity = hidden.has(i) ? 0.35 : 1;
            btn.style.textDecoration = hidden.has(i) ? "line-through" : "none";
            rose.setIcon(L.divIcon({ className: "", iconSize: [280, 280], iconAnchor: [140, 140], html: svgRose() }));
          });
          return d;
        };
        lg.addTo(m);
        AX.onSeg(ctl.querySelector(".ax-seg"), v => {
          Object.values(layers).forEach(l => m.removeLayer(l));
          layers[v].addTo(m);
        });
      }
    },
    {
      title: "Geofence Editor",
      level: 3,
      wide: true,
      desc: "Draw rectangles, circles or polygons on the map. Each zone lists the devices inside it, and zones can be sent to a workflow.",
      render(b) {
        const r = D.rng(91), centre = [-37.81, 144.96];
        const devs = Array.from({ length: 26 }, (_, i) => ({ id: `DEV-${3000 + i}`, ll: [centre[0] + (r() - 0.5) * 0.28, centre[1] + (r() - 0.5) * 0.42], s: r() < 0.12 ? "Offline" : r() < 0.35 ? "Warning" : "Online" }));
        const colors = ["#4f46e5", "#0d9488", "#f59e0b", "#ec4899", "#7c3aed", "#0ea5e9"];
        let mode = "", zones = [], draft = null, pts = [], n = 0;
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["", "Select"], ["rect", "Rectangle"], ["circle", "Circle"], ["poly", "Polygon"]], "")}<span class="ax-small" data-hint style="color:var(--ink-3)">Pick a shape, then click on the map</span>
          <button class="ax-btn ax-btn--primary" data-send style="margin-left:auto">Send zones to workflow</button></div>`);
        const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:1fr 260px;gap:12px"></div>`);
        const m = AX.map(AX.add(wrap, "<div></div>"), { center: centre, zoom: 11, height: 380, options: { doubleClickZoom: false } });
        const side = AX.add(wrap, `<div style="border:1px solid var(--line);border-radius:12px;padding:10px 12px;overflow:auto;max-height:380px"></div>`);
        const markers = devs.map(d => L.marker(d.ll, { icon: AX.dot(STATUS[d.s], 13) }).addTo(m).bindPopup(`<strong>${d.id}</strong><br>${AX.pill(d.s)}`));
        const inside = (z, ll) => {
          if (z.kind === "rect") return z.layer.getBounds().contains(ll);
          if (z.kind === "circle") return m.distance(z.layer.getLatLng(), ll) <= z.layer.getRadius();
          const poly = z.layer.getLatLngs()[0].map(p => [p.lat, p.lng]);
          let c = false;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [yi, xi] = poly[i], [yj, xj] = poly[j];
            if ((yi > ll[0]) !== (yj > ll[0]) && ll[1] < ((xj - xi) * (ll[0] - yi)) / (yj - yi) + xi) c = !c;
          }
          return c;
        };
        const drawSide = () => {
          side.innerHTML = `<div style="font-size:12.5px;font-weight:600;margin-bottom:6px">Zones (${zones.length})</div>` + (zones.length ? zones.map((z, i) => {
            const ins = devs.filter(d => inside(z, d.ll));
            return `<div style="border-top:1px solid #f4f4f5;padding:8px 0">
              <div class="ax-row ax-row--between"><span class="ax-row" style="gap:7px"><span style="width:10px;height:10px;border-radius:3px;background:${z.color}"></span><strong style="font-size:13px">${z.name}</strong></span><button class="ax-btn ax-btn--sm ax-btn--ghost" data-del="${i}" aria-label="Delete ${z.name}">Delete</button></div>
              <div class="ax-small" style="color:var(--ink-3)">${z.kind === "poly" ? "Polygon" : z.kind === "rect" ? "Rectangle" : "Circle"} · ${ins.length} device${ins.length === 1 ? "" : "s"} inside</div>
              <div style="margin-top:4px">${ins.map(d => `<span class="ax-pill ax-pill--${d.s.toLowerCase()}" style="margin:2px 3px 0 0">${d.id}</span>`).join("")}</div></div>`;
          }).join("") : '<div class="ax-small" style="color:var(--ink-3)">No zones yet</div>');
        };
        const addZone = (kind, layer) => {
          n++;
          const color = colors[(n - 1) % colors.length], name = `Geofence ${n}`;
          layer.setStyle({ color, weight: 2, fillOpacity: 0.18, dashArray: null });
          layer.bindTooltip(name, { permanent: true, direction: "center", className: "ax-room" });
          zones.push({ kind, layer, name, color });
          drawSide();
        };
        const hint = t => { ctl.querySelector("[data-hint]").textContent = t; };
        const clearDraft = () => { if (draft) m.removeLayer(draft); draft = null; pts = []; };
        m.on("click", e => {
          const ll = e.latlng;
          if (mode === "rect") {
            if (!pts.length) { pts = [ll]; draft = L.rectangle([ll, ll], { color: "#4f46e5", dashArray: "5 5", weight: 2 }).addTo(m); hint("Click the opposite corner"); }
            else { const lyr = draft; draft = null; pts = []; addZone("rect", lyr); hint("Rectangle added. Click to start another"); }
          } else if (mode === "circle") {
            if (!pts.length) { pts = [ll]; draft = L.circle(ll, { radius: 10, color: "#4f46e5", dashArray: "5 5", weight: 2 }).addTo(m); hint("Click to set the radius"); }
            else { const lyr = draft; draft = null; pts = []; addZone("circle", lyr); hint("Circle added. Click to start another"); }
          } else if (mode === "poly") {
            if (pts.length >= 3 && m.latLngToContainerPoint(pts[0]).distanceTo(e.containerPoint) < 12) {
              const lyr = L.polygon(pts).addTo(m); clearDraft(); addZone("poly", lyr); hint("Polygon added. Click to start another"); return;
            }
            pts.push(ll);
            if (draft) m.removeLayer(draft);
            draft = L.polyline(pts, { color: "#4f46e5", dashArray: "5 5", weight: 2 }).addTo(m);
            hint(pts.length < 3 ? "Keep clicking to add points" : "Double-click, or click the first point, to finish");
          }
        });
        m.on("dblclick", () => {
          if (mode !== "poly" || pts.length < 3) return;
          const lyr = L.polygon(pts).addTo(m); clearDraft(); addZone("poly", lyr); hint("Polygon added. Click to start another");
        });
        m.on("mousemove", e => {
          if (!draft || !pts.length) return;
          if (mode === "rect") draft.setBounds([pts[0], e.latlng]);
          if (mode === "circle") draft.setRadius(m.distance(pts[0], e.latlng));
          if (mode === "poly") draft.setLatLngs([...pts, e.latlng]);
        });
        AX.onSeg(ctl.querySelector(".ax-seg"), v => {
          mode = v; clearDraft();
          m.getContainer().style.cursor = v ? "crosshair" : "";
          markers.forEach(mk => { mk.options.interactive = !v; });
          hint(v ? { rect: "Click the first corner", circle: "Click the centre", poly: "Click to add points" }[v] : "Pick a shape, then click on the map");
        });
        side.addEventListener("click", e => {
          if (!e.target.dataset.del) return;
          const z = zones.splice(+e.target.dataset.del, 1)[0];
          m.removeLayer(z.layer);
          drawSide();
        });
        ctl.querySelector("[data-send]").addEventListener("click", () => {
          if (!zones.length) return AX.toast("Draw a zone first", "bad");
          AX.rv("pushPayload", { geofences: zones.map(z => ({ name: z.name, type: z.kind, ...(z.kind === "circle" ? { centre: z.layer.getLatLng(), radius_m: Math.round(z.layer.getRadius()) } : { points: (z.kind === "rect" ? z.layer.getLatLngs()[0] : z.layer.getLatLngs()[0]).map(p => [+p.lat.toFixed(5), +p.lng.toFixed(5)]) }) })) }, 205813, "default");
        });
        // Seed two zones so the panel isn't empty on first view
        addZone("rect", L.rectangle([[-37.79, 144.93], [-37.75, 145.0]]).addTo(m));
        addZone("circle", L.circle([-37.86, 144.98], { radius: 3500 }).addTo(m));
      }
    }
  ]);

  AX.extend("tables", [
    {
      title: "Operational Data Table",
      level: 3,
      wide: true,
      desc: "One row per device with an inline note, an attached file and an acknowledgement status, plus search, sort, paging and download.",
      render(b) {
        const ackOpts = [["Unacknowledged", "warn"], ["Investigating", "info"], ["Acknowledged", "good"]];
        const rows = Array.from({ length: 10 }, (_, i) => {
          const r = D.rng(i + 400), avg = +(30 + r() * 12).toFixed(1), peak = +(70 + r() * 9).toFixed(1);
          return { id: `Device ${i + 1}`, t: Date.now() - (i * 7 + 2) * 60e3, note: i === 3 ? "Check sensor mounting" : "", file: i === 2 ? "pdf" : i === 3 ? "csv" : "", energy: +(44 + r() * 2).toFixed(1), avg, peak, lf: +(avg / peak * 100).toFixed(1), ack: i === 5 ? "Investigating" : "Unacknowledged" };
        });
        const st = { q: "", sort: "energy", dir: -1, page: 0, size: 5 };
        const fileIcon = k => `<svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true"><path d="M3 1h11l6 6v16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="#fff" stroke="${k === "pdf" ? "#ef4444" : "#0d9488"}" stroke-width="1.5"/><rect x="2" y="13" width="18" height="8" rx="1.5" fill="${k === "pdf" ? "#ef4444" : "#0d9488"}"/><text x="11" y="19.4" text-anchor="middle" font-size="6.2" font-weight="700" fill="#fff" font-family="var(--font)">${k.toUpperCase()}</text></svg>`;
        const tools = AX.add(b, `<div class="ax-ctl"><input class="ax-input" type="search" placeholder="Search devices..." style="width:220px" aria-label="Search"><button class="ax-btn" data-dl style="margin-left:auto">Download CSV</button></div>`);
        const box = AX.add(b, "<div></div>"), pager = AX.add(b, `<div class="ax-pager"></div>`);
        const cols = [["id", "Device ID"], ["t", "Timestamp"], ["note", "Note"], ["file", "File"], ["energy", "Energy", 1], ["avg", "Avg power", 1], ["peak", "Peak power", 1], ["lf", "Load factor", 1], ["ack", "Acknowledgement"]];
        const view = () => rows.filter(r => !st.q || `${r.id} ${r.note} ${r.ack}`.toLowerCase().includes(st.q)).sort((a, z) => (a[st.sort] > z[st.sort] ? 1 : a[st.sort] < z[st.sort] ? -1 : 0) * st.dir);
        const draw = () => {
          const list = view(), pages = Math.max(1, Math.ceil(list.length / st.size));
          st.page = Math.min(st.page, pages - 1);
          box.innerHTML = `<div class="ax-table-wrap"><table class="ax-table ax-table--hover"><thead><tr>${cols.map(([k, l, num]) => `<th class="is-sortable ${num ? "num" : ""}" data-k="${k}" aria-sort="${st.sort === k ? (st.dir > 0 ? "ascending" : "descending") : "none"}">${l}${k === "note" ? " ✎" : ""}</th>`).join("")}</tr></thead><tbody>${list.slice(st.page * st.size, (st.page + 1) * st.size).map(r => {
            const tone = ackOpts.find(a => a[0] === r.ack)[1];
            return `<tr><td style="font-weight:500">${r.id}</td><td style="color:var(--ink-2)">${new Date(r.t).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
              <td><input class="ax-input" data-note="${r.id}" value="${F.esc(r.note)}" placeholder="✎ Type a note..." style="width:200px;height:30px"></td>
              <td>${r.file ? `<button type="button" data-file="${r.id}" style="all:unset;cursor:pointer" title="Open ${r.file.toUpperCase()}">${fileIcon(r.file)}</button>` : '<span style="color:var(--ink-3)">-</span>'}</td>
              <td class="num">${r.energy} kWh</td><td class="num">${r.avg} kW</td><td class="num">${r.peak} kW</td><td class="num">${r.lf}%</td>
              <td><select class="ax-select ax-pill--${tone}" data-ack="${r.id}" style="height:28px;font-size:11.5px;font-weight:600;border-radius:999px;border-color:transparent;background-color:var(--${tone === "info" ? "accent" : tone === "good" ? "ok" : "warn"}-soft);color:var(--${tone === "info" ? "accent" : tone === "good" ? "ok" : "warn"})" aria-label="Acknowledgement for ${r.id}">${ackOpts.map(([a]) => `<option ${a === r.ack ? "selected" : ""}>${a}</option>`).join("")}</select></td></tr>`;
          }).join("") || `<tr><td colspan="${cols.length}" class="ax-empty">No matching devices</td></tr>`}</tbody></table></div>`;
          pager.innerHTML = `<span>Showing ${list.length ? st.page * st.size + 1 : 0} to ${Math.min(list.length, (st.page + 1) * st.size)} of ${list.length} devices</span>
            <span class="ax-row" style="gap:4px"><button class="ax-btn ax-btn--sm" data-p="${st.page - 1}" ${st.page ? "" : "disabled"} aria-label="Previous page">‹</button>${Array.from({ length: pages }, (_, i) => `<button class="ax-btn ax-btn--sm ${i === st.page ? "ax-btn--primary" : ""}" data-p="${i}">${i + 1}</button>`).join("")}<button class="ax-btn ax-btn--sm" data-p="${st.page + 1}" ${st.page < pages - 1 ? "" : "disabled"} aria-label="Next page">›</button></span>`;
        };
        tools.querySelector("input").addEventListener("input", e => { st.q = e.target.value.trim().toLowerCase(); st.page = 0; draw(); });
        box.addEventListener("click", e => {
          const th = e.target.closest("th[data-k]");
          if (th) { st.dir = st.sort === th.dataset.k ? -st.dir : 1; st.sort = th.dataset.k; draw(); }
          const f = e.target.closest("[data-file]");
          if (f) AX.toast(`Demo: open the file attached to ${f.dataset.file}`);
        });
        box.addEventListener("change", e => {
          const id = e.target.dataset.note || e.target.dataset.ack;
          if (!id) return;
          const row = rows.find(r => r.id === id);
          if (e.target.dataset.note !== undefined) row.note = e.target.value.trim();
          else row.ack = e.target.value;
          AX.rv("updateDataToTable", "Devices", "onSaved", JSON.stringify({ device: id, note: row.note, acknowledgement: row.ack }));
          draw();
        });
        box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset.note) e.target.blur(); });
        pager.addEventListener("click", e => { if (e.target.dataset.p !== undefined && !e.target.disabled) { st.page = +e.target.dataset.p; draw(); } });
        tools.querySelector("[data-dl]").addEventListener("click", () => {
          AX.download("devices.csv", AX.csv(view().map(r => ({ ...r, t: new Date(r.t).toISOString() })), cols.map(([key, label]) => ({ key, label }))));
          AX.toast("Downloaded devices.csv", "good");
        });
        draw();
      }
    }
  ]);
})();
