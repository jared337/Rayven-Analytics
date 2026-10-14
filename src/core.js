/* ==========================================================================
 * Core: data, formatting, helpers, section registry and gallery rendering.
 * Every example card calls into AX / D / F, so sections stay short.
 * ========================================================================== */

/* Demo mode: Rayven helper calls (pushPayload, updateDataToTable, ...) are
 * shown as toasts instead of being executed. Set to false inside Rayven to
 * let the examples call the real functions. */
const AX_DEMO = true;

/* --------------------------------------------------------------------------
 * Formatting
 * -------------------------------------------------------------------------- */
const F = {
  num(v, d = 0) {
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  },
  compact(v) {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (a >= 1e3) return (v / 1e3).toFixed(1) + "k";
    return String(Math.round(v * 10) / 10);
  },
  pad: n => String(n).padStart(2, "0"),
  time(ms) { const d = new Date(ms); return `${F.pad(d.getHours())}:${F.pad(d.getMinutes())}`; },
  date(ms) { return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" }); },
  dateTime(ms) { return `${F.date(ms)} ${F.time(ms)}`; },
  iso(ms) { const d = new Date(ms); return `${d.getFullYear()}-${F.pad(d.getMonth() + 1)}-${F.pad(d.getDate())}`; },
  esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
};

/* --------------------------------------------------------------------------
 * Demo data (deterministic, so every reload looks the same)
 * -------------------------------------------------------------------------- */
const D = (() => {
  function rng(seed = 1) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }

  const r = rng(42);
  const pick = (arr, rand = r) => arr[Math.floor(rand() * arr.length)];
  const int = (min, max, rand = r) => Math.floor(min + rand() * (max - min + 1));
  const HOUR = 3600e3, DAY = 864e5;

  const sites = [
    { id: "SYD", name: "Sydney Plant",     region: "NSW", lat: -33.87, lng: 151.21 },
    { id: "NEW", name: "Newcastle Port",   region: "NSW", lat: -32.93, lng: 151.78 },
    { id: "MEL", name: "Melbourne Depot",  region: "VIC", lat: -37.81, lng: 144.96 },
    { id: "GEE", name: "Geelong Works",    region: "VIC", lat: -38.15, lng: 144.36 },
    { id: "BNE", name: "Brisbane Hub",     region: "QLD", lat: -27.47, lng: 153.03 },
    { id: "TSV", name: "Townsville Yard",  region: "QLD", lat: -19.26, lng: 146.82 },
    { id: "PER", name: "Perth Terminal",   region: "WA",  lat: -31.95, lng: 115.86 },
    { id: "ADL", name: "Adelaide Works",   region: "SA",  lat: -34.93, lng: 138.60 }
  ];

  const types = ["Chiller", "Pump", "Compressor", "Meter", "Sensor Hub", "Boiler"];
  const statuses = ["Online", "Online", "Online", "Online", "Warning", "Offline"];

  const devices = Array.from({ length: 60 }, (_, i) => {
    const site = sites[i % sites.length];
    const type = types[(i * 5) % types.length];
    const status = pick(statuses);
    return {
      id: "DEV-" + (1001 + i),
      name: `${type} ${Math.floor(i / types.length) + 1}`,
      type,
      site: site.name,
      siteId: site.id,
      region: site.region,
      status,
      temp: +(16 + r() * 18).toFixed(1),
      humidity: int(30, 75),
      power: +(2 + r() * 40).toFixed(1),
      battery: int(8, 100),
      uptime: +(status === "Offline" ? 70 + r() * 20 : 95 + r() * 5).toFixed(2),
      alerts: status === "Online" ? int(0, 1) : int(1, 6),
      lat: site.lat + (r() - 0.5) * 0.25,
      lng: site.lng + (r() - 0.5) * 0.25,
      installed: Date.now() - int(30, 1500) * DAY,
      lastSeen: status === "Offline" ? int(60, 900) : int(1, 15),
      firmware: pick(["2.1.0", "2.3.4", "2.4.1"])
    };
  });

  /* Random walk: realistic sensor drift */
  function walk(n, { base = 50, vol = 2, min = -Infinity, max = Infinity, seed = 7 } = {}) {
    const rand = rng(seed);
    let v = base;
    return Array.from({ length: n }, () => {
      v += (rand() - 0.5) * vol * 2 + (base - v) * 0.05;
      v = Math.min(max, Math.max(min, v));
      return +v.toFixed(2);
    });
  }

  /* Periodic wave with noise: daily cycles */
  function wave(n, { base = 50, amp = 10, period = 24, noise = 2, seed = 3, phase = 0 } = {}) {
    const rand = rng(seed);
    return Array.from({ length: n }, (_, i) =>
      +(base + amp * Math.sin((2 * Math.PI * (i + phase)) / period) + (rand() - 0.5) * noise * 2).toFixed(2));
  }

  /* Timestamped series ending now: [[ms, value], ...] */
  function ts(n, step = HOUR, values, end = Date.now()) {
    const start = Math.floor(end / step) * step - (n - 1) * step;
    return values.map((v, i) => [start + i * step, v]);
  }

  return {
    rng, pick, int, sites, types, devices, walk, wave, ts, HOUR, DAY,
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    hours: Array.from({ length: 24 }, (_, i) => F.pad(i) + ":00")
  };
})();

