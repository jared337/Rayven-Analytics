/* ==========================================================================
 * Water: 12 domain components, simple to advanced
 * ========================================================================== */
(() => {
  const HOUR = D.HOUR, DAY = D.DAY;
  const sum = a => a.reduce((s, v) => s + v, 0);
  const tile = (l, v, sub, tone = "") => `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px"><div class="ax-kpi__label">${l}</div><div style="font-size:22px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${v}</div><div class="ax-small" style="color:${tone ? `var(--${tone})` : "var(--ink-3)"}">${sub}</div></div>`;

  AX.section("water", [
    {
      title: "Reservoir Storage",
      level: 1,
      desc: "Each reservoir's level, volume and, most usefully, how many days of supply it holds at current demand.",
      render(b) {
        const res = [["Hilltop R1", 0.82, 45, 9.1], ["Northside R2", 0.57, 30, 7.4], ["Valley R3", 0.31, 20, 6.2]];
        b.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${res.map(([n, l, cap, dem]) => {
          const ml = l * cap, days = ml / dem, tone = l < 0.35 ? "#ef4444" : l < 0.5 ? "#f59e0b" : "#4f46e5";
          return `<div style="text-align:center">
            <div style="position:relative;height:120px;width:78px;margin:0 auto;border-radius:10px;background:#f0f0f2;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)">
              <div style="position:absolute;inset:auto 0 0 0;height:${l * 100}%;background:linear-gradient(${tone}cc,${tone})"></div>
              <div style="position:absolute;inset:0;display:grid;place-items:center;font-weight:600;color:${l > 0.55 ? "#fff" : "var(--ink)"};font-size:18px">${Math.round(l * 100)}%</div>
            </div>
            <div style="font-size:13px;font-weight:600;margin-top:8px">${n}</div>
            <div class="ax-small" style="color:var(--ink-3)">${ml.toFixed(1)} of ${cap} ML</div>
            <div class="ax-small" style="font-weight:600;color:${days < 2 ? "var(--bad)" : "var(--ink)"}">${days.toFixed(1)} days supply</div></div>`;
        }).join("")}</div>`;
      }
    },
    {
      title: "Pump Station Status",
      level: 1,
      desc: "Each pump's state, flow, runtime and starts today. Too many starts per hour wears motors, so it is flagged.",
      render(b) {
        const pumps = [["P-101", "Running", 212, 14.2, 3], ["P-102", "Standby", 0, 6.1, 2], ["P-103", "Running", 198, 11.8, 14], ["P-104", "Fault", 0, 2.3, 1]];
        const tone = { Running: "good", Standby: "info", Fault: "bad" };
        b.innerHTML = `<div class="ax-table-wrap"><table class="ax-table"><thead><tr><th>Pump</th><th>State</th><th class="num">Flow L/s</th><th class="num">Run today</th><th class="num">Starts</th></tr></thead><tbody>${pumps.map(([id, s, f, h, st]) => `
          <tr><td style="font-weight:500">${id}</td><td><span class="ax-pill ax-pill--${tone[s]}">${s}</span></td><td class="num">${f || "-"}</td><td class="num">${h} h</td>
          <td class="num">${st > 10 ? `<span class="ax-pill ax-pill--warn">${st}</span>` : st}</td></tr>`).join("")}</tbody></table></div>
          <div class="ax-small" style="color:var(--ink-3);margin-top:8px">Station total 410 L/s · duty / assist / standby rotation weekly</div>`;
      }
    },
    {
      title: "Water Quality Compliance",
      level: 2,
      desc: "Chlorine, turbidity and pH against drinking water guideline ranges, with 30-day trends and exceedance counts.",
      render(b) {
        const params = [
          { n: "Free chlorine", u: "mg/L", lo: 0.2, hi: 5, axis: [0, 2.5], v: D.walk(30, { base: 0.9, vol: 0.12, min: 0.05, seed: 1 }) },
          { n: "Turbidity", u: "NTU", lo: null, hi: 1, axis: [0, 1.4], v: D.walk(30, { base: 0.35, vol: 0.12, min: 0.05, seed: 2 }).map((x, i) => (i === 21 ? 1.18 : x)) },
          { n: "pH", u: "", lo: 6.5, hi: 8.5, axis: [6, 9], v: D.walk(30, { base: 7.6, vol: 0.08, seed: 3 }) }
        ];
        b.innerHTML = "";
        params.forEach(p => {
          const last = p.v[29], exc = p.v.filter(x => (p.lo !== null && x < p.lo) || x > p.hi).length, ok = (p.lo === null || last >= p.lo) && last <= p.hi;
          const row = AX.add(b, `<div style="display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;padding:6px 0;border-bottom:1px solid #f4f4f5">
            <div><div style="font-size:13px;font-weight:500">${p.n}</div><div style="font-size:20px;font-weight:600;font-variant-numeric:tabular-nums">${last.toFixed(2)} <span class="ax-kpi__unit">${p.u}</span></div>
            <div class="ax-small" style="color:var(--ink-3)">Range ${p.lo === null ? "< " + p.hi : p.lo + " to " + p.hi} · <span style="color:${exc ? "var(--bad)" : "var(--ok)"}">${exc} exceedance${exc === 1 ? "" : "s"}</span></div></div><div></div></div>`);
          AX.chart(row.lastElementChild, {
            grid: { left: 4, right: 8, top: 6, bottom: 4, containLabel: true }, tooltip: { trigger: "axis" },
            xAxis: { type: "category", show: false, data: p.v.map((_, i) => `Day ${i + 1}`) }, yAxis: { type: "value", min: p.axis[0], max: p.axis[1], splitNumber: 2, axisLabel: { fontSize: 9.5 } },
            series: [{ type: "line", data: p.v.map(x => +x.toFixed(2)), color: ok ? "#4f46e5" : "#ef4444", showSymbol: false,
              markArea: { silent: true, itemStyle: { color: "rgba(16,185,129,.08)" }, data: [[{ yAxis: p.lo ?? p.axis[0] }, { yAxis: p.hi }]] },
              markPoint: { symbol: "circle", symbolSize: 7, itemStyle: { color: "#ef4444" }, label: { show: false }, data: p.v.map((x, i) => ((p.lo !== null && x < p.lo) || x > p.hi ? { coord: [i, x] } : null)).filter(Boolean) } }]
          }, 70);
        });
      }
    },
    {
      title: "Rainfall and Inflow",
      level: 2,
      desc: "Rainfall hanging from the top, catchment inflow below on the same time axis. The lag between them is the catchment response.",
      render(b) {
        const n = 120, T = i => Date.now() - (n - 1 - i) * HOUR;
        const rain = Array.from({ length: n }, (_, i) => (i > 30 && i < 42 ? Math.round(2 + 8 * Math.sin(((i - 30) / 12) * Math.PI)) : i > 80 && i < 86 ? Math.round(3 * Math.sin(((i - 80) / 6) * Math.PI)) : 0));
        let q = 40;
        const flow = rain.map((_, i) => { const lag = rain[i - 6] || 0; q = q + lag * 9 - (q - 40) * 0.08; return Math.round(q); });
        AX.chart(b, {
          legend: { top: 0, data: ["Rainfall", "Inflow"] }, tooltip: { trigger: "axis" }, axisPointer: { link: [{ xAxisIndex: "all" }] },
          grid: [{ left: 50, right: 16, top: 32, height: "24%" }, { left: 50, right: 16, top: "46%", bottom: 26 }],
          xAxis: [{ type: "time", gridIndex: 0, axisLabel: { show: false } }, { type: "time", gridIndex: 1 }],
          yAxis: [{ type: "value", gridIndex: 0, inverse: true, name: "mm", nameLocation: "start", splitNumber: 2 }, { type: "value", gridIndex: 1, name: "ML/d" }],
          series: [
            { type: "bar", name: "Rainfall", xAxisIndex: 0, yAxisIndex: 0, data: rain.map((v, i) => [T(i), v]), color: "#0d9488", barCategoryGap: "10%", itemStyle: { borderRadius: [0, 0, 2, 2] } },
            { type: "line", name: "Inflow", xAxisIndex: 1, yAxisIndex: 1, data: flow.map((v, i) => [T(i), v]), areaStyle: {} }
          ]
        }, 280);
      }
    },
    {
      title: "Wet Well Levels",
      level: 2,
      desc: "Sewage pump station level cycling between duty start and stop setpoints, with standby start and overflow levels marked.",
      render(b) {
        const n = 240, T = i => Date.now() - (n - 1 - i) * 6 * 60e3;
        let lvl = 1.2, on = false;
        const lv = [], runs = [];
        for (let i = 0; i < n; i++) {
          const inflow = 0.035 + 0.025 * Math.sin((i / n) * 4 * Math.PI) + (i > 150 && i < 175 ? 0.06 : 0);
          if (lvl >= 2.1) on = true;
          if (lvl <= 0.9) on = false;
          lvl += inflow - (on ? 0.09 : 0);
          lv.push([T(i), +lvl.toFixed(2)]);
          if (on) runs.push(i);
        }
        const areas = [];
        runs.forEach((i, k) => { if (k === 0 || runs[k - 1] !== i - 1) areas.push([{ xAxis: T(i) }, { xAxis: T(i) }]); areas[areas.length - 1][1].xAxis = T(i); });
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">${areas.length} pump cycles in 24 h</span><span class="ax-pill ax-pill--good">No overflow</span><span class="ax-small" style="color:var(--ink-3)">Shaded = duty pump running</span></div>`;
        const ml = (name, y, color) => ({ name, yAxis: y, lineStyle: { color, type: "dashed" }, label: { formatter: `${name} ${y} m`, color, fontSize: 10, position: "insideEndTop" } });
        AX.chart(b, {
          xAxis: { type: "time" }, yAxis: { type: "value", name: "m", min: 0, max: 3.4 },
          series: [{ type: "line", name: "Level", data: lv, lineStyle: { width: 2 },
            markArea: { silent: true, itemStyle: { color: "rgba(79,70,229,.07)" }, data: areas },
            markLine: { symbol: "none", silent: true, data: [ml("Overflow", 3.1, "#ef4444"), ml("Standby start", 2.6, "#f59e0b"), ml("Duty start", 2.1, "#4f46e5"), ml("Stop", 0.9, "#a1a1aa")] } }]
        }, 240);
      }
    },
    {
      title: "Minimum Night Flow",
      level: 2,
      desc: "District inflow over two weeks with the 2 to 4 am window shaded. When the night minimum creeps up, a leak has started.",
      render(b) {
        const n = 14 * 24, T = i => Date.now() - (n - 1 - i) * HOUR;
        const flow = Array.from({ length: n }, (_, i) => { const h = (i + 1) % 24, base = 6 + (h >= 6 && h <= 22 ? 16 * Math.sin(((h - 6) / 16) * Math.PI) : 0); return +(base + (i > 9 * 24 ? 3.2 : 0) + Math.random() * 1.2).toFixed(1); });
        const nights = [], mnf = [];
        for (let d = 0; d < 14; d++) {
          const a = d * 24 + 1, win = flow.slice(a, a + 3);
          if (win.length) { mnf.push([T(a + 1), Math.min(...win)]); nights.push([{ xAxis: T(a) }, { xAxis: T(a + 3) }]); }
        }
        const before = sum(mnf.slice(0, 9).map(x => x[1])) / 9, after = sum(mnf.slice(10).map(x => x[1])) / mnf.slice(10).length;
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Night minimum up <strong>${(after - before).toFixed(1)} L/s</strong> since day 10</span><span class="ax-pill ax-pill--bad">Likely new leak · ~${F.num((after - before) * 86.4, 0)} kL/day</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "time" }, yAxis: { type: "value", name: "L/s", min: 0 },
          series: [
            { type: "line", name: "Inflow", data: flow.map((v, i) => [T(i), v]), lineStyle: { width: 1.2 }, markArea: { silent: true, itemStyle: { color: "rgba(161,161,170,.12)" }, data: nights } },
            { type: "line", name: "Night minimum", data: mnf, showSymbol: true, symbolSize: 7, color: "#ef4444", lineStyle: { width: 2 } }
          ]
        }, 240);
      }
    },
    {
      title: "DMA Water Balance",
      level: 2,
      desc: "System input split into billed consumption and losses for each district metered area, ranked by non-revenue water.",
      render(b) {
        const dmas = [["DMA-01 Riverside", 412, 371], ["DMA-02 Hilltop", 288, 244], ["DMA-03 CBD", 640, 602], ["DMA-04 Northgate", 198, 151], ["DMA-05 Lakes", 355, 329], ["DMA-06 Industrial", 520, 492]]
          .map(([n, inp, bill]) => ({ n, inp, bill, loss: inp - bill, nrw: ((inp - bill) / inp) * 100 })).sort((a, z) => z.nrw - a.nrw);
        const tot = sum(dmas.map(d => d.inp)), totLoss = sum(dmas.map(d => d.loss));
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Network NRW <strong>${(totLoss / tot * 100).toFixed(1)}%</strong> · ${F.num(totLoss)} ML/yr lost</span><span class="ax-pill ax-pill--warn">2 DMAs above 15% target</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          xAxis: [{ type: "value", name: "ML/yr" }], yAxis: [{ type: "category", data: dmas.map(d => d.n), inverse: true }],
          series: [
            { type: "bar", name: "Billed", stack: "s", data: dmas.map(d => d.bill), itemStyle: { color: "#c7d2fe", borderRadius: 0 }, barMaxWidth: 16 },
            { type: "bar", name: "Non-revenue", stack: "s", data: dmas.map(d => ({ value: d.loss, itemStyle: { color: d.nrw > 15 ? "#ef4444" : "#4f46e5", borderRadius: [0, 3, 3, 0] } })),
              label: { show: true, position: "right", fontSize: 10.5, color: "#52525b", formatter: p => dmas[p.dataIndex].nrw.toFixed(1) + "%" } }
          ]
        }, 250);
      }
    },
    {
      title: "Pump Energy Efficiency",
      level: 2,
      desc: "Specific energy (kWh per ML pumped) for each pump over 12 weeks against benchmark. Rising values signal wear or blockage.",
      render(b) {
        const pumps = [["P-101", 412, 0], ["P-102", 398, 0.4], ["P-103", 405, 2.6], ["P-104", 420, 0.2]];
        const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: weeks }, yAxis: { type: "value", name: "kWh/ML", min: 360 },
          series: pumps.map(([id, base, drift], i) => ({ type: "line", name: id, showSymbol: true, symbolSize: 5,
            data: D.walk(12, { base, vol: 3, seed: i + 30 }).map((v, k) => +(v + drift * k).toFixed(0)), color: drift > 1 ? "#ef4444" : AX.PALETTE[[0, 2, 0, 3][i]],
            lineStyle: { type: i === 2 || drift > 1 ? "solid" : i % 2 ? "dashed" : "solid" },
            ...(i === 0 ? { markLine: { symbol: "none", silent: true, label: { formatter: "Benchmark 410", fontSize: 10, position: "insideEndTop" }, lineStyle: { color: "#10b981", type: "dashed" }, data: [{ yAxis: 410 }] } } : {}) }))
        }, 240);
        b.insertAdjacentHTML("afterbegin", `<div class="ax-ctl"><span class="ax-pill ax-pill--bad">P-103 up 7% in 12 weeks</span><span class="ax-small" style="color:var(--ink-3)">Inspect impeller and suction screen</span></div>`);
      }
    },
    {
      title: "Pump Curve and Duty Point",
      level: 3,
      desc: "Pump head and efficiency curves against the system curve. Change VSD speed and the duty point moves along the system curve (affinity laws).",
      render(b) {
        const H0 = 62, k = 0.00042, static_ = 18, ks = 0.00019, qMax = 420;
        const ctl = AX.add(b, `<div class="ax-ctl"><label>VSD speed <input type="range" min="60" max="100" value="92" aria-label="Speed"></label><strong data-s></strong><span class="ax-small" data-d></span></div>`);
        const c = AX.chart(b, {
          legend: { top: 0 }, tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
          xAxis: { type: "value", name: "Flow L/s", max: qMax }, yAxis: [{ type: "value", name: "Head m", max: 70 }, { type: "value", name: "Eff. %", max: 100, splitLine: { show: false } }], series: []
        }, 270);
        const draw = sp => {
          const s = sp / 100, Q = Array.from({ length: 43 }, (_, i) => i * 10);
          const pump = q => H0 * s * s - k * q * q, sys = q => static_ + ks * q * q;
          const qd = Math.sqrt((H0 * s * s - static_) / (k + ks)), hd = sys(qd);
          const bep = 300 * s, eff = q => Math.max(0, 82 - 0.0011 * (q - bep) ** 2);
          ctl.querySelector("[data-s]").textContent = sp + "%";
          ctl.querySelector("[data-d]").innerHTML = `Duty <strong>${qd.toFixed(0)} L/s at ${hd.toFixed(1)} m</strong> · efficiency <strong>${eff(qd).toFixed(0)}%</strong> · ${Math.abs(qd - bep) / bep < 0.1 ? '<span class="ax-up">near BEP</span>' : '<span class="ax-down">away from BEP</span>'}`;
          c.setOption({ series: [
            { type: "line", name: "Pump curve", data: Q.filter(q => pump(q) > 0).map(q => [q, +pump(q).toFixed(2)]), smooth: true, lineStyle: { width: 2.5 } },
            { type: "line", name: "System curve", data: Q.map(q => [q, +sys(q).toFixed(2)]), smooth: true, color: "#a1a1aa", lineStyle: { type: "dashed" } },
            { type: "line", name: "Efficiency", yAxisIndex: 1, data: Q.filter(q => eff(q) > 0).map(q => [q, +eff(q).toFixed(1)]), smooth: true, color: "#0d9488", lineStyle: { width: 1.5 } },
            { type: "scatter", name: "Duty point", data: [[+qd.toFixed(1), +hd.toFixed(1)]], symbolSize: 14, itemStyle: { color: "#ef4444", borderColor: "#fff", borderWidth: 2.5 }, z: 5 },
            { type: "scatter", name: "BEP", data: [[+bep.toFixed(1), +pump(bep).toFixed(1)]], symbol: "diamond", symbolSize: 12, itemStyle: { color: "#10b981" } }
          ] }, { replaceMerge: ["series"] });
        };
        ctl.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(92);
      }
    },
    {
      title: "Supply and Demand Outlook",
      level: 3,
      desc: "14-day demand forecast against treatment capacity, with projected storage and the level that triggers water restrictions.",
      render(b) {
        const days = Array.from({ length: 21 }, (_, i) => F.date(Date.now() + (i - 7) * DAY));
        const cap = 92, r = D.rng(8);
        const demand = days.map((_, i) => Math.round(78 + i * 0.9 + (r() - 0.5) * 8 + (i > 11 && i < 16 ? 9 : 0)));
        let st = 68;
        const storage = demand.map(d => (st = Math.max(0, Math.min(100, st + (cap - d) * 0.45)), +st.toFixed(1)));
        const breach = storage.findIndex((s, i) => i >= 7 && s < 40);
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Capacity <strong>${cap} ML/d</strong></span><span class="ax-pill ax-pill--${breach > 0 ? "warn" : "good"}">${breach > 0 ? `Storage below 40% trigger on ${days[breach]}` : "No restrictions forecast"}</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: days, axisLabel: { interval: 2 } },
          yAxis: [{ type: "value", name: "ML/d", min: 60 }, { type: "value", name: "Storage %", max: 100, splitLine: { show: false } }],
          series: [
            { type: "bar", name: "Demand", data: demand.map((v, i) => ({ value: v, itemStyle: { color: i < 7 ? "#4f46e5" : "#c7d2fe" } })),
              markLine: { symbol: "none", silent: true, label: { formatter: "Capacity", fontSize: 10, position: "insideEndTop" }, lineStyle: { color: "#18181b", type: "dashed" }, data: [{ yAxis: cap }] },
              markArea: { silent: true, itemStyle: { color: "rgba(161,161,170,.06)" }, label: { color: "#a1a1aa", fontSize: 10, position: "insideTop" }, data: [[{ name: "Forecast", xAxis: days[7] }, { xAxis: days[20] }]] } },
            { type: "line", name: "Storage", yAxisIndex: 1, data: storage, color: "#0d9488", lineStyle: { width: 2.5 },
              markLine: { symbol: "none", silent: true, label: { formatter: "Restrictions 40%", fontSize: 10, position: "insideStartTop", color: "#ef4444" }, lineStyle: { color: "#ef4444", type: "dotted" }, data: [{ yAxis: 40 }] } }
          ]
        }, 250);
      }
    },
    {
      title: "Network Pressure Map",
      level: 3,
      desc: "Water mains coloured by modelled pressure. Switch between peak hour and night to see where customers lose pressure.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["peak", "Peak hour 07:30"], ["night", "Night 03:00"]], "peak")}<span class="ax-small" data-s></span></div>`);
        const legend = [["< 20 m", "#ef4444"], ["20 to 30 m", "#f59e0b"], ["30 to 50 m", "#4f46e5"], ["> 50 m", "#a5b4fc"]];
        b.insertAdjacentHTML("beforeend", `<div class="ax-ctl ax-small" style="margin:8px 0 0">${legend.map(([l, c]) => `<span class="ax-row" style="gap:6px"><span style="width:14px;height:4px;border-radius:2px;background:${c}"></span>${l}</span>`).join("")}</div>`);
        const m = AX.map(b, { center: [-33.835, 151.03], zoom: 14, height: 300 });
        b.appendChild(b.querySelector(".ax-ctl.ax-small"));
        const col = p => (p < 20 ? "#ef4444" : p < 30 ? "#f59e0b" : p < 50 ? "#4f46e5" : "#a5b4fc");
        const src = [-33.826, 151.012], pipes = [], r = D.rng(5);
        for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
          const a = [-33.822 - i * 0.004, 151.012 + j * 0.006];
          if (j < 6) pipes.push([a, [a[0], a[1] + 0.006]]);
          if (i < 6) pipes.push([a, [a[0] - 0.004, a[1]]]);
        }
        L.marker(src, { icon: AX.dot("#0d9488", 18) }).addTo(m).bindTooltip("Reservoir outlet (supply point)");
        const lines = pipes.map(p => {
          const mid = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2], dist = m.distance(src, mid), elev = r() * 8;
          return { p, dist, elev, line: L.polyline(p, { weight: 5, opacity: 0.9, lineCap: "round" }).addTo(m) };
        });
        const draw = mode => {
          let low = 0;
          lines.forEach(l => {
            const pr = mode === "peak" ? 58 - l.dist / 90 - l.elev * 1.2 : 74 - l.dist / 300 - l.elev;
            if (pr < 20) low++;
            l.line.setStyle({ color: col(pr) }).bindTooltip(`Main ${Math.round(l.dist)} m from supply<br><strong>${pr.toFixed(1)} m</strong> pressure`);
          });
          ctl.querySelector("[data-s]").innerHTML = low ? `<span class="ax-pill ax-pill--bad">${low} pipe segments below 20 m service level</span>` : `<span class="ax-pill ax-pill--good">All mains above 20 m</span>`;
        };
        draw("peak");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Treatment Process Mimic",
      level: 3,
      wide: true,
      desc: "Live SCADA-style mimic from raw water dam to town reservoir. Start and stop pumps, close the valve, and watch flows and tank levels respond, including a low-level interlock.",
      render(b) {
        const S = { P1: true, P2: false, P3: true, V1: true, dam: 72, tank: 54, res: 63, faultP3: false };
        const pipe = (id, pts) => `<polyline points="${pts}" fill="none" stroke="#e4e4e7" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><polyline data-pipe="${id}" points="${pts}" fill="none" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" class="ax-flow"/>`;
        const pump = (id, x, y) => `<g class="ax-hot" data-pump="${id}"><circle cx="${x}" cy="${y}" r="21" fill="#fff" stroke-width="3"/><g class="ax-spin" data-imp="${id}"><path d="M${x} ${y - 11} L${x + 9.5} ${y + 5.5} L${x - 9.5} ${y + 5.5} Z" fill="currentColor" opacity=".9"/></g><text x="${x}" y="${y + 40}" text-anchor="middle" font-size="12" font-weight="600" fill="#18181b">${id}</text><text x="${x}" y="${y + 54}" text-anchor="middle" font-size="10.5" data-ptext="${id}"></text></g>`;
        const tank = (id, x, y, w, h, label) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#f4f4f5" stroke="#d4d4d8" stroke-width="2"/><rect data-fill="${id}" x="${x + 3}" y="${y + 3}" width="${w - 6}" height="0" rx="4" fill="#818cf8"/><text x="${x + w / 2}" y="${y - 22}" text-anchor="middle" font-size="12" font-weight="600" fill="#18181b">${label}</text><text x="${x + w / 2}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#52525b" data-ltext="${id}"></text></g>`;
        b.innerHTML = `
          <div class="ax-ctl" data-k></div>
          <div style="overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:#fbfbfc">
          <svg viewBox="0 0 960 360" style="width:100%;min-width:760px;display:block;font-family:var(--font)">
            <clipPath id="ax-dam-clip"><path d="M14 110 L146 110 L156 300 L4 300 Z"/></clipPath>
            <path d="M14 110 L146 110 L156 300 L4 300 Z" fill="#f4f4f5" stroke="#d4d4d8" stroke-width="2"/>
            <rect data-fill="dam" x="0" y="300" width="160" height="0" fill="#0d9488" opacity=".55" clip-path="url(#ax-dam-clip)"/>
            <text x="80" y="88" text-anchor="middle" font-size="12" font-weight="600" fill="#18181b">Raw water dam</text>
            <text x="80" y="102" text-anchor="middle" font-size="11" fill="#52525b" data-ltext="dam"></text>
            ${pipe("A", "150,250 190,250 190,150 209,150")}${pipe("A2", "190,250 209,250")}
            ${pipe("B1", "251,150 290,150 290,200")}${pipe("B2", "251,250 290,250 290,200")}${pipe("B", "290,200 340,200")}
            ${pipe("C", "480,200 560,200")}${pipe("D", "640,270 689,270")}${pipe("E", "731,270 760,270 760,140 780,140")}${pipe("F", "870,230 950,230")}
            ${pump("P1", 230, 150)}${pump("P2", 230, 250)}
            <rect x="340" y="140" width="140" height="120" rx="12" fill="#fff" stroke="#d4d4d8" stroke-width="2"/>
            <text x="410" y="166" text-anchor="middle" font-size="12.5" font-weight="600" fill="#18181b">Treatment plant</text>
            <text x="410" y="190" text-anchor="middle" font-size="11" fill="#52525b" data-wtp="flow"></text>
            <text x="410" y="210" text-anchor="middle" font-size="11" fill="#52525b">Turbidity 0.12 NTU</text>
            <text x="410" y="230" text-anchor="middle" font-size="11" fill="#52525b">Free Cl 1.10 mg/L</text>
            <g class="ax-hot" data-valve="V1"><path d="M508 188 L532 212 L532 188 L508 212 Z" fill="#fff" stroke-width="2.5" stroke-linejoin="round"/><text x="520" y="232" text-anchor="middle" font-size="11.5" font-weight="600" fill="#18181b">V1</text><text x="520" y="246" text-anchor="middle" font-size="10.5" data-vtext></text></g>
            ${tank("tank", 560, 120, 80, 170, "Clear water tank")}
            ${pump("P3", 710, 270)}
            ${tank("res", 780, 90, 90, 160, "Town reservoir")}
            <text x="950" y="252" text-anchor="end" font-size="11" fill="#52525b" data-out></text>
          </svg></div>
          <div class="ax-small" style="color:var(--ink-3);margin-top:8px">Click a pump or valve to operate it. P3 trips automatically if the clear water tank falls below 10%.</div>`;
        const svg = b.querySelector("svg");
        const flows = () => {
          const qA = S.V1 ? (S.P1 ? 110 : 0) + (S.P2 ? 110 : 0) : 0;
          const qB = S.P3 && !S.faultP3 ? 180 : 0;
          return { qA, qB, out: S.res > 1 ? 150 : 0 };
        };
        const setLevel = (id, pct) => {
          const el = svg.querySelector(`[data-fill="${id}"]`);
          if (id === "dam") { el.setAttribute("y", 300 - 190 * pct / 100); el.setAttribute("height", 190 * pct / 100); }
          else {
            const box = el.previousElementSibling, y = +box.getAttribute("y"), h = +box.getAttribute("height") - 6;
            el.setAttribute("y", y + 3 + h * (1 - pct / 100)); el.setAttribute("height", h * pct / 100);
            el.setAttribute("fill", pct < 15 ? "#ef4444" : "#818cf8");
          }
          svg.querySelector(`[data-ltext="${id}"]`).textContent = `${pct.toFixed(1)}%`;
        };
        const draw = () => {
          const { qA, qB, out } = flows();
          const set = (id, on) => { const p = svg.querySelector(`[data-pipe="${id}"]`); p.setAttribute("stroke", on ? "#4f46e5" : "#d4d4d8"); p.classList.toggle("is-off", !on); };
          set("A", S.V1 && S.P1); set("A2", S.V1 && S.P2); set("B1", S.V1 && S.P1); set("B2", S.V1 && S.P2); set("B", qA > 0); set("C", qA > 0); set("D", qB > 0); set("E", qB > 0); set("F", out > 0);
          ["P1", "P2", "P3"].forEach(id => {
            const run = id === "P3" ? S.P3 && !S.faultP3 : S[id] && S.V1, fault = id === "P3" && S.faultP3;
            const g = svg.querySelector(`[data-pump="${id}"]`);
            g.style.color = fault ? "#ef4444" : run ? "#10b981" : "#a1a1aa";
            g.querySelector("circle").setAttribute("stroke", "currentColor");
            g.querySelector(`[data-imp="${id}"]`).classList.toggle("ax-spin", run);
            const t = svg.querySelector(`[data-ptext="${id}"]`);
            t.textContent = fault ? "Tripped" : run ? `${id === "P3" ? 180 : 110} L/s` : S[id] && !S.V1 ? "No flow" : "Stopped";
            t.setAttribute("fill", fault ? "#ef4444" : run ? "#059669" : "#a1a1aa");
          });
          const v = svg.querySelector("[data-valve]");
          v.style.color = S.V1 ? "#18181b" : "#ef4444";
          v.querySelector("path").setAttribute("stroke", "currentColor");
          v.querySelector("path").setAttribute("fill", S.V1 ? "#fff" : "#fecaca");
          svg.querySelector("[data-vtext]").textContent = S.V1 ? "Open" : "Closed";
          svg.querySelector("[data-vtext]").setAttribute("fill", S.V1 ? "#52525b" : "#ef4444");
          svg.querySelector('[data-wtp="flow"]').textContent = `Inflow ${qA} L/s`;
          svg.querySelector("[data-out]").textContent = `${out} L/s to town`;
          setLevel("dam", S.dam); setLevel("tank", S.tank); setLevel("res", S.res);
          const alarms = [S.faultP3 && "P3 tripped on low clear water level", S.tank > 95 && "Clear water tank high level", S.res < 25 && "Town reservoir low"].filter(Boolean);
          b.querySelector("[data-k]").innerHTML = `<span class="ax-pill ax-pill--${alarms.length ? "bad" : "live"}">${alarms.length ? alarms.length + " active alarm" + (alarms.length > 1 ? "s" : "") : "Running normally"}</span>${alarms.map(a => `<span class="ax-small" style="color:var(--bad)">${a}</span>`).join("")}<span class="ax-small" style="color:var(--ink-3);margin-left:auto">Production ${qA} L/s · Transfer ${qB} L/s · Demand ${out} L/s</span>`;
        };
        svg.addEventListener("click", async e => {
          const p = e.target.closest("[data-pump]"), v = e.target.closest("[data-valve]");
          if (p) {
            const id = p.dataset.pump, on = S[id] && !(id === "P3" && S.faultP3);
            if (!await AX.modal({ title: `${on ? "Stop" : "Start"} pump ${id}?`, body: `${id === "P3" ? "High-lift transfer pump to the town reservoir." : "Raw water intake pump."}${id === "P3" && S.faultP3 ? " This also resets the low-level trip." : ""}`, confirm: on ? "Stop pump" : "Start pump" })) return;
            if (id === "P3" && S.faultP3) { S.faultP3 = false; S.P3 = true; } else S[id] = !on;
            AX.rv("pushPayload", { pump: id, command: S[id] ? "start" : "stop" }, 205813, "UID", "WTP-01", Date.now());
          }
          if (v) {
            if (!await AX.modal({ title: `${S.V1 ? "Close" : "Open"} valve V1?`, body: S.V1 ? "Closing V1 stops all flow from the treatment plant to the clear water tank." : "Restores flow to the clear water tank.", confirm: S.V1 ? "Close valve" : "Open valve" })) return;
            S.V1 = !S.V1;
            AX.rv("pushPayload", { valve: "V1", command: S.V1 ? "open" : "close" }, 205813, "UID", "WTP-01", Date.now());
          }
          draw();
        });
        AX.every(1000, () => {
          const { qA, qB, out } = flows();
          S.dam = Math.max(0, S.dam - qA * 0.00002);
          S.tank = Math.max(0, Math.min(100, S.tank + (qA - qB) * 0.012));
          S.res = Math.max(0, Math.min(100, S.res + (qB - out) * 0.008));
          if (S.tank < 10 && S.P3 && !S.faultP3) { S.faultP3 = true; AX.toast("P3 tripped: clear water tank low level interlock", "bad"); }
          draw();
        }, b);
        draw();
      }
    }
  ]);
})();
