# gw-tanstack-table — WeWeb coded element

[TanStack Table](https://tanstack.com/table/v8/docs/framework/vue/vue-table) (`@tanstack/vue-table`) wrapped as a **WeWeb element**: bind **row data**, **columns**, **quick filter**, **appearance**, and layout modes—similar ergonomics to `gw-ag-grid`, without AG Grid.

## Dev

```bash
npm install
npm run serve
```

WeWeb: **Dev** → **Open Dev Editor** → **Add local Element** → port (see [development process](https://developer.weweb.io/development-process.html)).

## Publish & use in the **real** (non–Dev) editor

1. **Version**: bump `version` in `package.json` when you ship a change WeWeb should rebuild.
2. **Push** this repo to **GitHub** (branch you want WeWeb to track, e.g. `main`).
3. **Dashboard** → your workspace → **Coded components** → **Import element** (or attach **source code** to an existing component) → pick the repo and branch.
4. Wait for WeWeb’s **build** to finish, then open the component **version** and set it as **active** for the project.
5. Open the **normal** project **Editor** (not “Open Dev Editor”), **Add** panel → **Coded components** → drag **TanStack Table (Guestwhat)** (or your registered name) onto the page.
6. Clear **local Dev** element instances if you were testing on a port, so the page uses the **published** bundle.

Local check before pushing:

```bash
npm run build
```

See also: [WeWeb — push / import coded components](https://developer.weweb.io/using-llms-to-generate-custom-coded-comps/using-cursor.html) and [development process](https://developer.weweb.io/development-process.html).

## Bindings

| Property | Role |
|----------|------|
| **Row data** | Array of records |
| **Column definitions** | TanStack `ColumnDef` shapes, or `{ field, headerName }` like AG Grid |
| **WeWeb cell dropzone** | Set **`gwWwDropzoneTarget`** on the column (string id). Renders the shared tree from `content.cellWwSlot`; `ww-props` / context include **`dropzoneTarget`** (same id), **`cellValue`**, **`rowData`**, **`rowId`**, **`columnId`**, **`accessorKey`**. Branch in the dropped UI by `dropzoneTarget`. Legacy `gwWwTemplateKey: '_slot'` maps to target **`_slot`**. ([dropzone data](https://docs.weweb.io/components/component-dropzones.html)) |
| **Quick filter** | Client-side substring match over `JSON.stringify(row)` |
| **Appearance** | `headerStyle`, `cellStyle`, `rowStyle`, `oddRowStyle` / `evenRowStyle`, `headerClass`, `cellClass` (plain objects / strings) |
| **Height in layout** | Fill / fit content / fixed (+ optional fill min-height CSS) |

Workflows: **Table ready** (`rowCount`), **Row clicked** (`data`, `rowId`), **Selection changed**, **Cell value changed**. Custom triggers pass data on the **`event`** property (and `payload` alias) of the `trigger-event` object.

## Test formulas (`test/`)

Example WeWeb formula sources (same row dataset as `gw-ag-grid/test`): **`row-data.js`**, **`column-defs.js`**, **`appearance.js`**, **`quick-filter.js`**.

## Limits

Row virtualisation and column **sorting** UI are not wired in this element yet (filters, pagination, selection, resizable columns, and inline edit are). Extend via `useVueTable` in `wwElement.vue` when needed.