/* --------------------------------------------------------------------------
 * AX: UI helpers + registry
 * -------------------------------------------------------------------------- */
const AX = (() => {
  /* Restrained, indigo-led palette (matches Place Performance): the first
   * series is always the accent, then indigo tints, teal and neutrals.
   * Green, amber and red are reserved for status. */
  const PALETTE = ["#4f46e5", "#a5b4fc", "#0d9488", "#a1a1aa", "#6366f1", "#5eead4", "#d4d4d8", "#312e81", "#c7d2fe", "#71717a"];
  const STATUS_COLOR = { Online: "#10b981", Warning: "#f59e0b", Offline: "#ef4444" };
  const LEVELS = { 1: "Simple", 2: "Intermediate", 3: "Advanced" };

  /* Outline icons (Lucide geometry) */
  const ICONS = {
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    barChart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    lineChart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>',
    map: '<path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.66-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9L8.1 3.45a2 2 0 0 1 1.8 0z"/><path d="M15 5.76v15"/><path d="M9 3.24v15"/>',
    table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M12 3v18"/>',
    pie: '<path d="M21 12c.55 0 1-.45.95-1a10 10 0 0 0-8.95-8.95c-.55-.05-1 .4-1 .95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
    info: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>',
    mining: '<path d="M14.53 12.47 6.62 20.38a1 1 0 1 1-3-3l7.91-7.91"/><path d="M15.69 4.31A12.5 12.5 0 0 0 5.46 2.96a1 1 0 0 0 .12 1.75 22 22 0 0 1 6.32 3.39"/><path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/><path d="M19.69 8.31a12.5 12.5 0 0 1 1.35 10.23 1 1 0 0 1-1.75-.12 22 22 0 0 0-3.39-6.32"/>',
    energy: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    water: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    asset: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
  };
  const icon = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  const SECTIONS = [
    { id: "widgets",    label: "Assorted Widgets", icon: "gauge",     subtitle: "Single-value, status and control widgets, from a plain KPI to a drill-down asset card" },
    { id: "charts",     label: "Assorted Charts",  icon: "barChart",  subtitle: "Every major chart family, from a basic line to cross-filtered and configurable charts" },
    { id: "timeseries", label: "Time Series",      icon: "lineChart", subtitle: "Time-based data with ranges, zoom, aggregation, annotations, streaming and comparison" },
    { id: "maps",       label: "Maps",             icon: "map",       subtitle: "Location data, from a single marker to clustered, filtered, live and indoor maps" },
    { id: "tables",     label: "Tables",           icon: "table",     subtitle: "Tabular data, from a static list to a full data grid with editing and export" },
    { id: "barpie",     label: "Bar + Pie Charts", icon: "pie",       subtitle: "Categorical comparisons and part-to-whole, including drill-down and linked views" },
    { id: "extra",      label: "Extra Items",      icon: "info",      subtitle: "Supporting UI: notices, forms, timelines, calendars, boards and control builders" },
    { id: "mining",     label: "Mining",           icon: "mining",    group: "Industries", subtitle: "Production against plan, time usage, fleet and haul cycles, environmental compliance and geotechnical TARPs" },
    { id: "energy",     label: "Energy",           icon: "energy",    group: "Industries", subtitle: "Interval demand, tariffs, generation and storage, power quality, emissions and single-line diagrams" },
    { id: "water",      label: "Water",            icon: "water",     group: "Industries", subtitle: "Storage, pumping, water quality compliance, leakage, network pressure and live process mimics" },
    { id: "assets",     label: "Asset Management", icon: "asset",     group: "Industries", subtitle: "Condition, risk, remaining life, maintenance performance, renewals and condition monitoring" }
  ];

  const registry = {};
  const state = { section: null, level: 0, query: "" };
  let observer;

  /* ---------- ECharts theme ---------- */
  function registerTheme() {
    const axis = {
      axisLine: { lineStyle: { color: "#e0e0e5" } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 10.5, margin: 10 },
      splitLine: { lineStyle: { color: "#f0f0f2" } },
      nameTextStyle: { color: "#a1a1aa", fontSize: 10.5 }
    };
    echarts.registerTheme("rayven", {
      color: PALETTE,
      backgroundColor: "transparent",
      textStyle: { fontFamily: "Inter, -apple-system, Segoe UI, sans-serif", color: "#18181b" },
      title: { textStyle: { color: "#18181b", fontWeight: 600 } },
      categoryAxis: { ...axis, splitLine: { show: false } },
      valueAxis: { ...axis, axisLine: { show: false } },
      timeAxis: { ...axis, splitLine: { show: false } },
      logAxis: axis,
      legend: { textStyle: { color: "#52525b", fontSize: 12 }, itemWidth: 8, itemHeight: 8, itemGap: 16, icon: "circle" },
      tooltip: {
        backgroundColor: "#18181b", borderWidth: 0, padding: [8, 10],
        textStyle: { color: "#fafafa", fontSize: 12 },
        extraCssText: "border-radius:9px;box-shadow:0 12px 40px rgba(24,24,27,.14),0 2px 6px rgba(24,24,27,.06);",
        axisPointer: { lineStyle: { color: "#d4d4d8" }, crossStyle: { color: "#d4d4d8" }, shadowStyle: { color: "rgba(79,70,229,.05)" } }
      },
      line: { symbol: "circle", symbolSize: 6, showSymbol: false, lineStyle: { width: 2.2, cap: "round", join: "round" }, emphasis: { scale: 1.4 } },
      bar: { barMaxWidth: 28, itemStyle: { borderRadius: [4, 4, 0, 0] } },
      pie: { itemStyle: { borderColor: "#fff", borderWidth: 2 } },
      scatter: { itemStyle: { opacity: 0.8 } },
      gauge: { title: { color: "#a1a1aa" }, detail: { color: "#18181b" } },
      visualMap: { textStyle: { color: "#71717a", fontSize: 11 } },
      dataZoom: {
        borderColor: "#e0e0e5", fillerColor: "rgba(79,70,229,.08)", backgroundColor: "#fafafa",
        handleStyle: { color: "#fff", borderColor: "#a5b4fc" }, moveHandleStyle: { color: "#c7d2fe" },
        dataBackground: { lineStyle: { color: "#d4d4d8" }, areaStyle: { color: "#f0f0f2" } },
        selectedDataBackground: { lineStyle: { color: "#a5b4fc" }, areaStyle: { color: "#eef0ff" } },
        textStyle: { color: "#a1a1aa", fontSize: 10.5 }, brushSelect: false
      },
      animationDuration: 900,
      animationEasing: "cubicOut"
    });
  }

  /* Soft vertical gradient for area fills, in the series colour */
  const fade = (hex, a = 0.22) => {
    const n = parseInt(hex.slice(1), 16), rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `rgba(${rgb},${a})` }, { offset: 1, color: `rgba(${rgb},0)` }]);
  };

  /* ---------- DOM helpers ---------- */
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function add(parent, html) {
    const node = el(html);
    parent.appendChild(node);
    return node;
  }

  /* Swap flat area fills for a soft gradient in the series colour */
  function polish(option) {
    (Array.isArray(option.series) ? option.series : []).forEach((s, i) => {
      if (!s || !s.areaStyle || s.areaStyle.color) return;
      const c = s.color || s.itemStyle?.color || s.lineStyle?.color || PALETTE[i % PALETTE.length];
      if (typeof c !== "string" || c[0] !== "#") return;
      s.areaStyle = { ...s.areaStyle, color: fade(c, s.stack ? 0.5 : 0.22), opacity: 1 };
    });
    return option;
  }

  /* Create a chart inside `parent`. Height in px. Adds sensible grid defaults. */
  function chart(parent, option, height = 240) {
    const box = add(parent, `<div class="ax-chart" style="height:${height}px"></div>`);
    const inst = echarts.init(box, "rayven", { renderer: "canvas" });
    const hasAxes = option.xAxis || option.yAxis;
    if (hasAxes && !option.grid) {
      option.grid = { left: 4, right: 12, top: option.legend ? 36 : 14, bottom: option.dataZoom ? 46 : 4, containLabel: true };
    }
    if (option.tooltip === undefined) option.tooltip = { trigger: hasAxes ? "axis" : "item" };
    const set = inst.setOption.bind(inst);
    inst.setOption = (o, ...rest) => set(polish(o), ...rest);
    inst.setOption(option);
    new ResizeObserver(() => { if (box.offsetWidth) inst.resize(); }).observe(box);
    return inst;
  }

  /* Leaflet map inside `parent`. All basemaps are keyless; swap URLs here for a licensed provider in production. */
  const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/";
  const TILES = {
    light: [ESRI + "Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", "Tiles &copy; Esri", 16],
    dark: [ESRI + "Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", "Tiles &copy; Esri", 16],
    street: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png", "&copy; OpenStreetMap contributors", 19],
    topo: ["https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", "&copy; OpenStreetMap, &copy; OpenTopoMap", 17],
    satellite: [ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}", "Tiles &copy; Esri", 18]
  };

  function tiles(name = "light") {
    const [url, attribution, maxNativeZoom] = TILES[name];
    return L.tileLayer(url, { attribution, maxNativeZoom, maxZoom: 19 });
  }

  function map(parent, { height = 300, center, zoom = 4, base = "light", options = {} } = {}) {
    const box = add(parent, `<div class="ax-map" style="height:${height}px"></div>`);
    const m = L.map(box, { scrollWheelZoom: false, ...options });

    // Remember the last view set in code so it can be re-applied once the card has
    // its final size. Stops maps opening off-centre; never overrides the user's own panning.
    let lastView = null, userMoved = false;
    ["setView", "fitBounds"].forEach(name => {
      const orig = m[name].bind(m);
      m[name] = (...args) => { if (!userMoved) lastView = [orig, args]; return orig(...args); };
    });
    box.addEventListener("pointerdown", () => { userMoved = true; });
    box.addEventListener("wheel", () => { userMoved = true; }, { passive: true });

    if (center) m.setView(center, zoom);
    else m.fitBounds(D.sites.map(s => [s.lat, s.lng]), { padding: [28, 28] });
    if (base) tiles(base).addTo(m);

    // Skip while hidden (other section showing): layers like the heatmap fail on a 0-width canvas
    new ResizeObserver(() => {
      if (!box.offsetWidth) return;
      m.invalidateSize();
      if (!userMoved && lastView) lastView[0](...lastView[1]);
    }).observe(box);
    return m;
  }

  function dot(color, size = 14) {
    return L.divIcon({
      className: "",
      html: `<span class="ax-mk" style="--c:${color};width:${size}px;height:${size}px"></span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  /* Run `fn` every `ms`, but only while `node` is on screen. */
  function every(ms, fn, node) {
    const id = setInterval(() => {
      if (!node.isConnected) return clearInterval(id);
      if (document.hidden || node.offsetParent === null) return;
      fn();
    }, ms);
    return id;
  }

  function toast(msg, type = "") {
    const box = document.getElementById("ax-toasts");
    const t = add(box, `<div class="ax-toast ${type ? "ax-toast--" + type : ""}">${icon(type === "bad" ? "alert" : type === "good" ? "check" : "bell")}<span></span></div>`);
    t.querySelector("span").textContent = msg;
    setTimeout(() => { t.style.transition = "opacity .2s"; t.style.opacity = 0; setTimeout(() => t.remove(), 200); }, 3600);
  }

  function modal({ title, body, confirm = "Confirm", cancel = "Cancel" }) {
    return new Promise(resolve => {
      const bg = add(document.body, `
        <div class="ax-modal-backdrop" role="dialog" aria-modal="true">
          <div class="ax-modal">
            <div class="ax-modal__b">
              <h4>${F.esc(title)}</h4>
              <div style="font-size:13px;color:var(--ink-2);line-height:1.55">${body}</div>
            </div>
            <div class="ax-modal__f">
              ${cancel ? `<button class="ax-btn" data-v="0">${cancel}</button>` : ""}
              <button class="ax-btn ax-btn--primary" data-v="1">${confirm}</button>
            </div>
          </div>
        </div>`);
      const close = v => { document.removeEventListener("keydown", onKey); bg.remove(); resolve(v); };
      const onKey = e => { if (e.key === "Escape") close(false); };
      document.addEventListener("keydown", onKey);
      bg.addEventListener("click", e => {
        if (e.target === bg) close(false);
        if (e.target.dataset.v) close(e.target.dataset.v === "1");
      });
      bg.querySelector(".ax-btn--primary").focus();
    });
  }

  /* Call a Rayven helper function, or show what would be called in demo mode. */
  function rv(name, ...args) {
    if (!AX_DEMO && typeof window[name] === "function") return window[name](...args);
    const shown = args.map(a => (typeof a === "string" ? `"${a}"` : JSON.stringify(a))).join(", ");
    toast(`Demo: ${name}(${shown.length > 180 ? shown.slice(0, 180) + "..." : shown})`);
  }

  function download(filename, text, type = "text/csv") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = add(document.body, `<a href="${url}" download="${filename}" hidden></a>`);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function csv(rows, cols) {
    const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [cols.map(c => cell(c.label || c.key)).join(",")]
      .concat(rows.map(r => cols.map(c => cell(r[c.key])).join(",")))
      .join("\n");
  }

  function seg(options, active, cls = "") {
    return `<div class="ax-seg ${cls}">${options.map(([v, label]) =>
      `<button type="button" data-v="${v}" class="${String(v) === String(active) ? "is-active" : ""}">${label}</button>`).join("")}</div>`;
  }

  /* Wire a .ax-seg group; calls fn(value) and maintains active state. */
  function onSeg(root, fn) {
    root.addEventListener("click", e => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      root.querySelectorAll("button").forEach(x => x.classList.toggle("is-active", x === b));
      fn(b.dataset.v);
    });
  }

  function pill(status) {
    return `<span class="ax-pill ax-pill--${String(status).toLowerCase()}">${status}</span>`;
  }

  /* ---------- Registry + gallery ---------- */
  function section(id, examples) {
    registry[id] = examples;
  }

  /* Append components to an existing section, then keep the simple-to-advanced order */
  function extend(id, examples) {
    registry[id] = (registry[id] || []).concat(examples).map((ex, i) => [ex, i])
      .sort((a, b) => a[0].level - b[0].level || a[1] - b[1]).map(x => x[0]);
  }

  function buildCard(ex, i) {
    const card = el(`
      <article class="ax-ex${ex.wide ? " ax-ex--wide" : ""}" data-level="${ex.level}">
        <header class="ax-ex__head">
          <span class="ax-ex__num">${i + 1}</span>
          <div class="ax-ex__titles">
            <h3>${ex.title}</h3>
            <p class="ax-ex__desc">${ex.desc}</p>
          </div>
          <span class="ax-lvl ax-lvl--${ex.level}" title="Complexity: ${LEVELS[ex.level]}"><span class="ax-lvl__bars"><i></i><i></i><i></i></span>${LEVELS[ex.level]}</span>
        </header>
        <div class="ax-ex__body"></div>
      </article>`);
    card._ex = ex;
    card._search = `${ex.title} ${ex.desc} ${LEVELS[ex.level]}`.toLowerCase();
    return card;
  }

  function renderCard(card) {
    if (card._rendered) return;
    card._rendered = true;
    const body = card.querySelector(".ax-ex__body");
    body.classList.add("is-in");
    try {
      card._ex.render(body);
    } catch (err) {
      console.error(card._ex.title, err);
      body.innerHTML = `<div class="ax-empty">This example failed to render: ${F.esc(err.message)}</div>`;
    }
  }

  /* Level filter with live counts for the current section and search */
  function renderLevels() {
    const list = (registry[state.section] || []).filter(ex => !state.query || `${ex.title} ${ex.desc} ${LEVELS[ex.level]}`.toLowerCase().includes(state.query));
    const count = l => list.filter(ex => !l || ex.level === l).length;
    document.getElementById("ax-level").innerHTML = [[0, "All"], [1, "Simple"], [2, "Intermediate"], [3, "Advanced"]]
      .map(([v, label]) => `<button type="button" data-v="${v}" class="${v === state.level ? "is-active" : ""}">${label}<span class="n">${count(v)}</span></button>`).join("");
  }

  function applyFilter() {
    const sec = document.querySelector(`.ax-section[data-section="${state.section}"]`);
    if (!sec) return;
    let shown = 0;
    sec.querySelectorAll(".ax-ex").forEach(card => {
      const ok = (!state.level || card._ex.level === state.level) && (!state.query || card._search.includes(state.query));
      card.hidden = !ok;
      if (ok) shown++;
    });
    sec.querySelector(".ax-empty").hidden = shown > 0;
    renderLevels();
  }

  function show(id) {
    const meta = SECTIONS.find(s => s.id === id) || SECTIONS[0];
    state.section = meta.id;

    document.querySelectorAll(".ax-nav__item").forEach(b => {
      const on = b.dataset.target === meta.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-current", on ? "page" : "false");
    });
    document.querySelectorAll(".ax-section").forEach(s => s.classList.toggle("is-active", s.dataset.section === meta.id));
    document.getElementById("ax-title").textContent = meta.label;
    document.getElementById("ax-subtitle").textContent = meta.subtitle;
    document.getElementById("ax-crumb").textContent = meta.label;
    document.getElementById("ax-search").placeholder = `Search ${meta.label.toLowerCase()}`;
    document.getElementById("ax-main").scrollTop = 0;
    applyFilter();

    if (typeof setHTMLNodeGData === "function") setHTMLNodeGData("axSection", meta.id);
  }

  function start() {
    registerTheme();
    // Brand-consistent default marker in place of Leaflet's stock blue pin
    if (typeof L !== "undefined") L.Marker.prototype.options.icon = dot("#4f46e5", 16);

    const nav = document.getElementById("ax-nav");
    const host = document.getElementById("ax-sections");
    observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { renderCard(e.target); observer.unobserve(e.target); } });
    }, { root: document.getElementById("ax-main"), rootMargin: "300px 0px" });

    let group = "Components";
    SECTIONS.forEach(meta => {
      const examples = registry[meta.id] || [];
      if ((meta.group || "Components") !== group) {
        group = meta.group;
        add(nav, `<div class="ax-nav-sec">${group}</div>`);
      }
      const btn = add(nav, `
        <button type="button" class="ax-nav__item" data-target="${meta.id}">
          ${icon(meta.icon)}
          <span>${meta.label}</span>
          <span class="ax-nav__count">${examples.length}</span>
        </button>`);
      btn.addEventListener("click", () => show(meta.id));

      const sec = add(host, `<section class="ax-section" data-section="${meta.id}"><div class="ax-gallery"></div><div class="ax-empty" hidden>No components match your filters.</div></section>`);
      const gallery = sec.querySelector(".ax-gallery");
      examples.forEach((ex, i) => {
        const card = buildCard(ex, i);
        gallery.appendChild(card);
        observer.observe(card);
      });
    });

    const total = SECTIONS.reduce((a, s) => a + (registry[s.id] || []).length, 0);
    document.getElementById("ax-total").textContent = `${total} components across ${SECTIONS.length} categories`;

    onSeg(document.getElementById("ax-level"), v => { state.level = +v; applyFilter(); });
    const search = document.getElementById("ax-search");
    search.addEventListener("input", () => { state.query = search.value.trim().toLowerCase(); applyFilter(); });
    search.addEventListener("keydown", e => { if (e.key === "Escape") { search.value = ""; search.dispatchEvent(new Event("input")); search.blur(); } });
    document.addEventListener("keydown", e => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
    });

    const saved = typeof getHTMLNodeGData === "function" ? getHTMLNodeGData("axSection") : null;
    show(saved || SECTIONS[0].id);
  }

  return {
    PALETTE, STATUS_COLOR, section, extend, start, el, add, chart, map, tiles, dot, every,
    toast, modal, rv, download, csv, seg, onSeg, pill, icon, fade, renderCard
  };
})();
