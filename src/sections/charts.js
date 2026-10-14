/* ==========================================================================
 * Assorted Charts: 20 chart families, simple to advanced
 * ========================================================================== */
AX.section("charts", [
  {
    title: "Basic Line",
    level: 1,
    desc: "One series over categories. The default way to show a trend.",
    render(b) {
      AX.chart(b, {
        xAxis: { type: "category", data: D.days },
        yAxis: { type: "value" },
        series: [{ type: "line", name: "Output", data: [820, 932, 901, 934, 1290, 1330, 1320], symbol: "circle", symbolSize: 6 }]
      });
    }
  },
  {
    title: "Smooth Area",
    level: 1,
    desc: "Curved line with filled area underneath, which emphasises volume over time.",
    render(b) {
      AX.chart(b, {
        xAxis: { type: "category", boundaryGap: false, data: D.months },
        yAxis: { type: "value" },
        series: [{
          type: "line", name: "Visitors", smooth: true, data: D.wave(12, { base: 520, amp: 160, period: 12, noise: 30, seed: 4 }),
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(79,70,229,.35)" }, { offset: 1, color: "rgba(79,70,229,0)" }]) }
        }]
      });
    }
  },
  {
    title: "Scatter Plot",
    level: 1,
    desc: "Each point is one device. Shows the relationship between two measures.",
    render(b) {
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: p => `${p.data[2]}<br>${p.data[0]}°C, ${p.data[1]} kW` },
        xAxis: { type: "value", name: "Temp °C", scale: true },
        yAxis: { type: "value", name: "Power kW" },
        series: [{ type: "scatter", symbolSize: 9, data: D.devices.map(d => [d.temp, d.power, d.id]) }]
      });
    }
  },
  {
    title: "Radar",
    level: 1,
    desc: "Compares several entities across many dimensions at once, like site performance profiles.",
    render(b) {
      AX.chart(b, {
        legend: { bottom: 0 },
        radar: { indicator: ["Uptime", "Output", "Quality", "Safety", "Efficiency", "Cost"].map(n => ({ name: n, max: 100 })), radius: "62%", axisName: { color: "#71717a", fontSize: 11 } },
        series: [{
          type: "radar", areaStyle: { opacity: 0.15 },
          data: [{ name: "Sydney", value: [96, 82, 90, 99, 75, 68] }, { name: "Melbourne", value: [88, 91, 84, 95, 88, 80] }, { name: "Perth", value: [92, 70, 95, 100, 64, 90] }]
        }]
      }, 260);
    }
  },
  {
    title: "Funnel",
    level: 1,
    desc: "Stage-by-stage drop-off, for example sensor readings that pass each validation step.",
    render(b) {
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: "{b}: {c}" },
        series: [{
          type: "funnel", left: "4%", width: "62%", top: 8, bottom: 8, sort: "descending", gap: 3, minSize: "30%",
          itemStyle: { borderWidth: 0, borderRadius: 4 },
          label: { position: "right", color: "#52525b", fontSize: 12, formatter: p => `{n|${p.name}}  {v|${F.num(p.value)}}` , rich: { n: { color: "#52525b", fontSize: 12 }, v: { color: "#18181b", fontWeight: 600, fontSize: 12 } } },
          labelLine: { length: 12, lineStyle: { color: "#e0e0e5" } },
          // Single hue, light to dark: a funnel is one measure, not five categories
          data: [["Received", 10000], ["Parsed", 9620], ["Validated", 8810], ["Enriched", 8400], ["Stored", 8390]].map(([name, value], i) => ({ name, value, itemStyle: { color: ["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5"][i] } }))
        }]
      });
    }
  },
  {
    title: "Bubble Chart",
    level: 2,
    desc: "Scatter with a third measure as bubble size and a fourth as colour: temp, power, alerts and device type.",
    render(b) {
      AX.chart(b, {
        legend: { top: 0, type: "scroll" },
        tooltip: { trigger: "item", formatter: p => `${p.data[3]} (${p.seriesName})<br>${p.data[0]}°C · ${p.data[1]} kW · ${p.data[2]} alerts` },
        xAxis: { type: "value", name: "°C", scale: true }, yAxis: { type: "value", name: "kW" },
        series: D.types.map(t => ({
          type: "scatter", name: t, symbolSize: v => 8 + v[2] * 5, itemStyle: { opacity: 0.7 },
          data: D.devices.filter(d => d.type === t).map(d => [d.temp, d.power, d.alerts, d.id])
        }))
      }, 260);
    }
  },
  {
    title: "Heatmap",
    level: 2,
    desc: "Day by hour grid coloured by value. Reveals weekly and daily usage patterns at a glance.",
    render(b) {
      const rand = D.rng(9), data = [];
      D.days.forEach((_, d) => D.hours.forEach((_, h) => {
        const work = d < 5 && h >= 7 && h <= 18;
        data.push([h, d, Math.round((work ? 60 : 15) + rand() * 30 + (h === 12 ? -10 : 0))]);
      }));
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: p => `${D.days[p.data[1]]} ${D.hours[p.data[0]]}: ${p.data[2]} kWh` },
        grid: { left: 8, right: 8, top: 8, bottom: 58, containLabel: true },
        xAxis: { type: "category", data: D.hours, splitArea: { show: true }, axisLabel: { interval: 2 } },
        yAxis: { type: "category", data: D.days, splitArea: { show: true } },
        visualMap: { min: 0, max: 100, calculable: true, orient: "horizontal", left: "center", bottom: 0, itemHeight: 120, inRange: { color: ["#eef0ff", "#818cf8", "#4f46e5", "#312e81"] } },
        series: [{ type: "heatmap", data, itemStyle: { borderColor: "#fff", borderWidth: 1 } }]
      }, 260);
    }
  },
  {
    title: "Treemap",
    level: 2,
    desc: "Nested rectangles sized by value. Click a region to zoom in, use the breadcrumb to go back.",
    render(b) {
      const regions = [...new Set(D.sites.map(s => s.region))];
      const data = regions.map(r => ({
        name: r,
        children: D.sites.filter(s => s.region === r).map(s => ({
          name: s.name,
          children: D.types.map(t => ({ name: t, value: Math.round(D.devices.filter(d => d.site === s.name && d.type === t).reduce((a, d) => a + d.power, 0) * 10) / 10 })).filter(c => c.value)
        }))
      }));
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: p => `${p.treePathInfo.map(x => x.name).filter(Boolean).join(" / ")}: ${F.num(p.value, 1)} kW` },
        series: [{
          type: "treemap", data, top: 4, left: 0, right: 0, bottom: 28, leafDepth: 1, roam: false,
          breadcrumb: { bottom: 0, itemStyle: { color: "#f0f0f2", textStyle: { color: "#18181b" } } },
          label: { fontSize: 11 }, upperLabel: { show: true, height: 18, fontSize: 11, color: "#fff" },
          levels: [{ itemStyle: { borderWidth: 2, gapWidth: 2, borderColor: "#fff" } }, { itemStyle: { gapWidth: 1 }, colorSaturation: [0.35, 0.6] }]
        }]
      }, 280);
    }
  },
  {
    title: "Sunburst",
    level: 2,
    desc: "Hierarchy as rings: region, then site, then device type. Click a segment to focus on it.",
    render(b) {
      const regions = [...new Set(D.sites.map(s => s.region))];
      const data = regions.map(r => ({
        name: r,
        children: D.sites.filter(s => s.region === r).map(s => ({
          name: s.name.split(" ")[0],
          children: D.types.map(t => ({ name: t, value: D.devices.filter(d => d.site === s.name && d.type === t).length })).filter(c => c.value)
        }))
      }));
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: "{b}: {c} devices" },
        series: [{
          type: "sunburst", data, radius: [20, "95%"], sort: null, itemStyle: { borderColor: "#fff", borderWidth: 1.5 },
          levels: [{}, { r0: 20, r: 70, label: { rotate: 0, fontSize: 12, fontWeight: 600 } }, { r0: 70, r: 115, label: { fontSize: 10 } }, { r0: 115, r: 128, label: { show: false }, itemStyle: { opacity: 0.75 } }]
        }]
      }, 280);
    }
  },
  {
    title: "Box Plot",
    level: 2,
    desc: "Distribution summary per site: median, quartiles and range. Spots sites with unusual spread.",
    render(b) {
      const stats = arr => {
        const s = [...arr].sort((x, y) => x - y), q = p => s[Math.floor((s.length - 1) * p)];
        return [s[0], q(0.25), q(0.5), q(0.75), s[s.length - 1]];
      };
      const names = D.sites.map(s => s.id);
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: p => `${p.name}<br>Max ${p.data[5]}<br>Q3 ${p.data[4]}<br>Median ${p.data[3]}<br>Q1 ${p.data[2]}<br>Min ${p.data[1]}` },
        xAxis: { type: "category", data: names }, yAxis: { type: "value", name: "°C", scale: true },
        series: [{ type: "boxplot", itemStyle: { color: "#eef0ff", borderColor: "#4f46e5" }, data: names.map((_, i) => stats(D.wave(200, { base: 20 + i, amp: 3 + (i % 3) * 2, noise: 3, seed: i + 20 }))) }]
      });
    }
  },
  {
    title: "Wind Rose (Polar)",
    level: 2,
    desc: "Polar stacked bars by compass direction and speed band. Ideal for directional data like wind or flow.",
    render(b) {
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const bands = [["0-10 km/h", [5, 3, 2, 4, 8, 6, 4, 3]], ["10-20 km/h", [4, 2, 1, 3, 9, 7, 3, 2]], ["20+ km/h", [1, 1, 0, 1, 5, 4, 2, 1]]];
      AX.chart(b, {
        legend: { bottom: 0 },
        tooltip: { trigger: "item" },
        polar: { radius: [10, "72%"], center: ["50%", "46%"] },
        angleAxis: { type: "category", data: dirs, startAngle: 112.5, axisLabel: { color: "#71717a" } },
        radiusAxis: { axisLabel: { show: false }, axisLine: { show: false } },
        series: bands.map(([name, data]) => ({ type: "bar", name, data, coordinateSystem: "polar", stack: "w" }))
      }, 270);
    }
  },
  {
    title: "Candlestick",
    level: 2,
    desc: "Open, close, low and high per day. Used for energy spot prices or any value with a daily range.",
    render(b) {
      const rand = D.rng(5);
      let last = 120;
      const days = [], data = [];
      for (let i = 30; i > 0; i--) {
        const open = last, close = +(open + (rand() - 0.5) * 20).toFixed(1);
        data.push([open, close, +(Math.min(open, close) - rand() * 8).toFixed(1), +(Math.max(open, close) + rand() * 8).toFixed(1)]);
        days.push(F.date(Date.now() - i * D.DAY));
        last = close;
      }
      AX.chart(b, {
        xAxis: { type: "category", data: days, axisLabel: { interval: 4 } }, yAxis: { type: "value", scale: true, name: "$/MWh" },
        series: [{ type: "candlestick", data, itemStyle: { color: "#10b981", color0: "#ef4444", borderColor: "#10b981", borderColor0: "#ef4444" } }]
      });
    }
  },
  {
    title: "Theme River",
    level: 2,
    desc: "Stream graph of how the mix of categories changes over time, here alert types per week.",
    render(b) {
      const cats = ["Temperature", "Battery", "Comms", "Pressure"];
      const data = [];
      for (let w = 0; w < 16; w++) {
        const day = F.iso(Date.now() - (16 - w) * 7 * D.DAY);
        cats.forEach((c, i) => data.push([day, Math.round(10 + 8 * Math.sin((w + i * 3) / 3) + i * 3), c]));
      }
      AX.chart(b, {
        legend: { top: 0 }, tooltip: { trigger: "axis", axisPointer: { type: "line" } },
        singleAxis: { type: "time", top: 40, bottom: 24, axisLabel: { color: "#71717a" } },
        series: [{ type: "themeRiver", data, label: { show: false } }]
      }, 260);
    }
  },
  {
    title: "Sankey Energy Flow",
    level: 3,
    desc: "Shows how quantities flow from sources to uses. Hover a link to see each flow amount.",
    render(b) {
      const links = [
        ["Grid", "Main board", 620], ["Solar", "Main board", 240], ["Battery", "Main board", 80],
        ["Main board", "HVAC", 380], ["Main board", "Production", 360], ["Main board", "Lighting", 110], ["Main board", "Losses", 90],
        ["HVAC", "Chillers", 260], ["HVAC", "Fans", 120], ["Production", "Line A", 210], ["Production", "Line B", 150]
      ];
      const names = [...new Set(links.flatMap(l => [l[0], l[1]]))];
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: p => (p.dataType === "edge" ? `${p.data.source} → ${p.data.target}: ${p.data.value} kWh` : `${p.name}`) },
        series: [{
          type: "sankey", left: 4, right: 70, top: 6, bottom: 6, nodeGap: 10, emphasis: { focus: "adjacency" },
          lineStyle: { color: "gradient", opacity: 0.35, curveness: 0.5 }, label: { fontSize: 11 },
          data: names.map(name => ({ name })), links: links.map(([source, target, value]) => ({ source, target, value }))
        }]
      }, 280);
    }
  },
  {
    title: "Network Topology",
    level: 3,
    desc: "Force-directed graph of gateways and devices. Drag nodes, scroll to zoom, hover to highlight links.",
    render(b) {
      const nodes = [{ name: "Cloud", symbolSize: 34, category: 0 }];
      const links = [];
      D.sites.forEach(s => {
        nodes.push({ name: s.id + " gateway", symbolSize: 20, category: 1 });
        links.push({ source: "Cloud", target: s.id + " gateway" });
      });
      D.devices.slice(0, 40).forEach(d => {
        nodes.push({ name: d.id, symbolSize: 9, category: d.status === "Online" ? 2 : d.status === "Warning" ? 3 : 4, value: `${d.name}, ${d.status}` });
        links.push({ source: d.siteId + " gateway", target: d.id });
      });
      AX.chart(b, {
        legend: { top: 0, data: ["Gateway", "Online", "Warning", "Offline"] },
        tooltip: { trigger: "item", formatter: p => (p.dataType === "node" ? `${p.name}${p.data.value ? "<br>" + p.data.value : ""}` : "") },
        series: [{
          type: "graph", layout: "force", roam: true, draggable: true, top: 30, force: { repulsion: 70, edgeLength: [20, 60] },
          categories: [{ name: "Cloud", itemStyle: { color: "#18181b" } }, { name: "Gateway", itemStyle: { color: "#4f46e5" } }, { name: "Online", itemStyle: { color: "#10b981" } }, { name: "Warning", itemStyle: { color: "#f59e0b" } }, { name: "Offline", itemStyle: { color: "#ef4444" } }],
          data: nodes, links, lineStyle: { color: "#d4d4d8" }, emphasis: { focus: "adjacency" }
        }]
      }, 300);
    }
  },
  {
    title: "Parallel Coordinates",
    level: 3,
    desc: "Each line is a device across six measures. Drag along any axis to brush and filter the lines.",
    render(b) {
      const dims = [["temp", "Temp"], ["humidity", "Humidity"], ["power", "Power"], ["battery", "Battery"], ["uptime", "Uptime"], ["alerts", "Alerts"]];
      AX.chart(b, {
        tooltip: { show: false },
        parallelAxis: dims.map(([, name], dim) => ({ dim, name, nameTextStyle: { color: "#71717a", fontSize: 11 }, axisLabel: { color: "#71717a", fontSize: 10 } })),
        parallel: { left: 30, right: 40, top: 30, bottom: 20 },
        visualMap: { show: false, dimension: 0, min: 16, max: 34, inRange: { color: ["#4f46e5", "#f59e0b", "#ef4444"] } },
        series: [{ type: "parallel", lineStyle: { width: 1.2, opacity: 0.55 }, inactiveOpacity: 0.04, data: D.devices.map(d => dims.map(([k]) => d[k])) }]
      }, 280);
    }
  },
  {
    title: "Calendar Heatmap",
    level: 3,
    desc: "A full year of daily values on a calendar grid. Spot seasonal trends, weekends and outages.",
    wide: true,
    render(b) {
      const year = new Date().getFullYear() - 1;
      const rand = D.rng(31), data = [];
      for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += D.DAY) {
        const d = new Date(t), dow = d.getUTCDay(), season = Math.cos(((d.getUTCMonth() + 0.5) / 12) * 2 * Math.PI);
        data.push([F.iso(t), Math.round(dow === 0 || dow === 6 ? 200 + rand() * 80 : 420 + season * 120 + rand() * 90)]);
      }
      AX.chart(b, {
        tooltip: { trigger: "item", formatter: p => `${p.data[0]}: ${p.data[1]} kWh` },
        visualMap: { min: 150, max: 650, orient: "horizontal", left: "center", bottom: 0, itemHeight: 140, calculable: true, inRange: { color: ["#eef0ff", "#a5b4fc", "#4f46e5", "#312e81"] } },
        calendar: { range: String(year), top: 26, left: 36, right: 10, cellSize: ["auto", 15], itemStyle: { borderColor: "#fff", borderWidth: 2 }, splitLine: { show: false }, dayLabel: { color: "#71717a", fontSize: 10 }, monthLabel: { color: "#71717a", fontSize: 11 }, yearLabel: { show: false } },
        series: [{ type: "heatmap", coordinateSystem: "calendar", data }]
      }, 210);
    }
  },
  {
    title: "Brush Selection + Regression",
    level: 3,
    desc: "Fitted trend line with its equation and R². Drag a box over points to select them and see live stats.",
    render(b) {
      const pts = D.devices.map(d => [d.temp, +(d.temp * 0.9 + d.power * 0.4 - 6).toFixed(1)]);
      const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
      const slope = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
      const icpt = my - slope * mx;
      const r2 = 1 - pts.reduce((a, p) => a + (p[1] - (slope * p[0] + icpt)) ** 2, 0) / pts.reduce((a, p) => a + (p[1] - my) ** 2, 0);
      const xs = pts.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const info = AX.add(b, `<div class="ax-ctl"><span class="ax-pill ax-pill--info">y = ${slope.toFixed(2)}x ${icpt >= 0 ? "+" : "−"} ${Math.abs(icpt).toFixed(2)}</span><span class="ax-pill ax-pill--info">R² = ${r2.toFixed(2)}</span><span class="ax-small ax-muted" data-sel>Drag on the chart to select points</span></div>`);
      const c = AX.chart(b, {
        tooltip: { trigger: "item" },
        brush: { toolbox: ["rect", "clear"], xAxisIndex: 0, throttleType: "debounce", throttleDelay: 150, inBrush: { color: "#ef4444" } },
        toolbox: { right: 8, top: 0, feature: { brush: { title: { rect: "Box select", clear: "Clear" } } } },
        grid: { left: 8, right: 16, top: 30, bottom: 8, containLabel: true },
        xAxis: { type: "value", name: "Temp", scale: true }, yAxis: { type: "value", name: "Load index", scale: true },
        series: [
          { type: "scatter", data: pts, symbolSize: 8 },
          { type: "line", data: [[x0, slope * x0 + icpt], [x1, slope * x1 + icpt]], lineStyle: { type: "dashed", color: "#ef4444" }, tooltip: { show: false }, silent: true }
        ]
      }, 250);
      c.dispatchAction({ type: "takeGlobalCursor", key: "brush", brushOption: { brushType: "rect" } });
      c.on("brushSelected", e => {
        const idx = e.batch[0].selected[0].dataIndex;
        const sel = info.querySelector("[data-sel]");
        if (!idx.length) { sel.textContent = "Drag on the chart to select points"; return; }
        const avg = k => (idx.reduce((a, i) => a + pts[i][k], 0) / idx.length).toFixed(1);
        sel.innerHTML = `<strong>${idx.length}</strong> selected · avg temp ${avg(0)} · avg load ${avg(1)}`;
      });
    }
  },
  {
    title: "Cross-Filtered Charts",
    level: 3,
    wide: true,
    desc: "Click a slice in the donut to filter the scatter and summary. Click it again to clear. Charts talk to each other.",
    render(b) {
      let active = null;
      const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:1fr 2fr;gap:12px"></div>`);
      const left = AX.add(wrap, "<div></div>"), right = AX.add(wrap, "<div></div>");
      const summary = AX.add(right, `<div class="ax-ctl"></div>`);
      const pie = AX.chart(left, {
        tooltip: { trigger: "item", formatter: "{b}: {c} devices" },
        series: [{ type: "pie", radius: ["45%", "75%"], selectedMode: "single", label: { fontSize: 10 }, data: D.types.map(t => ({ name: t, value: D.devices.filter(d => d.type === t).length })) }]
      }, 250);
      const scatter = AX.chart(right, {
        tooltip: { trigger: "item", formatter: p => `${p.data[2]}<br>${p.data[0]}°C, ${p.data[1]} kW` },
        xAxis: { type: "value", name: "°C", scale: true }, yAxis: { type: "value", name: "kW" }, series: [{ type: "scatter", symbolSize: 9, data: [] }]
      }, 210);
      const draw = () => {
        const rows = D.devices.filter(d => !active || d.type === active);
        scatter.setOption({ series: [{ data: rows.map(d => [d.temp, d.power, d.id]), itemStyle: { color: active ? AX.PALETTE[D.types.indexOf(active)] : "#4f46e5" } }] });
        const avg = k => (rows.reduce((a, d) => a + d[k], 0) / rows.length).toFixed(1);
        summary.innerHTML = `<span class="ax-pill ax-pill--info">${active || "All types"}</span><span class="ax-small">${rows.length} devices · avg ${avg("temp")}°C · avg ${avg("power")} kW · ${rows.filter(d => d.status !== "Online").length} not online</span>`;
      };
      pie.on("click", p => { active = active === p.name ? null : p.name; draw(); });
      draw();
    }
  },
  {
    title: "Dimension Explorer",
    level: 3,
    wide: true,
    desc: "Build your own chart: choose the X, Y, size and colour fields plus the chart type. Every combination works.",
    render(b) {
      const num = [["temp", "Temperature"], ["humidity", "Humidity"], ["power", "Power"], ["battery", "Battery"], ["uptime", "Uptime"], ["alerts", "Alerts"]];
      const cat = [["type", "Device type"], ["site", "Site"], ["status", "Status"], ["region", "Region"]];
      const sel = (k, opts, v) => `<label>${k} <select class="ax-select" data-k="${k}">${opts.map(([val, l]) => `<option value="${val}" ${val === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
      const ctl = AX.add(b, `<div class="ax-ctl">
        ${sel("Chart", [["scatter", "Scatter"], ["bar", "Bar (average by colour field)"], ["box", "Range by colour field"]], "scatter")}
        ${sel("X", num, "temp")} ${sel("Y", num, "power")} ${sel("Size", [["", "None"], ...num], "alerts")} ${sel("Colour", cat, "type")}
      </div>`);
      const c = AX.chart(b, { xAxis: {}, yAxis: {}, series: [] }, 300);
      const draw = () => {
        const v = k => ctl.querySelector(`[data-k="${k}"]`).value;
        const [type, x, y, size, color] = ["Chart", "X", "Y", "Size", "Colour"].map(v);
        const label = k => [...num, ...cat].find(o => o[0] === k)[1];
        const groups = [...new Set(D.devices.map(d => d[color]))];
        ctl.querySelectorAll('[data-k="X"],[data-k="Size"]').forEach(s => { s.disabled = type !== "scatter"; });
        let opt;
        if (type === "scatter") {
          const sizes = size ? D.devices.map(d => d[size]) : [1];
          const lo = Math.min(...sizes), hi = Math.max(...sizes) || 1;
          opt = {
            legend: { top: 0, type: "scroll" }, tooltip: { trigger: "item", formatter: p => `${p.data[2]} (${p.seriesName})<br>${label(x)} ${p.data[0]}<br>${label(y)} ${p.data[1]}` },
            xAxis: { type: "value", name: label(x), scale: true }, yAxis: { type: "value", name: label(y), scale: true },
            series: groups.map(g => ({
              type: "scatter", name: g, itemStyle: { opacity: 0.75 },
              symbolSize: p => (size ? 6 + ((p[3] - lo) / (hi - lo || 1)) * 22 : 9),
              data: D.devices.filter(d => d[color] === g).map(d => [d[x], d[y], d.id, size ? d[size] : 0])
            }))
          };
        } else {
          const vals = g => D.devices.filter(d => d[color] === g).map(d => d[y]);
          opt = type === "bar"
            ? { tooltip: { trigger: "axis" }, xAxis: { type: "category", data: groups }, yAxis: { type: "value", name: `Avg ${label(y)}` }, series: [{ type: "bar", data: groups.map(g => +(vals(g).reduce((a, c) => a + c, 0) / vals(g).length).toFixed(2)), colorBy: "data" }] }
            : { tooltip: { trigger: "axis" }, xAxis: { type: "category", data: groups }, yAxis: { type: "value", name: label(y), scale: true }, series: [
                { type: "bar", stack: "r", data: groups.map(g => Math.min(...vals(g))), itemStyle: { color: "transparent" }, tooltip: { show: false } },
                { type: "bar", stack: "r", name: "Range", data: groups.map(g => +(Math.max(...vals(g)) - Math.min(...vals(g))).toFixed(2)), itemStyle: { borderRadius: 4 } }
              ] };
        }
        opt.grid = { left: 8, right: 24, top: 36, bottom: 8, containLabel: true };
        c.setOption(opt, true);
      };
      ctl.addEventListener("change", draw);
      draw();
    }
  }
]);
