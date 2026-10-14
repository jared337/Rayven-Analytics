/* ==========================================================================
 * Additions, round 2: meteogram, organisation chart, VU meter
 * ========================================================================== */
(() => {
  const HOUR = D.HOUR;

  /* Small weather icons as SVG data URIs for ECharts image symbols */
  const svgURI = s => "image://data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${s}</svg>`);
  const SUN = '<circle cx="16" cy="16" r="6" fill="#f59e0b"/><g stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/></g>';
  const CLOUD = (fill = "#d4d4d8") => `<path d="M9 25h15a6 6 0 0 0 .6-12A8 8 0 0 0 9.3 15 5 5 0 0 0 9 25z" fill="${fill}" stroke="#a1a1aa" stroke-width="1"/>`;
  const ICONS = {
    sun: svgURI(SUN),
    partly: svgURI('<g transform="translate(-4 -5) scale(.8)">' + SUN + "</g>" + CLOUD("#f4f4f5")),
    cloud: svgURI(CLOUD()),
    moon: svgURI('<path d="M21 5a11 11 0 1 0 6 18A9 9 0 0 1 21 5z" fill="#52525b"/>'),
    rain: svgURI(CLOUD("#e4e4e7") + '<g stroke="#4f46e5" stroke-width="2" stroke-linecap="round"><path d="M11 27l-1.5 3M17 27l-1.5 3M23 27l-1.5 3"/></g>')
  };
  const ARROW = "path://M0,-10 L4,2 L1,0 L1,10 L-1,10 L-1,0 L-4,2 Z";

  AX.extend("timeseries", [
    {
      title: "Meteogram",
      level: 3,
      wide: true,
      desc: "A 48-hour weather forecast on one timeline: temperature with weather icons, rain columns, a dotted pressure line and wind arrows along the bottom.",
      render(b) {
        const n = 48, start = Math.ceil(Date.now() / HOUR) * HOUR, T = i => start + i * HOUR, r = D.rng(48);
        const hourOf = i => new Date(T(i)).getHours();
        const temp = Array.from({ length: n }, (_, i) => { const h = hourOf(i); return +(14 + 6 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + (i > 24 ? 2.5 : 0) + (r() - 0.5)).toFixed(1); });
        const rain = Array.from({ length: n }, (_, i) => (i > 26 && i < 34 ? +(0.4 + r() * 2.6).toFixed(1) : i > 8 && i < 11 ? +(r() * 0.6).toFixed(1) : 0));
        const press = Array.from({ length: n }, (_, i) => +(1029 - 4 * Math.sin((i / n) * Math.PI) + Math.sin(i / 5) * 0.6).toFixed(1));
        const wind = Array.from({ length: n }, (_, i) => ({ dir: (20 + i * 5.5) % 360, spd: +(3 + 5 * Math.abs(Math.sin(i / 9)) + r()).toFixed(1) }));
        const icon = i => { const h = hourOf(i), night = h < 6 || h >= 20; return rain[i] > 0.3 ? "rain" : night ? (r() < 0.3 ? "cloud" : "moon") : temp[i] > 20 ? "sun" : r() < 0.5 ? "partly" : "cloud"; };
        const icons = Array.from({ length: n }, (_, i) => (i % 2 ? null : icon(i)));
        const midnights = Array.from({ length: n }, (_, i) => i).filter(i => hourOf(i) === 0);
        const tMax = Math.max(...temp), tMin = Math.min(...temp), rainSum = rain.reduce((s, v) => s + v, 0);
        b.innerHTML = `<div class="ax-ctl"><span class="ax-small">Melbourne · next 48 hours</span><span class="ax-pill ax-pill--info">${tMin}° to ${tMax}°</span><span class="ax-pill ax-pill--info">${rainSum.toFixed(1)} mm rain</span><span class="ax-small" style="color:var(--ink-3);margin-left:auto">Sample forecast. Connect a weather API workflow for live data.</span></div>`;
        AX.chart(b, {
          legend: { top: 0, data: ["Temperature", "Rain", "Pressure"] },
          tooltip: {
            trigger: "axis", axisPointer: { type: "line" },
            formatter: p => { const i = p[0].dataIndex; return `<b>${new Date(T(i)).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}</b><br>Temperature ${temp[i]}°C<br>Rain ${rain[i]} mm<br>Pressure ${press[i]} hPa<br>Wind ${wind[i].spd} m/s from ${Math.round(wind[i].dir)}°`; }
          },
          axisPointer: { link: [{ xAxisIndex: "all" }] },
          grid: [{ left: 40, right: 56, top: 40, bottom: 70 }, { left: 40, right: 56, height: 26, bottom: 30 }],
          xAxis: [
            { type: "category", data: temp.map((_, i) => F.pad(hourOf(i))), gridIndex: 0, axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: true, interval: 1, lineStyle: { color: "#f4f4f5" } } },
            { type: "category", data: temp.map((_, i) => F.pad(hourOf(i))), gridIndex: 1, axisLine: { show: false }, axisLabel: { interval: 1, fontSize: 10 } }
          ],
          yAxis: [
            { type: "value", gridIndex: 0, min: 0, max: 30, interval: 10, axisLabel: { formatter: "{value}°" } },
            { type: "value", gridIndex: 0, name: "mm", max: 8, position: "right", splitLine: { show: false }, axisLabel: { show: false }, nameTextStyle: { color: "#818cf8" } },
            { type: "value", gridIndex: 0, name: "hPa", min: 1022, max: 1032, position: "right", splitLine: { show: false }, axisLabel: { color: "#7c3aed" }, nameTextStyle: { color: "#7c3aed" } },
            { type: "value", gridIndex: 1, show: false, min: 0, max: 1 }
          ],
          series: [
            { type: "bar", name: "Rain", xAxisIndex: 0, yAxisIndex: 1, data: rain.map(v => v || null), color: "#a5b4fc", barWidth: "60%", itemStyle: { borderRadius: [2, 2, 0, 0] }, label: { show: true, position: "top", fontSize: 9, color: "#818cf8", formatter: p => (p.value >= 1 ? p.value : "") } },
            { type: "line", name: "Pressure", xAxisIndex: 0, yAxisIndex: 2, data: press, smooth: true, color: "#7c3aed", lineStyle: { type: "dotted", width: 1.6 } },
            { type: "line", name: "Temperature", xAxisIndex: 0, yAxisIndex: 0, data: temp, smooth: true, color: "#f97316", lineStyle: { width: 2.5 }, z: 4,
              markLine: { symbol: "none", silent: true, lineStyle: { color: "#a1a1aa", type: "solid" }, label: { position: "end", formatter: p => p.name, fontSize: 10.5, fontWeight: 600, color: "#18181b" },
                data: midnights.map(i => ({ xAxis: i, name: new Date(T(i)).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) })) } },
            { type: "scatter", name: "Sky", xAxisIndex: 0, yAxisIndex: 0, data: icons.map((ic, i) => (ic ? { value: [i, temp[i] + 3], symbol: ICONS[ic] } : null)).filter(Boolean), symbolSize: 20, tooltip: { show: false }, z: 5, silent: true },
            { type: "scatter", name: "Wind", xAxisIndex: 1, yAxisIndex: 3, data: wind.map((w, i) => (i % 2 ? null : { value: [i, 0.5], symbolRotate: -(w.dir + 180) })).filter(Boolean), symbol: ARROW, symbolSize: [9, 20], color: "#52525b", silent: true, tooltip: { show: false } }
          ]
        }, 360);
      }
    }
  ]);

  AX.extend("charts", [
    {
      title: "Organisation Chart",
      level: 2,
      wide: true,
      desc: "A hierarchy as connected boxes: who reports to whom and how teams are grouped. Click a box with a count to collapse or expand its branch.",
      render(b) {
        const tree = { n: "Shareholders", lv: 0, kids: [{ n: "Board of Directors", lv: 0, kids: [{ n: "Amelia Ward", r: "CEO", lv: 1, kids: [
          { n: "Noah Patel", r: "CFO", lv: 2, kids: [{ n: "Finance", h: 14 }] },
          { n: "Grace Liu", r: "CTO", lv: 2, kids: [{ n: "Platform Engineering", h: 22 }, { n: "Data and Analytics", h: 11 }] },
          { n: "Oliver Hart", r: "COO", lv: 2, kids: [{ n: "Solutions", h: 9 }, { n: "Field Operations", h: 31 }] },
          { n: "Isla Romero", r: "CSO", lv: 2, kids: [{ n: "Sales", h: 12 }, { n: "Customer Support", h: 8 }] }] }] }] };
        const size = t => (t.kids || []).reduce((s, k) => s + 1 + size(k), 0);
        const head = t => (t.h || 0) + (t.kids || []).reduce((s, k) => s + head(k), 0);
        const style = [["#f4f4f5", "#18181b", "#e4e4e7"], ["#18181b", "#fff", "#18181b"], ["#4f46e5", "#fff", "#4f46e5"], ["#eef0ff", "#3730a3", "#c7d2fe"]];
        const node = t => {
          const [bg, fg, bd] = style[t.lv ?? 3], hasKids = t.kids && t.kids.length;
          return `<li><button type="button" class="ax-org__box" ${hasKids ? 'data-tog' : ""} title="${t.n}${t.r ? " (" + t.r + ")" : ""} \u00B7 ${head(t)} people" style="background:${bg};color:${fg};border-color:${bd}">
            ${t.r ? `<span style="font-size:10.5px;font-weight:700;opacity:.75;letter-spacing:.04em">${t.r}</span>` : ""}<span style="font-weight:${t.r ? 600 : 500}">${t.n}</span>
            ${t.h ? `<span style="font-size:10.5px;opacity:.7">${t.h} people</span>` : ""}${hasKids ? `<span class="ax-org__count" hidden>+${size(t)}</span>` : ""}</button>
            ${hasKids ? `<ul>${t.kids.map(node).join("")}</ul>` : ""}</li>`;
        };
        b.innerHTML = `<style>
          .ax-org { overflow-x: auto; padding: 4px 0 8px; }
          .ax-org ul { display: flex; justify-content: center; margin: 0; padding: 22px 0 0; position: relative; list-style: none; }
          .ax-org > ul { padding-top: 0; min-width: max-content; }
          .ax-org li { position: relative; padding: 22px 5px 0; display: flex; flex-direction: column; align-items: center; }
          .ax-org li::before, .ax-org li::after { content: ""; position: absolute; top: 0; right: 50%; width: 50%; height: 22px; border-top: 1.5px solid #d4d4d8; }
          .ax-org li::after { right: auto; left: 50%; border-left: 1.5px solid #d4d4d8; }
          .ax-org li:only-child::before, .ax-org li:only-child::after { border-top: 0; }
          .ax-org li:only-child::before { display: none; }
          .ax-org li:first-child::before, .ax-org li:last-child::after { border: 0; }
          .ax-org li:last-child::before { border-right: 1.5px solid #d4d4d8; border-radius: 0 7px 0 0; }
          .ax-org li:first-child::after { border-radius: 7px 0 0 0; }
          .ax-org > ul > li { padding-top: 0; }
          .ax-org > ul > li::before, .ax-org > ul > li::after { display: none; }
          .ax-org ul ul::before { content: ""; position: absolute; top: 0; left: 50%; height: 22px; border-left: 1.5px solid #d4d4d8; }
          .ax-org__box { position: relative; display: flex; flex-direction: column; gap: 1px; align-items: center; justify-content: center; min-width: 132px; min-height: 48px; padding: 7px 12px;
            border: 1px solid; border-radius: 9px; font: inherit; font-size: 12px; line-height: 1.3; cursor: default; box-shadow: var(--shadow-xs); transition: transform .15s var(--ease), box-shadow .15s; }
          .ax-org__box[data-tog] { cursor: pointer; }
          .ax-org__box:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(24,24,27,.1); }
          .ax-org__count { position: absolute; bottom: -9px; left: 50%; transform: translateX(-50%); background: #fff; color: var(--ink-2); border: 1px solid var(--line-2); border-radius: 99px; font-size: 10.5px; font-weight: 600; padding: 0 6px; }
          .ax-org li.is-closed > ul { display: none; }
        </style><div class="ax-org"><ul>${node(tree)}</ul></div>`;
        b.addEventListener("click", e => {
          const btn = e.target.closest("[data-tog]");
          if (!btn) return;
          const li = btn.parentElement, closed = li.classList.toggle("is-closed");
          btn.querySelector(".ax-org__count").hidden = !closed;
        });
      }
    }
  ]);

  AX.extend("widgets", [
    {
      title: "VU Meter",
      level: 3,
      wide: true,
      desc: "Left and right levels on classic VU needles with smooth ballistics and a red zone above 0 VU. Test it with your microphone, or simulate a signal.",
      render(b) {
        b.innerHTML = `
          <div class="ax-ctl"><button class="ax-btn" data-mic>Use microphone</button><button class="ax-btn" data-sim>Simulate signal</button><button class="ax-btn" data-stop disabled>Stop</button>
            <span class="ax-small" data-status style="color:var(--ink-3)">Off. Sound is only measured in your browser, never recorded or sent anywhere.</span></div>
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;background:linear-gradient(#fffdf6,#fdf6dc);border:1px solid #efe6c4;border-radius:12px;padding:14px" data-meters></div>`;
        const meters = b.querySelector("[data-meters]"), status = b.querySelector("[data-status]");
        const minVU = -20, maxVU = 3, A0 = -50, A1 = 50, cx = 160, cy = 175, R = 130;
        const ang = vu => A0 + ((Math.max(minVU, Math.min(maxVU, vu)) - minVU) / (maxVU - minVU)) * (A1 - A0);
        const pol = (a, rr) => [cx + rr * Math.sin((a * Math.PI) / 180), cy - rr * Math.cos((a * Math.PI) / 180)];
        const meterSVG = label => {
          const ticks = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3];
          const arc = (a0, a1, rr) => { const [x0, y0] = pol(a0, rr), [x1, y1] = pol(a1, rr); return `M${x0} ${y0} A${rr} ${rr} 0 0 1 ${x1} ${y1}`; };
          return `<div style="text-align:center"><svg viewBox="0 0 320 200" width="320" height="200" style="font-family:var(--font)">
            <path d="${arc(A0, ang(0), R)}" fill="none" stroke="#18181b" stroke-width="1.5"/>
            <path d="${arc(ang(0), A1, R)}" fill="none" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
            ${ticks.map(v => { const a = ang(v), [x0, y0] = pol(a, R), [x1, y1] = pol(a, R + (v % 5 === 0 || v === -3 ? 12 : 7)), [tx, ty] = pol(a, R + 24);
              return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${v > 0 ? "#ef4444" : "#18181b"}" stroke-width="1.5"/>${[-20, -10, -5, -3, 0, 3].includes(v) ? `<text x="${tx}" y="${ty + 4}" text-anchor="middle" font-size="11" fill="${v > 0 ? "#ef4444" : "#52525b"}">${v > 0 ? "+" + v : v}</text>` : ""}`; }).join("")}
            <text x="${cx}" y="120" text-anchor="middle" font-size="18" font-weight="700" fill="#18181b">VU</text>
            <text x="${cx}" y="138" text-anchor="middle" font-size="11" fill="#71717a">${label}</text>
            <line data-needle x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - R - 6}" stroke="#18181b" stroke-width="1.8" stroke-linecap="round" transform="rotate(${A0} ${cx} ${cy})"/>
            <circle cx="${cx}" cy="${cy}" r="7" fill="#18181b"/>
            <circle data-peak cx="290" cy="40" r="5" fill="#fecaca"/></svg>
            <div class="ax-small" style="margin-top:-4px"><span style="color:var(--ink-3)">${label}</span> <strong data-read style="font-variant-numeric:tabular-nums">-</strong></div></div>`;
        };
        meters.innerHTML = meterSVG("Left") + meterSVG("Right");
        const needles = [...meters.querySelectorAll("[data-needle]")], peaks = [...meters.querySelectorAll("[data-peak]")], reads = [...meters.querySelectorAll("[data-read]")];
        let source = null, raf = 0, ctx = null, stream = null, analysers = [], shown = [minVU, minVU], t0 = 0;
        const btn = k => b.querySelector(`[data-${k}]`);
        const setButtons = on => { btn("mic").disabled = on; btn("sim").disabled = on; btn("stop").disabled = !on; };
        const target = ch => {
          if (source === "sim") {
            const t = (performance.now() - t0) / 1000, beat = Math.max(0, Math.sin(t * 4.2 + ch)) ** 3;
            return -12 + 9 * Math.sin(t * 0.7 + ch * 0.4) + 7 * beat + (Math.random() - 0.5) * 2;
          }
          const a = analysers[ch] || analysers[0], buf = new Float32Array(a.fftSize);
          a.getFloatTimeDomainData(buf);
          const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
          return 20 * Math.log10(Math.max(rms, 1e-6)) + 18; // 0 VU at -18 dBFS
        };
        const tick = () => {
          [0, 1].forEach(ch => {
            const v = target(ch);
            shown[ch] += (v - shown[ch]) * 0.12; // ~300 ms VU ballistics at 60 fps
            needles[ch].setAttribute("transform", `rotate(${ang(shown[ch])} ${cx} ${cy})`);
            peaks[ch].setAttribute("fill", shown[ch] > 0 ? "#ef4444" : "#fecaca");
            reads[ch].textContent = `${shown[ch] > 0 ? "+" : ""}${Math.max(minVU, shown[ch]).toFixed(1)} VU`;
          });
          raf = b.isConnected ? requestAnimationFrame(tick) : 0;
        };
        const stop = () => {
          cancelAnimationFrame(raf); raf = 0; source = null;
          if (stream) stream.getTracks().forEach(t => t.stop());
          if (ctx) ctx.close();
          stream = ctx = null; analysers = [];
          shown = [minVU, minVU];
          needles.forEach(nd => nd.setAttribute("transform", `rotate(${A0} ${cx} ${cy})`));
          peaks.forEach(p => p.setAttribute("fill", "#fecaca"));
          reads.forEach(rd => { rd.textContent = "-"; });
          status.textContent = "Off. Sound is only measured in your browser, never recorded or sent anywhere.";
          setButtons(false);
        };
        btn("sim").addEventListener("click", () => { source = "sim"; t0 = performance.now(); setButtons(true); status.textContent = "Simulated programme signal"; tick(); });
        btn("mic").addEventListener("click", async () => {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            const src = ctx.createMediaStreamSource(stream), split = ctx.createChannelSplitter(2);
            src.connect(split);
            analysers = [0, 1].map(i => { const a = ctx.createAnalyser(); a.fftSize = 2048; split.connect(a, i); return a; });
            if (src.channelCount < 2) analysers[1] = analysers[0];
            source = "mic"; setButtons(true);
            status.textContent = "Listening to your microphone. Nothing is recorded or sent.";
            tick();
          } catch (err) {
            status.textContent = `Microphone unavailable (${err.name || "blocked"}). Try Simulate signal instead.`;
          }
        });
        btn("stop").addEventListener("click", stop);
      }
    }
  ]);
})();
