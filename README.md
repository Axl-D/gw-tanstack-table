# gw-tanstack-table — WeWeb coded element

[TanStack Table](https://tanstack.com/table/v8/docs/framework/vue/vue-table) (`@tanstack/vue-table`) wrapped as a **WeWeb element**: bind **row data**, **columns**, **quick filter**, **appearance**, and layout modes—similar ergonomics to `gw-ag-grid`, without AG Grid.

## Dev

```bash
npm install
npm run serve
```

WeWeb: **Dev** → **Open Dev Editor** → **Add local Element** → port (see [development process](https://developer.weweb.io/development-process.html)).

## Publish

Push to GitHub, attach **source code** in the WeWeb dashboard, drag the component from **Dev** (normal editor).

```bash
npm run build
```

## Bindings

| Property | Role |
|----------|------|
| **Row data** | Array of records |
| **Column definitions** | TanStack `ColumnDef` shapes, or `{ field, headerName }` like AG Grid |
| **Cell WeWeb templates** | Object map: template id → WeWeb element (`isWwObject` + `type`). Column `meta.gwWwTemplateKey` (or `gwWwTemplateKey`) picks the entry; cells get `:ww-props` `{ cellValue, rowData, rowId, columnId, accessorKey }` |
| **Quick filter** | Client-side substring match over `JSON.stringify(row)` |
| **Appearance** | `headerStyle`, `cellStyle`, `rowStyle`, `oddRowStyle` / `evenRowStyle`, `headerClass`, `cellClass` (plain objects / strings) |
| **Height in layout** | Fill / fit content / fixed (+ optional fill min-height CSS) |

Workflows: **Table ready** (`rowCount`), **Row clicked** (`data`, `rowId`), **Selection changed**, **Cell value changed**. Custom triggers pass data on the **`event`** property (and `payload` alias) of the `trigger-event` object.

## Test formulas (`test/`)

Example WeWeb formula sources (same row dataset as `gw-ag-grid/test`): **`row-data.js`**, **`column-defs.js`**, **`cell-ww-templates.js`** (map for `cellWwTemplates`), **`appearance.js`**, **`quick-filter.js`**.

## Limits

Row virtualisation and column **sorting** UI are not wired in this element yet (filters, pagination, selection, resizable columns, and inline edit are). Extend via `useVueTable` in `wwElement.vue` when needed.
