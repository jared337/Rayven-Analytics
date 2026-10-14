/* ==========================================================================
 * Cross-industry operational components, added to existing sections:
 * data quality, alarm management, trigger levels, data gaps, state timeline
 * ========================================================================== */
(() => {
  const HOUR = D.HOUR, DAY = D.DAY;

  /* Shared trigger-level track: value against ascending Normal / Alert / Action / Critical thresholds */
  const LEVEL_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
  const LEVEL_NAMES = ["Normal", "Alert", "Action", "Critical"];
  const levelOf = (v, t) => (v >= t[2] ? 3 : v >= t[1] ? 2 : v >= t[0] ? 1 : 0);

  AX.extend("widgets", [
    {
      title: "Data Quality Tiles",
      level: 2,
      desc: "Every value carries its quality: good, stale, estimated, bad or comms lost. Operators can see which numbers to trust.",
      render(b) {
        const tiles = [
          ["Inlet flow", 412.6, "L/s", "good", 1], ["Reservoir level", 78.2, "%", "good", 2],
          ["Discharge pressure", 6.4, "bar", "stale", 135], ["Turbidity", 0.41, "NTU", "estimated", 20],
          ["Chlorine residual", 0.02, "mg/L", "bad", 4], ["Pump 3 current", null, "A", "comms", 190]
        ];
        const Q = {
          good: ["Good", "ok", ""], stale: ["Stale", "warn", "Not updated in"], estimated: ["Estimated", "info", "Calculated"],
          bad: ["Bad quality", "bad", "Sensor fault, flagged"], comms: ["Comms lost", "bad", "No data for"]
        };
        const age = m => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
        const good = tiles.filter(t => t[3] === "good").length;
        b.innerHTML = `
          <div class="ax-ctl"><span class="ax-small"><strong>${good} of ${tiles.length}</strong> values good</span>
            <div class="ax-bar" style="flex:1;max-width:220px"><div style="width:${(good / tiles.length) * 100}%;background:var(--ok)"></div></div></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${tiles.map(([n, v, u, q, m]) => {
            const [label, tone, note] = Q[q], dim = q !== "good";
            return `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;${q === "comms" || q === "bad" ? "background:#fffafa" : ""}">
              <div class="ax-row ax-row--between"><span class="ax-kpi__label">${n}</span>${q === "good" ? "" : `<span class="ax-pill ax-pill--${tone}">${label}</span>`}</div>
              <div style="font-size:22px;font-weight:600;letter-spacing:-.02em;margin-top:2px;font-variant-numeric:tabular-nums;color:${dim ? "var(--ink-3)" : "var(--ink)"};${q === "estimated" ? "font-style:italic" : ""};${q === "bad" ? "text-decoration:line-through" : ""}">${v === null ? "--" : v}<span class="ax-kpi__unit">${u}</span></div>
              <div class="ax-small" style="color:var(--ink-3)">${q === "good" ? `Updated ${age(m)} ago` : `${note}${q === "stale" || q === "comms" ? " " + age(m) : ""}`}</div>
            </div>`;
          }).join("")}</div>`;
      }
    },
    {
      title: "Trigger Level Status",
      level: 2,
      desc: "Instruments against Normal, Alert, Action and Critical trigger levels (TARP style), with the response each level requires.",
      render(b) {
        const inst = [
          ["Piezometer VWP-04", 41.8, "kPa", [35, 45, 55], "Increase reading frequency to daily"],
          ["Bore water level BH-12", 12.1, "m", [15, 18, 20], ""],
          ["Settlement prism P-07", 47, "mm", [25, 40, 60], "Notify geotechnical engineer within 24 h"],
          ["Seepage flow V-notch 2", 2.1, "L/s", [3, 5, 8], ""]
        ];
        b.innerHTML = `<div class="ax-stack">${inst.map(([n, v, u, t, act]) => {
          const max = t[2] * 1.25, lvl = levelOf(v, t), pct = x => Math.min(100, (x / max) * 100);
          const stops = [0, ...t.map(pct), 100];
          return `<div style="margin-bottom:16px">
            <div class="ax-row ax-row--between" style="margin-bottom:6px"><span style="font-size:13px;font-weight:500">${n}</span>
              <span class="ax-row" style="gap:8px"><strong style="font-variant-numeric:tabular-nums">${v} ${u}</strong><span class="ax-pill" style="background:${LEVEL_COLORS[lvl]}1f;color:${LEVEL_COLORS[lvl]}">${LEVEL_NAMES[lvl]}</span></span></div>
            <div style="position:relative;height:8px;border-radius:99px;overflow:hidden;display:flex">${LEVEL_COLORS.map((c, i) => `<div style="width:${stops[i + 1] - stops[i]}%;background:${c};opacity:${i === lvl ? 0.9 : 0.22}"></div>`).join("")}</div>
            <div style="position:relative;height:14px"><span style="position:absolute;left:${pct(v)}%;top:-13px;transform:translateX(-50%);width:3px;height:16px;border-radius:2px;background:#18181b;box-shadow:0 0 0 2px #fff"></span>
              ${t.map((x, i) => `<span class="ax-small" style="position:absolute;left:${pct(x)}%;top:2px;transform:translateX(-50%);color:var(--ink-3);font-size:10.5px">${x}</span>`).join("")}</div>
            ${act ? `<div class="ax-small" style="color:${LEVEL_COLORS[lvl]};font-weight:500">Required: ${act}</div>` : ""}
          </div>`;
        }).join("")}</div>`;
      }
    },
    {
      title: "Industrial Alarm Management",
      level: 3,
      wide: true,
      desc: "ISA-18.2 style: alarm rate against the 1-per-10-minute target, flood detection, priority mix against target, standing alarms and timed shelving.",
      render(b) {
        const now = Date.now(), MIN = 60e3;
        const pri = { 1: ["High", "bad"], 2: ["Medium", "warn"], 3: ["Low", "info"] };
        const alarms = [
          [1, "Pump 3 trip", "PS-North", 6], [2, "High wet well level", "SPS-12", 18], [3, "Door open", "Reservoir R2", 40],
          [2, "Chlorine low", "WTP Clearwater", 95], [3, "UPS on battery", "Gateway GW-4", 1600], [3, "Filter DP high", "WTP Filter 3", 2900],
          [1, "Comms lost", "Bore BH-12", 3]
        ].map(([p, t, src, m], i) => ({ i, p, t, src, at: now - m * MIN, ack: false, shelvedUntil: 0 }));
        const rate = D.walk(72, { base: 2.2, vol: 1.2, min: 0, seed: 404 }).map((v, i) => Math.round(i === 51 ? 14 : i === 52 ? 11 : v));
        b.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px" data-kpis></div>
          <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px">
            <div data-rate></div>
            <div><div class="ax-small" style="font-weight:600;margin-bottom:8px">Priority mix vs ISA-18.2 target</div><div data-mix></div></div>
          </div>
          <div class="ax-ctl" style="margin-top:14px">${AX.seg([["active", "Active"], ["standing", "Standing (> 24 h)"], ["shelved", "Shelved"]], "active")}</div>
          <ul class="ax-list" data-list></ul>`;
        AX.chart(b.querySelector("[data-rate]"), {
          title: { text: "Alarms per 10 min, last 12 h", textStyle: { fontSize: 12 }, left: 0, top: 0 },
          grid: { left: 4, right: 12, top: 30, bottom: 4, containLabel: true },
          xAxis: { type: "time" }, yAxis: { type: "value", minInterval: 1 },
          series: [{
            type: "bar", name: "Alarms", barMaxWidth: 6, data: rate.map((v, i) => ({ value: [now - (71 - i) * 10 * MIN, v], itemStyle: { color: v >= 10 ? "#ef4444" : v > 1 ? "#a5b4fc" : "#4f46e5" } })),
            markLine: { symbol: "none", silent: true, label: { formatter: "{b}", position: "insideEndTop", fontSize: 10 }, data: [
              { name: "Target 1", yAxis: 1, lineStyle: { color: "#10b981", type: "dashed" } },
              { name: "Flood 10", yAxis: 10, lineStyle: { color: "#ef4444", type: "dashed" } }] }
          }]
        }, 170);
        const mix = () => {
          const live = alarms.filter(a => !a.ack), n = live.length || 1;
          const target = { 1: 5, 2: 15, 3: 80 };
          b.querySelector("[data-mix]").innerHTML = [1, 2, 3].map(p => {
            const pc = Math.round((live.filter(a => a.p === p).length / n) * 100);
            return `<div style="margin-bottom:10px"><div class="ax-row ax-row--between ax-small"><span>${pri[p][0]}</span><span><strong>${pc}%</strong> <span style="color:var(--ink-3)">target ${target[p]}%</span></span></div>
              <div style="position:relative" class="ax-bar"><div style="width:${pc}%;background:${pc > target[p] * 1.5 ? "var(--warn)" : "var(--accent)"}"></div></div>
              <div style="position:relative;height:0"><span style="position:absolute;left:${target[p]}%;top:-8px;width:2px;height:8px;background:#18181b"></span></div></div>`;
          }).join("");
        };
        let view = "active";
        const draw = () => {
          const t = Date.now();
          const shelved = alarms.filter(a => a.shelvedUntil > t);
          const active = alarms.filter(a => a.shelvedUntil <= t);
          const standing = active.filter(a => t - a.at > DAY);
          const list = view === "shelved" ? shelved : view === "standing" ? standing : active;
          const avg = (rate.reduce((s, v) => s + v, 0) / rate.length).toFixed(1);
          b.querySelector("[data-kpis]").innerHTML = [
            ["Avg rate / 10 min", avg, +avg > 1 ? "warn" : "ok"], ["Floods (12 h)", rate.filter(v => v >= 10).length, "bad"],
            ["Unacknowledged", active.filter(a => !a.ack).length, "info"], ["Standing", standing.length, standing.length ? "warn" : "ok"]
          ].map(([l, v, tone]) => `<div style="background:var(--paper-2);border:1px solid var(--line);border-radius:10px;padding:8px 12px"><div class="ax-small" style="color:var(--ink-2)">${l}</div><div style="font-size:20px;font-weight:600;color:var(--${tone === "info" ? "ink" : tone})">${v}</div></div>`).join("");
          b.querySelector("[data-list]").innerHTML = list.length ? list.map(a => {
            const mins = Math.round((t - a.at) / MIN);
            return `<li style="opacity:${a.ack ? 0.55 : 1}"><span class="ax-row" style="gap:10px"><span class="ax-pill ax-pill--${pri[a.p][1]}">${pri[a.p][0]}</span><span>${a.t}<br><span class="ax-small" style="color:var(--ink-3)">${a.src} · ${mins >= 1440 ? Math.floor(mins / 1440) + " d" : mins >= 60 ? Math.floor(mins / 60) + " h" : mins + " min"} ago${a.ack ? " · acknowledged" : ""}</span></span></span>
              <span class="ax-row" style="gap:6px">${view === "shelved" ? `<span class="ax-small" style="color:var(--ink-3)">until ${F.time(a.shelvedUntil)}</span><button class="ax-btn ax-btn--sm" data-unshelve="${a.i}">Unshelve</button>`
                : `${a.ack ? "" : `<button class="ax-btn ax-btn--sm" data-ack="${a.i}">Ack</button>`}<select class="ax-select" data-shelve="${a.i}" style="height:28px;font-size:12px" aria-label="Shelve"><option value="">Shelve...</option><option value="1">1 hour</option><option value="8">8 hours</option><option value="24">24 hours</option></select>`}</span></li>`;
          }).join("") : '<li style="color:var(--ink-3)">Nothing here</li>';
          mix();
        };
        b.addEventListener("click", e => {
          const s = e.target.closest(".ax-seg button");
          if (s) { b.querySelectorAll(".ax-seg button").forEach(x => x.classList.toggle("is-active", x === s)); view = s.dataset.v; draw(); }
          if (e.target.dataset.ack) { alarms[+e.target.dataset.ack].ack = true; draw(); }
          if (e.target.dataset.unshelve) { alarms[+e.target.dataset.unshelve].shelvedUntil = 0; draw(); }
        });
        b.addEventListener("change", e => {
          if (!e.target.dataset.shelve || !e.target.value) return;
          const a = alarms[+e.target.dataset.shelve];
          a.shelvedUntil = Date.now() + +e.target.value * HOUR;
          AX.toast(`${a.t} shelved for ${e.target.value} h`);
          draw();
        });
        draw();
      }
    }
  ]);

  AX.extend("timeseries", [
    {
      title: "Data Gaps and Quality",
      level: 3,
      desc: "Real telemetry has holes. Comms outages show as shaded gaps, estimated values as dashed, bad readings as red points. Toggle gap filling.",
      render(b) {
        const n = 168, raw = D.wave(n, { base: 120, amp: 25, noise: 6, seed: 707 });
        const t0 = Math.floor(Date.now() / HOUR) * HOUR - (n - 1) * HOUR, T = i => t0 + i * HOUR;
        const gap = [[40, 52], [118, 123]], est = [80, 92], bad = [27, 63, 101, 140];
        const inGap = i => gap.some(([a, z]) => i >= a && i <= z);
        const good = raw.map((v, i) => [T(i), inGap(i) || (i > est[0] && i < est[1]) ? null : v]);
        const estimated = raw.map((v, i) => [T(i), i >= est[0] && i <= est[1] ? +(v * 0.97).toFixed(1) : null]);
        const badPts = bad.map(i => [T(i), +(raw[i] * 1.6).toFixed(1)]);
        const pctGood = Math.round(((n - gap.reduce((s, [a, z]) => s + z - a + 1, 0) - (est[1] - est[0] + 1) - bad.length) / n) * 100);
        b.innerHTML = `<div class="ax-ctl">
          <span class="ax-pill ax-pill--good">${pctGood}% good</span><span class="ax-pill ax-pill--info">${est[1] - est[0] + 1} h estimated</span>
          <span class="ax-pill ax-pill--bad">${gap.reduce((s, [a, z]) => s + z - a + 1, 0)} h missing · ${bad.length} bad</span>
          <label style="margin-left:auto"><input type="checkbox" data-fill> Fill gaps (linear)</label></div>`;
        const opt = fill => ({
          legend: { top: 0, data: ["Good", "Estimated", "Bad reading"] },
          xAxis: { type: "time" }, yAxis: { type: "value", name: "L/s", scale: true },
          series: [
            { type: "line", name: "Good", data: good, connectNulls: fill, lineStyle: fill ? { width: 2.2 } : undefined,
              markArea: { silent: true, itemStyle: { color: "rgba(161,161,170,.13)" }, label: { color: "#a1a1aa", fontSize: 10 }, data: gap.map(([a, z]) => [{ name: "Comms lost", xAxis: T(a) }, { xAxis: T(z) }]) } },
            { type: "line", name: "Estimated", data: estimated, lineStyle: { type: "dashed", color: "#a5b4fc" }, itemStyle: { color: "#a5b4fc" } },
            { type: "scatter", name: "Bad reading", data: badPts, symbol: "path://M2,2 L10,10 M10,2 L2,10", symbolSize: 9, itemStyle: { color: "#ef4444", borderColor: "#ef4444", borderWidth: 2 } }
          ]
        });
        const c = AX.chart(b, opt(false), 250);
        b.querySelector("[data-fill]").addEventListener("change", e => c.setOption(opt(e.target.checked), true));
      }
    },
    {
      title: "Equipment State Timeline",
      level: 3,
      wide: true,
      desc: "Ten assets over seven days, coloured by state. Availability is calculated per asset. Zoom to any shift, hover a block for its duration.",
      render(b) {
        const states = [["Running", "#4f46e5"], ["Standby", "#c7d2fe"], ["Planned maintenance", "#f59e0b"], ["Breakdown", "#ef4444"]];
        const assets = ["Crusher 1", "Crusher 2", "Conveyor CV-01", "Conveyor CV-02", "Mill A", "Mill B", "Pump P-101", "Pump P-102", "Thickener", "Stacker"];
        const end = Date.now(), start = end - 7 * DAY, data = [], down = [];
        assets.forEach((a, ai) => {
          const r = D.rng(ai * 31 + 5);
          let t = start, s = 0, lost = 0;
          while (t < end) {
            const roll = r();
            s = s !== 0 ? 0 : roll < 0.08 ? 3 : roll < 0.16 ? 2 : roll < 0.45 ? 1 : 0;
            const dur = (s === 0 ? 6 + r() * 30 : s === 1 ? 1 + r() * 5 : s === 2 ? 4 + r() * 6 : 1 + r() * 7) * HOUR;
            const z = Math.min(end, t + dur);
            data.push({ value: [ai, t, z, s], itemStyle: { color: states[s][1] } });
            if (s >= 2) lost += z - t;
            t = z;
          }
          down.push(Math.round((1 - lost / (end - start)) * 1000) / 10);
        });
        b.innerHTML = `<div class="ax-ctl">${states.map(([n, c]) => `<span class="ax-row" style="gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:${c}"></span>${n}</span>`).join("")}</div>`;
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: p => `<b>${assets[p.value[0]]}</b><br>${states[p.value[3]][0]}<br>${F.dateTime(p.value[1])} to ${F.dateTime(p.value[2])}<br>${((p.value[2] - p.value[1]) / HOUR).toFixed(1)} h` },
          grid: { left: 4, right: 70, top: 6, bottom: 46, containLabel: true },
          dataZoom: [{ type: "inside", filterMode: "weakFilter" }, { type: "slider", height: 20, bottom: 6, filterMode: "weakFilter" }],
          xAxis: { type: "time", min: start, max: end },
          yAxis: [
            { type: "category", data: assets, inverse: true, axisLabel: { color: "#52525b", fontSize: 11.5 } },
            { type: "category", data: down.map(v => v + "%"), inverse: true, position: "right", axisLine: { show: false }, axisLabel: { color: "#18181b", fontWeight: 600, fontSize: 11.5, formatter: v => v }, name: "Avail.", nameTextStyle: { color: "#a1a1aa" } }
          ],
          series: [{
            type: "custom", data, encode: { x: [1, 2], y: 0 },
            renderItem(params, api) {
              const a = api.coord([api.value(1), api.value(0)]), z = api.coord([api.value(2), api.value(0)]), h = api.size([0, 1])[1] * 0.62;
              const rect = echarts.graphic.clipRectByRect({ x: a[0], y: a[1] - h / 2, width: Math.max(1, z[0] - a[0] - 0.5), height: h },
                { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height });
              return rect && { type: "rect", shape: { ...rect, r: 2 }, style: { fill: api.visual("color") } };
            }
          }]
        }, 380);
      }
    }
  ]);
})();
