/* ==========================================================================
 * Mining: 12 domain components, simple to advanced
 * ========================================================================== */
(() => {
  const HOUR = D.HOUR, DAY = D.DAY;
  const sum = a => a.reduce((s, v) => s + v, 0);
  const tile = (l, v, sub, tone = "") => `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px"><div class="ax-kpi__label">${l}</div><div style="font-size:22px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${v}</div><div class="ax-small" style="color:${tone ? `var(--${tone})` : "var(--ink-3)"}">${sub}</div></div>`;

  /* Mine fleet used by several components */
  const fleet = [
    ...Array.from({ length: 12 }, (_, i) => ({ id: `HT${String(i + 1).padStart(2, "0")}`, kind: "Haul truck", cap: 220 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `EX0${i + 1}`, kind: "Excavator", cap: 0 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `DZ0${i + 1}`, kind: "Dozer", cap: 0 })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: `DR0${i + 1}`, kind: "Drill", cap: 0 }))
  ];

  AX.section("mining", [
    {
      title: "Shift Production",
      level: 1,
      desc: "The numbers a superintendent checks first: tonnes moved, ore milled, head grade and recovery against shift plan.",
      render(b) {
        const k = [["Material moved", 48210, 52000, "t"], ["Ore milled", 9840, 10000, "t"], ["Head grade", 1.84, 1.75, "g/t"], ["Recovery", 91.2, 92.5, "%"]];
        b.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">${k.map(([l, v, p, u]) => {
          const pct = (v / p) * 100, good = pct >= 98;
          return `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px">
            <div class="ax-kpi__label">${l}</div>
            <div style="font-size:22px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${F.num(v, v < 100 ? 2 : 0)}<span class="ax-kpi__unit">${u}</span></div>
            <div class="ax-bar" style="margin:6px 0 4px"><div style="width:${Math.min(100, pct)}%;background:${good ? "var(--accent)" : "var(--warn)"}"></div></div>
            <div class="ax-small" style="color:var(--ink-3)">Plan ${F.num(p, p < 100 ? 2 : 0)} · <span class="${good ? "ax-up" : "ax-down"}">${pct >= 100 ? "+" : ""}${(pct - 100).toFixed(1)}%</span></div></div>`;
        }).join("")}</div><div class="ax-small" style="color:var(--ink-3);margin-top:10px">Day shift · 06:00 to 18:00 · 9 h 40 min elapsed</div>`;
      }
    },
    {
      title: "Fleet Status Board",
      level: 1,
      desc: "Every machine and what it is doing right now, with counts by state. The view dispatch keeps open all shift.",
      render(b) {
        const st = { Hauling: "#4f46e5", Loading: "#818cf8", Queued: "#f59e0b", Down: "#ef4444", Standby: "#d4d4d8" };
        const r = D.rng(91), keys = Object.keys(st);
        const rows = fleet.map(f => ({ ...f, s: f.kind === "Haul truck" ? keys[Math.floor(r() ** 1.6 * 5)] : r() < 0.15 ? "Down" : r() < 0.3 ? "Standby" : "Loading" }));
        b.innerHTML = `<div class="ax-ctl">${keys.map(k => `<span class="ax-row" style="gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:${st[k]}"></span>${k} <strong style="color:var(--ink)">${rows.filter(x => x.s === k).length}</strong></span>`).join("")}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px">${rows.map(x => `
            <div title="${x.kind} ${x.id}: ${x.s}" style="border:1px solid var(--line);border-radius:8px;padding:6px 8px;border-left:3px solid ${st[x.s]}">
              <div style="font-size:12.5px;font-weight:600">${x.id}</div><div class="ax-small" style="color:var(--ink-3);font-size:11px">${x.s}</div></div>`).join("")}</div>`;
      }
    },
    {
      title: "Tonnes vs Plan",
      level: 2,
      desc: "Cumulative month-to-date tonnes against plan, with a run-rate forecast to month end and the gap to close.",
      render(b) {
        const days = 30, today = 19, plan = Array.from({ length: days }, (_, i) => Math.round(((i + 1) / days) * 1500));
        const daily = D.walk(today, { base: 47, vol: 6, min: 25, seed: 12 });
        let acc = 0;
        const actual = daily.map(v => (acc += v));
        const rate = acc / today, fc = Array.from({ length: days }, (_, i) => (i < today - 1 ? null : Math.round(acc + rate * (i - today + 1))));
        const gap = plan[days - 1] - fc[days - 1];
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Month to date <strong>${F.num(acc)} kt</strong> vs plan <strong>${F.num(plan[today - 1])} kt</strong></span>
          <span class="ax-pill ax-pill--${gap > 0 ? "warn" : "good"}">${gap > 0 ? `Forecast ${F.num(gap)} kt short` : "On track"}</span>
          <span class="ax-small" style="color:var(--ink-3)">Need ${F.num((plan[days - 1] - acc) / (days - today), 1)} kt/day vs ${F.num(rate, 1)} run rate</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: plan.map((_, i) => i + 1), name: "Day" }, yAxis: { type: "value", name: "kt" },
          series: [
            { type: "line", name: "Plan", data: plan, lineStyle: { color: "#a1a1aa", type: "dashed" }, itemStyle: { color: "#a1a1aa" } },
            { type: "line", name: "Actual", data: actual, areaStyle: {}, lineStyle: { width: 2.5 } },
            { type: "line", name: "Forecast", data: fc, lineStyle: { color: "#f59e0b", type: "dotted", width: 2 }, itemStyle: { color: "#f59e0b" } }
          ]
        }, 240);
      }
    },
    {
      title: "Time Usage Model",
      level: 2,
      desc: "Calendar time broken down to productive hours the way mines report it, with each loss category shown as a step down.",
      render(b) {
        const steps = [["Calendar", 720, 1], ["Scheduled down", -36], ["Unscheduled down", -58], ["Available", 0, 1], ["Standby", -41], ["Operating delay", -63], ["Productive", 0, 1]];
        let run = 0;
        const base = [], val = [], labels = [];
        steps.forEach(([n, v, total]) => {
          labels.push(n);
          if (total) { const t = v || run; run = t; base.push(0); val.push({ value: t, itemStyle: { color: "#4f46e5" } }); }
          else { run += v; base.push(run); val.push({ value: -v, itemStyle: { color: "#fca5a5" } }); }
        });
        const pct = (n, d) => ((n / d) * 100).toFixed(1);
        const avail = 720 - 94, prod = avail - 104;
        b.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
          ${tile("Availability", pct(avail, 720) + "%", "Available / calendar")}${tile("Utilisation", pct(prod, avail) + "%", "Productive / available")}${tile("Effective use", pct(prod, 720) + "%", "Productive / calendar")}</div>`;
        AX.chart(b, {
          tooltip: { trigger: "axis", formatter: p => `${p[1].name}: ${p[1].value} h` },
          xAxis: { type: "category", data: labels, axisLabel: { interval: 0, fontSize: 10, rotate: 18 } }, yAxis: { type: "value", name: "h" },
          series: [{ type: "bar", stack: "w", data: base, itemStyle: { color: "transparent" }, silent: true },
            { type: "bar", stack: "w", data: val, barMaxWidth: 36, label: { show: true, position: "top", fontSize: 10, color: "#52525b" } }]
        }, 230);
      }
    },
    {
      title: "Downtime by Reason",
      level: 2,
      desc: "Pareto of downtime hours by reason code with MTBF and MTTR. Filter by fleet to see where reliability effort should go.",
      render(b) {
        const data = {
          "Haul trucks": [["Tyres", 64], ["Engine", 48], ["Electrical", 31], ["Hydraulics", 22], ["Body / tray", 14], ["Other", 9]],
          Excavators: [["Hydraulics", 52], ["Ground engaging tools", 38], ["Electrical", 20], ["Slew ring", 16], ["Other", 6]],
          "Fixed plant": [["Liners", 70], ["Conveyor belt", 44], ["Blockages", 33], ["Electrical", 18], ["Other", 8]]
        };
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg(Object.keys(data).map(k => [k, k]), "Haul trucks")}</div>`);
        const kp = AX.add(b, `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px"></div>`);
        const c = AX.chart(b, { xAxis: { type: "category" }, yAxis: [{ type: "value", name: "h" }, { type: "value", max: 100, axisLabel: { formatter: "{value}%" }, splitLine: { show: false } }], series: [] }, 220);
        const draw = k => {
          const rows = data[k], total = sum(rows.map(r => r[1]));
          let acc = 0;
          kp.innerHTML = tile("Downtime", total + " h", "Last 30 days") + tile("MTBF", (720 / (total / 6)).toFixed(0) + " h", "Mean time between failures") + tile("MTTR", (total / 31).toFixed(1) + " h", "Mean time to repair");
          c.setOption({ xAxis: { data: rows.map(r => r[0]), axisLabel: { interval: 0, fontSize: 10 } }, series: [
            { type: "bar", name: "Hours", data: rows.map(r => r[1]) },
            { type: "line", name: "Cumulative", yAxisIndex: 1, symbol: "circle", showSymbol: true, symbolSize: 5, itemStyle: { color: "#f59e0b" }, data: rows.map(r => +((acc += r[1]) / total * 100).toFixed(1)) }
          ] }, { replaceMerge: ["series"] });
        };
        draw("Haul trucks");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Haul Cycle Breakdown",
      level: 2,
      desc: "Each truck's average cycle split into queue, load, haul, dump and return. Queue time exposes shovel and dump bottlenecks.",
      render(b) {
        const phases = [["Queue", "#f59e0b"], ["Load", "#818cf8"], ["Haul loaded", "#4f46e5"], ["Dump", "#a5b4fc"], ["Return empty", "#c7d2fe"]];
        const trucks = fleet.filter(f => f.kind === "Haul truck").slice(0, 8);
        const rows = trucks.map((t, i) => { const r = D.rng(i + 50); return [1 + r() * 6, 2.5 + r(), 9 + r() * 4, 1 + r() * 0.6, 7 + r() * 3].map(v => +v.toFixed(1)); });
        const avg = (sum(rows.map(r => sum(r))) / rows.length).toFixed(1);
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Average cycle <strong>${avg} min</strong> · target 24.0 min</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: v => v + " min" },
          xAxis: { type: "value", name: "min" }, yAxis: { type: "category", data: trucks.map(t => t.id), inverse: true },
          series: phases.map(([n, c], pi) => ({ type: "bar", name: n, stack: "c", barMaxWidth: 16, data: rows.map(r => r[pi]), itemStyle: { color: c, borderRadius: 0 } }))
        }, 280);
      }
    },
    {
      title: "Payload Distribution",
      level: 2,
      desc: "Truck payloads against rated capacity using the 10/10/20 rule: no more than 10% of loads over 110%, none over 120%.",
      render(b) {
        const r = D.rng(77), loads = Array.from({ length: 600 }, () => 220 * (0.97 + (r() + r() + r() - 1.5) * 0.14));
        const bins = Array.from({ length: 24 }, (_, i) => 160 + i * 5);
        const counts = bins.map(x => loads.filter(l => l >= x && l < x + 5).length);
        const over110 = loads.filter(l => l > 242).length / loads.length * 100, over120 = loads.filter(l => l > 264).length;
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Mean <strong>${F.num(sum(loads) / loads.length, 1)} t</strong> (${(sum(loads) / loads.length / 2.2).toFixed(1)}% of rated)</span>
          <span class="ax-pill ax-pill--${over110 > 10 ? "bad" : "good"}">${over110.toFixed(1)}% over 110%</span><span class="ax-pill ax-pill--${over120 ? "bad" : "good"}">${over120} over 120%</span></div>`;
        AX.chart(b, {
          xAxis: { type: "category", data: bins.map(String), name: "t", axisLabel: { interval: 3 } }, yAxis: { type: "value", name: "Loads" },
          series: [{ type: "bar", barCategoryGap: "8%", data: counts.map((v, i) => ({ value: v, itemStyle: { color: bins[i] >= 264 ? "#ef4444" : bins[i] >= 242 ? "#f59e0b" : "#4f46e5", borderRadius: 2 } })),
            markLine: { symbol: "none", silent: true, label: { formatter: "{b}", fontSize: 10, position: "end" }, data: [
              { name: "Rated", xAxis: "220", lineStyle: { color: "#18181b" } }, { name: "110%", xAxis: "240", lineStyle: { color: "#f59e0b", type: "dashed" } }, { name: "120%", xAxis: "265", lineStyle: { color: "#ef4444", type: "dashed" } }] } }]
        }, 220);
      }
    },
    {
      title: "Stockpile Inventory",
      level: 2,
      desc: "ROM and product stockpiles with tonnes, grade and days of feed remaining at the current mill rate.",
      render(b) {
        const piles = [["ROM high grade", 182000, 260000, 2.4], ["ROM low grade", 412000, 500000, 0.9], ["Crushed ore", 38000, 60000, 1.8], ["Product (conc.)", 14200, 25000, 24.5]];
        const mill = 9800;
        b.innerHTML = piles.map(([n, t, cap, g]) => {
          const pct = t / cap * 100, days = n.startsWith("Product") ? null : t / mill;
          return `<div style="display:grid;grid-template-columns:140px 1fr 150px;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid #f4f4f5">
            <div><div style="font-size:13px;font-weight:500">${n}</div><div class="ax-small" style="color:var(--ink-3)">${g} g/t</div></div>
            <div><div class="ax-bar" style="height:10px"><div style="width:${pct}%"></div></div><div class="ax-small" style="color:var(--ink-3);margin-top:3px">${F.compact(t)} of ${F.compact(cap)} t</div></div>
            <div style="text-align:right"><strong style="font-variant-numeric:tabular-nums">${days ? days.toFixed(1) + " days" : F.compact(t) + " t"}</strong><div class="ax-small" style="color:var(--ink-3)">${days ? "of mill feed" : "awaiting shipment"}</div></div></div>`;
        }).join("");
      }
    },
    {
      title: "Dust Compliance (PM10)",
      level: 3,
      desc: "Hourly PM10 with the 24-hour rolling average against the 50 µg/m³ licence limit. Shows exceedances and early warning.",
      render(b) {
        const n = 24 * 10, hourly = D.wave(n, { base: 32, amp: 14, noise: 12, seed: 66, phase: -8 }).map((v, i) => Math.max(4, v + (i > 170 && i < 200 ? 30 : 0)));
        const roll = hourly.map((_, i) => (i < 23 ? null : +(sum(hourly.slice(i - 23, i + 1)) / 24).toFixed(1)));
        const T = i => Date.now() - (n - 1 - i) * HOUR;
        const exc = roll.filter((v, i) => v > 50 && (roll[i - 1] || 0) <= 50).length;
        const last = roll[n - 1];
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">24 h average <strong>${last} µg/m³</strong></span><span class="ax-pill ax-pill--${last > 50 ? "bad" : last > 40 ? "warn" : "good"}">${last > 50 ? "Exceeding" : last > 40 ? "Approaching limit" : "Compliant"}</span><span class="ax-pill ax-pill--${exc ? "bad" : "good"}">${exc} exceedance event${exc === 1 ? "" : "s"} (10 days)</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "time" }, yAxis: { type: "value", name: "µg/m³" },
          series: [
            { type: "bar", name: "Hourly", data: hourly.map((v, i) => [T(i), +v.toFixed(1)]), itemStyle: { color: "#c7d2fe", borderRadius: 1 }, barCategoryGap: "10%" },
            { type: "line", name: "24 h rolling", data: roll.map((v, i) => [T(i), v]), lineStyle: { width: 2.5 },
              markLine: { symbol: "none", silent: true, label: { formatter: "Licence 50", position: "insideEndTop", fontSize: 10, color: "#ef4444" }, lineStyle: { color: "#ef4444", type: "dashed" }, data: [{ yAxis: 50 }] },
              markArea: { silent: true, itemStyle: { color: "rgba(239,68,68,.07)" }, data: [[{ yAxis: 50 }, { yAxis: 200 }]] } }
          ]
        }, 240);
      }
    },
    {
      title: "Wind and Dust Rose",
      level: 3,
      desc: "Where dust comes from: PM10 by wind direction and concentration band. Tells you which activity or boundary is the source.",
      render(b) {
        const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const bands = [["< 25", "#c7d2fe"], ["25 to 50", "#818cf8"], ["50 to 100", "#f59e0b"], ["> 100", "#ef4444"]];
        const r = D.rng(17), w = i => Math.exp(-((i - 11) ** 2) / 8) + 0.25;
        AX.chart(b, {
          legend: { bottom: 0, data: bands.map(x => x[0]) }, tooltip: { trigger: "item", formatter: p => `${p.name} wind<br>${p.seriesName} µg/m³: ${p.value}% of hours` },
          polar: { radius: [8, "70%"], center: ["50%", "46%"] }, angleAxis: { type: "category", data: dirs, startAngle: 101.25, axisLabel: { fontSize: 10, color: "#71717a" } },
          radiusAxis: { axisLabel: { show: false }, axisLine: { show: false }, splitLine: { lineStyle: { color: "#f0f0f2" } } },
          series: bands.map(([n, c], bi) => ({ type: "bar", name: n, coordinateSystem: "polar", stack: "r", itemStyle: { color: c },
            data: dirs.map((_, i) => +(w(i) * [3, 2, 0.9, 0.35][bi] * (0.6 + r() * 0.8)).toFixed(2)) }))
        }, 290);
      }
    },
    {
      title: "Blast Monitoring",
      level: 3,
      desc: "Each blast's ground vibration (PPV) and airblast overpressure against licence limits, with the 5% allowance tracked.",
      render(b) {
        const r = D.rng(23), blasts = Array.from({ length: 36 }, (_, i) => ({ id: `B-${2400 + i}`, ppv: +(0.6 + r() ** 1.8 * 6).toFixed(2), ob: +(98 + r() * 22).toFixed(1), t: Date.now() - (36 - i) * 2 * DAY }));
        const over = blasts.filter(x => x.ppv > 5 || x.ob > 115);
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small"><strong>${blasts.length}</strong> blasts this year</span><span class="ax-pill ax-pill--${over.length / blasts.length > 0.05 ? "bad" : "warn"}">${over.length} over limit (${(over.length / blasts.length * 100).toFixed(1)}%, allowance 5%)</span><span class="ax-small" style="color:var(--ink-3)">Limit: 10 mm/s and 120 dBL never</span></div>`;
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: p => `${p.data[2]} · ${F.date(p.data[3])}<br>PPV ${p.data[0]} mm/s<br>Overpressure ${p.data[1]} dBL` },
          xAxis: { type: "value", name: "PPV mm/s", min: 0, max: 8 }, yAxis: { type: "value", name: "dBL", min: 95, max: 125 },
          series: [{ type: "scatter", symbolSize: 10, data: blasts.map(x => ({ value: [x.ppv, x.ob, x.id, x.t], itemStyle: { color: x.ppv > 5 || x.ob > 115 ? "#ef4444" : "#4f46e5" } })),
            markArea: { silent: true, itemStyle: { color: "rgba(16,185,129,.06)" }, data: [[{ xAxis: 0, yAxis: 95 }, { xAxis: 5, yAxis: 115 }]] },
            markLine: { symbol: "none", silent: true, lineStyle: { color: "#f59e0b", type: "dashed" }, label: { fontSize: 10, formatter: "{b}" }, data: [{ name: "5 mm/s", xAxis: 5 }, { name: "115 dBL", yAxis: 115 }] } }]
        }, 250);
      }
    },
    {
      title: "Tailings Dam TARP",
      level: 3,
      wide: true,
      desc: "Piezometer pore pressures against Green, Amber and Red trigger levels. Pick an instrument to see its trend and the response the TARP requires.",
      render(b) {
        const inst = [
          { id: "VWP-01", loc: "Embankment crest, Ch 200", base: 38, t: [45, 55], seed: 1 }, { id: "VWP-04", loc: "Downstream toe, Ch 450", base: 44, t: [45, 55], seed: 4, rise: 0.06 },
          { id: "VWP-07", loc: "Decant tower", base: 29, t: [40, 50], seed: 7 }, { id: "VWP-09", loc: "Abutment, Ch 900", base: 49, t: [45, 55], seed: 9, rise: 0.03 }
        ];
        const act = ["Routine monitoring. Weekly readings.", "Increase readings to daily. Inspect embankment. Notify geotechnical engineer within 24 h.", "Stop deposition in affected cell. Engineer on site within 4 h. Notify regulator and dam safety committee."];
        const col = ["#10b981", "#f59e0b", "#ef4444"], name = ["Green", "Amber", "Red"];
        inst.forEach(x => { x.data = D.ts(90, DAY, D.walk(90, { base: x.base, vol: 0.8, seed: x.seed }).map((v, i) => +(v + (x.rise || 0) * i).toFixed(1))); x.v = x.data[89][1]; x.lvl = x.v >= x.t[1] ? 2 : x.v >= x.t[0] ? 1 : 0; });
        const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:260px 1fr;gap:16px"></div>`);
        const list = AX.add(wrap, `<div></div>`), right = AX.add(wrap, `<div></div>`);
        const info = AX.add(right, `<div></div>`);
        const c = AX.chart(right, { xAxis: { type: "time" }, yAxis: { type: "value", name: "kPa", scale: true }, series: [] }, 220);
        let sel = 1;
        const draw = () => {
          list.innerHTML = inst.map((x, i) => `<button type="button" data-i="${i}" style="all:unset;box-sizing:border-box;display:flex;width:100%;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;margin-bottom:4px;background:${i === sel ? "var(--accent-soft)" : "transparent"}">
            <span style="width:10px;height:10px;border-radius:50%;background:${col[x.lvl]};box-shadow:0 0 0 3px ${col[x.lvl]}26"></span>
            <span style="flex:1"><span style="font-size:13px;font-weight:600">${x.id}</span><br><span class="ax-small" style="color:var(--ink-3)">${x.loc}</span></span><strong class="ax-small">${x.v}</strong></button>`).join("");
          const x = inst[sel];
          info.innerHTML = `<div class="ax-row" style="gap:10px;margin-bottom:6px"><span class="ax-pill" style="background:${col[x.lvl]}1f;color:${col[x.lvl]}">${name[x.lvl]} TARP</span><span class="ax-small"><strong>${x.id}</strong> ${x.v} kPa · Amber at ${x.t[0]}, Red at ${x.t[1]}</span></div>
            <div class="ax-small" style="background:var(--paper-2);border:1px solid var(--line);border-radius:9px;padding:8px 10px;margin-bottom:8px"><strong>Required response:</strong> ${act[x.lvl]}</div>`;
          c.setOption({ series: [{ type: "line", name: x.id, data: x.data, lineStyle: { width: 2.2 },
            markArea: { silent: true, data: [[{ yAxis: x.t[0], itemStyle: { color: "rgba(245,158,11,.08)" } }, { yAxis: x.t[1] }], [{ yAxis: x.t[1], itemStyle: { color: "rgba(239,68,68,.08)" } }, { yAxis: 200 }]] },
            markLine: { symbol: "none", silent: true, label: { fontSize: 10, formatter: "{b}", position: "insideEndTop" }, data: [{ name: "Amber", yAxis: x.t[0], lineStyle: { color: "#f59e0b", type: "dashed" } }, { name: "Red", yAxis: x.t[1], lineStyle: { color: "#ef4444", type: "dashed" } }] } }],
            yAxis: { max: Math.max(x.t[1] + 4, Math.ceil(Math.max(...x.data.map(p => p[1])) + 2)) } });
        };
        list.addEventListener("click", e => { const btn = e.target.closest("[data-i]"); if (btn) { sel = +btn.dataset.i; draw(); } });
        draw();
      }
    }
  ]);
})();
