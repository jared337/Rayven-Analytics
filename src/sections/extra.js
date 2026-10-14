/* ==========================================================================
 * Extra Items: 20 supporting UI examples, simple to advanced
 * ========================================================================== */
(() => {
  const box = (inner, extra = "") => `<div style="border:1px solid var(--rv-border);border-radius:8px;padding:12px 14px;${extra}">${inner}</div>`;

  /* Safe localStorage: some embeds block storage, so every access is guarded */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };

  AX.section("extra", [
    {
      title: "Notice Banners",
      level: 1,
      desc: "Info, success, warning and error messages. Each can be dismissed.",
      render(b) {
        const kinds = [["info", "Scheduled maintenance on Sunday 02:00 to 04:00."], ["good", "All 8 sites reported in the last 5 minutes."], ["warn", "3 devices have batteries below 20%."], ["bad", "Compressor B at Melbourne Depot is offline."]];
        b.innerHTML = kinds.map(([k, t]) => `<div class="ax-row ax-row--between" style="padding:9px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;border-left:4px solid var(--rv-${k === "info" ? "primary" : k});background:var(--rv-${k === "info" ? "primary" : k}-soft)"><span>${t}</span><button class="ax-btn ax-btn--sm" style="background:transparent;border:0" aria-label="Dismiss">✕</button></div>`).join("");
        b.addEventListener("click", e => { if (e.target.getAttribute("aria-label") === "Dismiss") e.target.parentElement.remove(); });
      }
    },
    {
      title: "Rich Text Card",
      level: 1,
      desc: "Formatted text with headings, lists and links for instructions, site notes or procedures.",
      render(b) {
        b.innerHTML = `<div style="font-size:13px;line-height:1.6">
          <h4 style="margin:0 0 4px">Chiller start-up procedure</h4>
          <p class="ax-muted" style="margin:0 0 8px">Follow these steps after any planned shutdown.</p>
          <ol style="margin:0;padding-left:20px"><li>Confirm condenser water flow is above <strong>40 L/s</strong>.</li><li>Enable the chiller from the BMS, not locally.</li><li>Watch discharge pressure for 10 minutes.</li><li>Log the start in the maintenance register.</li></ol>
          <p style="margin:8px 0 0"><a href="#" onclick="return false" style="color:var(--rv-primary)">Open full procedure (PDF)</a></p></div>`;
      }
    },
    {
      title: "Key-Value Details",
      level: 1,
      desc: "Label and value pairs for an asset's properties. Clean and easy to scan.",
      render(b) {
        const d = D.devices[3];
        const rows = [["Device ID", d.id], ["Type", d.type], ["Site", d.site], ["Region", d.region], ["Status", AX.pill(d.status)], ["Firmware", d.firmware], ["Installed", F.date(d.installed)], ["Coordinates", `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`]];
        b.innerHTML = `<dl style="display:grid;grid-template-columns:max-content 1fr;gap:8px 18px;margin:0;font-size:13px">${rows.map(([k, v]) => `<dt class="ax-muted">${k}</dt><dd style="margin:0;font-weight:500">${v}</dd>`).join("")}</dl>`;
      }
    },
    {
      title: "Progress List",
      level: 1,
      desc: "Several tasks with completion bars, coloured as they near or reach 100%.",
      render(b) {
        const tasks = [["Quarterly chiller service", 100], ["Sensor recalibration", 55], ["Firmware rollout v2.4", 34], ["Battery replacements", 82], ["Annual safety audit", 12]];
        b.innerHTML = tasks.map(([t, p]) => `<div style="margin-bottom:12px"><div class="ax-row ax-row--between ax-small"><span>${t}</span><strong>${p === 100 ? "✓ Done" : p + "%"}</strong></div><div class="ax-bar" style="margin-top:5px"><div style="width:${p}%;background:${p === 100 ? "var(--rv-good)" : p < 25 ? "var(--rv-warn)" : "var(--rv-primary)"}"></div></div></div>`).join("");
      }
    },
    {
      title: "Activity Timeline",
      level: 1,
      desc: "A vertical timeline of recent events with coloured markers by event type.",
      render(b) {
        const events = [["bad", "Pump 3 went offline", 18], ["good", "Alert cleared on Chiller 2", 42], ["info", "DEV-1061 registered", 75], ["warn", "Threshold changed on Sensor Hub 1", 160], ["info", "Report exported by Operations", 300]];
        b.innerHTML = `<div style="position:relative;padding-left:22px"><div style="position:absolute;left:6px;top:4px;bottom:4px;width:2px;background:var(--rv-border)"></div>${events.map(([k, t, m]) => `
          <div style="position:relative;margin-bottom:14px"><span style="position:absolute;left:-21px;top:3px;width:12px;height:12px;border-radius:50%;background:var(--rv-${k === "info" ? "primary" : k});border:2px solid #fff"></span>
          <div style="font-size:13px">${t}</div><div class="ax-small ax-muted">${m < 60 ? m + " min" : Math.round(m / 60) + " h"} ago</div></div>`).join("")}</div>`;
      }
    },
    {
      title: "Tabs",
      level: 2,
      desc: "Switch between related panels without leaving the card. Keyboard arrows move between tabs.",
      render(b) {
        const tabs = [["Summary", "8 sites, 60 devices, 99.2% fleet uptime this month."], ["Energy", "1.84 GWh consumed, 13% from on-site solar. Peak demand 2.1 MW on Tuesday."], ["Maintenance", "4 open work orders, 2 overdue. Next scheduled service: Sydney Plant, Monday."]];
        b.innerHTML = `<div role="tablist" class="ax-row" style="gap:0;border-bottom:1px solid var(--rv-border);margin-bottom:12px">${tabs.map(([t], i) => `<button role="tab" data-i="${i}" aria-selected="${!i}" tabindex="${i ? -1 : 0}" style="border:0;background:none;padding:8px 14px;font:inherit;font-size:13px;cursor:pointer;border-bottom:2px solid ${i ? "transparent" : "var(--rv-primary)"};color:${i ? "var(--rv-muted)" : "var(--rv-primary)"};margin-bottom:-1px">${t}</button>`).join("")}</div><div role="tabpanel" style="font-size:13px;line-height:1.6"></div>`;
        const btns = [...b.querySelectorAll("[role=tab]")];
        const go = i => {
          btns.forEach((x, j) => { const on = i === j; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; x.style.borderBottomColor = on ? "var(--rv-primary)" : "transparent"; x.style.color = on ? "var(--rv-primary)" : "var(--rv-muted)"; });
          b.querySelector("[role=tabpanel]").textContent = tabs[i][1];
        };
        b.addEventListener("click", e => { if (e.target.dataset.i) go(+e.target.dataset.i); });
        b.addEventListener("keydown", e => {
          const i = btns.indexOf(document.activeElement);
          if (i < 0 || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
          const n = (i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length;
          btns[n].focus(); go(n);
        });
        go(0);
      }
    },
    {
      title: "Accordion",
      level: 2,
      desc: "Collapsible sections that keep long content tidy. Only one section opens at a time.",
      render(b) {
        const items = [["Why is a device showing Offline?", "It has not reported within its expected interval. Check power, then network, then the gateway at that site."], ["How are alerts prioritised?", "Critical alerts affect safety or production, major alerts affect efficiency, minor alerts are informational."], ["Can I change a threshold?", "Yes, users with the Engineer role can edit thresholds in the Tables section using inline editing."]];
        b.innerHTML = items.map(([q, a]) => `<details style="border-bottom:1px solid var(--rv-border);padding:10px 0"><summary style="cursor:pointer;font-weight:500;font-size:13px">${q}</summary><p class="ax-small ax-muted" style="margin:8px 0 0;line-height:1.6">${a}</p></details>`).join("");
        b.addEventListener("toggle", e => { if (e.target.open) b.querySelectorAll("details").forEach(d => { if (d !== e.target) d.open = false; }); }, true);
      }
    },
    {
      title: "Stepper",
      level: 2,
      desc: "Shows where a process is up to. Use Next and Back to move through the work order stages.",
      render(b) {
        const steps = ["Raised", "Approved", "Scheduled", "In progress", "Completed"];
        let at = 2;
        b.innerHTML = `<div data-steps style="display:flex;align-items:flex-start;margin:8px 0 18px"></div><div class="ax-row ax-row--between"><span class="ax-small" data-s></span><span class="ax-row" style="gap:6px"><button class="ax-btn" data-d="-1">Back</button><button class="ax-btn ax-btn--primary" data-d="1">Next</button></span></div>`;
        const draw = () => {
          b.querySelector("[data-steps]").innerHTML = steps.map((s, i) => `
            <div style="flex:1;text-align:center;position:relative">
              ${i ? `<div style="position:absolute;top:13px;right:50%;width:100%;height:2px;background:${i <= at ? "var(--rv-primary)" : "var(--rv-border)"}"></div>` : ""}
              <div style="position:relative;margin:0 auto;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;background:${i < at ? "var(--rv-primary)" : i === at ? "#fff" : "var(--rv-bg)"};color:${i < at ? "#fff" : i === at ? "var(--rv-primary)" : "var(--rv-muted)"};border:2px solid ${i <= at ? "var(--rv-primary)" : "var(--rv-border)"}">${i < at ? "✓" : i + 1}</div>
              <div class="ax-small" style="margin-top:6px;color:${i === at ? "var(--rv-text)" : "var(--rv-muted)"};font-weight:${i === at ? 600 : 400}">${s}</div>
            </div>`).join("");
          b.querySelector("[data-s]").innerHTML = `WO-2291 · <strong>${steps[at]}</strong>`;
          b.querySelector('[data-d="-1"]').disabled = at === 0;
          b.querySelector('[data-d="1"]').disabled = at === steps.length - 1;
        };
        b.addEventListener("click", e => { if (e.target.dataset.d) { at += +e.target.dataset.d; draw(); } });
        draw();
      }
    },
    {
      title: "Toast Notifications",
      level: 2,
      desc: "Short pop-up messages that confirm an action or flag a problem, then disappear on their own.",
      render(b) {
        b.innerHTML = `<div class="ax-row" style="flex-wrap:wrap;gap:8px"><button class="ax-btn" data-t="">Info</button><button class="ax-btn" data-t="good">Success</button><button class="ax-btn" data-t="bad">Error</button></div><p class="ax-small ax-muted">Toasts appear in the bottom-right corner and stack if several fire together.</p>`;
        const msg = { "": "Report is being generated", good: "Settings saved", bad: "Could not reach gateway GW-4" };
        b.addEventListener("click", e => { if (e.target.dataset.t !== undefined) AX.toast(msg[e.target.dataset.t], e.target.dataset.t); });
      }
    },
    {
      title: "Confirmation Dialog",
      level: 2,
      desc: "Asks the user to confirm before a destructive or important action, and reports the outcome.",
      render(b) {
        const list = AX.add(b, `<ul class="ax-list"></ul>`);
        let items = ["Old gateway GW-1", "Test device DEV-0999", "Decommissioned meter M-12"];
        const draw = () => { list.innerHTML = items.length ? items.map((t, i) => `<li><span>${t}</span><button class="ax-btn ax-btn--sm" data-i="${i}" style="color:var(--rv-bad)">Remove</button></li>`).join("") : '<li class="ax-muted">Nothing left to remove</li>'; };
        list.addEventListener("click", async e => {
          if (!e.target.dataset.i) return;
          const t = items[+e.target.dataset.i];
          if (await AX.modal({ title: "Remove this item?", body: `<strong>${t}</strong> will be removed from the register. This cannot be undone.`, confirm: "Remove" })) {
            items = items.filter(x => x !== t);
            AX.toast(`${t} removed`, "good");
            draw();
          }
        });
        draw();
      }
    },
    {
      title: "Date Range Presets",
      level: 2,
      desc: "Quick presets plus custom dates. Outputs the exact start and end strings Rayven's data functions expect.",
      render(b) {
        const pad = F.pad, fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        const presets = { today: "Today", yesterday: "Yesterday", "7d": "Last 7 days", month: "This month", custom: "Custom" };
        b.innerHTML = `<div class="ax-ctl">${AX.seg(Object.entries(presets), "7d")}</div><div class="ax-ctl" data-custom hidden><input class="ax-input" type="date" data-a><span>to</span><input class="ax-input" type="date" data-z></div><pre style="background:var(--rv-bg);padding:10px;border-radius:8px;font-size:11.5px;overflow:auto;margin:0"></pre>`;
        const out = b.querySelector("pre");
        const show = (a, z) => { out.textContent = `getDataFromAPINode(55, "processData",\n  "${fmt(a)}",\n  "${fmt(z)}");`; };
        const pick = k => {
          const now = new Date(), sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          b.querySelector("[data-custom]").hidden = k !== "custom";
          if (k === "today") show(sod, now);
          if (k === "yesterday") show(new Date(sod - D.DAY), new Date(sod - 1000));
          if (k === "7d") show(new Date(sod - 6 * D.DAY), now);
          if (k === "month") show(new Date(now.getFullYear(), now.getMonth(), 1), now);
          if (k === "custom") custom();
        };
        const custom = () => {
          const a = b.querySelector("[data-a]").value, z = b.querySelector("[data-z]").value;
          if (!a || !z) { out.textContent = "Choose a start and end date"; return; }
          if (a > z) { out.textContent = "Start date must be before end date"; return; }
          show(new Date(a + "T00:00:00"), new Date(z + "T23:59:59"));
        };
        AX.onSeg(b.querySelector(".ax-seg"), pick);
        b.querySelector("[data-custom]").addEventListener("change", custom);
        pick("7d");
      }
    },
    {
      title: "Autocomplete Search",
      level: 2,
      desc: "Suggestions appear as you type, grouped by kind. Use arrow keys and Enter, or click a result.",
      render(b) {
        const items = [...D.sites.map(s => ({ kind: "Site", label: s.name, sub: s.region })), ...D.devices.map(d => ({ kind: "Device", label: `${d.id} ${d.name}`, sub: d.site }))];
        b.innerHTML = `<div style="position:relative"><input class="ax-input" placeholder="Search sites and devices..." style="width:100%" role="combobox" aria-expanded="false" aria-label="Search"><ul class="ax-list" role="listbox" hidden style="position:absolute;left:0;right:0;top:36px;z-index:5;background:#fff;border:1px solid var(--rv-border);border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.12);max-height:220px;overflow:auto;padding:4px 0"></ul></div><div class="ax-small" data-pick style="margin-top:10px"></div>`;
        const input = b.querySelector("input"), list = b.querySelector("ul");
        let hits = [], at = -1;
        const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); };
        const choose = i => { const h = hits[i]; input.value = h.label; close(); b.querySelector("[data-pick]").innerHTML = `Selected <span class="ax-pill ax-pill--info">${h.kind}</span> <strong>${h.label}</strong> <span class="ax-muted">${h.sub}</span>`; };
        const draw = () => {
          list.innerHTML = hits.map((h, i) => `<li role="option" data-i="${i}" style="padding:7px 12px;cursor:pointer;border:0;background:${i === at ? "var(--rv-primary-soft)" : ""}"><span>${h.label.replace(new RegExp(input.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), m => `<strong>${m}</strong>`)} <span class="ax-muted ax-small">${h.sub}</span></span><span class="ax-small ax-muted">${h.kind}</span></li>`).join("") || '<li class="ax-muted" style="padding:7px 12px;border:0">No results</li>';
          list.hidden = false; input.setAttribute("aria-expanded", "true");
        };
        input.addEventListener("input", () => { const q = input.value.trim().toLowerCase(); if (!q) return close(); hits = items.filter(i => i.label.toLowerCase().includes(q)).slice(0, 8); at = 0; draw(); });
        input.addEventListener("keydown", e => {
          if (list.hidden || !hits.length) return;
          if (e.key === "ArrowDown") { at = (at + 1) % hits.length; draw(); e.preventDefault(); }
          if (e.key === "ArrowUp") { at = (at - 1 + hits.length) % hits.length; draw(); e.preventDefault(); }
          if (e.key === "Enter") choose(at);
          if (e.key === "Escape") close();
        });
        list.addEventListener("mousedown", e => { const li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); choose(+li.dataset.i); } });
        input.addEventListener("blur", close);
      }
    },
    {
      title: "Validated Form",
      level: 3,
      desc: "Field rules checked as you type and on submit. Valid data is saved as a new row with insertDataToTable().",
      render(b) {
        b.innerHTML = `<form novalidate style="display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;font-size:12.5px">
          <label style="display:grid;gap:4px">Device ID<input class="ax-input" name="id" placeholder="DEV-1234"></label>
          <label style="display:grid;gap:4px">Site<select class="ax-select" name="site"><option value="">Choose...</option>${D.sites.map(s => `<option>${s.name}</option>`).join("")}</select></label>
          <label style="display:grid;gap:4px">High threshold °C<input class="ax-input" name="high" type="number"></label>
          <label style="display:grid;gap:4px">Contact email<input class="ax-input" name="email" type="email" placeholder="name@company.com"></label>
          <label style="display:grid;gap:4px;grid-column:span 2">Notes <span class="ax-muted" data-count>0 / 120</span><textarea class="ax-input" name="notes" rows="2" maxlength="120"></textarea></label>
          <div style="grid-column:span 2" class="ax-row ax-row--between"><span class="ax-small ax-muted">All fields except notes are required</span><button class="ax-btn ax-btn--primary" type="submit">Save device</button></div>
        </form>`;
        const form = b.querySelector("form");
        const rules = {
          id: v => (/^DEV-\d{4}$/.test(v) ? "" : "Format must be DEV- followed by 4 digits"),
          site: v => (v ? "" : "Choose a site"),
          high: v => (v === "" ? "Required" : +v < -20 || +v > 120 ? "Must be between -20 and 120" : ""),
          email: v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email")
        };
        const check = (name, show) => {
          const f = form.elements[name], err = rules[name](f.value.trim());
          let msg = f.parentElement.querySelector(".ax-err");
          if (!msg) msg = AX.add(f.parentElement, `<span class="ax-err ax-small" style="color:var(--rv-bad)"></span>`);
          msg.textContent = show ? err : "";
          f.style.borderColor = show && err ? "var(--rv-bad)" : "";
          return !err;
        };
        form.addEventListener("input", e => {
          if (e.target.name === "notes") b.querySelector("[data-count]").textContent = `${e.target.value.length} / 120`;
          else if (rules[e.target.name] && e.target.dataset.touched) check(e.target.name, true);
        });
        form.addEventListener("focusout", e => { if (rules[e.target.name]) { e.target.dataset.touched = 1; check(e.target.name, true); } });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const ok = Object.keys(rules).map(n => check(n, true)).every(Boolean);
          if (!ok) return AX.toast("Please fix the highlighted fields", "bad");
          const row = Object.fromEntries(new FormData(form));
          AX.rv("insertDataToTable", "Devices", "onInsertResult", JSON.stringify(row));
          form.reset();
          form.querySelectorAll(".ax-err").forEach(x => { x.textContent = ""; });
          form.querySelectorAll("[data-touched]").forEach(x => { delete x.dataset.touched; });
          b.querySelector("[data-count]").textContent = "0 / 120";
        });
      }
    },
    {
      title: "Persistent Checklist",
      level: 3,
      desc: "Shift handover checklist with progress. Ticks are remembered in this browser and survive a reload.",
      render(b) {
        const KEY = "ax-checklist-v1";
        const items = ["Walk the plant floor", "Check chiller pressures", "Review open alarms", "Confirm backup generator status", "Update shift log", "Hand over keys"];
        const done = new Set(store.get(KEY, []));
        b.innerHTML = `<div class="ax-row ax-row--between ax-small" style="margin-bottom:6px"><span data-p></span><button class="ax-btn ax-btn--sm" data-reset>Reset</button></div><div class="ax-bar" style="margin-bottom:10px"><div></div></div><ul class="ax-list"></ul>`;
        const draw = () => {
          b.querySelector("ul").innerHTML = items.map((t, i) => `<li style="justify-content:flex-start"><label style="display:flex;gap:10px;align-items:center;cursor:pointer;${done.has(i) ? "text-decoration:line-through;color:var(--rv-muted)" : ""}"><input type="checkbox" data-i="${i}" ${done.has(i) ? "checked" : ""}> ${t}</label></li>`).join("");
          b.querySelector("[data-p]").innerHTML = `<strong>${done.size}</strong> of ${items.length} complete`;
          b.querySelector(".ax-bar > div").style.width = (done.size / items.length) * 100 + "%";
          store.set(KEY, [...done]);
        };
        b.addEventListener("change", e => { const i = +e.target.dataset.i; e.target.checked ? done.add(i) : done.delete(i); if (done.size === items.length) AX.toast("Checklist complete", "good"); draw(); });
        b.querySelector("[data-reset]").addEventListener("click", () => { done.clear(); draw(); });
        draw();
      }
    },
    {
      title: "Kanban Board",
      level: 3,
      wide: true,
      desc: "Drag work orders between columns to change their status. Column counts update as cards move.",
      render(b) {
        const cols = ["To do", "In progress", "Waiting on parts", "Done"];
        const cards = [["WO-2281", "Replace filter, AHU-2", 0, "minor"], ["WO-2284", "Recalibrate CO₂ sensor", 0, "minor"], ["WO-2287", "Compressor B trip investigation", 1, "critical"], ["WO-2290", "Pump 3 seal leak", 2, "major"], ["WO-2291", "Chiller 2 annual service", 1, "major"], ["WO-2275", "Lighting zone A timer", 3, "minor"]]
          .map(([id, t, col, sev]) => ({ id, t, col, sev }));
        const sevC = { critical: "bad", major: "warn", minor: "info" };
        const board = AX.add(b, `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px"></div>`);
        let dragId = null;
        const draw = () => {
          board.innerHTML = cols.map((c, ci) => `
            <div data-col="${ci}" style="background:var(--rv-bg);border-radius:8px;padding:8px;min-height:200px;transition:background .15s">
              <div class="ax-row ax-row--between ax-small" style="font-weight:600;margin-bottom:8px"><span>${c}</span><span class="ax-muted">${cards.filter(k => k.col === ci).length}</span></div>
              ${cards.filter(k => k.col === ci).map(k => `<div draggable="true" data-id="${k.id}" style="background:#fff;border:1px solid var(--rv-border);border-radius:7px;padding:8px 10px;margin-bottom:6px;cursor:grab;font-size:12.5px"><div class="ax-row ax-row--between"><span class="ax-muted ax-small">${k.id}</span><span class="ax-pill ax-pill--${sevC[k.sev]}">${k.sev}</span></div><div style="margin-top:4px">${k.t}</div></div>`).join("")}
            </div>`).join("");
        };
        board.addEventListener("dragstart", e => { dragId = e.target.dataset.id; e.dataTransfer.effectAllowed = "move"; e.target.style.opacity = 0.4; });
        board.addEventListener("dragend", e => { e.target.style.opacity = 1; });
        board.addEventListener("dragover", e => { const col = e.target.closest("[data-col]"); if (col) { e.preventDefault(); board.querySelectorAll("[data-col]").forEach(x => { x.style.background = x === col ? "var(--rv-primary-soft)" : "var(--rv-bg)"; }); } });
        board.addEventListener("drop", e => {
          const col = e.target.closest("[data-col]");
          if (!col || !dragId) return;
          e.preventDefault();
          const card = cards.find(k => k.id === dragId), to = +col.dataset.col;
          if (card.col !== to) { card.col = to; AX.toast(`${card.id} moved to ${cols[to]}`); }
          dragId = null;
          draw();
        });
        draw();
      }
    },
    {
      title: "Calendar Month View",
      level: 3,
      desc: "Month grid with events. Move between months and click a day to list its events.",
      render(b) {
        const r = D.rng(88), kinds = [["Service", "primary"], ["Inspection", "good"], ["Outage", "bad"], ["Delivery", "warn"]];
        const base = new Date(); base.setDate(1);
        const events = Array.from({ length: 40 }, (_, i) => { const d = new Date(base.getFullYear(), base.getMonth() - 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 28)); const k = kinds[Math.floor(r() * 4)]; return { day: F.iso(d), kind: k[0], c: k[1], t: `${k[0]}: ${D.sites[i % 8].name}` }; });
        let view = new Date(base), sel = F.iso(new Date());
        b.innerHTML = `<div class="ax-row ax-row--between" style="margin-bottom:8px"><button class="ax-btn ax-btn--sm" data-m="-1">‹</button><strong data-title></strong><button class="ax-btn ax-btn--sm" data-m="1">›</button></div><div data-grid style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:11.5px"></div><ul class="ax-list ax-small" data-list style="margin-top:8px"></ul>`;
        const draw = () => {
          const y = view.getFullYear(), m = view.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
          b.querySelector("[data-title]").textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });
          b.querySelector("[data-grid]").innerHTML = D.days.map(d => `<div class="ax-muted" style="text-align:center;padding:2px 0">${d[0]}</div>`).join("") + "<div></div>".repeat(first) +
            Array.from({ length: days }, (_, i) => {
              const iso = F.iso(new Date(y, m, i + 1)), ev = events.filter(e => e.day === iso), today = iso === F.iso(new Date());
              return `<button data-d="${iso}" style="aspect-ratio:1.2;border:1px solid ${iso === sel ? "var(--rv-primary)" : "var(--rv-border)"};border-radius:5px;background:${today ? "var(--rv-primary-soft)" : "#fff"};font:inherit;font-size:11.5px;cursor:pointer;padding:2px;display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-weight:${today ? 700 : 400}">${i + 1}</span><span style="display:flex;gap:2px">${ev.slice(0, 3).map(e => `<span style="width:5px;height:5px;border-radius:50%;background:var(--rv-${e.c})"></span>`).join("")}</span></button>`;
            }).join("");
          const ev = events.filter(e => e.day === sel);
          b.querySelector("[data-list]").innerHTML = `<li><strong>${new Date(sel + "T00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</strong><span class="ax-muted">${ev.length} event(s)</span></li>` + ev.map(e => `<li><span>${e.t}</span><span class="ax-pill ax-pill--${e.c === "primary" ? "info" : e.c}">${e.kind}</span></li>`).join("");
        };
        b.addEventListener("click", e => {
          const btn = e.target.closest("button");
          if (!btn) return;
          if (btn.dataset.m) view = new Date(view.getFullYear(), view.getMonth() + +btn.dataset.m, 1);
          if (btn.dataset.d) sel = btn.dataset.d;
          draw();
        });
        draw();
      }
    },
    {
      title: "Gantt Schedule",
      level: 3,
      wide: true,
      desc: "Maintenance tasks as bars across the next four weeks, with progress fill, a today line and overdue flags.",
      render(b) {
        const DAYS = 28, start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 5);
        const tasks = [["Chiller 2 annual service", 0, 6, 1, "Sydney Plant"], ["Firmware rollout v2.4", 3, 14, 0.4, "All sites"], ["Pump 3 seal replacement", 1, 3, 0.2, "Perth Terminal"], ["Sensor recalibration", 8, 7, 0, "Melbourne Depot"], ["Solar inverter inspection", 12, 4, 0, "Brisbane Hub"], ["Safety audit", 18, 6, 0, "Adelaide Works"], ["Battery replacements", 6, 10, 0.1, "Townsville Yard"]];
        const today = 5;
        b.innerHTML = `<div style="overflow-x:auto"><div style="min-width:720px">
          <div style="display:grid;grid-template-columns:200px 1fr;font-size:11px" class="ax-muted"><div></div><div style="display:grid;grid-template-columns:repeat(${DAYS},1fr)">${Array.from({ length: DAYS }, (_, i) => { const d = new Date(start.getTime() + i * D.DAY); return `<div style="text-align:center;border-left:1px solid ${d.getDay() === 1 ? "var(--rv-border)" : "transparent"}">${d.getDay() === 1 || i === 0 ? F.date(d) : ""}</div>`; }).join("")}</div></div>
          ${tasks.map(([t, s, len, p, site]) => {
            const overdue = s + len <= today && p < 1;
            return `<div style="display:grid;grid-template-columns:200px 1fr;align-items:center;border-top:1px solid var(--rv-border);min-height:36px">
              <div style="font-size:12.5px;padding-right:8px">${t}<div class="ax-small ax-muted">${site}</div></div>
              <div style="position:relative;height:36px;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(100%/${DAYS} - 1px),#f4f4f5 calc(100%/${DAYS} - 1px),#f4f4f5 calc(100%/${DAYS}))">
                <div title="${t}: ${Math.round(p * 100)}% complete" style="position:absolute;top:9px;height:18px;left:${(s / DAYS) * 100}%;width:${(len / DAYS) * 100}%;border-radius:4px;background:${overdue ? "var(--rv-bad-soft)" : "#e0e7ff"};border:1px solid ${overdue ? "var(--rv-bad)" : "#818cf8"};overflow:hidden">
                  <div style="height:100%;width:${p * 100}%;background:${p === 1 ? "var(--rv-good)" : overdue ? "var(--rv-bad)" : "var(--rv-primary)"};opacity:.75"></div>
                </div>
                <div style="position:absolute;top:0;bottom:0;left:${((today + 0.5) / DAYS) * 100}%;width:2px;background:var(--rv-bad)"></div>
              </div></div>`;
          }).join("")}
        </div></div><div class="ax-ctl ax-small" style="margin-top:8px"><span><span style="display:inline-block;width:2px;height:10px;background:var(--rv-bad)"></span> Today</span><span class="ax-pill ax-pill--good">Complete</span><span class="ax-pill ax-pill--info">Scheduled / in progress</span><span class="ax-pill ax-pill--bad">Overdue</span></div>`;
      }
    },
    {
      title: "Notes Thread",
      level: 3,
      desc: "Add timestamped notes against an asset, with the author taken from the logged-in Rayven user.",
      render(b) {
        let me = "Demo User";
        if (!AX_DEMO && typeof getUserDetails === "function") {
          window.axNotesUser = r => { me = r?.name || r?.user?.name || me; };
          getUserDetails("axNotesUser");
        }
        const notes = [{ who: "Sam Lee", t: Date.now() - 5 * D.HOUR, text: "Vibration on Pump 3 higher than usual, monitoring." }, { who: "Alex Chen", t: Date.now() - 2 * D.HOUR, text: "Ordered replacement seal, ETA Thursday." }];
        b.innerHTML = `<ul class="ax-list" data-l style="max-height:180px;overflow:auto"></ul><form class="ax-row" style="margin-top:10px"><input class="ax-input" placeholder="Add a note..." style="flex:1" maxlength="200" aria-label="Note"><button class="ax-btn ax-btn--primary" type="submit">Post</button></form>`;
        const initials = n => n.split(" ").map(x => x[0]).join("").slice(0, 2);
        const draw = () => {
          b.querySelector("[data-l]").innerHTML = notes.map(n => `<li style="align-items:flex-start;justify-content:flex-start;gap:10px"><span style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--rv-primary-soft);color:var(--rv-primary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${initials(n.who)}</span><span><strong>${F.esc(n.who)}</strong> <span class="ax-small ax-muted">${F.dateTime(n.t)}</span><br>${F.esc(n.text)}</span></li>`).join("");
          const l = b.querySelector("[data-l]"); l.scrollTop = l.scrollHeight;
        };
        b.querySelector("form").addEventListener("submit", e => {
          e.preventDefault();
          const input = b.querySelector("input"), text = input.value.trim();
          if (!text) return;
          notes.push({ who: me, t: Date.now(), text });
          input.value = "";
          draw();
        });
        draw();
      }
    },
    {
      title: "Role-Aware Panel",
      level: 3,
      desc: "Shows different actions for different user groups, plus quick links that navigate with linkToInterface().",
      render(b) {
        const roles = { viewer: ["View dashboards"], operator: ["View dashboards", "Acknowledge alarms", "Start / stop equipment"], engineer: ["View dashboards", "Acknowledge alarms", "Start / stop equipment", "Edit thresholds", "Manage devices"] };
        const all = roles.engineer;
        b.innerHTML = `<div class="ax-ctl">Preview as ${AX.seg([["viewer", "Viewer"], ["operator", "Operator"], ["engineer", "Engineer"]], "operator")}</div>
          <div data-who class="ax-small" style="margin-bottom:8px"></div><ul class="ax-list" data-caps></ul>
          <div class="ax-small ax-muted" style="margin:10px 0 6px">Quick links</div>
          <div class="ax-row" style="flex-wrap:wrap;gap:6px">${[["101,Site Overview", "Site overview"], ["102,Alarms", "Alarms"], ["103,Reports", "Reports"]].map(([v, l]) => `<button class="ax-btn ax-btn--sm" data-link="${v}">${l} →</button>`).join("")}</div>`;
        const draw = role => {
          b.querySelector("[data-who]").innerHTML = `Signed in as <strong>Demo User</strong> · group <span class="ax-pill ax-pill--info">${role}</span>`;
          b.querySelector("[data-caps]").innerHTML = all.map(c => { const ok = roles[role].includes(c); return `<li style="opacity:${ok ? 1 : 0.45}"><span>${c}</span><span class="${ok ? "ax-up" : "ax-muted"}">${ok ? "✓ Allowed" : "Hidden"}</span></li>`; }).join("");
        };
        AX.onSeg(b.querySelector(".ax-seg"), draw);
        b.addEventListener("click", e => { if (e.target.dataset.link) AX.rv("linkToInterface", e.target.dataset.link); });
        draw("operator");
      }
    },
    {
      title: "Alert Rule Builder",
      level: 3,
      wide: true,
      desc: "Build an alert rule from conditions joined by AND or OR, choose the action, preview the JSON and send it to a workflow.",
      render(b) {
        const metrics = [["temp", "Temperature °C"], ["humidity", "Humidity %"], ["power", "Power kW"], ["battery", "Battery %"], ["alerts", "Open alerts"]];
        const ops = [[">", "is above"], ["<", "is below"], [">=", "is at least"], ["<=", "is at most"], ["==", "equals"]];
        const rule = { name: "High temp, low battery", join: "AND", conditions: [{ metric: "temp", op: ">", value: 30 }, { metric: "battery", op: "<", value: 20 }], action: "notify", target: "Operations" };
        const opt = (list, v) => list.map(([k, l]) => `<option value="${k}" ${k === v ? "selected" : ""}>${l}</option>`).join("");
        const wrap = AX.add(b, `<div style="display:grid;grid-template-columns:3fr 2fr;gap:14px"></div>`);
        const left = AX.add(wrap, "<div></div>"), right = AX.add(wrap, `<div></div>`);
        const matches = () => D.devices.filter(d => {
          const res = rule.conditions.map(c => { const v = d[c.metric], x = +c.value; return { ">": v > x, "<": v < x, ">=": v >= x, "<=": v <= x, "==": v === x }[c.op]; });
          return rule.join === "AND" ? res.every(Boolean) : res.some(Boolean);
        });
        const draw = () => {
          left.innerHTML = `
            <label class="ax-small" style="display:grid;gap:4px;margin-bottom:10px">Rule name<input class="ax-input" data-f="name" value="${F.esc(rule.name)}"></label>
            <div class="ax-ctl">Trigger when ${AX.seg([["AND", "all"], ["OR", "any"]], rule.join)} of these are true:</div>
            ${rule.conditions.map((c, i) => `<div class="ax-ctl" data-c="${i}">
              <select class="ax-select" data-k="metric">${opt(metrics, c.metric)}</select><select class="ax-select" data-k="op">${opt(ops, c.op)}</select>
              <input class="ax-input" type="number" data-k="value" value="${c.value}" style="width:80px"><button class="ax-btn ax-btn--sm" data-rm="${i}" ${rule.conditions.length < 2 ? "disabled" : ""} aria-label="Remove condition">✕</button></div>`).join("")}
            <button class="ax-btn ax-btn--sm" data-add>+ Add condition</button>
            <div class="ax-ctl" style="margin-top:12px">Then <select class="ax-select" data-f="action">${opt([["notify", "send a notification to"], ["email", "email"], ["ticket", "raise a work order for"]], rule.action)}</select>
            <select class="ax-select" data-f="target">${opt([["Operations", "Operations"], ["Maintenance", "Maintenance"], ["Site manager", "Site manager"]], rule.target)}</select></div>`;
          const hit = matches();
          right.innerHTML = box(`<div class="ax-small ax-muted">Would trigger right now for</div><div style="font-size:22px;font-weight:700">${hit.length} device${hit.length === 1 ? "" : "s"}</div><div class="ax-small ax-muted" style="max-height:44px;overflow:auto">${hit.slice(0, 12).map(d => d.id).join(", ")}${hit.length > 12 ? "..." : ""}</div>`, "margin-bottom:10px") +
            `<pre style="background:#18181b;color:#f2f2f4;padding:10px;border-radius:8px;font-size:11px;overflow:auto;max-height:170px;margin:0 0 10px">${F.esc(JSON.stringify(rule, null, 2))}</pre><button class="ax-btn ax-btn--primary" data-send style="width:100%">Save rule to workflow</button>`;
        };
        left.addEventListener("change", e => {
          const c = e.target.closest("[data-c]");
          if (c && e.target.dataset.k) rule.conditions[+c.dataset.c][e.target.dataset.k] = e.target.dataset.k === "value" ? +e.target.value : e.target.value;
          if (e.target.dataset.f) rule[e.target.dataset.f] = e.target.value;
          draw();
        });
        left.addEventListener("click", e => {
          const s = e.target.closest(".ax-seg button");
          if (s) { rule.join = s.dataset.v; draw(); }
          if (e.target.dataset.rm) { rule.conditions.splice(+e.target.dataset.rm, 1); draw(); }
          if (e.target.dataset.add !== undefined) { rule.conditions.push({ metric: "power", op: ">", value: 25 }); draw(); }
        });
        right.addEventListener("click", e => {
          if (e.target.dataset.send === undefined) return;
          if (!rule.name.trim()) return AX.toast("Give the rule a name first", "bad");
          AX.rv("pushPayload", { rule }, 205813, "default");
        });
        draw();
      }
    }
  ]);
})();
