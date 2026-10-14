# Rayven Analytics

A component library of 201 analytics components for Rayven interfaces, from a single KPI tile to live process mimics. They're grouped into 11 categories, and each is tagged Simple, Intermediate or Advanced.

**Live demo: https://jared337.github.io/Rayven-Analytics/**

| Category | Components |
|---|---|
| Assorted Widgets | 24 |
| Assorted Charts | 22 |
| Time Series | 23 |
| Maps | 23 |
| Tables | 21 |
| Bar + Pie Charts | 20 |
| Extra Items | 20 |
| Mining | 12 |
| Energy | 12 |
| Water | 12 |
| Asset Management | 12 |

The design system matches the Place Performance and CBased interfaces: zinc neutrals, one indigo accent, and colour used only where it carries meaning.

## Use it in Rayven

`index.html` is a single self-contained file. Paste its contents into the Interface Builder **Code** tab.

- `AX_DEMO = true` (top of `src/core.js`) shows Rayven helper calls (`pushPayload`, `insertDataToTable`, `updateDataToTable`, `linkToInterface`) as on-screen messages instead of running them. Set it to `false` inside Rayven to call the real functions.
- All data is sample data. Swap the generators in `src/core.js` (`D`) for `getDataFromTable()` / `getDataFromAPINode()` calls to show live data.
- External libraries load from cdnjs: ECharts 5.5.0, Leaflet 1.9.4, Leaflet.markercluster and Leaflet.heat. Map tiles come from Esri, OpenStreetMap and OpenTopoMap.

## Edit it

```
src/
  shell.html        layout, design tokens and styles
  core.js           data, formatting, helpers, chart theme, gallery
  sections/*.js     one file per category
build.mjs           inlines everything into index.html
```

After editing, rebuild:

```bash
node build.mjs
```

Each component is an object in its section file:

```js
{ title: "Radial Gauge", level: 1, desc: "What it shows", wide: false, render(body) { /* draw into body */ } }
```

Use `AX.section(id, [...])` to define a category, or `AX.extend(id, [...])` to add components to an existing one.

## Notes

- Domain thresholds are typical published values and should be checked against each client's licence or standard before use. Examples include the PM10 licence limit, drinking water guideline ranges, ISO 10816 vibration zones and the AS 61000.3.100 voltage band.
- Basemap tiles are keyless providers suitable for demos. Use a licensed tile provider in production.
