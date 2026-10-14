/* ==========================================================================
 * Asset Management: 12 domain components, simple to advanced
 * ========================================================================== */
(() => {
  const sum = a => a.reduce((s, v) => s + v, 0);
  const tile = (l, v, sub, tone = "") => `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px"><div class="ax-kpi__label">${l}</div><div style="font-size:22px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums">${v}</div><div class="ax-small" style="color:${tone ? `var(--${tone})` : "var(--ink-3)"}">${sub}</div></div>`;

  /* Condition scale 1 (very good) to 5 (very poor) */
  const COND = [["1 Very good", "#4f46e5"], ["2 Good", "#818cf8"], ["3 Fair", "#c7d2fe"], ["4 Poor", "#f59e0b"], ["5 Very poor", "#ef4444"]];
  const classes = ["Pumps", "Valves", "Pipes", "Motors", "Switchboards", "Tanks"];

  /* Synthetic asset register */
  const assets = Array.from({ length: 80 }, (_, i) => {
    const r = D.rng(i * 13 + 7), cls = classes[i % classes.length];
    const cond = Math.min(5, Math.max(1, Math.round(1 + r() * 3.2 + (r() > 0.85 ? 1 : 0))));
    return {
      id: `${cls.slice(0, 3).toUpperCase()}-${String(100 + i)}`, cls, site: D.sites[i % D.sites.length].name, cond,
      crit: Math.min(5, Math.max(1, Math.round(1 + r() * 4.2))), like: Math.min(5, Math.max(1, Math.round(cond - 0.5 + r() * 1.6))),
      health: Math.round(100 - cond * 15 - r() * 12), rul: +(Math.max(0.3, (6 - cond) * 3.2 + (r() - 0.5) * 5)).toFixed(1),
      value: Math.round((cls === "Pipes" ? 400 : cls === "Switchboards" ? 260 : 60 + r() * 140) * 1000)
    };
  });

  AX.section("assets", [
    {
      title: "Asset Portfolio Summary",
      level: 1,
      desc: "The register at a glance: asset count, replacement value, average condition and the share in poor or very poor condition.",
      render(b) {
        const poor = assets.filter(a => a.cond >= 4).length;
        b.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          ${tile("Assets", F.num(assets.length * 54), "Across 8 sites, 6 classes")}${tile("Replacement value", "$" + F.compact(sum(assets.map(a => a.value)) * 54), "Current, gross")}
          ${tile("Average condition", (sum(assets.map(a => a.cond)) / assets.length).toFixed(1) + " / 5", "1 very good, 5 very poor")}${tile("Poor or very poor", Math.round(poor / assets.length * 100) + "%", `${poor * 54} assets need attention`, "warn")}</div>`;
      }
    },
    {
      title: "Condition by Asset Class",
      level: 1,
      desc: "Share of each asset class in each condition grade, so you can see which classes are ageing fastest.",
      render(b) {
        AX.chart(b, {
          legend: { top: 0 }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: v => v + "%" },
          xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } }, yAxis: { type: "category", data: classes, inverse: true },
          series: COND.map(([n, c], ci) => ({ type: "bar", name: n, stack: "c", barMaxWidth: 18, itemStyle: { color: c, borderRadius: 0 },
            data: classes.map(cl => { const g = assets.filter(a => a.cls === cl); return Math.round(g.filter(a => a.cond === ci + 1).length / g.length * 100); }) }))
        }, 260);
      }
    },
    {
      title: "Risk Matrix",
      level: 2,
      desc: "Assets plotted by likelihood of failure and consequence. Click any cell to list the assets in it.",
      render(b) {
        const score = (l, c) => l * c, band = s => (s >= 15 ? ["Extreme", "#ef4444"] : s >= 10 ? ["High", "#f97316"] : s >= 5 ? ["Medium", "#f59e0b"] : ["Low", "#10b981"]);
        const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:auto 1fr;gap:6px;align-items:center"></div>`);
        wrap.innerHTML = `<div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11.5px;color:var(--ink-3);text-align:center">Likelihood →</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px">${[5, 4, 3, 2, 1].map(l => [1, 2, 3, 4, 5].map(c => {
            const n = assets.filter(a => a.like === l && a.crit === c).length, [, col] = band(score(l, c));
            return `<button type="button" data-l="${l}" data-c="${c}" style="all:unset;cursor:pointer;aspect-ratio:1.6;border-radius:7px;display:grid;place-items:center;background:${col}${n ? "2e" : "12"};color:${col};font-weight:600;font-size:15px;box-shadow:inset 0 0 0 1px ${col}33">${n || ""}</button>`;
          }).join("")).join("")}</div>
          <div></div><div class="ax-small" style="text-align:center;color:var(--ink-3)">Consequence →</div>`;
        const out = AX.add(b, `<div class="ax-small" style="margin-top:10px;color:var(--ink-3)">Click a cell to see its assets</div>`);
        wrap.addEventListener("click", e => {
          const cell = e.target.closest("[data-l]");
          if (!cell) return;
          wrap.querySelectorAll("[data-l]").forEach(x => { x.style.outline = x === cell ? "2px solid #18181b" : "none"; });
          const l = +cell.dataset.l, c = +cell.dataset.c, [bn] = band(score(l, c)), list = assets.filter(a => a.like === l && a.crit === c);
          out.innerHTML = `<strong style="color:var(--ink)">${bn} risk</strong> · likelihood ${l} × consequence ${c} · ${list.length} asset${list.length === 1 ? "" : "s"}<br>${list.slice(0, 10).map(a => `<span class="ax-pill" style="margin:4px 4px 0 0">${a.id}</span>`).join("") || "None"}`;
        });
      }
    },
    {
      title: "Criticality vs Health",
      level: 2,
      desc: "Each asset by how critical it is and how healthy it is. The quadrants turn that into an action: act now, plan renewal, monitor, or run to failure.",
      render(b) {
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: p => `${p.data[2]} (${p.data[3]})<br>Health ${p.data[0]} · Criticality ${p.data[1]}` },
          grid: { left: 4, right: 12, top: 14, bottom: 26, containLabel: true },
          xAxis: { type: "value", name: "Health score (lower is worse)", nameLocation: "middle", nameGap: 26, min: 0, max: 100, inverse: true }, yAxis: { type: "value", name: "Criticality", min: 0, max: 5.5 },
          series: [{ type: "scatter", symbolSize: 9, data: assets.map(a => { const cr = +(a.crit + (D.rng(a.health)() - 0.5) * 0.6).toFixed(2); return { value: [a.health, cr, a.id, a.cls], itemStyle: { color: a.health < 50 && cr >= 3 ? "#ef4444" : a.health < 50 || cr >= 3 ? "#4f46e5" : "#a1a1aa" } }; }),
            markLine: { symbol: "none", silent: true, label: { show: false }, lineStyle: { color: "#d4d4d8" }, data: [{ xAxis: 50 }, { yAxis: 3 }] },
            markArea: { silent: true, label: { fontSize: 11, fontWeight: 600, position: "insideTopRight" }, data: [
              [{ name: "Act now", xAxis: 50, yAxis: 5.5, itemStyle: { color: "rgba(239,68,68,.06)" }, label: { color: "#ef4444", position: "insideTopRight" } }, { xAxis: 0, yAxis: 3 }],
              [{ name: "Plan renewal", xAxis: 50, yAxis: 3, itemStyle: { color: "rgba(0,0,0,0)" }, label: { color: "#71717a", position: "insideBottomRight" } }, { xAxis: 0, yAxis: 0 }],
              [{ name: "Maintain and monitor", xAxis: 100, yAxis: 5.5, itemStyle: { color: "rgba(0,0,0,0)" }, label: { color: "#71717a", position: "insideTopLeft" } }, { xAxis: 50, yAxis: 3 }],
              [{ name: "Run to failure", xAxis: 100, yAxis: 3, itemStyle: { color: "rgba(0,0,0,0)" }, label: { color: "#a1a1aa", position: "insideBottomLeft" } }, { xAxis: 50, yAxis: 0 }]] } }]
        }, 290);
      }
    },
    {
      title: "Remaining Useful Life",
      level: 2,
      desc: "Assets with the least remaining life first, with the year each will need replacing. Feeds directly into the renewal plan.",
      render(b) {
        const list = [...assets].sort((a, z) => a.rul - z.rul).slice(0, 12), yr = new Date().getFullYear();
        AX.chart(b, {
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => `${p[0].name}<br>${p[0].value} years · replace ${yr + Math.floor(p[0].value)}` },
          xAxis: { type: "value", name: "Years" }, yAxis: { type: "category", data: list.map(a => `${a.id} ${a.cls}`), inverse: true, axisLabel: { fontSize: 10.5 } },
          series: [{ type: "bar", barMaxWidth: 12, data: list.map(a => ({ value: a.rul, itemStyle: { color: a.rul < 2 ? "#ef4444" : a.rul < 5 ? "#f59e0b" : "#4f46e5", borderRadius: [0, 3, 3, 0] } })),
            label: { show: true, position: "right", fontSize: 10, color: "#71717a", formatter: p => `${yr + Math.floor(p.value)}` } }]
        }, 300);
      }
    },
    {
      title: "Maintenance Performance",
      level: 2,
      desc: "The core maintenance KPIs: PM compliance, planned vs reactive work, MTBF, MTTR and backlog in crew-weeks.",
      render(b) {
        b.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:12px;align-items:center"><div data-d></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${tile("PM compliance", "87%", "Target 90%", "warn")}${tile("MTBF", "412 h", "▲ 8% vs last quarter", "ok")}${tile("MTTR", "5.6 h", "▼ 0.4 h vs last quarter", "ok")}${tile("Backlog", "3.4 wk", "Healthy range 2 to 4")}</div></div>`;
        AX.chart(b.querySelector("[data-d]"), {
          tooltip: { trigger: "item", formatter: "{b}: {d}%" },
          graphic: [{ type: "text", left: "center", top: "40%", style: { text: "71%", fontSize: 24, fontWeight: 600, fill: "#18181b", textAlign: "center" } }, { type: "text", left: "center", top: "56%", style: { text: "planned", fontSize: 11, fill: "#a1a1aa", textAlign: "center" } }],
          series: [{ type: "pie", radius: ["58%", "80%"], label: { show: false }, data: [{ name: "Planned", value: 71, itemStyle: { color: "#4f46e5" } }, { name: "Reactive", value: 29, itemStyle: { color: "#f59e0b" } }] }]
        }, 170);
      }
    },
    {
      title: "Work Order Backlog Ageing",
      level: 2,
      desc: "Open work orders by age and priority. Old high-priority work is the risk; old low-priority work is a clean-up job.",
      render(b) {
        const buckets = ["0 to 7 days", "8 to 30 days", "31 to 90 days", "Over 90 days"];
        const pri = [["Priority 1", [6, 2, 1, 0], "#ef4444"], ["Priority 2", [18, 14, 6, 2], "#f59e0b"], ["Priority 3", [34, 41, 28, 19], "#4f46e5"], ["Priority 4", [22, 30, 37, 44], "#c7d2fe"]];
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small"><strong>${sum(pri.flatMap(p => p[1]))}</strong> open work orders</span><span class="ax-pill ax-pill--bad">3 priority 1 orders past 7-day target</span></div>`;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: buckets }, yAxis: { type: "value", name: "Work orders" },
          series: pri.map(([n, d, c], i) => ({ type: "bar", name: n, stack: "p", data: d, itemStyle: { color: c, borderRadius: i === 3 ? [3, 3, 0, 0] : 0 }, barMaxWidth: 44 }))
        }, 240);
      }
    },
    {
      title: "Renewal Forecast",
      level: 2,
      desc: "Ten-year capital renewal need by asset class against expected funding, showing the size and timing of the funding gap.",
      render(b) {
        const yr = new Date().getFullYear(), years = Array.from({ length: 10 }, (_, i) => String(yr + 1 + i));
        const need = classes.map((c, ci) => years.map((_, i) => Math.round((0.6 + ci * 0.15) * (1 + 0.6 * Math.sin((i + ci) / 2) ** 2) * 1000) / 1000));
        const totals = years.map((_, i) => sum(need.map(n => n[i]))), funding = years.map(() => 6.2);
        const gap = sum(totals.map((t, i) => Math.max(0, t - funding[i])));
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">10-year need <strong>$${sum(totals).toFixed(1)}M</strong> · funding $${sum(funding).toFixed(1)}M</span><span class="ax-pill ax-pill--warn">Funding gap $${gap.toFixed(1)}M</span></div>`;
        AX.chart(b, {
          legend: { top: 0, type: "scroll" }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: v => "$" + (+v).toFixed(2) + "M" },
          xAxis: { type: "category", data: years }, yAxis: { type: "value", axisLabel: { formatter: v => "$" + v + "M" } },
          series: [...classes.map((c, ci) => ({ type: "bar", name: c, stack: "n", data: need[ci], itemStyle: { color: AX.PALETTE[ci], borderRadius: 0 }, barMaxWidth: 34 })),
            { type: "line", name: "Funding", data: funding, step: "middle", color: "#18181b", lineStyle: { type: "dashed", width: 2 } }]
        }, 260);
      }
    },
    {
      title: "Vibration Trend (ISO 10816)",
      level: 3,
      desc: "Overall vibration velocity against ISO 10816 zones A to D, with a projection of when the asset will reach the alarm zone.",
      render(b) {
        const machines = { "P-101 pump": [1.6, 0.004, 1], "FAN-02 fan": [2.4, 0.016, 2], "CMP-03 compressor": [3.2, 0.022, 3] };
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg(Object.keys(machines).map(k => [k, k]), "FAN-02 fan")}<span class="ax-small" data-p></span></div>`);
        const zones = [[0, 1.4, "A Good", "rgba(16,185,129,.07)"], [1.4, 2.8, "B Acceptable", "rgba(16,185,129,.03)"], [2.8, 7.1, "C Alarm", "rgba(245,158,11,.08)"], [7.1, 12, "D Danger", "rgba(239,68,68,.08)"]];
        const c = AX.chart(b, { xAxis: { type: "time" }, yAxis: { type: "value", name: "mm/s RMS", min: 0, max: 9 }, series: [] }, 250);
        const draw = k => {
          const [base, slope, seed] = machines[k], n = 180;
          const data = D.ts(n, D.DAY, D.walk(n, { base, vol: 0.12, seed }).map((v, i) => +(v + slope * i).toFixed(2)));
          const last = data[n - 1][1], daysTo = slope > 0 ? Math.max(0, (2.8 - last) / slope) : Infinity;
          const proj = slope > 0.005 ? [[data[n - 1][0], last], [data[n - 1][0] + 60 * D.DAY, +(last + slope * 60).toFixed(2)]] : [];
          ctl.querySelector("[data-p]").innerHTML = last >= 2.8 ? '<span class="ax-pill ax-pill--warn">In alarm zone C</span>' : daysTo < 120 ? `<span class="ax-pill ax-pill--warn">Reaches zone C in ~${Math.round(daysTo)} days</span>` : '<span class="ax-pill ax-pill--good">Stable</span>';
          c.setOption({ series: [
            { type: "line", name: "Velocity", data, markArea: { silent: true, label: { fontSize: 10, color: "#71717a", position: "insideTopLeft" }, data: zones.map(([a, z, n, col]) => [{ name: n, yAxis: a, itemStyle: { color: col } }, { yAxis: z }]) } },
            { type: "line", name: "Projection", data: proj, lineStyle: { type: "dashed", color: "#f59e0b" }, itemStyle: { color: "#f59e0b" } }
          ] }, { replaceMerge: ["series"] });
        };
        draw("FAN-02 fan");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Vibration Spectrum (FFT)",
      level: 3,
      desc: "Frequency spectrum with running-speed harmonics and bearing defect frequency marked. Pick a fault to see its signature and the diagnosis.",
      render(b) {
        const rpm = 1480, f1 = rpm / 60, bpfo = f1 * 3.58;
        const faults = {
          healthy: ["Healthy", "Low, even spectrum. 1× dominant at low amplitude.", { 1: 0.8 }],
          imbalance: ["Imbalance", "High 1× radial, little at harmonics. Balance the rotor.", { 1: 4.2, 2: 0.5 }],
          misalign: ["Misalignment", "Strong 2× (and 3×) relative to 1×. Check coupling alignment.", { 1: 1.6, 2: 3.1, 3: 1.4 }],
          bearing: ["Outer race defect", "Peaks at BPFO and its harmonics with sidebands. Plan bearing change.", { 1: 0.9, bpfo: 2.2, bpfo2: 1.3 }]
        };
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg(Object.entries(faults).map(([k, v]) => [k, v[0]]), "misalign")}</div>`);
        const dx = AX.add(b, `<div class="ax-small" style="margin-bottom:6px"></div>`);
        const c = AX.chart(b, { xAxis: { type: "value", name: "Hz", max: 250 }, yAxis: { type: "value", name: "mm/s", max: 5 }, series: [] }, 230);
        const draw = k => {
          const [name, text, peaks] = faults[k], r = D.rng(3);
          const pts = Array.from({ length: 500 }, (_, i) => {
            const f = i * 0.5, bump = (fc, a, w = 0.9) => a * Math.exp(-((f - fc) ** 2) / (2 * w * w));
            let v = 0.05 + r() * 0.06;
            [1, 2, 3].forEach(h => { if (peaks[h]) v += bump(f1 * h, peaks[h]); });
            if (peaks.bpfo) { v += bump(bpfo, peaks.bpfo) + bump(bpfo - f1, 0.5) + bump(bpfo + f1, 0.5) + bump(bpfo * 2, peaks.bpfo2); }
            return [f, +v.toFixed(3)];
          });
          dx.innerHTML = `<span class="ax-pill ax-pill--${k === "healthy" ? "good" : "warn"}">${name}</span> <span style="color:var(--ink-2)">${text}</span>`;
          c.setOption({ series: [{ type: "line", name: "Amplitude", data: pts, lineStyle: { width: 1.3 }, areaStyle: {},
            markLine: { symbol: "none", silent: true, lineStyle: { color: "#a1a1aa", type: "dotted" }, label: { fontSize: 10, formatter: "{b}", position: "end" },
              data: [{ name: "1×", xAxis: f1 }, { name: "2×", xAxis: f1 * 2 }, { name: "3×", xAxis: f1 * 3 }, { name: "BPFO", xAxis: bpfo, lineStyle: { color: "#f59e0b" } }] } }] });
        };
        draw("misalign");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Replace or Maintain",
      level: 3,
      desc: "Cumulative cost of keeping an ageing asset against replacing it now. Adjust the assumptions and the optimal replacement year moves.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl">
          <label>Replacement cost $k <input type="range" min="80" max="300" value="160" data-k="cap" aria-label="Replacement cost"></label><strong data-v="cap"></strong>
          <label>Maintenance growth <input type="range" min="4" max="25" value="12" data-k="g" aria-label="Maintenance growth"></label><strong data-v="g"></strong></div>`);
        const out = AX.add(b, `<div class="ax-small" style="margin-bottom:6px"></div>`);
        const yr = new Date().getFullYear(), years = Array.from({ length: 15 }, (_, i) => String(yr + i));
        const c = AX.chart(b, { legend: { top: 0 }, xAxis: { type: "category", data: years }, yAxis: { type: "value", name: "$k cumulative" }, series: [] }, 240);
        const draw = () => {
          const cap = +ctl.querySelector('[data-k="cap"]').value, g = +ctl.querySelector('[data-k="g"]').value / 100;
          ctl.querySelector('[data-v="cap"]').textContent = "$" + cap + "k"; ctl.querySelector('[data-v="g"]').textContent = Math.round(g * 100) + "%/yr";
          let a = 0, z = cap;
          const keep = years.map((_, i) => Math.round(a += 14 * (1 + g) ** (i + 6)));
          const repl = years.map((_, i) => Math.round(z += 4 * 1.04 ** i));
          const cross = keep.findIndex((v, i) => v > repl[i]);
          out.innerHTML = cross > 0 ? `Replacing pays back from <strong>${years[cross]}</strong>. Over 15 years, replacing now saves <strong>$${F.num(keep[14] - repl[14])}k</strong>.` : "At these assumptions, keep maintaining for at least 15 years.";
          c.setOption({ series: [
            { type: "line", name: "Keep maintaining", data: keep, color: "#f59e0b", lineStyle: { width: 2.5 } },
            { type: "line", name: "Replace now", data: repl, lineStyle: { width: 2.5 },
              markPoint: cross > 0 ? { symbol: "circle", symbolSize: 10, itemStyle: { color: "#18181b", borderColor: "#fff", borderWidth: 2 }, label: { show: false }, data: [{ coord: [cross, repl[cross]] }] } : { data: [] } }
          ] }, { replaceMerge: ["series"] });
        };
        ctl.addEventListener("input", draw);
        draw();
      }
    },
    {
      title: "Field Inspection Form",
      level: 3,
      wide: true,
      desc: "Mobile-friendly inspection: pick the asset, score its condition, tick defects, attach photos, and submit. The recent inspections list updates.",
      render(b) {
        const defects = ["Corrosion", "Leak", "Noise / vibration", "Guard damaged", "Signage missing", "Overheating"];
        const recent = [["PUM-100", 2, "Sam Lee", Date.now() - 3 * D.HOUR, 0], ["VAL-109", 4, "Alex Chen", Date.now() - 26 * D.HOUR, 2]];
        b.innerHTML = `<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px">
          <form novalidate style="display:grid;gap:12px">
            <label style="display:grid;gap:5px;font-size:12.5px;font-weight:500">Asset<select class="ax-select" name="asset" required><option value="">Choose an asset...</option>${assets.slice(0, 30).map(a => `<option value="${a.id}">${a.id} · ${a.cls} · ${a.site}</option>`).join("")}</select></label>
            <div style="font-size:12.5px;font-weight:500">Condition score
              <div class="ax-row" style="gap:6px;margin-top:5px" data-score>${COND.map(([n, col], i) => `<button type="button" data-s="${i + 1}" title="${n}" style="all:unset;cursor:pointer;flex:1;text-align:center;padding:8px 0;border-radius:8px;border:1px solid var(--line-2);font-weight:600;font-size:13px">${i + 1}<div style="font-size:10px;font-weight:500;color:var(--ink-3)">${n.slice(2)}</div></button>`).join("")}</div></div>
            <div style="font-size:12.5px;font-weight:500">Defects found
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:5px">${defects.map(d => `<label style="display:flex;gap:6px;align-items:center;font-weight:400;color:var(--ink-2)"><input type="checkbox" name="defect" value="${d}"> ${d}</label>`).join("")}</div></div>
            <label style="display:grid;gap:5px;font-size:12.5px;font-weight:500">Notes<textarea class="ax-input" name="notes" rows="2" placeholder="What did you see?"></textarea></label>
            <div style="font-size:12.5px;font-weight:500">Photos
              <label style="display:block;margin-top:5px;border:1.5px dashed var(--line-2);border-radius:10px;padding:14px;text-align:center;color:var(--ink-3);cursor:pointer;font-weight:400">Tap to add photos<input type="file" accept="image/*" multiple hidden data-file></label>
              <div class="ax-row" style="gap:6px;margin-top:6px;flex-wrap:wrap" data-thumbs></div></div>
            <div class="ax-row ax-row--between"><span class="ax-small" style="color:var(--bad)" data-err></span><button class="ax-btn ax-btn--primary" type="submit">Submit inspection</button></div>
          </form>
          <div><div style="font-size:12.5px;font-weight:600;margin-bottom:6px">Recent inspections</div><ul class="ax-list" data-recent></ul></div></div>`;
        let score = 0, photos = [];
        const form = b.querySelector("form");
        const drawRecent = () => {
          b.querySelector("[data-recent]").innerHTML = recent.map(([id, s, who, t, nd]) => `<li><span><strong>${id}</strong> <span class="ax-pill" style="background:${COND[s - 1][1]}26;color:${s >= 4 ? COND[s - 1][1] : "#4338ca"}">${COND[s - 1][0]}</span><br><span class="ax-small" style="color:var(--ink-3)">${who} · ${F.dateTime(t)} · ${nd} defect${nd === 1 ? "" : "s"}</span></span></li>`).join("");
        };
        b.querySelector("[data-score]").addEventListener("click", e => {
          const btn = e.target.closest("[data-s]");
          if (!btn) return;
          score = +btn.dataset.s;
          b.querySelectorAll("[data-s]").forEach(x => { const on = x === btn, col = COND[+x.dataset.s - 1][1]; x.style.background = on ? col : ""; x.style.color = on ? (score === 3 ? "#18181b" : "#fff") : ""; x.style.borderColor = on ? col : "var(--line-2)"; x.querySelector("div").style.color = on ? "inherit" : "var(--ink-3)"; });
        });
        b.querySelector("[data-file]").addEventListener("change", e => {
          [...e.target.files].slice(0, 6 - photos.length).forEach(f => {
            const rd = new FileReader();
            rd.onload = () => { photos.push(rd.result); b.querySelector("[data-thumbs]").insertAdjacentHTML("beforeend", `<img src="${rd.result}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">`); };
            rd.readAsDataURL(f);
          });
        });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const asset = form.elements.asset.value, defs = [...form.querySelectorAll("[name=defect]:checked")].map(x => x.value);
          const err = !asset ? "Choose an asset" : !score ? "Pick a condition score" : "";
          b.querySelector("[data-err]").textContent = err;
          if (err) return;
          AX.rv("insertDataToTable", "Inspections", "onInsertResult", JSON.stringify({ asset, score, defects: defs, notes: form.elements.notes.value, photos: photos.length }));
          recent.unshift([asset, score, "Demo User", Date.now(), defs.length]);
          drawRecent();
          form.reset(); score = 0; photos = [];
          b.querySelector("[data-thumbs]").innerHTML = "";
          b.querySelectorAll("[data-s]").forEach(x => { x.style.background = ""; x.style.color = ""; x.style.borderColor = "var(--line-2)"; x.querySelector("div").style.color = "var(--ink-3)"; });
        });
        drawRecent();
      }
    }
  ]);
})();
