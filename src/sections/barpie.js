/* ==========================================================================
 * Bar + Pie Charts: 20 examples, simple to advanced
 * ========================================================================== */
(() => {
  const sum = a => a.reduce((s, v) => s + v, 0);
  const siteKw = () => D.sites.map(s => ({ name: s.name, id: s.id, value: +sum(D.devices.filter(d => d.site === s.name).map(d => d.power)).toFixed(1) }));
  const monthly = (seed, base = 40000, amp = 7000) => D.wave(12, { base, amp, period: 12, noise: 2500, seed, phase: 9 }).map(Math.round);

  AX.section("barpie", [
    {
      title: "Column Chart",
      level: 1,
      desc: "Vertical bars for comparing values across a small number of categories or periods.",
      render(b) {
        AX.chart(b, { xAxis: { type: "category", data: D.months }, yAxis: { type: "value", name: "kWh" }, series: [{ type: "bar", name: "Consumption", data: monthly(1) }] });
      }
    },
    {
      title: "Sorted Horizontal Bars",
      level: 1,
      desc: "Horizontal bars ranked highest first. Best when labels are long or there are many categories.",
      render(b) {
        const rows = siteKw().sort((a, z) => a.value - z.value);
        AX.chart(b, {
          xAxis: { type: "value", name: "kW" }, yAxis: { type: "category", data: rows.map(r => r.name) },
          series: [{ type: "bar", name: "Power", data: rows.map(r => r.value), itemStyle: { borderRadius: [0, 3, 3, 0] }, label: { show: true, position: "right", fontSize: 10 } }]
        }, 260);
      }
    },
    {
      title: "Pie Chart",
      level: 1,
      desc: "Part-to-whole for a handful of categories. Hover a slice for its value and share.",
      render(b) {
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" }, legend: { bottom: 0 },
          series: [{ type: "pie", radius: "68%", center: ["50%", "45%"], data: ["Online", "Warning", "Offline"].map(s => ({ name: s, value: D.devices.filter(d => d.status === s).length, itemStyle: { color: AX.STATUS_COLOR[s] } })) }]
        }, 250);
      }
    },
    {
      title: "Donut with Centre Total",
      level: 1,
      desc: "A ring chart with the overall total in the middle, so you get the whole and the parts together.",
      render(b) {
        const data = D.types.map(t => ({ name: t, value: D.devices.filter(d => d.type === t).length }));
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" }, legend: { right: 0, top: "middle", orient: "vertical" },
          graphic: [{ type: "text", left: "31%", top: "42%", style: { text: String(D.devices.length), fontSize: 28, fontWeight: 700, fill: "#18181b", textAlign: "center" } },
                    { type: "text", left: "31%", top: "56%", style: { text: "devices", fontSize: 12, fill: "#71717a", textAlign: "center" } }],
          series: [{ type: "pie", radius: ["50%", "75%"], center: ["35%", "50%"], label: { show: false }, data }]
        }, 250);
      }
    },
    {
      title: "Grouped Bars",
      level: 2,
      desc: "Bars side by side per category to compare series directly, here this year against last year.",
      render(b) {
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: D.months.slice(0, 6) }, yAxis: { type: "value", name: "kWh" },
          series: [{ type: "bar", name: "Last year", data: monthly(2).slice(0, 6), itemStyle: { color: "#c7d2fe" } }, { type: "bar", name: "This year", data: monthly(3, 38000).slice(0, 6) }]
        });
      }
    },
    {
      title: "Stacked Bars",
      level: 2,
      desc: "Each bar split into parts. Shows totals and composition together, such as energy by end use.",
      render(b) {
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: D.sites.map(s => s.id) }, yAxis: { type: "value", name: "MWh" },
          series: [["HVAC", 4], ["Production", 5], ["Lighting", 6], ["Other", 7]].map(([name, seed], i) => ({
            type: "bar", name, stack: "t", data: D.walk(8, { base: 30 - i * 6, vol: 6, min: 2, seed }), itemStyle: { borderRadius: i === 3 ? [3, 3, 0, 0] : 0 }
          }))
        });
      }
    },
    {
      title: "100% Stacked Bars",
      level: 2,
      desc: "Every bar scaled to 100% so you compare the mix between categories, regardless of size.",
      render(b) {
        const parts = ["Online", "Warning", "Offline"];
        const pct = s => parts.map(p => { const all = D.devices.filter(d => d.site === s.name); return +((all.filter(d => d.status === p).length / all.length) * 100).toFixed(1); });
        const rows = D.sites.map(pct);
        AX.chart(b, {
          legend: { top: 0 }, tooltip: { trigger: "axis", valueFormatter: v => v + "%" },
          xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } }, yAxis: { type: "category", data: D.sites.map(s => s.id) },
          series: parts.map((p, i) => ({ type: "bar", name: p, stack: "s", data: rows.map(r => r[i]), itemStyle: { color: AX.STATUS_COLOR[p], borderRadius: 0 } }))
        }, 260);
      }
    },
    {
      title: "Variance Bars",
      level: 2,
      desc: "Positive and negative bars around zero, coloured by direction. Shows over and under budget clearly.",
      render(b) {
        const v = D.wave(12, { base: 0, amp: 9, period: 7, noise: 6, seed: 12 }).map(x => +x.toFixed(1));
        AX.chart(b, {
          tooltip: { trigger: "axis", valueFormatter: x => (x > 0 ? "+" : "") + x + "%" },
          xAxis: { type: "category", data: D.months }, yAxis: { type: "value", axisLabel: { formatter: "{value}%" } },
          series: [{ type: "bar", name: "vs budget", data: v.map(x => ({ value: x, itemStyle: { color: x >= 0 ? "#ef4444" : "#10b981", borderRadius: x >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3] } })) }]
        });
      }
    },
    {
      title: "Target Line and Thresholds",
      level: 2,
      desc: "Bars coloured by how they perform against a target, with the target drawn across the chart.",
      render(b) {
        const target = 85, data = [92, 78, 88, 64, 95, 83, 71, 90];
        AX.chart(b, {
          xAxis: { type: "category", data: D.sites.map(s => s.id) }, yAxis: { type: "value", max: 100, name: "OEE %" },
          series: [{
            type: "bar", name: "OEE", data: data.map(v => ({ value: v, itemStyle: { color: v >= target ? "#4f46e5" : v >= target - 10 ? "#f59e0b" : "#ef4444" } })), // colour only flags a miss
            label: { show: true, position: "top", fontSize: 10 },
            markLine: { symbol: "none", label: { formatter: "Target {c}%", position: "insideEndTop", fontSize: 10 }, lineStyle: { color: "#18181b", type: "dashed" }, data: [{ yAxis: target }] }
          }]
        });
      }
    },
    {
      title: "Waterfall",
      level: 2,
      desc: "How a starting value becomes an ending value through increases and decreases along the way.",
      render(b) {
        const steps = [["Opening", 1200, "total"], ["Solar", 340], ["Battery", 120], ["HVAC", -460], ["Production", -380], ["Lighting", -90], ["Closing", null, "total"]];
        let run = 0;
        const base = [], up = [], down = [];
        steps.forEach(([, v, kind], i) => {
          if (kind === "total") { const t = i ? run : v; base.push(0); up.push({ value: t, itemStyle: { color: "#4f46e5" } }); down.push("-"); run = t; return; }
          if (v >= 0) { base.push(run); up.push(v); down.push("-"); run += v; } else { run += v; base.push(run); up.push("-"); down.push(-v); }
        });
        AX.chart(b, {
          tooltip: { trigger: "axis", formatter: p => { const s = p.filter(x => x.seriesIndex > 0 && x.value !== "-")[0]; return s ? `${s.name}: ${s.seriesIndex === 2 ? "−" : ""}${s.value} kWh` : ""; } },
          xAxis: { type: "category", data: steps.map(s => s[0]), axisLabel: { interval: 0, fontSize: 10 } }, yAxis: { type: "value", name: "kWh" },
          series: [
            { type: "bar", stack: "w", data: base, itemStyle: { color: "transparent" }, silent: true },
            { type: "bar", stack: "w", name: "Increase", data: up, itemStyle: { color: "#10b981" }, label: { show: true, position: "top", fontSize: 10, formatter: p => (p.value === "-" ? "" : p.value) } },
            { type: "bar", stack: "w", name: "Decrease", data: down, itemStyle: { color: "#ef4444" }, label: { show: true, position: "bottom", fontSize: 10, formatter: p => (p.value === "-" ? "" : "−" + p.value) } }
          ]
        });
      }
    },
    {
      title: "Pareto Chart",
      level: 2,
      desc: "Causes sorted largest first with a cumulative percentage line, showing the vital few behind most issues.",
      render(b) {
        const causes = [["Comms loss", 62], ["Overheating", 41], ["Low battery", 33], ["Sensor drift", 18], ["Power dip", 12], ["Door open", 7], ["Other", 5]];
        const total = sum(causes.map(c => c[1]));
        let acc = 0;
        AX.chart(b, {
          legend: { top: 0 }, xAxis: { type: "category", data: causes.map(c => c[0]), axisLabel: { interval: 0, rotate: 20, fontSize: 10 } },
          yAxis: [{ type: "value", name: "Alerts" }, { type: "value", max: 100, axisLabel: { formatter: "{value}%" }, splitLine: { show: false } }],
          series: [
            { type: "bar", name: "Alerts", data: causes.map(c => c[1]) },
            { type: "line", name: "Cumulative %", yAxisIndex: 1, symbol: "circle", symbolSize: 6, data: causes.map(c => +((acc += c[1]) / total * 100).toFixed(1)), itemStyle: { color: "#ef4444" },
              markLine: { symbol: "none", silent: true, label: { formatter: "80%", fontSize: 10 }, lineStyle: { type: "dotted", color: "#71717a" }, data: [{ yAxis: 80 }] } }
          ]
        }, 260);
      }
    },
    {
      title: "Nightingale Rose",
      level: 2,
      desc: "A pie where slice radius, not angle, shows the value. Eye-catching for cyclical categories like months.",
      render(b) {
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: "{b}: {c} kWh" },
          series: [{ type: "pie", roseType: "area", radius: [16, "88%"], itemStyle: { borderRadius: 4 }, label: { fontSize: 10, color: "#71717a" }, labelLine: { lineStyle: { color: "#e0e0e5" } },
            // One hue, opacity by value: the radius already encodes size, colour just reinforces it
            data: (vals => { const lo = Math.min(...vals), hi = Math.max(...vals); return D.months.map((m, i) => ({ name: m, value: vals[i], itemStyle: { color: "#4f46e5", opacity: 0.3 + 0.7 * ((vals[i] - lo) / (hi - lo)) } })); })(monthly(5)) }]
        }, 270);
      }
    },
    {
      title: "Half Donut",
      level: 2,
      desc: "A semicircle ring that saves vertical space. Good for budget split or capacity used versus remaining.",
      render(b) {
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: p => (p.name ? `${p.name}: ${p.value} MWh (${(p.percent * 2).toFixed(0)}%)` : "") },
          legend: { bottom: 0 },
          graphic: [{ type: "group", left: "center", top: "56%", children: [{ type: "text", style: { text: "1,840", fontSize: 24, fontWeight: 600, fill: "#18181b", textAlign: "center", x: 0, y: 0 } }, { type: "text", style: { text: "MWh capacity", fontSize: 11.5, fill: "#a1a1aa", textAlign: "center", x: 0, y: 30 } }] }],
          series: [{
            type: "pie", radius: ["60%", "95%"], center: ["50%", "75%"], startAngle: 180, label: { show: false },
            data: [{ name: "Used", value: 1240 }, { name: "Reserved", value: 310 }, { name: "Available", value: 290, itemStyle: { color: "#f2f2f4" } }, { value: 1840, itemStyle: { color: "none" }, tooltip: { show: false }, label: { show: false } }]
          }]
        }, 230);
      }
    },
    {
      title: "Nested Pie",
      level: 2,
      desc: "Inner ring shows regions, outer ring breaks each region into its sites. Two levels in one view.",
      render(b) {
        const regions = [...new Set(D.sites.map(s => s.region))], kw = siteKw();
        AX.chart(b, {
          tooltip: { trigger: "item", formatter: "{b}: {c} kW ({d}%)" },
          series: [
            { type: "pie", radius: [0, "38%"], label: { position: "inner", fontSize: 11, color: "#fff" }, data: regions.map(r => ({ name: r, value: +sum(kw.filter(k => D.sites.find(s => s.id === k.id).region === r).map(k => k.value)).toFixed(1) })) },
            { type: "pie", radius: ["48%", "72%"], label: { fontSize: 10 }, data: regions.flatMap((r, ri) => kw.filter(k => D.sites.find(s => s.id === k.id).region === r).map((k, j) => ({ name: k.id, value: k.value, itemStyle: { color: AX.PALETTE[ri], opacity: 1 - j * 0.3 } }))) }
          ]
        }, 280);
      }
    },
    {
      title: "Histogram",
      level: 3,
      desc: "Distribution of 500 readings in bins. Change the bin count to see more or less detail.",
      render(b) {
        const r = D.rng(61), vals = Array.from({ length: 500 }, () => 22 + (r() + r() + r() + r() - 2) * 6);
        const ctl = AX.add(b, `<div class="ax-ctl"><label>Bins <input type="range" min="4" max="40" value="14" aria-label="Bins"></label><strong data-n>14</strong><span class="ax-small ax-muted">mean ${(sum(vals) / vals.length).toFixed(1)}°C</span></div>`);
        const c = AX.chart(b, { xAxis: { type: "category", name: "°C" }, yAxis: { type: "value", name: "Readings" }, series: [{ type: "bar", name: "Readings", barCategoryGap: "4%", itemStyle: { borderRadius: 2 } }] }, 230);
        const draw = n => {
          const lo = Math.min(...vals), w = (Math.max(...vals) - lo) / n, counts = Array(n).fill(0);
          vals.forEach(v => { counts[Math.min(n - 1, Math.floor((v - lo) / w))]++; });
          ctl.querySelector("[data-n]").textContent = n;
          c.setOption({ xAxis: { data: counts.map((_, i) => (lo + i * w).toFixed(1)) }, series: [{ data: counts }] });
        };
        ctl.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(14);
      }
    },
    {
      title: "Pie with 'Other' Grouping",
      level: 3,
      desc: "Small slices below your threshold are merged into 'Other' so the pie stays readable. Click legend items to exclude.",
      render(b) {
        const raw = D.devices.slice(0, 18).map(d => ({ name: d.id, value: d.power }));
        const ctl = AX.add(b, `<div class="ax-ctl"><label>Group slices under <input type="range" min="0" max="10" value="4" step="0.5" aria-label="Threshold"></label><strong data-t></strong><span class="ax-small ax-muted" data-o></span></div>`);
        const c = AX.chart(b, { tooltip: { trigger: "item", formatter: p => (p.data.parts ? `Other (${p.data.parts} devices): ${F.num(p.value, 1)} kW` : `${p.name}: ${p.value} kW (${p.percent}%)`) }, legend: { type: "scroll", bottom: 0 }, series: [{ type: "pie", radius: ["30%", "65%"], center: ["50%", "44%"], label: { fontSize: 10 } }] }, 280);
        const draw = th => {
          const total = sum(raw.map(r => r.value)), big = raw.filter(r => (r.value / total) * 100 >= th), small = raw.filter(r => (r.value / total) * 100 < th);
          const data = big.sort((a, z) => z.value - a.value).concat(small.length ? [{ name: "Other", value: +sum(small.map(s => s.value)).toFixed(1), parts: small.length, itemStyle: { color: "#a1a1aa" } }] : []);
          ctl.querySelector("[data-t]").textContent = th + "%";
          ctl.querySelector("[data-o]").textContent = `${big.length} slices + ${small.length} grouped`;
          c.setOption({ series: [{ data }] });
        };
        ctl.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(4);
      }
    },
    {
      title: "Top N with Metric Picker",
      level: 3,
      desc: "Choose the measure, top or bottom, and how many to show. The ranking rebuilds instantly.",
      render(b) {
        const metrics = [["power", "Power kW"], ["temp", "Temperature °C"], ["alerts", "Alerts"], ["battery", "Battery %"], ["uptime", "Uptime %"]];
        const ctl = AX.add(b, `<div class="ax-ctl"><select class="ax-select" data-k="m" aria-label="Metric">${metrics.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>${AX.seg([["top", "Top"], ["bottom", "Bottom"]], "top")}<select class="ax-select" data-k="n" aria-label="How many"><option>5</option><option selected>10</option><option>15</option></select></div>`);
        const c = AX.chart(b, { xAxis: { type: "value" }, yAxis: { type: "category", inverse: true }, series: [{ type: "bar", itemStyle: { borderRadius: [0, 3, 3, 0] }, label: { show: true, position: "right", fontSize: 10 } }] }, 300);
        let dir = "top";
        const draw = () => {
          const m = ctl.querySelector('[data-k="m"]').value, n = +ctl.querySelector('[data-k="n"]').value;
          const rows = [...D.devices].sort((a, z) => (dir === "top" ? z[m] - a[m] : a[m] - z[m])).slice(0, n);
          c.setOption({ xAxis: { name: metrics.find(x => x[0] === m)[1], scale: m === "uptime" }, yAxis: { data: rows.map(r => `${r.id} ${r.name}`) }, series: [{ name: m, data: rows.map(r => r[m]), itemStyle: { color: dir === "top" ? "#4f46e5" : "#f59e0b" } }] });
        };
        ctl.addEventListener("change", draw);
        AX.onSeg(ctl.querySelector(".ax-seg"), v => { dir = v; draw(); });
        draw();
      }
    },
    {
      title: "Drill-Down Bars",
      level: 3,
      desc: "Click a region bar to see its sites, then a site to see its devices. Breadcrumbs take you back up.",
      render(b) {
        const crumbs = AX.add(b, `<div class="ax-ctl ax-small"></div>`);
        const c = AX.chart(b, { xAxis: { type: "category", axisLabel: { interval: 0, fontSize: 10 } }, yAxis: { type: "value", name: "kW" }, series: [{ type: "bar", name: "Power", colorBy: "data", universalTransition: true }] }, 250);
        let path = [];
        const level = () => {
          if (!path.length) return [...new Set(D.sites.map(s => s.region))].map(r => [r, sum(D.devices.filter(d => d.region === r).map(d => d.power))]);
          if (path.length === 1) return D.sites.filter(s => s.region === path[0]).map(s => [s.name, sum(D.devices.filter(d => d.site === s.name).map(d => d.power))]);
          return D.devices.filter(d => d.site === path[1]).map(d => [d.id, d.power]);
        };
        const draw = () => {
          const rows = level();
          crumbs.innerHTML = ["All regions", ...path].map((p, i) => (i < path.length ? `<a href="#" data-i="${i}" style="color:var(--rv-primary)">${p}</a> ›` : `<strong>${p}</strong>`)).join(" ") + (path.length < 2 ? ' <span class="ax-muted">· click a bar to drill down</span>' : "");
          c.setOption({ xAxis: { data: rows.map(r => r[0]) }, series: [{ data: rows.map(r => +r[1].toFixed(1)) }] });
        };
        c.on("click", p => { if (path.length < 2) { path.push(p.name); draw(); } });
        crumbs.addEventListener("click", e => { if (e.target.dataset.i) { e.preventDefault(); path = path.slice(0, +e.target.dataset.i); draw(); } });
        draw();
      }
    },
    {
      title: "Bar Race",
      level: 3,
      desc: "Animated ranking as cumulative totals grow month by month. Bars reorder as leaders change.",
      render(b) {
        const series = D.sites.map((s, i) => ({ id: s.id, vals: monthly(i + 70, 3000 + i * 300, 1800) }));
        const ctl = AX.add(b, `<div class="ax-ctl"><button class="ax-btn ax-btn--primary" style="width:70px">Play</button><strong data-m></strong></div>`);
        const c = AX.chart(b, {
          xAxis: { type: "value", max: "dataMax" }, yAxis: { type: "category", inverse: true, animationDuration: 300, animationDurationUpdate: 300, data: series.map(s => s.id) },
          series: [{ type: "bar", realtimeSort: true, colorBy: "data", label: { show: true, position: "right", valueAnimation: true, fontSize: 10 }, itemStyle: { borderRadius: [0, 3, 3, 0] } }],
          animationDuration: 0, animationDurationUpdate: 900, animationEasing: "linear", animationEasingUpdate: "linear"
        }, 270);
        let m = 0, playing = false;
        const draw = () => {
          ctl.querySelector("[data-m]").textContent = `Year to date: ${D.months[m]}`;
          c.setOption({ series: [{ data: series.map(s => sum(s.vals.slice(0, m + 1))) }] });
        };
        const btn = ctl.querySelector("button");
        btn.addEventListener("click", () => { playing = !playing; if (playing && m === 11) { m = 0; draw(); } btn.textContent = playing ? "Pause" : "Play"; });
        AX.every(1000, () => { if (!playing) return; if (m >= 11) { playing = false; btn.textContent = "Replay"; return; } m++; draw(); }, b);
        draw();
      }
    },
    {
      title: "Linked Bar and Pie",
      level: 3,
      wide: true,
      desc: "Click a site bar to break the pie down for that site; click a pie slice to filter the bars by device type.",
      render(b) {
        let site = null, type = null;
        const info = AX.add(b, `<div class="ax-ctl"></div>`);
        const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:3fr 2fr;gap:12px"></div>`);
        const bar = AX.chart(AX.add(wrap, "<div></div>"), { xAxis: { type: "category", data: D.sites.map(s => s.id) }, yAxis: { type: "value", name: "kW" }, series: [{ type: "bar", name: "Power" }] }, 270);
        const pie = AX.chart(AX.add(wrap, "<div></div>"), { tooltip: { trigger: "item", formatter: "{b}: {c} kW ({d}%)" }, series: [{ type: "pie", radius: ["38%", "70%"], label: { fontSize: 10 } }] }, 270);
        const draw = () => {
          const pool = D.devices.filter(d => !type || d.type === type);
          bar.setOption({ series: [{ data: D.sites.map(s => ({ value: +sum(pool.filter(d => d.site === s.name).map(d => d.power)).toFixed(1), itemStyle: { color: site && site !== s.id ? "#e0e7ff" : type ? AX.PALETTE[D.types.indexOf(type)] : "#4f46e5" } })) }] });
          const pp = D.devices.filter(d => !site || d.siteId === site);
          pie.setOption({ series: [{ data: D.types.map((t, i) => ({ name: t, value: +sum(pp.filter(d => d.type === t).map(d => d.power)).toFixed(1), itemStyle: { opacity: type && type !== t ? 0.25 : 1, color: AX.PALETTE[i] } })).filter(x => x.value) }] });
          info.innerHTML = `<span class="ax-pill ax-pill--info">Site: ${site || "All"}</span><span class="ax-pill ax-pill--info">Type: ${type || "All"}</span>${site || type ? '<button class="ax-btn ax-btn--sm" data-clear>Clear filters</button>' : '<span class="ax-small ax-muted">Click a bar or a slice</span>'}`;
        };
        bar.on("click", p => { site = site === p.name ? null : p.name; draw(); });
        pie.on("click", p => { type = type === p.name ? null : p.name; draw(); });
        info.addEventListener("click", e => { if (e.target.dataset.clear !== undefined) { site = type = null; draw(); } });
        draw();
      }
    }
  ]);
})();
