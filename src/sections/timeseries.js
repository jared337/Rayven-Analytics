/* ==========================================================================
 * Time Series: 20 examples, simple to advanced
 * ========================================================================== */
(() => {
  const MIN = 60e3, HOUR = D.HOUR, DAY = D.DAY;
  const timeAxis = (extra = {}) => ({ type: "time", ...extra });

  /* Hourly-cycle sensor data: [[ms, v], ...] */
  const sensor = (n, step, { base = 22, amp = 4, noise = 1, seed = 1, period } = {}) =>
    D.ts(n, step, D.wave(n, { base, amp, noise, seed, period: period || Math.round(DAY / step) }));

  const avg = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);

  /* Bucket [[t, v]] into windows of `size` ms using `fn` over values */
  function bucket(data, size, fn = avg) {
    const map = new Map();
    data.forEach(([t, v]) => {
      const k = Math.floor(t / size) * size;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(v);
    });
    return [...map].map(([t, vals]) => [t, +fn(vals).toFixed(2)]);
  }

  AX.section("timeseries", [
    {
      title: "Single Series",
      level: 1,
      desc: "One sensor over the last 24 hours on a real time axis. The starting point for any time series.",
      render(b) {
        AX.chart(b, {
          xAxis: timeAxis(), yAxis: { type: "value", name: "°C", scale: true },
          series: [{ type: "line", name: "Temperature", data: sensor(96, 15 * MIN, { seed: 2 }) }]
        });
      }
    },
    {
      title: "Multiple Series",
      level: 1,
      desc: "Several sensors on one chart. Click a legend item to hide or show that series.",
      render(b) {
        AX.chart(b, {
          legend: { top: 0 }, xAxis: timeAxis(), yAxis: { type: "value", scale: true },
          series: ["Zone A", "Zone B", "Zone C"].map((name, i) => ({ type: "line", name, data: sensor(48, HOUR, { base: 20 + i * 2, amp: 3 + i, seed: i + 5 }) }))
        });
      }
    },
    {
      title: "Threshold Lines",
      level: 1,
      desc: "Upper and lower limits drawn across the chart so out-of-range periods stand out immediately.",
      render(b) {
        AX.chart(b, {
          xAxis: timeAxis(), yAxis: { type: "value", name: "bar", scale: true },
          series: [{
            type: "line", name: "Pressure", areaStyle: { opacity: 0.08 }, data: sensor(72, HOUR, { base: 6, amp: 1.8, noise: 0.5, seed: 8 }),
            markLine: { symbol: "none", label: { formatter: "{b}: {c}", position: "insideEndTop", fontSize: 10 }, data: [
              { name: "High limit", yAxis: 7.5, lineStyle: { color: "#ef4444", type: "dashed" } },
              { name: "Low limit", yAxis: 4.5, lineStyle: { color: "#f59e0b", type: "dashed" } }
            ] }
          }]
        });
      }
    },
    {
      title: "Step Line for States",
      level: 1,
      desc: "On/off or mode changes drawn as steps, so you can see exactly when a state changed and for how long.",
      render(b) {
        const rand = D.rng(12);
        let s = 1;
        const data = Array.from({ length: 48 }, (_, i) => { if (rand() < 0.18) s = 1 - s; return [Date.now() - (47 - i) * 30 * MIN, s]; });
        AX.chart(b, {
          tooltip: { trigger: "axis", formatter: p => `${F.dateTime(p[0].data[0])}<br>Pump: <strong>${p[0].data[1] ? "On" : "Off"}</strong>` },
          xAxis: timeAxis(), yAxis: { type: "value", min: 0, max: 1, interval: 1, axisLabel: { formatter: v => (v ? "On" : "Off") } },
          series: [{ type: "line", step: "end", data, areaStyle: { opacity: 0.15 }, lineStyle: { color: "#0d9488" }, itemStyle: { color: "#0d9488" } }]
        }, 180);
      }
    },
    {
      title: "Time Range Selector",
      level: 2,
      desc: "Buttons switch between the last hour, day, week and month. Resolution adjusts to suit each range.",
      render(b) {
        const ranges = { "1h": [60, MIN], "24h": [96, 15 * MIN], "7d": [168, HOUR], "30d": [120, 6 * HOUR] };
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg(Object.keys(ranges).map(k => [k, k]), "24h")}<span class="ax-small ax-muted" data-res></span></div>`);
        const c = AX.chart(b, { xAxis: timeAxis(), yAxis: { type: "value", name: "kW", scale: true }, series: [{ type: "line", name: "Load", areaStyle: { opacity: 0.1 } }] });
        const draw = k => {
          const [n, step] = ranges[k];
          c.setOption({ series: [{ data: D.ts(n, step, D.walk(n, { base: 40, vol: 2.5, seed: n })) }] });
          ctl.querySelector("[data-res]").textContent = `${n} points, one every ${step >= HOUR ? step / HOUR + " h" : step / MIN + " min"}`;
        };
        draw("24h");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Zoom and Pan",
      level: 2,
      desc: "30 days of hourly data. Drag the slider handles or scroll on the chart to zoom, drag to pan.",
      render(b) {
        AX.chart(b, {
          xAxis: timeAxis(), yAxis: { type: "value", name: "°C", scale: true },
          dataZoom: [{ type: "inside", start: 70, end: 100 }, { type: "slider", start: 70, end: 100, height: 22, bottom: 8 }],
          series: [{ type: "line", name: "Temperature", data: sensor(720, HOUR, { base: 21, amp: 5, noise: 1.5, seed: 14 }), sampling: "lttb" }]
        }, 260);
      }
    },
    {
      title: "Dual Axis",
      level: 2,
      desc: "Two measures with different units on left and right axes: temperature as a line, power as bars.",
      render(b) {
        AX.chart(b, {
          legend: { top: 0 }, xAxis: timeAxis(),
          yAxis: [{ type: "value", name: "°C", scale: true }, { type: "value", name: "kW", splitLine: { show: false } }],
          series: [
            { type: "bar", name: "Power", yAxisIndex: 1, data: D.ts(24, HOUR, D.wave(24, { base: 30, amp: 12, seed: 3 })), itemStyle: { color: "#c7d2fe" } },
            { type: "line", name: "Temperature", data: sensor(24, HOUR, { base: 24, amp: 5, seed: 4 }), lineStyle: { width: 2.5 }, itemStyle: { color: "#ef4444" } }
          ]
        });
      }
    },
    {
      title: "Aggregation Levels",
      level: 2,
      desc: "Same data shown raw, as hourly averages, or as daily averages with a min to max band.",
      render(b) {
        const raw = sensor(7 * 96, 15 * MIN, { base: 22, amp: 4, noise: 2.5, seed: 21 });
        const ctl = AX.add(b, `<div class="ax-ctl">${AX.seg([["raw", "Raw (15 min)"], ["hour", "Hourly avg"], ["day", "Daily avg + range"]], "hour")}</div>`);
        const c = AX.chart(b, { xAxis: timeAxis(), yAxis: { type: "value", scale: true, name: "°C" }, series: [] });
        const draw = mode => {
          let series;
          if (mode === "raw") series = [{ type: "line", name: "Raw", data: raw, lineStyle: { width: 1 } }];
          else if (mode === "hour") series = [{ type: "line", name: "Hourly avg", data: bucket(raw, HOUR) }];
          else {
            const lo = bucket(raw, DAY, a => Math.min(...a)), hi = bucket(raw, DAY, a => Math.max(...a));
            series = [
              { type: "line", name: "Min", data: lo, stack: "band", lineStyle: { opacity: 0 }, symbol: "none", tooltip: { show: false } },
              { type: "line", name: "Range", data: hi.map(([t, v], i) => [t, +(v - lo[i][1]).toFixed(2)]), stack: "band", lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(79,70,229,.15)" }, symbol: "none", tooltip: { show: false } },
              { type: "line", name: "Daily avg", data: bucket(raw, DAY), symbol: "circle", symbolSize: 7 }
            ];
          }
          c.setOption({ series }, { replaceMerge: ["series"] });
        };
        draw("hour");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Moving Average",
      level: 2,
      desc: "Noisy raw readings with a smoothed rolling average. Drag the slider to change the window size.",
      render(b) {
        const raw = D.ts(200, HOUR, D.walk(200, { base: 50, vol: 6, seed: 33 }));
        const ctl = AX.add(b, `<div class="ax-ctl"><label>Window <input type="range" min="2" max="48" value="12" aria-label="Window size"></label><strong data-w>12 h</strong></div>`);
        const c = AX.chart(b, { legend: { top: 0 }, xAxis: timeAxis(), yAxis: { type: "value", scale: true }, series: [
          { type: "line", name: "Raw", data: raw, lineStyle: { width: 1, color: "#d4d4d8" }, itemStyle: { color: "#d4d4d8" } },
          { type: "line", name: "Moving avg", lineStyle: { width: 2.5 } }
        ] });
        const draw = w => {
          ctl.querySelector("[data-w]").textContent = w + " h";
          c.setOption({ series: [{}, { data: raw.map(([t], i) => [t, i < w - 1 ? null : +avg(raw.slice(i - w + 1, i + 1).map(p => p[1])).toFixed(2)]) }] });
        };
        ctl.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(12);
      }
    },
    {
      title: "Stacked Area by Category",
      level: 2,
      desc: "Total energy split into circuits, stacked so you see both the total and each part's share over time.",
      render(b) {
        AX.chart(b, {
          legend: { top: 0 }, xAxis: timeAxis(), yAxis: { type: "value", name: "kWh" },
          tooltip: { trigger: "axis" },
          series: [["HVAC", 30, 10], ["Production", 45, 15], ["Lighting", 12, 6], ["Other", 8, 3]].map(([name, base, amp], i) => ({
            type: "line", name, stack: "total", areaStyle: { opacity: 0.6 }, lineStyle: { width: 1 }, emphasis: { focus: "series" },
            data: D.ts(48, HOUR, D.wave(48, { base, amp, noise: 2, seed: i + 40, phase: i })).map(([t, v]) => [t, Math.max(0, v)])
          }))
        });
      }
    },
    {
      title: "Date Range Picker",
      level: 2,
      desc: "Choose any from and to date, or use a preset. The chart and the totals update to the selection.",
      render(b) {
        const all = D.ts(180, DAY, D.wave(180, { base: 420, amp: 80, period: 7, noise: 40, seed: 50 }));
        const today = F.iso(Date.now());
        const ctl = AX.add(b, `<div class="ax-ctl">
          <label>From <input class="ax-input" type="date" data-from></label>
          <label>To <input class="ax-input" type="date" data-to max="${today}"></label>
          <button class="ax-btn ax-btn--sm" data-p="7">7d</button><button class="ax-btn ax-btn--sm" data-p="30">30d</button><button class="ax-btn ax-btn--sm" data-p="90">90d</button>
        </div>`);
        const sum = AX.add(b, `<div class="ax-small ax-muted" style="margin-bottom:6px"></div>`);
        const c = AX.chart(b, { xAxis: timeAxis(), yAxis: { type: "value", name: "kWh" }, series: [{ type: "bar", name: "Daily kWh" }] }, 220);
        const from = ctl.querySelector("[data-from]"), to = ctl.querySelector("[data-to]");
        const draw = () => {
          const a = new Date(from.value).getTime(), z = new Date(to.value).getTime() + DAY;
          const rows = all.filter(([t]) => t >= a && t < z);
          c.setOption({ series: [{ data: rows }] });
          const vals = rows.map(r => r[1]);
          sum.innerHTML = rows.length ? `<strong>${rows.length}</strong> days · total <strong>${F.num(vals.reduce((s, v) => s + v, 0))}</strong> kWh · peak ${F.num(Math.max(...vals))} · avg ${F.num(avg(vals))}` : "No data in this range";
        };
        const preset = d => { to.value = today; from.value = F.iso(Date.now() - (d - 1) * DAY); draw(); };
        ctl.addEventListener("click", e => { if (e.target.dataset.p) preset(+e.target.dataset.p); });
        from.addEventListener("change", draw);
        to.addEventListener("change", draw);
        preset(30);
      }
    },
    {
      title: "Device Multi-Select",
      level: 2,
      desc: "Tick which devices to plot. Useful when there are too many series to show all at once.",
      render(b) {
        const devs = D.devices.filter(d => d.type === "Chiller").slice(0, 8);
        const ctl = AX.add(b, `<div class="ax-ctl">${devs.map((d, i) => `<label><input type="checkbox" value="${i}" ${i < 3 ? "checked" : ""}> ${d.id}</label>`).join("")}</div>`);
        const c = AX.chart(b, { legend: { top: 0, type: "scroll" }, xAxis: timeAxis(), yAxis: { type: "value", name: "°C", scale: true }, series: [] }, 230);
        const draw = () => {
          const on = [...ctl.querySelectorAll("input:checked")].map(x => +x.value);
          c.setOption({ series: on.map(i => ({ type: "line", name: devs[i].id, data: sensor(48, HOUR, { base: devs[i].temp, amp: 2.5, seed: i + 60 }), color: AX.PALETTE[i] })) }, { replaceMerge: ["series"] });
        };
        ctl.addEventListener("change", draw);
        draw();
      }
    },
    {
      title: "Anomaly Detection",
      level: 3,
      desc: "Flags readings more than k standard deviations from a rolling mean. Adjust sensitivity to tune alerts.",
      render(b) {
        const vals = D.walk(240, { base: 60, vol: 2.5, seed: 70 });
        [40, 95, 150, 151, 210].forEach((i, j) => { vals[i] += j % 2 ? -14 : 16; });
        const data = D.ts(240, HOUR, vals);
        const ctl = AX.add(b, `<div class="ax-ctl"><label>Sensitivity (k) <input type="range" min="1.5" max="4" step="0.1" value="2.5" aria-label="Sensitivity"></label><strong data-k></strong><span class="ax-pill ax-pill--bad" data-n></span></div>`);
        const c = AX.chart(b, { legend: { top: 0, data: ["Reading", "Expected range", "Anomaly"] }, xAxis: timeAxis(), yAxis: { type: "value", scale: true }, series: [
          { type: "line", name: "Reading", data },
          { type: "line", name: "lower", lineStyle: { opacity: 0 }, stack: "b", symbol: "none", tooltip: { show: false } },
          { type: "line", name: "Expected range", lineStyle: { opacity: 0 }, stack: "b", areaStyle: { color: "rgba(79,70,229,.08)" }, itemStyle: { color: "#c7d2fe" }, symbol: "none", tooltip: { show: false } },
          { type: "scatter", name: "Anomaly", symbolSize: 11, itemStyle: { color: "#ef4444" } }
        ] }, 240);
        const draw = k => {
          const W = 24, lo = [], width = [], hits = [];
          data.forEach(([t, v], i) => {
            const win = data.slice(Math.max(0, i - W), i).map(p => p[1]);
            if (win.length < 6) { lo.push([t, null]); width.push([t, null]); return; }
            const m = avg(win), sd = Math.sqrt(avg(win.map(x => (x - m) ** 2)));
            lo.push([t, +(m - k * sd).toFixed(2)]);
            width.push([t, +(2 * k * sd).toFixed(2)]);
            if (Math.abs(v - m) > k * sd) hits.push([t, v]);
          });
          ctl.querySelector("[data-k]").textContent = k;
          ctl.querySelector("[data-n]").textContent = `${hits.length} anomalies`;
          c.setOption({ series: [{}, { data: lo }, { data: width }, { data: hits }] });
        };
        ctl.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(2.5);
      }
    },
    {
      title: "Forecast with Confidence Band",
      level: 3,
      desc: "History plus a 48-hour projection. The shaded band widens the further ahead the forecast goes.",
      render(b) {
        const hist = sensor(120, HOUR, { base: 30, amp: 8, noise: 1.5, seed: 80 });
        const last = hist[hist.length - 1][0];
        const fc = D.wave(49, { base: 30, amp: 8, noise: 0, seed: 1, phase: 119, period: 24 }).map((v, i) => [last + i * HOUR, v]);
        const lo = fc.map(([t, v], i) => [t, +(v - 1 - i * 0.12).toFixed(2)]);
        const wd = fc.map(([t], i) => [t, +(2 + i * 0.24).toFixed(2)]);
        AX.chart(b, {
          legend: { top: 0, data: ["Actual", "Forecast", "80% interval"] }, xAxis: timeAxis(), yAxis: { type: "value", name: "kW", scale: true },
          series: [
            { type: "line", name: "Actual", data: hist },
            { type: "line", name: "lower", data: lo, stack: "ci", lineStyle: { opacity: 0 }, symbol: "none", tooltip: { show: false } },
            { type: "line", name: "80% interval", data: wd, stack: "ci", lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(13,148,136,.14)" }, itemStyle: { color: "rgba(13,148,136,.35)" }, symbol: "none", tooltip: { show: false } },
            { type: "line", name: "Forecast", data: fc, lineStyle: { type: "dashed", color: "#0d9488" }, itemStyle: { color: "#0d9488" },
              markLine: { symbol: "none", silent: true, label: { formatter: "Now", fontSize: 10 }, lineStyle: { color: "#71717a" }, data: [{ xAxis: last }] } }
          ]
        }, 250);
      }
    },
    {
      title: "Live Streaming",
      level: 3,
      desc: "New reading every second, keeping a rolling 2-minute window. Pause, resume and see the update rate.",
      render(b) {
        let data = D.ts(120, 1000, D.walk(120, { base: 50, vol: 3, seed: 90 })), paused = false, n = 0;
        const ctl = AX.add(b, `<div class="ax-ctl"><span class="ax-pill ax-pill--live" data-live>Live</span><button class="ax-btn ax-btn--sm" data-toggle>Pause</button><span class="ax-small ax-muted" data-info></span></div>`);
        const c = AX.chart(b, { xAxis: timeAxis(), yAxis: { type: "value", scale: true }, series: [{ type: "line", name: "Signal", data, areaStyle: { opacity: 0.1 }, animation: false }] }, 220);
        ctl.querySelector("[data-toggle]").addEventListener("click", e => {
          paused = !paused;
          e.target.textContent = paused ? "Resume" : "Pause";
          ctl.querySelector("[data-live]").className = `ax-pill ax-pill--${paused ? "warn" : "live"}`;
          ctl.querySelector("[data-live]").textContent = paused ? "Paused" : "Live";
        });
        AX.every(1000, () => {
          if (paused) return;
          const v = +(data[data.length - 1][1] + (Math.random() - 0.5) * 6 + (50 - data[data.length - 1][1]) * 0.05).toFixed(2);
          data = data.slice(1).concat([[Date.now(), v]]);
          n++;
          c.setOption({ series: [{ data }] });
          ctl.querySelector("[data-info]").textContent = `Last ${v} · ${n} updates received`;
        }, b);
      }
    },
    {
      title: "Period Comparison",
      level: 3,
      desc: "This week overlaid on last week or the same week last year, aligned by weekday with a change summary.",
      render(b) {
        const cur = D.wave(168, { base: 40, amp: 12, noise: 4, seed: 101 });
        const prev = { last: D.wave(168, { base: 37, amp: 11, noise: 4, seed: 102 }), year: D.wave(168, { base: 33, amp: 10, noise: 4, seed: 103 }) };
        const labels = Array.from({ length: 168 }, (_, i) => `${D.days[Math.floor(i / 24)]} ${F.pad(i % 24)}:00`);
        const ctl = AX.add(b, `<div class="ax-ctl">Compare with ${AX.seg([["last", "Last week"], ["year", "Same week last year"]], "last")}<span class="ax-small" data-d></span></div>`);
        const c = AX.chart(b, { legend: { top: 0 }, xAxis: { type: "category", data: labels, axisLabel: { interval: 23, formatter: v => v.split(" ")[0] } }, yAxis: { type: "value", name: "kW" }, series: [] }, 230);
        const draw = k => {
          const t1 = cur.reduce((a, v) => a + v, 0), t0 = prev[k].reduce((a, v) => a + v, 0), d = ((t1 - t0) / t0) * 100;
          ctl.querySelector("[data-d]").innerHTML = `Total ${F.num(t1)} vs ${F.num(t0)} kWh <span class="${d <= 0 ? "ax-up" : "ax-down"}">${d >= 0 ? "+" : ""}${d.toFixed(1)}%</span>`;
          c.setOption({ series: [
            { type: "line", name: "This week", data: cur },
            { type: "line", name: k === "last" ? "Last week" : "Last year", data: prev[k], lineStyle: { type: "dashed", color: "#a1a1aa" }, itemStyle: { color: "#a1a1aa" } }
          ] }, { replaceMerge: ["series"] });
        };
        draw("last");
        AX.onSeg(ctl.querySelector(".ax-seg"), draw);
      }
    },
    {
      title: "Event Annotations",
      level: 3,
      desc: "Maintenance windows shaded, alarms pinned and setpoint changes marked. Toggle each annotation layer.",
      render(b) {
        const data = sensor(96, HOUR, { base: 24, amp: 4, noise: 1, seed: 110 });
        const t = i => data[i][0];
        const layers = {
          maint: { markArea: { itemStyle: { color: "rgba(245,158,11,.12)" }, label: { fontSize: 10, color: "#b45309" }, data: [[{ name: "Maintenance", xAxis: t(20) }, { xAxis: t(26) }], [{ name: "Service", xAxis: t(70) }, { xAxis: t(74) }]] } },
          alarms: { markPoint: { symbol: "pin", symbolSize: 34, itemStyle: { color: "#ef4444" }, label: { fontSize: 9, formatter: "!" }, data: [{ name: "High temp", coord: data[45] }, { name: "Sensor fault", coord: data[88] }] } },
          changes: { markLine: { symbol: "none", label: { formatter: "{b}", fontSize: 10, position: "end", color: "#4f46e5" }, lineStyle: { color: "#4f46e5", type: "dashed" }, data: [{ name: "Setpoint 22 to 21", xAxis: t(55) }] } }
        };
        const ctl = AX.add(b, `<div class="ax-ctl">${[["maint", "Maintenance windows"], ["alarms", "Alarms"], ["changes", "Setpoint changes"]].map(([k, l]) => `<label><input type="checkbox" value="${k}" checked> ${l}</label>`).join("")}</div>`);
        const c = AX.chart(b, { xAxis: timeAxis(), yAxis: { type: "value", name: "°C", scale: true }, series: [{ type: "line", name: "Temperature", data }] }, 240);
        const draw = () => {
          const on = [...ctl.querySelectorAll("input:checked")].map(x => x.value);
          const s = { type: "line", name: "Temperature", data, markArea: { data: [] }, markPoint: { data: [] }, markLine: { data: [] } };
          on.forEach(k => Object.assign(s, layers[k]));
          c.setOption({ series: [s] }, { replaceMerge: ["series"] });
        };
        ctl.addEventListener("change", draw);
        draw();
      }
    },
    {
      title: "Threshold Colouring",
      level: 3,
      desc: "The line changes colour where it crosses your threshold. Move the slider to see time spent above it.",
      render(b) {
        const data = sensor(168, HOUR, { base: 70, amp: 15, noise: 4, seed: 120 });
        const ctl = AX.add(b, `<div class="ax-ctl"><label>Alert above <input type="range" min="60" max="95" value="80" aria-label="Threshold"></label><strong data-t></strong><span class="ax-pill ax-pill--bad" data-h></span></div>`);
        // Red overlay series holds only the points above the threshold (plus the
        // neighbours either side so segments join the blue line cleanly)
        const c = AX.chart(b, {
          tooltip: { trigger: "axis", formatter: p => `${F.dateTime(p[0].data[0])}<br>Utilisation <strong>${p[0].data[1]}%</strong>` },
          xAxis: timeAxis(), yAxis: { type: "value", name: "%", scale: true },
          series: [
            { type: "line", name: "Utilisation", data, lineStyle: { width: 2.5, color: "#4f46e5" } },
            { type: "line", name: "Above", lineStyle: { width: 2.5, color: "#ef4444" }, connectNulls: false, z: 3,
              markLine: { symbol: "none", silent: true, label: { show: false }, lineStyle: { color: "#ef4444", type: "dashed" }, data: [] } }
          ]
        }, 230);
        const draw = th => {
          const above = data.map(([t, v], i) => [t, v > th || data[i - 1]?.[1] > th || data[i + 1]?.[1] > th ? v : null]);
          const hours = data.filter(p => p[1] > th).length;
          ctl.querySelector("[data-t]").textContent = th + "%";
          ctl.querySelector("[data-h]").textContent = `${hours} h above (${Math.round((hours / data.length) * 100)}%)`;
          c.setOption({ series: [{}, { data: above, markLine: { data: [{ yAxis: th }] } }] });
        };
        ctl.querySelector("input").addEventListener("input", e => draw(+e.target.value));
        draw(80);
      }
    },
    {
      title: "Synchronised Charts",
      level: 3,
      wide: true,
      desc: "Three stacked charts share one crosshair and one zoom. Hover or zoom any chart and the others follow.",
      render(b) {
        const group = "sync-" + Math.random().toString(36).slice(2);
        const metrics = [["Temperature °C", 22, 4, 0], ["Humidity %", 50, 10, 1], ["Power kW", 30, 9, 2]];
        const charts = metrics.map(([name, base, amp, i], idx) => {
          const c = AX.chart(b, {
            grid: { left: 8, right: 16, top: 24, bottom: idx === 2 ? 46 : 4, containLabel: true },
            title: { text: name, left: 0, top: 0, textStyle: { fontSize: 12, fontWeight: 600 } },
            tooltip: { trigger: "axis", axisPointer: { type: "line" } },
            xAxis: timeAxis({ axisLabel: { show: idx === 2 } }), yAxis: { type: "value", scale: true, splitNumber: 3 },
            dataZoom: [{ type: "inside" }, ...(idx === 2 ? [{ type: "slider", height: 20, bottom: 6 }] : [])],
            series: [{ type: "line", name, data: sensor(168, HOUR, { base, amp, noise: amp / 4, seed: 130 + i }), itemStyle: { color: AX.PALETTE[i] }, lineStyle: { color: AX.PALETTE[i] } }]
          }, idx === 2 ? 170 : 120);
          c.group = group;
          return c;
        });
        echarts.connect(group);
        return charts;
      }
    },
    {
      title: "Time Series Explorer",
      level: 3,
      wide: true,
      desc: "Pick device, metric, range, aggregation and chart style. Zoom in, read live stats, then export to CSV.",
      render(b) {
        const metrics = { temp: ["Temperature", "°C", 4], humidity: ["Humidity", "%", 10], power: ["Power", "kW", 8] };
        const ranges = { 1: "24 hours", 7: "7 days", 30: "30 days" };
        const aggs = { raw: ["Raw", 0], h: ["Hourly", HOUR], d: ["Daily", DAY] };
        const fns = { avg: ["Average", avg], max: ["Maximum", a => Math.max(...a)], min: ["Minimum", a => Math.min(...a)], sum: ["Sum", a => a.reduce((s, v) => s + v, 0)] };
        const opts = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${k == v ? "selected" : ""}>${Array.isArray(l) ? l[0] : l}</option>`).join("");
        const ctl = AX.add(b, `<div class="ax-ctl">
          <select class="ax-select" data-k="dev" aria-label="Device">${D.devices.slice(0, 20).map(d => `<option value="${d.id}">${d.id} · ${d.name}</option>`).join("")}</select>
          <select class="ax-select" data-k="metric" aria-label="Metric">${opts(metrics, "temp")}</select>
          <select class="ax-select" data-k="range" aria-label="Range">${opts(ranges, 7)}</select>
          <select class="ax-select" data-k="agg" aria-label="Aggregation">${opts(aggs, "h")}</select>
          <select class="ax-select" data-k="fn" aria-label="Function">${opts(fns, "avg")}</select>
          ${AX.seg([["line", "Line"], ["area", "Area"], ["bar", "Bar"]], "line")}
          <button class="ax-btn" data-csv style="margin-left:auto">Export CSV</button>
        </div>`);
        const stats = AX.add(b, `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:8px"></div>`);
        const c = AX.chart(b, { xAxis: timeAxis(), yAxis: { type: "value", scale: true }, dataZoom: [{ type: "inside" }, { type: "slider", height: 20, bottom: 6 }], series: [] }, 280);
        let style = "line", rows = [];
        const v = k => ctl.querySelector(`[data-k="${k}"]`).value;
        const showStats = (from = 0, to = 100) => {
          const a = Math.floor((rows.length - 1) * from / 100), z = Math.ceil((rows.length - 1) * to / 100);
          const vals = rows.slice(a, z + 1).map(r => r[1]);
          const [, unit] = metrics[v("metric")];
          stats.innerHTML = [["Points", vals.length, ""], ["Min", Math.min(...vals).toFixed(1), unit], ["Max", Math.max(...vals).toFixed(1), unit], ["Average", avg(vals).toFixed(1), unit], ["Latest", vals[vals.length - 1]?.toFixed(1), unit]]
            .map(([l, x, u]) => `<div style="background:var(--rv-bg);border-radius:7px;padding:6px 10px"><div class="ax-small ax-muted">${l}</div><strong>${x} ${u}</strong></div>`).join("");
        };
        const draw = () => {
          const dev = D.devices.find(d => d.id === v("dev")), [name, unit, amp] = metrics[v("metric")];
          ctl.querySelector('[data-k="fn"]').disabled = v("agg") === "raw";
          const days = +v("range"), n = days * 96;
          const raw = sensor(n, 15 * MIN, { base: dev[v("metric")], amp, noise: amp / 3, seed: +dev.id.slice(4) + v("metric").length });
          rows = v("agg") === "raw" ? raw : bucket(raw, aggs[v("agg")][1], fns[v("fn")][1]);
          c.setOption({
            yAxis: { name: unit },
            dataZoom: [{ start: 0, end: 100 }, { start: 0, end: 100 }],
            series: [{ type: style === "bar" ? "bar" : "line", name: `${dev.id} ${name}`, data: rows, areaStyle: style === "area" ? { opacity: 0.2 } : undefined, sampling: "lttb", showSymbol: false }]
          }, { replaceMerge: ["series"] });
          showStats();
        };
        c.on("dataZoom", () => { const z = c.getOption().dataZoom[0]; showStats(z.start, z.end); });
        ctl.addEventListener("change", draw);
        AX.onSeg(ctl.querySelector(".ax-seg"), s => { style = s; draw(); });
        ctl.querySelector("[data-csv]").addEventListener("click", () => {
          AX.download(`${v("dev")}-${v("metric")}.csv`, AX.csv(rows.map(([t, x]) => ({ time: new Date(t).toISOString(), value: x })), [{ key: "time" }, { key: "value" }]));
          AX.toast(`Exported ${rows.length} rows`, "good");
        });
        draw();
      }
    }
  ]);
})();
