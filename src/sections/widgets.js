/* ==========================================================================
 * Assorted Widgets: 20 examples, simple to advanced
 * ========================================================================== */
AX.section("widgets", [
  {
    title: "Single Value",
    level: 1,
    desc: "One number with a label and unit. The most basic widget: show the latest value of one metric.",
    render(b) {
      b.innerHTML = `
        <div class="ax-kpi__label">Energy used today</div>
        <div class="ax-kpi__value">1,284<span class="ax-kpi__unit">kWh</span></div>
        <div class="ax-small ax-muted" style="margin-top:6px">Updated ${F.time(Date.now())}</div>`;
    }
  },
  {
    title: "Value with Change",
    level: 1,
    desc: "Current value compared with the previous period, with a coloured up or down arrow.",
    render(b) {
      const items = [["Avg temperature", "22.4", "°C", 1.8], ["Water usage", "8,910", "L", -6.4]];
      b.innerHTML = `<div class="ax-row" style="gap:28px;flex-wrap:wrap">${items.map(([l, v, u, d]) => `
        <div>
          <div class="ax-kpi__label">${l}</div>
          <div class="ax-kpi__value">${v}<span class="ax-kpi__unit">${u}</span></div>
          <div class="ax-small"><span class="${d >= 0 ? "ax-up" : "ax-down"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}%</span> <span class="ax-muted">vs yesterday</span></div>
        </div>`).join("")}</div>`;
    }
  },
  {
    title: "Value with Sparkline",
    level: 1,
    desc: "A headline number with a small trend line underneath for context on recent movement.",
    render(b) {
      const data = D.walk(48, { base: 340, vol: 14, seed: 11 });
      b.innerHTML = `
        <div class="ax-kpi__label">Throughput (units/h)</div>
        <div class="ax-kpi__value">${F.num(data[data.length - 1])}</div>`;
      AX.chart(b, {
        grid: { left: 0, right: 0, top: 8, bottom: 0 },
        xAxis: { type: "category", show: false, data: data.map((_, i) => i) },
        yAxis: { type: "value", show: false, min: "dataMin" },
        tooltip: { show: false },
        series: [{ type: "line", data, smooth: true, areaStyle: { opacity: 0.12 } }]
      }, 80);
    }
  },
  {
    title: "Progress to Target",
    level: 1,
    desc: "How far a metric is towards a goal. The bar colour changes as it approaches or passes the target.",
    render(b) {
      const goals = [["Monthly production", 8420, 10000, "units"], ["Solar generation", 3120, 3000, "kWh"], ["Water savings", 1250, 4000, "L"]];
      b.innerHTML = goals.map(([l, v, t, u]) => {
        const pct = Math.round((v / t) * 100);
        const color = pct >= 100 ? "var(--rv-good)" : pct >= 60 ? "var(--rv-primary)" : "var(--rv-warn)";
        return `<div style="margin-bottom:14px">
          <div class="ax-row ax-row--between ax-small"><span>${l}</span><span><strong>${F.num(v)}</strong> / ${F.num(t)} ${u} (${pct}%)</span></div>
          <div class="ax-bar" style="margin-top:6px"><div style="width:${Math.min(pct, 100)}%;background:${color}"></div></div>
        </div>`;
      }).join("");
    }
  },
  {
    title: "Radial Gauge",
    level: 1,
    desc: "A classic dial for a single bounded value, such as load as a percentage of capacity.",
    render(b) {
      AX.chart(b, {
        series: [{
          type: "gauge", min: 0, max: 100, startAngle: 205, endAngle: -25, radius: "92%", center: ["50%", "58%"],
          axisLine: { roundCap: true, lineStyle: { width: 14, color: [[1, "#f0f0f2"]] } },
          progress: { show: true, roundCap: true, width: 14, itemStyle: { color: "#4f46e5" } },
          pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false },
          axisLabel: { distance: -34, fontSize: 10.5, color: "#a1a1aa", formatter: v => (v === 0 || v === 100 ? v + "%" : "") },
          detail: { valueAnimation: true, formatter: "{value}%", fontSize: 34, fontWeight: 600, color: "#18181b", offsetCenter: [0, "-4%"] },
          title: { offsetCenter: [0, "26%"], fontSize: 12, color: "#a1a1aa" },
          data: [{ value: 72, name: "of rated capacity" }]
        }]
      }, 230);
    }
  },
  {
    title: "Status Lights",
    level: 1,
    desc: "Traffic-light indicators for system health. Good for showing many on/off or ok/warning/fault states.",
    render(b) {
      const systems = [["Main power", "Online"], ["Backup generator", "Online"], ["Cooling loop", "Warning"], ["Network gateway", "Online"], ["Fire panel", "Online"], ["Compressor B", "Offline"]];
      b.innerHTML = `<ul class="ax-list">${systems.map(([n, s]) => `
        <li><span class="ax-row" style="gap:10px"><span style="width:12px;height:12px;border-radius:50%;background:${AX.STATUS_COLOR[s]};box-shadow:0 0 0 4px ${AX.STATUS_COLOR[s]}22"></span>${n}</span>${AX.pill(s)}</li>`).join("")}</ul>`;
    }
  },
  {
    title: "Battery Levels",
    level: 2,
    desc: "Battery icons per device, coloured by charge, with a count of devices that need attention.",
    render(b) {
      const devs = D.devices.slice(0, 12);
      const color = v => (v < 20 ? "var(--rv-bad)" : v < 45 ? "var(--rv-warn)" : "var(--rv-good)");
      const low = devs.filter(d => d.battery < 20).length;
      b.innerHTML = `
        <div class="ax-small" style="margin-bottom:10px"><span class="ax-pill ax-pill--bad">${low} low</span> <span class="ax-muted">below 20%</span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">${devs.map(d => `
          <div class="ax-small" title="${d.name}, ${d.site}">
            <svg viewBox="0 0 44 20" width="44" height="20" aria-hidden="true">
              <rect x="1" y="1" width="38" height="18" rx="3" fill="none" stroke="#d4d4d8" stroke-width="2"/>
              <rect x="40" y="6" width="3" height="8" rx="1" fill="#d4d4d8"/>
              <rect x="4" y="4" width="${(32 * d.battery) / 100}" height="12" rx="1.5" fill="${color(d.battery)}"/>
            </svg>
            <div><strong>${d.battery}%</strong> <span class="ax-muted">${d.id}</span></div>
          </div>`).join("")}</div>`;
    }
  },
  {
    title: "Tank Levels",
    level: 2,
    desc: "Fill-level vessels with volume, capacity and a high-level alarm line. Levels animate as they change.",
    render(b) {
      const tanks = [{ n: "Tank A", cap: 50000, lvl: 0.78 }, { n: "Tank B", cap: 30000, lvl: 0.42 }, { n: "Tank C", cap: 20000, lvl: 0.93 }];
      b.innerHTML = `<div class="ax-row" style="justify-content:space-around;align-items:flex-end">${tanks.map((t, i) => `
        <div style="text-align:center">
          <div style="position:relative;width:70px;height:140px;border:2px solid #d4d4d8;border-radius:8px 8px 12px 12px;overflow:hidden;background:#fafafa">
            <div data-tank="${i}" style="position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(#6366f1,#4f46e5);transition:height 1s"></div>
            <div style="position:absolute;left:0;right:0;top:10%;border-top:2px dashed var(--rv-bad)" title="High level alarm (90%)"></div>
          </div>
          <div style="margin-top:6px;font-weight:600">${t.n}</div>
          <div class="ax-small ax-muted" data-tank-label="${i}"></div>
        </div>`).join("")}</div>`;
      const draw = () => tanks.forEach((t, i) => {
        b.querySelector(`[data-tank="${i}"]`).style.height = t.lvl * 100 + "%";
        b.querySelector(`[data-tank="${i}"]`).style.background = t.lvl > 0.9 ? "linear-gradient(#fca5a5,#ef4444)" : "linear-gradient(#6366f1,#4f46e5)";
        b.querySelector(`[data-tank-label="${i}"]`).textContent = `${Math.round(t.lvl * 100)}% · ${F.compact(t.lvl * t.cap)} / ${F.compact(t.cap)} L`;
      });
      requestAnimationFrame(draw);
      AX.every(3000, () => { tanks.forEach(t => { t.lvl = Math.min(0.98, Math.max(0.05, t.lvl + (Math.random() - 0.5) * 0.08)); }); draw(); }, b);
    }
  },
  {
    title: "Banded Gauge",
    level: 2,
    desc: "Gauge with normal, warning and critical bands. Switch between metrics to reuse the same widget.",
    render(b) {
      const metrics = {
        temp: { name: "Temperature", unit: "°C", min: 0, max: 60, value: 41, bands: [[0.6, "#10b981"], [0.8, "#f59e0b"], [1, "#ef4444"]] },
        pressure: { name: "Pressure", unit: "bar", min: 0, max: 10, value: 8.7, bands: [[0.5, "#10b981"], [0.85, "#f59e0b"], [1, "#ef4444"]] },
        vibration: { name: "Vibration", unit: "mm/s", min: 0, max: 20, value: 4.2, bands: [[0.4, "#10b981"], [0.7, "#f59e0b"], [1, "#ef4444"]] }
      };
      const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["temp", "Temperature"], ["pressure", "Pressure"], ["vibration", "Vibration"]], "temp")}</div>`);
      const opt = m => ({
        series: [{
          type: "gauge", min: m.min, max: m.max, splitNumber: 4, startAngle: 210, endAngle: -30, radius: "90%", center: ["50%", "56%"],
          axisLine: { lineStyle: { width: 8, color: m.bands } },
          pointer: { length: "58%", width: 4, offsetCenter: [0, 0], itemStyle: { color: "#18181b" } },
          anchor: { show: true, size: 12, itemStyle: { color: "#fff", borderColor: "#18181b", borderWidth: 3 } },
          axisTick: { show: false }, splitLine: { show: false },
          axisLabel: { distance: 16, fontSize: 10.5, color: "#a1a1aa" },
          title: { offsetCenter: [0, "86%"], fontSize: 12, color: "#a1a1aa" },
          detail: { formatter: `{value} ${m.unit}`, fontSize: 24, fontWeight: 600, color: "#18181b", offsetCenter: [0, "56%"] },
          data: [{ value: m.value, name: m.name }]
        }]
      });
      const c = AX.chart(b, opt(metrics.temp), 220);
      AX.onSeg(ctl.querySelector(".ax-seg"), v => c.setOption(opt(metrics[v])));
    }
  },
  {
    title: "Thermometer",
    level: 2,
    desc: "Vertical thermometer showing the current value plus today's minimum and maximum markers.",
    render(b) {
      const cur = 27.4, lo = 18.2, hi = 31.6, min = 0, max = 45;
      const pos = v => ((v - min) / (max - min)) * 100;
      b.innerHTML = `
        <div class="ax-row" style="justify-content:center;gap:40px;padding:6px 0 18px">
          <div style="position:relative;width:110px;height:190px">
            <div style="position:absolute;left:0;top:0;width:22px;height:170px;background:#f0f0f2;border-radius:11px">
              <div style="position:absolute;left:5px;right:5px;bottom:5px;height:calc(${pos(cur)}% - 10px);background:linear-gradient(#fca5a5,#ef4444);border-radius:7px"></div>
            </div>
            <div style="position:absolute;left:-6px;top:156px;width:34px;height:34px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 5px #f0f0f2"></div>
            ${[[hi, "Max"], [lo, "Min"]].map(([v, l]) => `
              <div style="position:absolute;left:28px;top:${170 - (170 * pos(v)) / 100}px;transform:translateY(-50%);display:flex;align-items:center;gap:6px;white-space:nowrap">
                <span style="width:10px;height:1.5px;background:#d4d4d8"></span><span class="ax-small" style="color:var(--ink-3)">${l}</span><strong class="ax-small">${v}°</strong>
              </div>`).join("")}
          </div>
          <div>
            <div class="ax-kpi__label">Server room</div>
            <div class="ax-kpi__value">${cur}<span class="ax-kpi__unit">°C</span></div>
            <div class="ax-small" style="color:var(--ink-3);margin-top:4px">Range today ${lo}° to ${hi}°</div>
            <span class="ax-pill ax-pill--warn" style="margin-top:10px">Above 25° target</span>
          </div>
        </div>`;
    }
  },
  {
    title: "Bullet Charts",
    level: 2,
    desc: "Compact actual-vs-target bars over poor, ok and good ranges. Shows several KPIs in little space.",
    render(b) {
      const kpis = [["Output", 82, 90], ["Quality", 96, 95], ["Availability", 71, 85], ["Efficiency", 88, 80]];
      AX.chart(b, {
        grid: { left: 8, right: 24, top: 6, bottom: 4, containLabel: true },
        tooltip: { trigger: "axis", axisPointer: { type: "none" } },
        xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
        // Second hidden category axis lets the actual bar sit centred on top of the range bands
        yAxis: [
          { type: "category", data: kpis.map(k => k[0]), inverse: true },
          { type: "category", data: kpis.map(k => k[0]), inverse: true, show: false }
        ],
        series: [
          ...[[60, "#f2f2f4"], [25, "#e4e4e7"], [15, "#d4d4d8"]].map(([v, c]) => ({
            type: "bar", stack: "bg", data: kpis.map(() => v), barWidth: 22, itemStyle: { color: c, borderRadius: 0 }, silent: true, tooltip: { show: false }
          })),
          { type: "bar", name: "Actual", yAxisIndex: 1, data: kpis.map(k => k[1]), barWidth: 8, z: 3, itemStyle: { color: "#18181b", borderRadius: 0 } },
          { type: "scatter", name: "Target", yAxisIndex: 1, data: kpis.map(k => k[2]), symbol: "rect", symbolSize: [3, 22], z: 4, itemStyle: { color: "#ef4444" } }
        ]
      }, 200);
    }
  },
  {
    title: "Live Value Ticker",
    level: 2,
    desc: "Value refreshes every 1.5 s, flashing green or red by direction, with session min, max and update count.",
    render(b) {
      let v = 101.3, lo = v, hi = v, n = 0;
      b.innerHTML = `
        <div class="ax-kpi__label">Line pressure (kPa) <span class="ax-pill ax-pill--live" style="margin-left:6px">Live</span></div>
        <div class="ax-kpi__value" data-v style="transition:color .4s">${v}</div>
        <div class="ax-small ax-muted" data-s></div>`;
      const valEl = b.querySelector("[data-v]"), stats = b.querySelector("[data-s]");
      const tick = () => {
        const prev = v;
        v = +(v + (Math.random() - 0.5) * 1.6).toFixed(1);
        lo = Math.min(lo, v); hi = Math.max(hi, v); n++;
        valEl.textContent = v;
        valEl.style.color = v > prev ? "var(--rv-good)" : v < prev ? "var(--rv-bad)" : "";
        setTimeout(() => { valEl.style.color = ""; }, 600);
        stats.textContent = `Min ${lo} · Max ${hi} · ${n} updates`;
      };
      tick();
      AX.every(1500, tick, b);
    }
  },
  {
    title: "Uptime Counter",
    level: 2,
    desc: "Counts up live from the last restart and shows availability over the last 30 days as a strip.",
    render(b) {
      const since = Date.now() - (D.DAY * 12 + 3600e3 * 7 + 1260e3);
      const days = Array.from({ length: 30 }, (_, i) => (i === 8 ? "Offline" : i === 19 || i === 20 ? "Warning" : "Online"));
      b.innerHTML = `
        <div class="ax-kpi__label">Running since ${F.dateTime(since)}</div>
        <div class="ax-kpi__value" data-up style="font-size:26px"></div>
        <div class="ax-small" style="margin:12px 0 6px">Last 30 days · <strong>99.4%</strong> available</div>
        <div style="display:flex;gap:3px">${days.map((s, i) => `<div title="Day ${i + 1}: ${s}" style="flex:1;height:26px;border-radius:3px;background:${AX.STATUS_COLOR[s]}"></div>`).join("")}</div>`;
      const up = b.querySelector("[data-up]");
      const tick = () => {
        let s = Math.floor((Date.now() - since) / 1000);
        const d = Math.floor(s / 86400); s %= 86400;
        up.textContent = `${d}d ${F.pad(Math.floor(s / 3600))}h ${F.pad(Math.floor((s % 3600) / 60))}m ${F.pad(s % 60)}s`;
      };
      tick();
      AX.every(1000, tick, b);
    }
  },
  {
    title: "Device Status Grid",
    level: 2,
    desc: "Every device as a coloured tile. Filter by status, and hover a tile for details.",
    render(b) {
      const counts = s => D.devices.filter(d => !s || d.status === s).length;
      const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["", `All ${counts()}`], ["Online", `Online ${counts("Online")}`], ["Warning", `Warning ${counts("Warning")}`], ["Offline", `Offline ${counts("Offline")}`]], "")}</div>`);
      const grid = AX.add(b, `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(30px,1fr));gap:5px"></div>`);
      const draw = f => {
        grid.innerHTML = D.devices.map(d => `<div title="${d.id} · ${d.name}\n${d.site}\n${d.status}, ${d.temp}°C" style="aspect-ratio:1;border-radius:5px;background:${AX.STATUS_COLOR[d.status]};opacity:${!f || d.status === f ? 1 : 0.12};transition:opacity .2s"></div>`).join("");
      };
      draw("");
      AX.onSeg(ctl.querySelector(".ax-seg"), draw);
    }
  },
  {
    title: "Control Switches",
    level: 2,
    desc: "On/off toggles that send a command to a device. Asks for confirmation, then calls pushPayload().",
    render(b) {
      const items = [["Pump 1", true, "DEV-1002"], ["Ventilation", false, "DEV-1004"], ["Lighting zone A", true, "DEV-1007"], ["Heater", false, "DEV-1010"]];
      b.innerHTML = `<ul class="ax-list">${items.map(([n, on, id], i) => `
        <li><span>${n} <span class="ax-small ax-muted">${id}</span></span>
          <label style="position:relative;width:42px;height:24px;cursor:pointer">
            <input type="checkbox" data-i="${i}" ${on ? "checked" : ""} style="opacity:0;width:0;height:0" aria-label="${n}">
            <span data-track style="position:absolute;inset:0;border-radius:12px;background:${on ? "var(--rv-primary)" : "#d4d4d8"};transition:background .2s"></span>
            <span data-knob style="position:absolute;top:3px;left:${on ? 21 : 3}px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)"></span>
          </label></li>`).join("")}</ul>`;
      const paint = (input, on) => {
        input.parentElement.querySelector("[data-track]").style.background = on ? "var(--rv-primary)" : "#d4d4d8";
        input.parentElement.querySelector("[data-knob]").style.left = on ? "21px" : "3px";
      };
      b.querySelectorAll("input").forEach(input => input.addEventListener("change", async () => {
        const [n, , id] = items[+input.dataset.i];
        const ok = await AX.modal({ title: `Turn ${input.checked ? "on" : "off"} ${n}?`, body: `This sends a command to ${id}.` });
        if (!ok) { input.checked = !input.checked; return; }
        paint(input, input.checked);
        AX.rv("pushPayload", { command: input.checked ? "on" : "off" }, 205813, "UID", id, Date.now());
      }));
    }
  },
  {
    title: "Setpoint Control",
    level: 3,
    desc: "Adjust a target with slider, stepper or typed value. Validates the range, shows pending vs applied, and sends on Apply.",
    render(b) {
      const MIN = 16, MAX = 28;
      let applied = 21.5, pending = applied;
      b.innerHTML = `
        <div class="ax-row ax-row--between">
          <div><div class="ax-kpi__label">Current</div><div class="ax-kpi__value">22.8<span class="ax-kpi__unit">°C</span></div></div>
          <div style="text-align:right"><div class="ax-kpi__label">Target</div><div class="ax-kpi__value" data-target style="color:var(--rv-primary)"></div></div>
        </div>
        <div class="ax-row" style="margin:14px 0 8px">
          <button class="ax-btn" data-step="-0.5" aria-label="Decrease">−</button>
          <input type="range" min="${MIN}" max="${MAX}" step="0.5" style="flex:1" aria-label="Setpoint">
          <button class="ax-btn" data-step="0.5" aria-label="Increase">+</button>
          <input class="ax-input" type="number" step="0.5" style="width:74px" aria-label="Setpoint value">
        </div>
        <div class="ax-row ax-row--between">
          <span class="ax-small" data-msg></span>
          <span class="ax-row" style="gap:6px"><button class="ax-btn" data-reset>Reset</button><button class="ax-btn ax-btn--primary" data-apply>Apply</button></span>
        </div>`;
      const range = b.querySelector("input[type=range]"), num = b.querySelector("input[type=number]");
      const msg = b.querySelector("[data-msg]"), apply = b.querySelector("[data-apply]");
      const sync = () => {
        const valid = pending >= MIN && pending <= MAX;
        range.value = num.value = pending;
        b.querySelector("[data-target]").innerHTML = `${pending}<span class="ax-kpi__unit">°C</span>`;
        apply.disabled = !valid || pending === applied;
        msg.innerHTML = !valid ? `<span class="ax-down">Must be between ${MIN} and ${MAX}</span>`
          : pending === applied ? `<span class="ax-pill ax-pill--good">Applied</span>` : `<span class="ax-pill ax-pill--warn">Pending change from ${applied}</span>`;
      };
      range.addEventListener("input", () => { pending = +range.value; sync(); });
      num.addEventListener("input", () => { pending = +num.value; sync(); });
      b.querySelectorAll("[data-step]").forEach(btn => btn.addEventListener("click", () => {
        pending = Math.min(MAX, Math.max(MIN, +(pending + +btn.dataset.step).toFixed(1))); sync();
      }));
      b.querySelector("[data-reset]").addEventListener("click", () => { pending = applied; sync(); });
      apply.addEventListener("click", () => {
        AX.rv("pushPayload", { setpoint: pending }, 205813, "UID", "DEV-1001", Date.now());
        applied = pending; sync();
      });
      sync();
    }
  },
  {
    title: "Period Scorecard",
    level: 3,
    desc: "A set of KPIs that all recalculate for the selected period, each with its change and a mini trend.",
    render(b) {
      const periods = { d: ["Today", 24, 1], w: ["7 days", 7, 7], m: ["30 days", 30, 30] };
      const metrics = [["Energy", "kWh", 1280, 101], ["Output", "units", 8200, 202], ["Downtime", "min", 42, 303], ["Alerts", "", 7, 404]];
      const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg(Object.entries(periods).map(([k, p]) => [k, p[0]]), "d")}</div>`);
      const grid = AX.add(b, `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px"></div>`);
      const draw = p => {
        const [, pts, mult] = periods[p];
        grid.innerHTML = "";
        metrics.forEach(([name, unit, base, seed], i) => {
          const vals = D.walk(pts, { base: base * (mult === 1 ? 1 / 24 : 1), vol: base * 0.03, min: 0, seed: seed + mult });
          const total = vals.reduce((a, c) => a + c, 0);
          const delta = +((D.rng(seed * mult)() - 0.45) * 20).toFixed(1);
          const good = name === "Downtime" || name === "Alerts" ? delta < 0 : delta > 0;
          const cell = AX.add(grid, `
            <div style="border:1px solid var(--rv-border);border-radius:8px;padding:10px 12px">
              <div class="ax-kpi__label">${name}</div>
              <div style="font-size:20px;font-weight:700">${F.compact(total)} <span class="ax-small ax-muted">${unit}</span></div>
              <div class="ax-small ${good ? "ax-up" : "ax-down"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}%</div>
            </div>`);
          AX.chart(cell, {
            grid: { left: 0, right: 0, top: 4, bottom: 0 }, tooltip: { show: false },
            xAxis: { type: "category", show: false, data: vals.map((_, j) => j) }, yAxis: { type: "value", show: false, min: "dataMin" },
            series: [{ type: "bar", data: vals, itemStyle: { color: AX.PALETTE[i], borderRadius: 1 } }]
          }, 36);
        });
      };
      draw("d");
      AX.onSeg(ctl.querySelector(".ax-seg"), draw);
    }
  },
  {
    title: "Alarm Panel",
    level: 3,
    desc: "Active alarms with severity filter, per-alarm and bulk acknowledge, and live counts by severity.",
    render(b) {
      const sev = { critical: "bad", major: "warn", minor: "info" };
      const alarms = [
        ["critical", "Compressor B tripped", "Melbourne Depot", 4], ["major", "High temperature on Chiller 2", "Sydney Plant", 11],
        ["major", "Low battery on Sensor Hub 3", "Perth Terminal", 26], ["minor", "Door left open", "Brisbane Hub", 38],
        ["critical", "Loss of comms: Gateway 4", "Townsville Yard", 52], ["minor", "Filter change due", "Adelaide Works", 95]
      ].map(([s, t, site, m], i) => ({ i, s, t, site, m, ack: false }));
      let filter = "";
      b.innerHTML = `<div class="ax-ctl" data-ctl></div><ul class="ax-list" data-list></ul>`;
      const ctl = b.querySelector("[data-ctl]"), list = b.querySelector("[data-list]");
      const draw = () => {
        const open = alarms.filter(a => !a.ack);
        const c = s => open.filter(a => a.s === s).length;
        ctl.innerHTML = `${AX.seg([["", `All ${open.length}`], ["critical", `Critical ${c("critical")}`], ["major", `Major ${c("major")}`], ["minor", `Minor ${c("minor")}`]], filter)}
          <button class="ax-btn ax-btn--sm" data-all ${open.length ? "" : "disabled"} style="margin-left:auto">Acknowledge all</button>`;
        const shown = alarms.filter(a => !filter || a.s === filter);
        list.innerHTML = shown.length ? shown.map(a => `
          <li style="opacity:${a.ack ? 0.45 : 1}">
            <span><span class="ax-pill ax-pill--${sev[a.s]}">${a.s}</span> ${a.t}<br><span class="ax-small ax-muted">${a.site} · ${a.m} min ago</span></span>
            ${a.ack ? '<span class="ax-small ax-muted">Acknowledged</span>' : `<button class="ax-btn ax-btn--sm" data-ack="${a.i}">Ack</button>`}
          </li>`).join("") : '<li class="ax-muted">No alarms</li>';
      };
      b.addEventListener("click", e => {
        const s = e.target.closest(".ax-seg button");
        if (s) { filter = s.dataset.v; draw(); }
        if (e.target.dataset.ack) { alarms[+e.target.dataset.ack].ack = true; AX.toast("Alarm acknowledged", "good"); draw(); }
        if (e.target.hasAttribute("data-all")) { alarms.forEach(a => { a.ack = true; }); AX.toast("All alarms acknowledged", "good"); draw(); }
      });
      draw();
    }
  },
  {
    title: "Weighted Health Score",
    level: 3,
    desc: "A composite score built from several sub-metrics. Change the weights and the score recalculates live.",
    render(b) {
      const parts = [{ n: "Availability", v: 96, w: 40 }, { n: "Performance", v: 78, w: 30 }, { n: "Quality", v: 91, w: 20 }, { n: "Safety", v: 100, w: 10 }];
      const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center"></div>`);
      const gaugeBox = AX.add(wrap, `<div></div>`);
      const sliders = AX.add(wrap, `<div>${parts.map((p, i) => `
        <div class="ax-small" style="margin-bottom:8px">
          <div class="ax-row ax-row--between"><span>${p.n} <strong>${p.v}</strong></span><span class="ax-muted" data-w="${i}">${p.w}%</span></div>
          <input type="range" min="0" max="100" value="${p.w}" data-i="${i}" style="width:100%" aria-label="${p.n} weight">
        </div>`).join("")}</div>`);
      const score = () => {
        const tw = parts.reduce((a, p) => a + p.w, 0) || 1;
        return Math.round(parts.reduce((a, p) => a + p.v * p.w, 0) / tw);
      };
      const opt = s => ({
        series: [{
          type: "gauge", startAngle: 90, endAngle: -270, pointer: { show: false }, progress: { show: true, roundCap: true, width: 14, itemStyle: { color: s >= 90 ? "#10b981" : s >= 75 ? "#f59e0b" : "#ef4444" } },
          axisLine: { lineStyle: { width: 14 } }, splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
          detail: { offsetCenter: [0, 0], fontSize: 30, fontWeight: 700, formatter: "{value}" }, title: { offsetCenter: [0, "32%"], fontSize: 11, color: "#71717a" },
          data: [{ value: s, name: "Health score" }]
        }]
      });
      const c = AX.chart(gaugeBox, opt(score()), 190);
      sliders.addEventListener("input", e => {
        const i = +e.target.dataset.i;
        parts[i].w = +e.target.value;
        sliders.querySelector(`[data-w="${i}"]`).textContent = parts[i].w + "%";
        c.setOption(opt(score()));
      });
    }
  },
  {
    title: "Asset Drill-Down Card",
    level: 3,
    wide: true,
    desc: "Pick any device to see its overview, 7-day trend and alert history in tabs. One widget for every asset.",
    render(b) {
      const ctl = AX.add(b, `<div class="ax-ctl">
        <select class="ax-select" aria-label="Device">${D.devices.map(d => `<option value="${d.id}">${d.id} · ${d.name} (${d.site})</option>`).join("")}</select>
        ${AX.seg([["overview", "Overview"], ["trend", "Trend"], ["alerts", "Alerts"]], "overview")}
      </div>`);
      const pane = AX.add(b, `<div></div>`);
      let tab = "overview";
      const draw = () => {
        const d = D.devices.find(x => x.id === ctl.querySelector("select").value);
        const seed = +d.id.slice(4);
        pane.innerHTML = "";
        if (tab === "overview") {
          pane.innerHTML = `
            <div class="ax-row" style="gap:10px;margin-bottom:12px">${AX.pill(d.status)}<span class="ax-small ax-muted">Firmware ${d.firmware} · installed ${F.date(d.installed)} · last seen ${d.lastSeen} min ago</span></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px">
              ${[["Temperature", d.temp, "°C"], ["Humidity", d.humidity, "%"], ["Power", d.power, "kW"], ["Battery", d.battery, "%"], ["Uptime", d.uptime, "%"], ["Open alerts", d.alerts, ""]].map(([l, v, u]) => `
                <div style="border:1px solid var(--rv-border);border-radius:8px;padding:10px 12px"><div class="ax-kpi__label">${l}</div><div style="font-size:20px;font-weight:700">${v}<span class="ax-kpi__unit">${u}</span></div></div>`).join("")}
            </div>`;
        } else if (tab === "trend") {
          const n = 7 * 24;
          AX.chart(pane, {
            legend: { top: 0 },
            xAxis: { type: "time" }, yAxis: [{ type: "value", name: "°C" }, { type: "value", name: "kW" }],
            series: [
              { type: "line", name: "Temperature", data: D.ts(n, D.HOUR, D.wave(n, { base: d.temp, amp: 3, noise: 1, seed })) },
              { type: "line", name: "Power", yAxisIndex: 1, data: D.ts(n, D.HOUR, D.walk(n, { base: d.power, vol: 1.5, min: 0, seed: seed + 1 })) }
            ]
          }, 240);
        } else {
          const rand = D.rng(seed);
          const rows = Array.from({ length: d.alerts + 2 }, (_, i) => [["High temperature", "Low battery", "Comms lost", "Threshold breach"][Math.floor(rand() * 4)], Date.now() - (i + 1) * rand() * 2 * D.DAY, i < d.alerts ? "Open" : "Closed"]);
          pane.innerHTML = `<ul class="ax-list">${rows.map(([t, when, s]) => `<li><span>${t}<br><span class="ax-small ax-muted">${F.dateTime(when)}</span></span><span class="ax-pill ax-pill--${s === "Open" ? "bad" : "good"}">${s}</span></li>`).join("")}</ul>`;
        }
      };
      ctl.querySelector("select").addEventListener("change", draw);
      AX.onSeg(ctl.querySelector(".ax-seg"), v => { tab = v; draw(); });
      draw();
    }
  }
]);
