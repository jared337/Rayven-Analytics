/* ==========================================================================
 * Tables: 20 examples, simple to advanced
 * ========================================================================== */
(() => {
  const COLS = {
    id: { key: "id", label: "Device" },
    name: { key: "name", label: "Name" },
    type: { key: "type", label: "Type" },
    site: { key: "site", label: "Site" },
    region: { key: "region", label: "Region" },
    status: { key: "status", label: "Status", fmt: v => AX.pill(v) },
    temp: { key: "temp", label: "Temp °C", num: true, fmt: v => F.num(v, 1) },
    humidity: { key: "humidity", label: "Humidity %", num: true },
    power: { key: "power", label: "Power kW", num: true, fmt: v => F.num(v, 1) },
    battery: { key: "battery", label: "Battery %", num: true },
    uptime: { key: "uptime", label: "Uptime %", num: true, fmt: v => F.num(v, 2) },
    alerts: { key: "alerts", label: "Alerts", num: true },
    lastSeen: { key: "lastSeen", label: "Last seen", num: true, fmt: v => (v >= 60 ? `${Math.floor(v / 60)} h ago` : `${v} min ago`) }
  };
  const cols = (...keys) => keys.map(k => COLS[k]);

  const cell = (c, r) => (c.fmt ? c.fmt(r[c.key], r) : F.esc(r[c.key]));
  const sortRows = (rows, key, dir) => [...rows].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * dir);

  /* Basic table markup. opts: cls, sort {key, dir}, wrapStyle, rowAttr(r, i), lead(r)/leadHead (extra first column), foot (html) */
  function table(rows, columns, o = {}) {
    const th = columns.map(c => `<th data-key="${c.key}" class="${c.num ? "num" : ""} ${o.sort ? "is-sortable" : ""}" ${o.sort ? `aria-sort="${o.sort.key === c.key ? (o.sort.dir > 0 ? "ascending" : "descending") : "none"}"` : ""} scope="col">${c.label}</th>`).join("");
    const body = rows.length
      ? rows.map((r, i) => `<tr ${o.rowAttr ? o.rowAttr(r, i) : ""}>${o.lead ? `<td>${o.lead(r, i)}</td>` : ""}${columns.map(c => `<td class="${c.num ? "num" : ""}" ${c.style ? `style="${c.style(r[c.key], r)}"` : ""}>${cell(c, r)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${columns.length + (o.lead ? 1 : 0)}" class="ax-empty">No matching rows</td></tr>`;
    return `<div class="ax-table-wrap" style="${o.wrapStyle || ""}"><table class="ax-table ax-table--hover ${o.cls || ""}"><thead><tr>${o.lead ? `<th>${o.leadHead || ""}</th>` : ""}${th}</tr></thead><tbody>${body}</tbody>${o.foot || ""}</table></div>`;
  }

  /* Wire sortable headers in `root`: calls back with the new sort state */
  function onSort(root, sort, redraw) {
    root.addEventListener("click", e => {
      const th = e.target.closest("th.is-sortable");
      if (!th) return;
      sort.dir = sort.key === th.dataset.key ? -sort.dir : 1;
      sort.key = th.dataset.key;
      redraw();
    });
  }

  const sparkline = (vals, color = "#4f46e5", w = 90, h = 24) => {
    const lo = Math.min(...vals), hi = Math.max(...vals), sx = w / (vals.length - 1);
    const pts = vals.map((v, i) => `${(i * sx).toFixed(1)},${(h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`).join(" ");
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6"/></svg>`;
  };

  const siteSummary = () => D.sites.map(s => {
    const devs = D.devices.filter(d => d.site === s.name);
    return { site: s.name, region: s.region, devices: devs.length, power: +devs.reduce((a, d) => a + d.power, 0).toFixed(1), alerts: devs.reduce((a, d) => a + d.alerts, 0), uptime: +(devs.reduce((a, d) => a + d.uptime, 0) / devs.length).toFixed(2) };
  });

  AX.section("tables", [
    {
      title: "Basic Table",
      level: 1,
      desc: "A plain list of records with a header row. Good for small, fixed sets of data.",
      render(b) {
        b.innerHTML = table(D.sites, [{ key: "id", label: "Code" }, { key: "name", label: "Site" }, { key: "region", label: "Region" }, { key: "lat", label: "Lat", num: true }, { key: "lng", label: "Lng", num: true }]);
      }
    },
    {
      title: "Striped and Compact",
      level: 1,
      desc: "Toggle zebra stripes and compact row height to fit more data or improve readability.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl"><label><input type="checkbox" data-c="ax-table--striped" checked> Striped</label><label><input type="checkbox" data-c="ax-table--compact"> Compact</label></div>`);
        const box = AX.add(b, "<div></div>");
        const draw = () => { box.innerHTML = table(D.devices.slice(0, 8), cols("id", "name", "site", "temp"), { cls: [...ctl.querySelectorAll("input:checked")].map(i => i.dataset.c).join(" ") }); };
        ctl.addEventListener("change", draw);
        draw();
      }
    },
    {
      title: "Sortable Columns",
      level: 1,
      desc: "Click any column heading to sort, click again to reverse. Text and numbers sort correctly.",
      render(b) {
        const sort = { key: "temp", dir: -1 };
        const draw = () => { b.innerHTML = table(sortRows(D.devices.slice(0, 10), sort.key, sort.dir), cols("id", "type", "temp", "battery"), { sort }); };
        onSort(b, sort, draw);
        draw();
      }
    },
    {
      title: "Quick Search",
      level: 1,
      desc: "Type to filter rows across every column. Matching text is highlighted.",
      render(b) {
        const input = AX.add(b, `<div class="ax-ctl"><input class="ax-input" type="search" placeholder="Try 'pump' or 'Perth'..." style="flex:1" aria-label="Search"><span class="ax-small ax-muted" data-n></span></div>`).querySelector("input");
        const box = AX.add(b, "<div></div>");
        const draw = () => {
          const q = input.value.trim().toLowerCase();
          const hl = v => (q ? F.esc(v).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), m => `<mark>${m}</mark>`) : F.esc(v));
          const rows = D.devices.filter(d => !q || `${d.id} ${d.name} ${d.site} ${d.status}`.toLowerCase().includes(q));
          box.innerHTML = table(rows.slice(0, 8), ["id", "name", "site"].map(k => ({ ...COLS[k], fmt: hl })).concat(COLS.status), { wrapStyle: "max-height:260px" });
          b.querySelector("[data-n]").textContent = `${rows.length} of ${D.devices.length}`;
        };
        input.addEventListener("input", draw);
        draw();
      }
    },
    {
      title: "Pagination",
      level: 2,
      desc: "Splits long lists into pages. Choose the page size and jump between pages.",
      render(b) {
        let page = 0, size = 5;
        const box = AX.add(b, "<div></div>");
        const pager = AX.add(b, `<div class="ax-pager"></div>`);
        const draw = () => {
          const pages = Math.ceil(D.devices.length / size);
          page = Math.min(page, pages - 1);
          box.innerHTML = table(D.devices.slice(page * size, page * size + size), cols("id", "name", "site", "status"));
          const nums = Array.from({ length: pages }, (_, i) => i).filter(i => i < 2 || i >= pages - 2 || Math.abs(i - page) <= 1);
          pager.innerHTML = `
            <span>Rows <select class="ax-select" aria-label="Rows per page">${[5, 10, 20].map(n => `<option ${n === size ? "selected" : ""}>${n}</option>`).join("")}</select> · ${page * size + 1} to ${Math.min(D.devices.length, (page + 1) * size)} of ${D.devices.length}</span>
            <span class="ax-row" style="gap:4px"><button class="ax-btn ax-btn--sm" data-p="${page - 1}" ${page ? "" : "disabled"}>‹</button>
            ${nums.map((n, i) => `${i && n - nums[i - 1] > 1 ? "…" : ""}<button class="ax-btn ax-btn--sm ${n === page ? "ax-btn--primary" : ""}" data-p="${n}">${n + 1}</button>`).join("")}
            <button class="ax-btn ax-btn--sm" data-p="${page + 1}" ${page < pages - 1 ? "" : "disabled"}>›</button></span>`;
        };
        pager.addEventListener("click", e => { if (e.target.dataset.p) { page = +e.target.dataset.p; draw(); } });
        pager.addEventListener("change", e => { size = +e.target.value; page = 0; draw(); });
        draw();
      }
    },
    {
      title: "Conditional Formatting",
      level: 2,
      desc: "Cells change colour based on rules: high temperature, low battery, poor uptime and open alerts.",
      render(b) {
        const rule = (bad, warn) => v => (bad(v) ? "background:var(--rv-bad-soft);color:var(--rv-bad);font-weight:600" : warn(v) ? "background:var(--rv-warn-soft);color:#b45309" : "");
        b.innerHTML = table(D.devices.slice(10, 20), [
          COLS.id, COLS.status,
          { ...COLS.temp, style: rule(v => v > 30, v => v > 27) },
          { ...COLS.battery, style: rule(v => v < 20, v => v < 40) },
          { ...COLS.uptime, style: rule(v => v < 90, v => v < 97) },
          { ...COLS.alerts, style: rule(v => v >= 4, v => v >= 1) }
        ]) + `<div class="ax-ctl ax-small" style="margin-top:8px"><span class="ax-pill ax-pill--bad">Critical</span><span class="ax-pill ax-pill--warn">Warning</span></div>`;
      }
    },
    {
      title: "Totals and Formatting",
      level: 2,
      desc: "Units, thousands separators and a footer with totals and averages calculated from the rows.",
      render(b) {
        const rows = siteSummary();
        const sum = k => rows.reduce((a, r) => a + r[k], 0);
        b.innerHTML = table(rows, [{ key: "site", label: "Site" }, { key: "devices", label: "Devices", num: true }, { key: "power", label: "Power", num: true, fmt: v => `${F.num(v, 1)} kW` }, { key: "alerts", label: "Alerts", num: true }, { key: "uptime", label: "Uptime", num: true, fmt: v => `${F.num(v, 2)}%` }], {
          foot: `<tfoot><tr><td>Total / avg</td><td class="num">${sum("devices")}</td><td class="num">${F.num(sum("power"), 1)} kW</td><td class="num">${sum("alerts")}</td><td class="num">${F.num(sum("uptime") / rows.length, 2)}%</td></tr></tfoot>`
        });
      }
    },
    {
      title: "Data Bars",
      level: 2,
      desc: "A bar behind each value makes the column scannable like a chart while keeping exact numbers.",
      render(b) {
        const rows = siteSummary(), max = Math.max(...rows.map(r => r.power));
        const bar = (pct, c, label) => `<div style="position:relative;min-width:140px"><div style="position:absolute;inset:2px auto 2px 0;width:${Math.max(0, Math.min(100, pct))}%;background:${c};border-radius:3px;opacity:.25"></div><span style="position:relative;padding-left:4px">${label}</span></div>`;
        b.innerHTML = table(sortRows(rows, "power", -1), [
          { key: "site", label: "Site" },
          { key: "power", label: "Power kW", fmt: v => bar((v / max) * 100, "#4f46e5", F.num(v, 1)) },
          { key: "uptime", label: "Uptime % (scale 90 to 100)", fmt: v => bar((v - 90) * 10, "#0d9488", F.num(v, 2)) }
        ]);
      }
    },
    {
      title: "Sparklines in Cells",
      level: 2,
      desc: "A tiny 7-day trend in each row, plus the change, so you see direction as well as the current value.",
      render(b) {
        const rows = D.devices.slice(0, 8).map((d, i) => {
          const t = D.walk(14, { base: d.power, vol: 2, min: 0, seed: i + 200 });
          return { ...d, trend: t, change: +(((t[13] - t[0]) / t[0]) * 100).toFixed(1) };
        });
        b.innerHTML = table(rows, [COLS.id, COLS.name, { key: "trend", label: "Power, 7 days", fmt: (v, r) => sparkline(v, r.change >= 0 ? "#10b981" : "#ef4444") }, { key: "change", label: "Change", num: true, fmt: v => `<span class="${v >= 0 ? "ax-up" : "ax-down"}">${v >= 0 ? "+" : ""}${v}%</span>` }]);
      }
    },
    {
      title: "Column Filters",
      level: 2,
      desc: "A filter under each heading: text match, status dropdown and numeric minimums, all combined.",
      render(b) {
        const filters = { id: "", site: "", status: "", temp: "", battery: "" };
        const head = `<tr class="ax-filter-row">
          <th><input class="ax-input" data-f="id" placeholder="Contains" style="width:90px"></th>
          <th><input class="ax-input" data-f="site" placeholder="Contains" style="width:110px"></th>
          <th><select class="ax-select" data-f="status"><option value="">All</option><option>Online</option><option>Warning</option><option>Offline</option></select></th>
          <th class="num"><input class="ax-input" data-f="temp" type="number" placeholder="Min" style="width:70px"></th>
          <th class="num"><input class="ax-input" data-f="battery" type="number" placeholder="Max" style="width:70px"></th></tr>`;
        const box = AX.add(b, "<div></div>");
        const draw = () => {
          const rows = D.devices.filter(d =>
            (!filters.id || d.id.toLowerCase().includes(filters.id.toLowerCase())) && (!filters.site || d.site.toLowerCase().includes(filters.site.toLowerCase())) &&
            (!filters.status || d.status === filters.status) && (filters.temp === "" || d.temp >= +filters.temp) && (filters.battery === "" || d.battery <= +filters.battery));
          box.querySelector("tbody").innerHTML = rows.length ? rows.map(r => `<tr><td>${r.id}</td><td>${r.site}</td><td>${AX.pill(r.status)}</td><td class="num">${r.temp}</td><td class="num">${r.battery}</td></tr>`).join("") : '<tr><td colspan="5" class="ax-empty">No matching rows</td></tr>';
          box.querySelector("[data-n]").textContent = `${rows.length} rows`;
        };
        box.innerHTML = `<div class="ax-table-wrap" style="max-height:300px"><table class="ax-table ax-table--hover ax-table--compact"><thead><tr><th>Device</th><th>Site</th><th>Status</th><th class="num">Temp ≥</th><th class="num">Battery ≤</th></tr>${head}</thead><tbody></tbody></table></div><div class="ax-pager"><span data-n></span><button class="ax-btn ax-btn--sm" data-clear>Clear filters</button></div>`;
        box.querySelectorAll(".ax-filter-row th").forEach(th => { th.style.top = "33px"; });
        box.addEventListener("input", e => { if (e.target.dataset.f) { filters[e.target.dataset.f] = e.target.value; draw(); } });
        box.querySelector("[data-clear]").addEventListener("click", () => { Object.keys(filters).forEach(k => { filters[k] = ""; }); box.querySelectorAll("[data-f]").forEach(i => { i.value = ""; }); draw(); });
        draw();
      }
    },
    {
      title: "Heatmap Table",
      level: 2,
      desc: "A site by month matrix where each cell is shaded by its value. Combines exact numbers with patterns.",
      render(b) {
        const r = D.rng(77), months = D.months.slice(0, 6);
        const rows = D.sites.map(s => ({ site: s.id, ...Object.fromEntries(months.map((m, i) => [m, Math.round(300 + r() * 500 + Math.sin(i) * 80)])) }));
        const all = rows.flatMap(row => months.map(m => row[m])), lo = Math.min(...all), hi = Math.max(...all);
        const shade = v => { const t = (v - lo) / (hi - lo); return `background:rgba(79,70,229,${(0.08 + t * 0.8).toFixed(2)});color:${t > 0.55 ? "#fff" : "inherit"}`; };
        b.innerHTML = table(rows, [{ key: "site", label: "Site" }, ...months.map(m => ({ key: m, label: m, num: true, style: shade }))], { cls: "ax-table--compact" });
      }
    },
    {
      title: "Column Chooser",
      level: 2,
      desc: "Pick which columns to show. Handy when records have many fields but people need different views.",
      render(b) {
        const keys = ["id", "name", "type", "site", "status", "temp", "humidity", "power", "battery", "uptime"];
        const on = new Set(["id", "name", "status", "temp"]);
        const ctl = AX.add(b, `<div class="ax-ctl">${keys.map(k => `<label><input type="checkbox" value="${k}" ${on.has(k) ? "checked" : ""}> ${COLS[k].label}</label>`).join("")}</div>`);
        const box = AX.add(b, "<div></div>");
        const draw = () => { box.innerHTML = table(D.devices.slice(0, 7), keys.filter(k => on.has(k)).map(k => COLS[k]), { cls: "ax-table--compact" }); };
        ctl.addEventListener("change", e => { e.target.checked ? on.add(e.target.value) : on.delete(e.target.value); if (!on.size) { on.add("id"); ctl.querySelector('[value="id"]').checked = true; } draw(); });
        draw();
      }
    },
    {
      title: "Row Selection and Bulk Actions",
      level: 3,
      desc: "Tick rows, or select all, then act on them together: restart devices or export just the selection.",
      render(b) {
        const rows = D.devices.slice(0, 12), sel = new Set();
        const bar = AX.add(b, `<div class="ax-ctl"><span class="ax-small" data-n></span><button class="ax-btn ax-btn--sm" data-a="restart">Restart</button><button class="ax-btn ax-btn--sm" data-a="export">Export CSV</button><button class="ax-btn ax-btn--sm" data-a="clear">Clear</button></div>`);
        const box = AX.add(b, "<div></div>");
        const draw = () => {
          box.innerHTML = table(rows, cols("id", "name", "site", "status"), {
            cls: "ax-table--compact", wrapStyle: "max-height:290px",
            leadHead: `<input type="checkbox" data-all ${sel.size === rows.length ? "checked" : ""} aria-label="Select all">`,
            lead: r => `<input type="checkbox" data-id="${r.id}" ${sel.has(r.id) ? "checked" : ""} aria-label="Select ${r.id}">`,
            rowAttr: r => (sel.has(r.id) ? 'class="is-selected"' : "")
          });
          const allBox = box.querySelector("[data-all]");
          allBox.indeterminate = sel.size > 0 && sel.size < rows.length;
          bar.querySelector("[data-n]").innerHTML = `<strong>${sel.size}</strong> selected`;
          bar.querySelectorAll("[data-a]").forEach(btn => { btn.disabled = !sel.size; });
        };
        box.addEventListener("change", e => {
          if (e.target.dataset.all !== undefined) { e.target.checked ? rows.forEach(r => sel.add(r.id)) : sel.clear(); }
          else if (e.target.dataset.id) { e.target.checked ? sel.add(e.target.dataset.id) : sel.delete(e.target.dataset.id); }
          draw();
        });
        bar.addEventListener("click", async e => {
          const a = e.target.dataset.a;
          if (a === "clear") sel.clear();
          if (a === "restart" && await AX.modal({ title: `Restart ${sel.size} devices?`, body: [...sel].join(", ") })) AX.rv("pushPayload", { command: "restart", devices: [...sel] }, 205813, "default");
          if (a === "export") AX.download("selected-devices.csv", AX.csv(rows.filter(r => sel.has(r.id)), cols("id", "name", "site", "status")));
          draw();
        });
        draw();
      }
    },
    {
      title: "Expandable Rows",
      level: 3,
      desc: "Click a row to open a detail panel with extra fields and a 24-hour chart for that device.",
      render(b) {
        const rows = D.devices.slice(20, 28);
        b.innerHTML = `<div class="ax-table-wrap"><table class="ax-table ax-table--hover"><thead><tr><th></th><th>Device</th><th>Site</th><th>Status</th><th class="num">Temp</th></tr></thead><tbody>${rows.map((d, i) => `
          <tr data-i="${i}" style="cursor:pointer"><td data-caret>▸</td><td>${d.id}</td><td>${d.site}</td><td>${AX.pill(d.status)}</td><td class="num">${d.temp}</td></tr>
          <tr data-detail="${i}" hidden><td colspan="5" style="background:#fafafa;white-space:normal"></td></tr>`).join("")}</tbody></table></div>`;
        b.addEventListener("click", e => {
          const tr = e.target.closest("tr[data-i]");
          if (!tr) return;
          const i = +tr.dataset.i, det = b.querySelector(`[data-detail="${i}"]`), open = det.hidden;
          det.hidden = !open;
          tr.querySelector("[data-caret]").textContent = open ? "▾" : "▸";
          const td = det.firstElementChild;
          if (open && !td.childElementCount) {
            const d = rows[i];
            td.innerHTML = `<div class="ax-small" style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:6px"><span>Type <strong>${d.type}</strong></span><span>Firmware <strong>${d.firmware}</strong></span><span>Power <strong>${d.power} kW</strong></span><span>Battery <strong>${d.battery}%</strong></span><span>Installed <strong>${F.date(d.installed)}</strong></span></div>`;
            AX.chart(td, { xAxis: { type: "time" }, yAxis: { type: "value", scale: true }, series: [{ type: "line", name: "Temp", data: D.ts(24, D.HOUR, D.wave(24, { base: d.temp, amp: 2, seed: i })), areaStyle: { opacity: 0.1 } }] }, 130);
          }
        });
      }
    },
    {
      title: "Grouped Rows with Subtotals",
      level: 3,
      desc: "Group by site, type or status. Each group collapses and shows its own count and subtotals.",
      render(b) {
        const ctl = AX.add(b, `<div class="ax-ctl">Group by ${AX.seg([["site", "Site"], ["type", "Type"], ["status", "Status"]], "site")}<button class="ax-btn ax-btn--sm" data-x>Collapse all</button></div>`);
        const box = AX.add(b, `<div class="ax-table-wrap" style="max-height:320px"></div>`);
        let by = "site";
        const closed = new Set();
        const draw = () => {
          const groups = [...new Set(D.devices.map(d => d[by]))].sort();
          box.innerHTML = `<table class="ax-table ax-table--compact"><thead><tr><th>Device</th><th>Name</th><th class="num">Power kW</th><th class="num">Alerts</th></tr></thead><tbody>${groups.map(g => {
            const rows = D.devices.filter(d => d[by] === g), isClosed = closed.has(g);
            return `<tr data-g="${F.esc(g)}" style="cursor:pointer;background:var(--rv-bg);font-weight:600"><td colspan="2">${isClosed ? "▸" : "▾"} ${F.esc(g)} <span class="ax-muted" style="font-weight:400">(${rows.length})</span></td><td class="num">${F.num(rows.reduce((a, d) => a + d.power, 0), 1)}</td><td class="num">${rows.reduce((a, d) => a + d.alerts, 0)}</td></tr>` +
              (isClosed ? "" : rows.map(d => `<tr><td style="padding-left:24px">${d.id}</td><td>${d.name}</td><td class="num">${d.power}</td><td class="num">${d.alerts}</td></tr>`).join(""));
          }).join("")}</tbody></table>`;
          ctl.querySelector("[data-x]").textContent = closed.size === groups.length ? "Expand all" : "Collapse all";
        };
        box.addEventListener("click", e => { const g = e.target.closest("tr[data-g]")?.dataset.g; if (g) { closed.has(g) ? closed.delete(g) : closed.add(g); draw(); } });
        ctl.querySelector("[data-x]").addEventListener("click", () => { const groups = [...new Set(D.devices.map(d => d[by]))]; closed.size === groups.length ? closed.clear() : groups.forEach(g => closed.add(g)); draw(); });
        AX.onSeg(ctl.querySelector(".ax-seg"), v => { by = v; closed.clear(); draw(); });
        draw();
      }
    },
    {
      title: "Inline Editing",
      level: 3,
      desc: "Double-click a name or threshold to edit it in place. Values are validated, and changed rows can be saved.",
      render(b) {
        const rows = D.devices.slice(30, 37).map(d => ({ id: d.id, name: d.name, high: Math.round(d.temp + 5), low: Math.round(d.temp - 8) }));
        const dirty = new Set();
        const bar = AX.add(b, `<div class="ax-ctl"><span class="ax-small ax-muted" data-n>Double-click a highlighted cell to edit</span><button class="ax-btn ax-btn--primary ax-btn--sm" data-save disabled style="margin-left:auto">Save changes</button></div>`);
        const box = AX.add(b, "<div></div>");
        const editable = (k, r) => `<td class="${k === "name" ? "" : "num"}" data-edit="${k}" data-id="${r.id}" style="cursor:text;background:${dirty.has(r.id + k) ? "var(--rv-warn-soft)" : "#fafaff"}" title="Double-click to edit">${F.esc(r[k])}</td>`;
        const draw = () => {
          box.innerHTML = `<div class="ax-table-wrap"><table class="ax-table"><thead><tr><th>Device</th><th>Display name</th><th class="num">High °C</th><th class="num">Low °C</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.id}</td>${editable("name", r)}${editable("high", r)}${editable("low", r)}</tr>`).join("")}</tbody></table></div>`;
          const ids = new Set([...dirty].map(k => k.slice(0, 8)));
          bar.querySelector("[data-save]").disabled = !dirty.size;
          bar.querySelector("[data-n]").textContent = dirty.size ? `${ids.size} row(s) changed` : "Double-click a highlighted cell to edit";
        };
        box.addEventListener("dblclick", e => {
          const td = e.target.closest("td[data-edit]");
          if (!td || td.querySelector("input")) return;
          const r = rows.find(x => x.id === td.dataset.id), k = td.dataset.edit;
          td.innerHTML = `<input class="ax-input" value="${F.esc(r[k])}" ${k !== "name" ? 'type="number"' : ""} style="width:${k === "name" ? 150 : 70}px">`;
          const input = td.querySelector("input");
          input.focus(); input.select();
          let done = false;
          // Enter keeps the editor open on a validation error; leaving the cell reverts it instead
          const commit = (ok, leaving) => {
            if (done) return;
            if (ok) {
              const v = k === "name" ? input.value.trim() : +input.value;
              const err = k === "name" ? (!v && "Name cannot be empty") : (k === "high" && v <= r.low) ? "High must be above low" : (k === "low" && v >= r.high) ? "Low must be below high" : null;
              if (err) {
                AX.toast(leaving ? `${err}. Change discarded.` : err, "bad");
                if (!leaving) { input.focus(); return; }
              } else if (v !== r[k]) { r[k] = v; dirty.add(r.id + k); }
            }
            done = true;
            draw();
          };
          input.addEventListener("keydown", ev => { if (ev.key === "Enter") commit(true); if (ev.key === "Escape") commit(false); });
          input.addEventListener("blur", () => commit(true, true));
        });
        bar.querySelector("[data-save]").addEventListener("click", () => {
          [...new Set([...dirty].map(k => k.slice(0, 8)))].forEach(id => { const r = rows.find(x => x.id === id); AX.rv("updateDataToTable", "Devices", "onSaved", JSON.stringify(r)); });
          dirty.clear(); draw();
        });
        draw();
      }
    },
    {
      title: "Tree Table",
      level: 3,
      desc: "Region, site and device as an expandable hierarchy. Parent rows roll up totals from their children.",
      render(b) {
        const tree = [...new Set(D.sites.map(s => s.region))].map(reg => ({
          name: reg, kids: D.sites.filter(s => s.region === reg).map(s => ({ name: s.name, kids: D.devices.filter(d => d.site === s.name).map(d => ({ name: `${d.id} ${d.name}`, n: 1, power: d.power, alerts: d.alerts })) }))
        }));
        const roll = n => { if (n.kids) { n.kids.forEach(roll); n.n = n.kids.reduce((a, k) => a + k.n, 0); n.power = n.kids.reduce((a, k) => a + k.power, 0); n.alerts = n.kids.reduce((a, k) => a + k.alerts, 0); } };
        tree.forEach(roll);
        const open = new Set(["NSW"]);
        const box = AX.add(b, `<div class="ax-table-wrap" style="max-height:320px"></div>`);
        const rowsFor = (nodes, depth, path) => nodes.map(n => {
          const p = path + "/" + n.name, isOpen = open.has(n.name) || open.has(p);
          const caret = n.kids ? (isOpen ? "▾" : "▸") : " ";
          return `<tr ${n.kids ? `data-p="${F.esc(n.name)}" style="cursor:pointer;${depth === 0 ? "font-weight:600" : ""}"` : ""}><td style="padding-left:${10 + depth * 20}px">${caret} ${F.esc(n.name)}</td><td class="num">${n.n}</td><td class="num">${F.num(n.power, 1)}</td><td class="num">${n.alerts}</td></tr>` +
            (n.kids && isOpen ? rowsFor(n.kids, depth + 1, p) : "");
        }).join("");
        const draw = () => { box.innerHTML = `<table class="ax-table ax-table--compact ax-table--hover"><thead><tr><th>Name</th><th class="num">Devices</th><th class="num">Power kW</th><th class="num">Alerts</th></tr></thead><tbody>${rowsFor(tree, 0, "")}</tbody></table>`; };
        box.addEventListener("click", e => { const p = e.target.closest("tr[data-p]")?.dataset.p; if (p) { open.has(p) ? open.delete(p) : open.add(p); draw(); } });
        draw();
      }
    },
    {
      title: "Pivot Table",
      level: 3,
      desc: "Choose what goes in rows and columns, the measure and how to aggregate it. Includes row and column totals.",
      render(b) {
        const dims = [["region", "Region"], ["site", "Site"], ["type", "Type"], ["status", "Status"]];
        const measures = [["power", "Power"], ["alerts", "Alerts"], ["temp", "Temperature"], ["battery", "Battery"], ["id", "Count"]];
        const aggs = { sum: a => a.reduce((s, v) => s + v, 0), avg: a => a.reduce((s, v) => s + v, 0) / a.length, max: a => Math.max(...a), min: a => Math.min(...a), count: a => a.length };
        const sel = (k, o, v) => `<label>${k} <select class="ax-select" data-k="${k}">${o.map(([val, l]) => `<option value="${val}" ${val === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
        const ctl = AX.add(b, `<div class="ax-ctl">${sel("Rows", dims, "type")}${sel("Columns", dims, "region")}${sel("Measure", measures, "power")}${sel("Aggregate", Object.keys(aggs).map(k => [k, k]), "sum")}</div>`);
        const box = AX.add(b, "<div></div>");
        const draw = () => {
          const v = k => ctl.querySelector(`[data-k="${k}"]`).value;
          const [rk, ck, mk] = [v("Rows"), v("Columns"), v("Measure")], agg = mk === "id" ? aggs.count : aggs[v("Aggregate")];
          ctl.querySelector('[data-k="Aggregate"]').disabled = mk === "id";
          const rs = [...new Set(D.devices.map(d => d[rk]))].sort(), cs = [...new Set(D.devices.map(d => d[ck]))].sort();
          const val = (f) => { const vals = D.devices.filter(f).map(d => (mk === "id" ? 1 : d[mk])); return vals.length ? +agg(vals).toFixed(1) : ""; };
          const all = D.devices.map(d => (mk === "id" ? 1 : d[mk]));
          box.innerHTML = `<div class="ax-table-wrap"><table class="ax-table ax-table--compact"><thead><tr><th>${dims.find(d => d[0] === rk)[1]} \\ ${dims.find(d => d[0] === ck)[1]}</th>${cs.map(c => `<th class="num">${c}</th>`).join("")}<th class="num">Total</th></tr></thead><tbody>
            ${rs.map(r => `<tr><td>${r}</td>${cs.map(c => `<td class="num">${val(d => d[rk] === r && d[ck] === c)}</td>`).join("")}<td class="num"><strong>${val(d => d[rk] === r)}</strong></td></tr>`).join("")}
          </tbody><tfoot><tr><td>Total</td>${cs.map(c => `<td class="num">${val(d => d[ck] === c)}</td>`).join("")}<td class="num">${+agg(all).toFixed(1)}</td></tr></tfoot></table></div>`;
        };
        ctl.addEventListener("change", draw);
        draw();
      }
    },
    {
      title: "Live Updating Table",
      level: 3,
      desc: "Values refresh every 2 seconds and changed cells flash. Your sort order is kept between updates.",
      render(b) {
        const rows = D.devices.slice(0, 8).map(d => ({ ...d }));
        const sort = { key: "power", dir: -1 };
        const info = AX.add(b, `<div class="ax-ctl ax-small"><span class="ax-pill ax-pill--live">Live</span><span class="ax-muted" data-t></span></div>`);
        const box = AX.add(b, "<div></div>");
        let changed = new Set();
        const draw = () => {
          box.innerHTML = table(sortRows(rows, sort.key, sort.dir), [COLS.id, COLS.name, ...["temp", "power", "battery"].map(k => ({ ...COLS[k], style: (v, r) => (changed.has(r.id + k) ? "background:#fef3c7;transition:background 1s" : "transition:background 1s") }))], { sort, cls: "ax-table--compact" });
          setTimeout(() => box.querySelectorAll("td[style*='fff3bf']").forEach(td => { td.style.background = ""; }), 50);
        };
        onSort(box, sort, draw);
        AX.every(2000, () => {
          changed = new Set();
          rows.forEach(r => {
            if (Math.random() < 0.4) { r.temp = +(r.temp + (Math.random() - 0.5) * 1.4).toFixed(1); changed.add(r.id + "temp"); }
            if (Math.random() < 0.5) { r.power = +Math.max(0, r.power + (Math.random() - 0.5) * 4).toFixed(1); changed.add(r.id + "power"); }
            if (Math.random() < 0.1) { r.battery = Math.max(0, r.battery - 1); changed.add(r.id + "battery"); }
          });
          info.querySelector("[data-t]").textContent = `Updated ${new Date().toLocaleTimeString()} · ${changed.size} cells changed`;
          draw();
        }, b);
        draw();
      }
    },
    {
      title: "Full Data Grid",
      level: 3,
      wide: true,
      desc: "Everything together: search, status filter, sorting, paging, selection, column chooser and CSV export.",
      render(b) {
        const all = ["id", "name", "type", "site", "region", "status", "temp", "humidity", "power", "battery", "uptime", "alerts", "lastSeen"];
        const st = { q: "", status: "", sort: { key: "id", dir: 1 }, page: 0, size: 10, sel: new Set(), show: new Set(["id", "name", "type", "site", "status", "temp", "power", "battery", "lastSeen"]) };
        const ctl = AX.add(b, `<div class="ax-ctl">
          <input class="ax-input" type="search" placeholder="Search all fields..." style="width:220px" aria-label="Search">
          ${AX.seg([["", "All"], ["Online", "Online"], ["Warning", "Warning"], ["Offline", "Offline"]], "")}
          <details style="position:relative"><summary class="ax-btn" style="list-style:none">Columns ▾</summary>
            <div style="position:absolute;z-index:5;background:#fff;border:1px solid var(--rv-border);border-radius:8px;padding:8px 12px;box-shadow:0 6px 20px rgba(0,0,0,.12);margin-top:4px">${all.map(k => `<label style="display:block;padding:2px 0;white-space:nowrap"><input type="checkbox" value="${k}" ${st.show.has(k) ? "checked" : ""}> ${COLS[k].label}</label>`).join("")}</div>
          </details>
          <span class="ax-small" data-sel style="margin-left:auto"></span>
          <button class="ax-btn" data-export>Export CSV</button>
        </div>`);
        const box = AX.add(b, "<div></div>"), pager = AX.add(b, `<div class="ax-pager"></div>`);
        const filtered = () => sortRows(D.devices.filter(d => (!st.status || d.status === st.status) && (!st.q || all.some(k => String(d[k]).toLowerCase().includes(st.q)))), st.sort.key, st.sort.dir);
        const draw = () => {
          const rows = filtered(), pages = Math.max(1, Math.ceil(rows.length / st.size));
          st.page = Math.min(st.page, pages - 1);
          const view = rows.slice(st.page * st.size, (st.page + 1) * st.size);
          box.innerHTML = table(view, all.filter(k => st.show.has(k)).map(k => COLS[k]), {
            sort: st.sort, cls: "ax-table--compact", wrapStyle: "max-height:420px",
            leadHead: `<input type="checkbox" data-all ${view.length && view.every(r => st.sel.has(r.id)) ? "checked" : ""} aria-label="Select page">`,
            lead: r => `<input type="checkbox" data-id="${r.id}" ${st.sel.has(r.id) ? "checked" : ""} aria-label="Select ${r.id}">`,
            rowAttr: r => (st.sel.has(r.id) ? 'class="is-selected"' : "")
          });
          ctl.querySelector("[data-sel]").textContent = st.sel.size ? `${st.sel.size} selected` : "";
          ctl.querySelector("[data-export]").textContent = st.sel.size ? `Export ${st.sel.size} selected` : `Export ${rows.length} rows`;
          pager.innerHTML = `<span>${rows.length ? st.page * st.size + 1 : 0} to ${Math.min(rows.length, (st.page + 1) * st.size)} of ${rows.length} · Rows <select class="ax-select" aria-label="Rows per page">${[10, 25, 60].map(n => `<option ${n === st.size ? "selected" : ""}>${n}</option>`).join("")}</select></span>
            <span class="ax-row" style="gap:4px"><button class="ax-btn ax-btn--sm" data-p="0" ${st.page ? "" : "disabled"}>«</button><button class="ax-btn ax-btn--sm" data-p="${st.page - 1}" ${st.page ? "" : "disabled"}>‹</button>
            <span style="padding:0 8px">Page ${st.page + 1} of ${pages}</span>
            <button class="ax-btn ax-btn--sm" data-p="${st.page + 1}" ${st.page < pages - 1 ? "" : "disabled"}>›</button><button class="ax-btn ax-btn--sm" data-p="${pages - 1}" ${st.page < pages - 1 ? "" : "disabled"}>»</button></span>`;
        };
        ctl.querySelector("input[type=search]").addEventListener("input", e => { st.q = e.target.value.trim().toLowerCase(); st.page = 0; draw(); });
        AX.onSeg(ctl.querySelector(".ax-seg"), v => { st.status = v; st.page = 0; draw(); });
        ctl.querySelector("details").addEventListener("change", e => { e.target.checked ? st.show.add(e.target.value) : st.show.delete(e.target.value); draw(); });
        onSort(box, st.sort, draw);
        box.addEventListener("change", e => {
          if (e.target.dataset.all !== undefined) { const view = filtered().slice(st.page * st.size, (st.page + 1) * st.size); view.forEach(r => (e.target.checked ? st.sel.add(r.id) : st.sel.delete(r.id))); }
          if (e.target.dataset.id) e.target.checked ? st.sel.add(e.target.dataset.id) : st.sel.delete(e.target.dataset.id);
          draw();
        });
        pager.addEventListener("click", e => { if (e.target.dataset.p) { st.page = +e.target.dataset.p; draw(); } });
        pager.addEventListener("change", e => { st.size = +e.target.value; st.page = 0; draw(); });
        ctl.querySelector("[data-export]").addEventListener("click", () => {
          const rows = st.sel.size ? D.devices.filter(d => st.sel.has(d.id)) : filtered();
          AX.download("devices.csv", AX.csv(rows, all.filter(k => st.show.has(k)).map(k => COLS[k])));
          AX.toast(`Exported ${rows.length} rows`, "good");
        });
        draw();
      }
    }
  ]);
})();
