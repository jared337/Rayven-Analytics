/* ==========================================================================
 * Energy: 12 domain components, simple to advanced
 * ========================================================================== */
(() => {
  const HOUR = D.HOUR, DAY = D.DAY, HH = 30 * 60e3;
  const sum = a => a.reduce((s, v) => s + v, 0);
  const tile = (l, v, sub, tone = "") => `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px"><div class="ax-kpi__label">${l}</div><div style="font-size:22px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${v}</div><div class="ax-small" style="color:${tone ? `var(--${tone})` : "var(--ink-3)"}">${sub}</div></div>`;
  const halfHours = Array.from({ length: 48 }, (_, i) => `${F.pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);

  /* Commercial site demand profile in kW for one day (48 half-hours) */
  const dayProfile = (seed, scale = 1) => {
    const r = D.rng(seed);
    return halfHours.map((_, i) => {
      const h = i / 2, work = h >= 6 && h <= 19;
      return Math.round((380 + (work ? 520 * Math.sin(((h - 6) / 13) * Math.PI) ** 0.6 : 0) + r() * 60) * scale);
    });
  };
  const CONTRACT = 950;

  AX.section("energy", [
    {
      title: "Site Energy Summary",
      level: 1,
      desc: "Month-to-date consumption, cost, peak demand and emissions, each compared with the same period last year.",
      render(b) {
        b.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          ${tile("Consumption", "412 MWh", "▼ 6.2% vs last year", "ok")}${tile("Energy cost", "$71,840", "▼ 3.9% vs last year", "ok")}
          ${tile("Peak demand", "924 kW", "97% of 950 kW contract", "warn")}${tile("Emissions", "278 tCO₂e", "Scope 2, location based")}</div>`;
      }
    },
    {
      title: "Interval Load Profile",
      level: 2,
      desc: "Half-hourly demand for a day with the contracted maximum demand and the peak interval marked.",
      render(b) {
        const days = { today: ["Today", 3], yday: ["Yesterday", 4], peak: ["Peak day (12 Oct)", 9] };
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg(Object.entries(days).map(([k, v]) => [k, v[0]]), "today")}<span class="ax-small" data-p></span></div>`);
        const c = AX.chart(b, { xAxis: { type: "category", data: halfHours, axisLabel: { interval: 5 } }, yAxis: { type: "value", name: "kW" }, series: [] }, 240);
        const draw = k => {
          const p = dayProfile(days[k][1], k === "peak" ? 1.06 : 1), mx = Math.max(...p), at = p.indexOf(mx);
          ctl.querySelector("[data-p]").innerHTML = `Peak <strong>${mx} kW</strong> at ${halfHours[at]} · <span class="${mx > CONTRACT ? "ax-down" : "ax-up"}">${mx > CONTRACT ? "over" : "within"} contract</span>`;
          c.setOption({ series: [{ type: "line", name: "Demand", data: p, areaStyle: {}, step: "end",
            markPoint: { symbol: "circle", symbolSize: 9, itemStyle: { color: mx > CONTRACT ? "#ef4444" : "#4f46e5", borderColor: "#fff", borderWidth: 2 }, label: { show: false }, data: [{ coord: [at, mx] }] },
            markLine: { symbol: "none", silent: true, label: { formatter: `Contract ${CONTRACT} kW`, position: "insideEndTop", fontSize: 10, color: "#ef4444" }, lineStyle: { color: "#ef4444", type: "dashed" }, data: [{ yAxis: CONTRACT }] } }] });
        };
        draw("today");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Load Duration Curve",
      level: 2,
      desc: "30 days of half-hourly demand sorted highest to lowest. Shows base load, and how few hours drive the peak you pay for.",
      render(b) {
        const all = Array.from({ length: 30 }, (_, d) => dayProfile(d + 20, d % 7 >= 5 ? 0.7 : 1)).flat().sort((a, z) => z - a);
        const n = all.length, top = all[0], p1 = all[Math.floor(n * 0.01)], base = all[Math.floor(n * 0.9)];
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Peak <strong>${top} kW</strong></span><span class="ax-small">Top 1% of time above <strong>${p1} kW</strong></span><span class="ax-small">Base load <strong>${base} kW</strong></span>
          <span class="ax-pill ax-pill--info">Shaving the top 1% saves ${top - p1} kW of demand</span></div>`;
        AX.chart(b, {
          tooltip: { trigger: "axis", formatter: p => `${p[0].data[0].toFixed(1)}% of time above ${p[0].data[1]} kW` },
          xAxis: { type: "value", max: 100, name: "% of time", axisLabel: { formatter: "{value}%" } }, yAxis: { type: "value", name: "kW", min: 0 },
          series: [{ type: "line", data: all.map((v, i) => [+(i / n * 100).toFixed(2), v]), areaStyle: {}, sampling: "lttb",
            markArea: { silent: true, itemStyle: { color: "rgba(239,68,68,.08)" }, label: { color: "#ef4444", fontSize: 10 }, data: [[{ name: "Peak", xAxis: 0 }, { xAxis: 1 }]] },
            markLine: { symbol: "none", silent: true, label: { formatter: "Base {c} kW", fontSize: 10, position: "insideEndTop" }, lineStyle: { color: "#a1a1aa", type: "dashed" }, data: [{ yAxis: base }] } }]
        }, 230);
      }
    },
    {
      title: "Time-of-Use Breakdown",
      level: 2,
      desc: "Daily consumption split into peak, shoulder and off-peak tariff periods. Switch between energy and cost.",
      render(b) {
        const tariffs = [["Peak", 0.28, "#4f46e5"], ["Shoulder", 0.17, "#a5b4fc"], ["Off-peak", 0.09, "#d4d4d8"]];
        const r = D.rng(31), days = Array.from({ length: 14 }, (_, i) => F.date(Date.now() - (13 - i) * DAY));
        const kwh = days.map((_, i) => { const we = (i + 3) % 7 >= 5; return [we ? 1800 : 7200 + r() * 900, we ? 2600 : 4800 + r() * 500, 3900 + r() * 400].map(Math.round); });
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["kwh", "kWh"], ["cost", "Cost $"]], "kwh")}<span class="ax-small" data-t></span></div>`);
        const c = AX.chart(b, { legend: { top: 0 }, xAxis: { type: "category", data: days, axisLabel: { interval: 1 } }, yAxis: { type: "value" }, series: [] }, 230);
        const draw = m => {
          const val = (d, ti) => (m === "kwh" ? d[ti] : Math.round(d[ti] * tariffs[ti][1]));
          const total = sum(kwh.map(d => sum(d.map((_, ti) => d[ti] * tariffs[ti][1]))));
          ctl.querySelector("[data-t]").innerHTML = `14-day cost <strong>$${F.num(total)}</strong> · peak share ${Math.round(sum(kwh.map(d => d[0] * tariffs[0][1])) / total * 100)}% of cost`;
          c.setOption({ yAxis: { name: m === "kwh" ? "kWh" : "$" }, series: tariffs.map(([n, , col], ti) => ({ type: "bar", name: n, stack: "t", data: kwh.map(d => val(d, ti)), itemStyle: { color: col, borderRadius: ti === 2 ? [3, 3, 0, 0] : 0 } })) }, { replaceMerge: ["series"] });
        };
        draw("kwh");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Generation vs Consumption",
      level: 2,
      desc: "Solar generation against site load, with net grid import above zero and export below. Shows self-consumption at a glance.",
      render(b) {
        const load = dayProfile(5, 0.6), solar = halfHours.map((_, i) => { const h = i / 2; return h > 6 && h < 18.5 ? Math.round(620 * Math.sin(((h - 6) / 12.5) * Math.PI) ** 1.3) : 0; });
        const net = load.map((v, i) => v - solar[i]);
        const selfUse = sum(load.map((v, i) => Math.min(v, solar[i]))) / sum(solar) * 100;
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Solar ${F.num(sum(solar) / 2)} kWh · Exported ${F.num(sum(net.filter(v => v < 0)) / -2)} kWh</span><span class="ax-pill ax-pill--good">${selfUse.toFixed(0)}% self-consumed</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: halfHours, axisLabel: { interval: 5 } }, yAxis: { type: "value", name: "kW" },
          series: [
            { type: "bar", name: "Net grid", data: net.map(v => ({ value: v, itemStyle: { color: v < 0 ? "#10b981" : "#e4e4e7", borderRadius: v < 0 ? [0, 0, 2, 2] : [2, 2, 0, 0] } })), barCategoryGap: "20%" },
            { type: "line", name: "Solar", data: solar, areaStyle: {}, color: "#0d9488" },
            { type: "line", name: "Site load", data: load }
          ]
        }, 240);
      }
    },
    {
      title: "Battery State of Charge",
      level: 2,
      desc: "Battery charge level across the day with charging and discharging power, so you can see it soaking up solar and shaving the evening peak.",
      render(b) {
        let soc = 34;
        const power = halfHours.map((_, i) => { const h = i / 2; return h >= 9 && h < 14 ? -220 : h >= 17 && h < 21 ? 240 : h >= 1 && h < 4 ? -60 : 0; });
        const socs = power.map(p => (soc = Math.max(8, Math.min(98, soc - p / 2 / 500 * 100)), +soc.toFixed(1)));
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">500 kWh / 250 kW battery · now <strong>${socs[29]}%</strong></span><span class="ax-pill ax-pill--good">2 cycles today</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: halfHours, axisLabel: { interval: 5 } },
          yAxis: [{ type: "value", name: "kW (+ discharge)" }, { type: "value", name: "SoC %", max: 100, splitLine: { show: false } }],
          series: [
            { type: "bar", name: "Charge / discharge", data: power.map(v => ({ value: v, itemStyle: { color: v > 0 ? "#4f46e5" : "#a5b4fc" } })), barCategoryGap: "20%" },
            { type: "line", name: "State of charge", yAxisIndex: 1, data: socs, color: "#0d9488", lineStyle: { width: 2.5 } }
          ]
        }, 240);
      }
    },
    {
      title: "Power Factor and kVA",
      level: 2,
      desc: "Power factor against the 0.95 target. Low power factor raises kVA demand, which many network tariffs charge for.",
      render(b) {
        const n = 7 * 48, pf = D.walk(n, { base: 0.93, vol: 0.012, min: 0.8, max: 0.995, seed: 81 });
        const T = i => Date.now() - (n - 1 - i) * HH, below = pf.filter(v => v < 0.95).length / n * 100;
        const kw = 900, kva = Math.round(kw / Math.min(...pf.slice(-48)));
        b.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">${tile("Average PF", (sum(pf) / n).toFixed(3), `${below.toFixed(0)}% of intervals below 0.95`, below > 30 ? "warn" : "")}${tile("Peak kVA", F.num(kva), `vs ${kw} kW real power`)}${tile("Correction value", "$" + F.num((kva - kw / 0.98) * 14.2 * 12), "Per year at $14.20/kVA/month", "ok")}</div>`;
        AX.chart(b, {
          xAxis: { type: "time" }, yAxis: { type: "value", min: 0.8, max: 1 },
          series: [{ type: "line", name: "Power factor", data: pf.map((v, i) => [T(i), v]), sampling: "lttb",
            markArea: { silent: true, itemStyle: { color: "rgba(16,185,129,.07)" }, data: [[{ yAxis: 0.95 }, { yAxis: 1 }]] },
            markLine: { symbol: "none", silent: true, label: { formatter: "Target 0.95", fontSize: 10, position: "insideEndTop" }, lineStyle: { color: "#10b981", type: "dashed" }, data: [{ yAxis: 0.95 }] } }]
        }, 200);
      }
    },
    {
      title: "Emissions Tracker",
      level: 2,
      desc: "Scope 1 and Scope 2 emissions by month against the reduction trajectory, with year-to-date position for NGER reporting.",
      render(b) {
        const s1 = [62, 58, 61, 57, 55, 54, 52, 53, 50, 49, 0, 0], s2 = [298, 284, 276, 262, 240, 236, 241, 230, 221, 214, 0, 0];
        const target = D.months.map((_, i) => Math.round(370 - i * 7.5));
        const ytd = sum(s1) + sum(s2), ytdT = sum(target.slice(0, 10));
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Year to date <strong>${F.num(ytd)} tCO₂e</strong> vs trajectory ${F.num(ytdT)}</span><span class="ax-pill ax-pill--${ytd <= ytdT ? "good" : "warn"}">${ytd <= ytdT ? "Below" : "Above"} trajectory by ${F.num(Math.abs(ytdT - ytd))} t</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: D.months }, yAxis: { type: "value", name: "tCO₂e" },
          series: [
            { type: "bar", name: "Scope 1 (fuel)", stack: "e", data: s1.map(v => v || null), itemStyle: { color: "#0d9488", borderRadius: 0 } },
            { type: "bar", name: "Scope 2 (electricity)", stack: "e", data: s2.map(v => v || null) },
            { type: "line", name: "Trajectory", data: target, lineStyle: { type: "dashed", color: "#a1a1aa" }, itemStyle: { color: "#a1a1aa" } }
          ]
        }, 240);
      }
    },
    {
      title: "Power Quality",
      level: 3,
      desc: "Three-phase voltage held within the 216 to 253 V band (AS 61000.3.100), with sags and swells counted and listed.",
      render(b) {
        const n = 288, T = i => Date.now() - (n - 1 - i) * 5 * 60e3;
        const ph = [["L1", 11], ["L2", 12], ["L3", 13]].map(([name, seed]) => {
          const v = D.walk(n, { base: 239, vol: 1.2, min: 225, max: 250, seed });
          if (name === "L2") { v[140] = 209; v[141] = 214; }
          if (name === "L3") v[220] = 256;
          return { name, v };
        });
        const events = [];
        ph.forEach(p => p.v.forEach((x, i) => { if (x < 216.2 || x > 253) events.push([p.name, T(i), x]); }));
        b.innerHTML = `<div class="ax-ctl"><span class="ax-pill ax-pill--${events.length ? "warn" : "good"}">${events.length} events in 24 h</span>${events.map(([p, t, x]) => `<span class="ax-small">${p} ${x < 216 ? "sag" : "swell"} ${x} V at ${F.time(t)}</span>`).join(" · ")}</div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "time" }, yAxis: { type: "value", name: "V", min: 205, max: 260 },
          series: ph.map((p, i) => ({ type: "line", name: p.name, data: p.v.map((x, j) => [T(j), x]), color: ["#4f46e5", "#0d9488", "#a1a1aa"][i], lineStyle: { width: 1.5 },
            ...(i === 0 ? { markArea: { silent: true, itemStyle: { color: "rgba(16,185,129,.06)" }, data: [[{ yAxis: 216.2 }, { yAxis: 253 }]] },
              markLine: { symbol: "none", silent: true, lineStyle: { color: "#ef4444", type: "dashed" }, label: { fontSize: 10, formatter: "{c} V", position: "insideEndTop" }, data: [{ yAxis: 216.2 }, { yAxis: 253 }] } } : {}) }))
        }, 240);
      }
    },
    {
      title: "Peak Demand Forecast",
      level: 3,
      desc: "Today's demand so far plus the forecast for the rest of the day. If it will breach the contract, tick loads to shed and watch the forecast drop.",
      render(b) {
        const p = dayProfile(9, 1.07), nowIdx = 26;
        const sheds = [["Stage down chiller 3 (14:00 to 17:00)", 150, 28, 34], ["Pause EV fleet charging", 80, 26, 40], ["Pre-cool, then raise setpoint 2°C", 60, 30, 36]];
        const ctl = AX.add(b, `<div><div class="ax-ctl" data-s></div><div class="ax-ctl">${sheds.map(([n, kw], i) => `<label><input type="checkbox" data-i="${i}"> ${n} <span style="color:var(--ink-3)">−${kw} kW</span></label>`).join("")}</div></div>`);
        const c = AX.chart(b, { legend: { top: 0 }, xAxis: { type: "category", data: halfHours, axisLabel: { interval: 5 } }, yAxis: { type: "value", name: "kW", max: 1100 }, series: [] }, 240);
        const draw = () => {
          const on = [...ctl.querySelectorAll("input:checked")].map(x => +x.dataset.i);
          const fc = p.map((v, i) => (i < nowIdx ? null : v - sum(on.filter(s => i >= sheds[s][2] && i <= sheds[s][3]).map(s => sheds[s][1]))));
          const peak = Math.max(...fc.filter(v => v !== null)), at = fc.indexOf(peak);
          ctl.querySelector("[data-s]").innerHTML = `<span class="ax-small">Forecast peak <strong>${peak} kW</strong> at ${halfHours[at]}</span><span class="ax-pill ax-pill--${peak > CONTRACT ? "bad" : "good"}">${peak > CONTRACT ? `Breach by ${peak - CONTRACT} kW` : "Within contract"}</span>${peak > CONTRACT ? '<span class="ax-small" style="color:var(--ink-3)">Tick loads below to shed</span>' : ""}`;
          c.setOption({ series: [
            { type: "line", name: "Actual", data: p.map((v, i) => (i <= nowIdx ? v : null)), areaStyle: {} },
            { type: "line", name: "Forecast", data: fc, lineStyle: { type: "dashed", color: peak > CONTRACT ? "#ef4444" : "#0d9488" }, itemStyle: { color: peak > CONTRACT ? "#ef4444" : "#0d9488" },
              markLine: { symbol: "none", silent: true, label: { formatter: "Contract", fontSize: 10, position: "insideEndTop", color: "#ef4444" }, lineStyle: { color: "#ef4444", type: "dashed" }, data: [{ yAxis: CONTRACT }] } }
          ] }, { replaceMerge: ["series"] });
        };
        ctl.addEventListener("change", draw);
        draw();
      }
    },
    {
      title: "Load Shift Simulator",
      level: 3,
      desc: "Move flexible load out of the peak tariff period and see the annual saving and the new cost split. A simple what-if for energy managers.",
      render(b) {
        const base = { peak: 1.82e6, shoulder: 1.31e6, off: 1.05e6 }, rate = { peak: 0.28, shoulder: 0.17, off: 0.09 };
        b.innerHTML = `<div class="ax-ctl"><label>Shift <input type="range" min="0" max="30" value="10" aria-label="Percent of peak load shifted"></label><strong data-p></strong><span>of peak kWh to off-peak</span></div><div data-k style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px"></div>`;
        const c = AX.chart(b, { legend: { top: 0 }, xAxis: { type: "category", data: ["Current", "With shift"] }, yAxis: { type: "value", name: "$ / year", axisLabel: { formatter: v => "$" + F.compact(v) } }, series: [] }, 220);
        const draw = s => {
          const moved = base.peak * s / 100, after = { peak: base.peak - moved, shoulder: base.shoulder, off: base.off + moved };
          const cost = x => ({ peak: x.peak * rate.peak, shoulder: x.shoulder * rate.shoulder, off: x.off * rate.off });
          const c0 = cost(base), c1 = cost(after), t0 = sum(Object.values(c0)), t1 = sum(Object.values(c1));
          b.querySelector("[data-p]").textContent = s + "%";
          b.querySelector("[data-k]").innerHTML = tile("Annual saving", "$" + F.num(t0 - t1), `${((t0 - t1) / t0 * 100).toFixed(1)}% of energy cost`, "ok") + tile("kWh moved", F.compact(moved), "per year") + tile("New cost", "$" + F.compact(t1), "per year");
          c.setOption({ series: [["peak", "Peak", "#4f46e5"], ["shoulder", "Shoulder", "#a5b4fc"], ["off", "Off-peak", "#d4d4d8"]].map(([k, n, col]) => ({ type: "bar", name: n, stack: "s", barMaxWidth: 70, data: [Math.round(c0[k]), Math.round(c1[k])], itemStyle: { color: col, borderRadius: 0 } })) }, { replaceMerge: ["series"] });
        };
        b.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(10);
      }
    },
    {
      title: "Single-Line Diagram",
      level: 3,
      wide: true,
      desc: "Live electrical single-line diagram. Click any breaker to open or close it: downstream equipment de-energises and incomer flow recalculates.",
      render(b) {
        const feeders = [
          { id: "F1", name: "Chillers", kw: 310, kind: "load" }, { id: "F2", name: "Production line", kw: 420, kind: "load" },
          { id: "F3", name: "Lighting & small power", kw: 95, kind: "load" }, { id: "F4", name: "Solar PV 400 kWp", kw: 265, kind: "gen" },
          { id: "F5", name: "Battery 250 kW", kw: 120, kind: "gen" }
        ];
        const closed = { MAIN: true, F1: true, F2: true, F3: true, F4: true, F5: true };
        const W = 900, busY = 190, x0 = 120, gap = (W - 2 * x0) / (feeders.length - 1);
        const live = "#4f46e5", dead = "#d4d4d8";
        const brk = (id, x, y) => `<g data-brk="${id}" style="cursor:pointer"><rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="4" fill="#fff" stroke="currentColor" stroke-width="2"/><g data-sym></g><rect x="${x - 16}" y="${y - 16}" width="32" height="32" fill="transparent"/></g>`;
        b.innerHTML = `
          <div class="ax-ctl" data-k></div>
          <div style="overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:#fbfbfc">
          <svg viewBox="0 0 ${W} 420" style="width:100%;min-width:720px;display:block;font-family:var(--font)">
            <defs><marker id="sld-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="currentColor"/></marker></defs>
            <g data-line="MAIN"><line x1="${W / 2}" y1="34" x2="${W / 2}" y2="${busY}" stroke-width="3"/></g>
            <text x="${W / 2 + 14}" y="30" font-size="12" font-weight="600" fill="#18181b">Grid supply 11 kV</text>
            <text x="${W / 2 + 14}" y="46" font-size="11" fill="#71717a" data-grid></text>
            ${brk("MAIN", W / 2, 72)}
            <g data-tx><circle cx="${W / 2}" cy="118" r="15" fill="#fff" stroke-width="2.5"/><circle cx="${W / 2}" cy="138" r="15" fill="#fff" stroke-width="2.5"/></g>
            <text x="${W / 2 + 24}" y="124" font-size="11" fill="#71717a">TX1 1.5 MVA</text><text x="${W / 2 + 24}" y="138" font-size="11" fill="#71717a">11 kV / 415 V</text>
            <g data-line="BUS"><line x1="${x0 - 30}" y1="${busY}" x2="${W - x0 + 30}" y2="${busY}" stroke-width="6" stroke-linecap="round"/></g>
            <text x="${x0 - 30}" y="${busY - 12}" font-size="11" font-weight="600" fill="#71717a">MSB 415 V</text>
            ${feeders.map((f, i) => {
              const x = x0 + i * gap;
              return `<g data-line="${f.id}"><line x1="${x}" y1="${busY}" x2="${x}" y2="330" stroke-width="3"/></g>
                ${brk(f.id, x, 250)}
                <g data-flow="${f.id}"><line x1="${x + 18}" y1="${f.kind === "gen" ? 320 : 280}" x2="${x + 18}" y2="${f.kind === "gen" ? 280 : 320}" stroke-width="1.5" marker-end="url(#sld-arrow)"/></g>
                <g data-eq="${f.id}">${f.kind === "gen"
                  ? `<circle cx="${x}" cy="352" r="20" fill="#fff" stroke-width="2.5"/><text x="${x}" y="357" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${f.name.startsWith("Solar") ? "PV" : "B"}</text>`
                  : `<path d="M${x - 18} 334 h36 l-18 34 z" fill="#fff" stroke-width="2.5"/>`}</g>
                <text x="${x}" y="396" text-anchor="middle" font-size="12" font-weight="600" fill="#18181b">${f.name}</text>
                <text x="${x}" y="412" text-anchor="middle" font-size="11" data-kw="${f.id}"></text>`;
            }).join("")}
          </svg></div>
          <div class="ax-small" style="color:var(--ink-3);margin-top:8px">Click a breaker to toggle it. Values refresh every 2 s.</div>`;
        const svg = b.querySelector("svg");
        const draw = () => {
          const mainOn = closed.MAIN;
          const on = f => mainOn && closed[f.id];
          const load = sum(feeders.filter(f => f.kind === "load" && on(f)).map(f => f.kw));
          const gen = sum(feeders.filter(f => f.kind === "gen" && on(f)).map(f => f.kw));
          const grid = mainOn ? load - gen : 0;
          const paint = (sel, isLive) => svg.querySelectorAll(sel).forEach(g => { g.style.color = isLive ? live : dead; g.querySelectorAll("line,circle,path,rect").forEach(s => { if (s.getAttribute("fill") !== "transparent") s.setAttribute("stroke", "currentColor"); }); });
          paint('[data-line="MAIN"]', true);
          paint("[data-tx]", mainOn);
          paint('[data-line="BUS"]', mainOn);
          feeders.forEach(f => {
            paint(`[data-line="${f.id}"]`, on(f)); paint(`[data-eq="${f.id}"]`, on(f));
            const flow = svg.querySelector(`[data-flow="${f.id}"]`);
            flow.style.color = f.kind === "gen" ? "#10b981" : live;
            flow.style.opacity = on(f) ? 1 : 0;
            const t = svg.querySelector(`[data-kw="${f.id}"]`);
            t.textContent = on(f) ? `${f.kind === "gen" ? "+" : ""}${f.kw} kW` : "De-energised";
            t.setAttribute("fill", on(f) ? (f.kind === "gen" ? "#059669" : "#52525b") : "#a1a1aa");
          });
          Object.keys(closed).forEach(id => {
            const g = svg.querySelector(`[data-brk="${id}"]`), isOn = closed[id];
            const x = +g.querySelector("rect").getAttribute("x") + 11, y = +g.querySelector("rect").getAttribute("y") + 11;
            g.style.color = isOn ? "#18181b" : "#ef4444";
            g.querySelector("[data-sym]").innerHTML = isOn
              ? `<line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}" stroke="currentColor" stroke-width="2.5"/>`
              : `<line x1="${x - 6}" y1="${y + 6}" x2="${x + 6}" y2="${y - 6}" stroke="currentColor" stroke-width="2.5"/>`;
          });
          svg.querySelector("[data-grid]").textContent = mainOn ? `${grid >= 0 ? "Import" : "Export"} ${Math.abs(grid)} kW` : "Incomer open";
          b.querySelector("[data-k]").innerHTML = `<span class="ax-pill ax-pill--${mainOn ? "live" : "bad"}">${mainOn ? "Energised" : "Site isolated"}</span><span class="ax-small">Load <strong>${load} kW</strong> · On-site generation <strong>${gen} kW</strong> · Grid <strong>${grid >= 0 ? "import" : "export"} ${Math.abs(grid)} kW</strong></span>`;
        };
        svg.addEventListener("click", async e => {
          const g = e.target.closest("[data-brk]");
          if (!g) return;
          const id = g.dataset.brk, name = id === "MAIN" ? "the main incomer" : feeders.find(f => f.id === id).name;
          if (!await AX.modal({ title: `${closed[id] ? "Open" : "Close"} breaker ${id}?`, body: `This will ${closed[id] ? "de-energise" : "energise"} ${name}${id === "MAIN" ? " and everything downstream" : ""}.`, confirm: closed[id] ? "Open breaker" : "Close breaker" })) return;
          closed[id] = !closed[id];
          AX.rv("pushPayload", { breaker: id, command: closed[id] ? "close" : "open" }, 205813, "UID", "MSB-01", Date.now());
          draw();
        });
        AX.every(2000, () => { feeders.forEach(f => { f.kw = Math.max(5, Math.round(f.kw * (0.96 + Math.random() * 0.08))); }); draw(); }, b);
        draw();
      }
    }
  ]);
})();
