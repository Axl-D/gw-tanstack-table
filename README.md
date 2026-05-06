# gw-tanstack-table — WeWeb coded element

[TanStack Table](https://tanstack.com/table/v8/docs/framework/vue/vue-table) (`@tanstack/vue-table`) wrapped as a **WeWeb element**: bind **row data**, **columns**, **quick filter**, **appearance**, and layout modes—similar ergonomics to `gw-ag-grid`, without AG Grid.

## Dev

```bash
npm install
npm run serve
```

WeWeb: **Dev** → **Open Dev Editor** → **Add local Element** → port (see [development process](https://developer.weweb.io/development-process.html)).

**Important:** **Open Dev Editor** is only wired for **local** bundles (`npm run serve`). Anything you imported from **GitHub** is built and registered in the **normal** editor. If you stay inside the Dev Editor, you will only see the local element — not the imported version.

## Publish & use in the **real** (non–Dev) editor

1. **Version**: bump **`version`** in `package.json` to a numeric dotted form WeWeb expects (e.g. `0.1.0`, `0.2.0`), then commit and push.
2. **Push** this repo to **GitHub** (branch WeWeb should track, e.g. `main`).
3. **Workspace** → **Components** (or **Coded components**) → **Import from GitHub** → select repo, branch, and wait until the remote **build succeeds** (fix any build errors shown in the dashboard).
4. Open the component **version** in the dashboard and set it **active** for your project (and ensure this **project** actually has that coded component **added** / enabled if your plan uses project-level installs).
5. Open the **standard project Editor** (dashboard → your project → **Editor** — **do not** use **Open Dev Editor** for this step). In the **Add** panel, open **Coded** / **Coded components** / **Development** (wording varies by UI) → find **TanStack Table (Guestwhat)** → drag it onto the page.
6. Optional: remove any **Add local Element** instance that still points at a dev port, so you are not mixing local and hosted bundles.

### If the imported element does not appear or does not drop on the canvas

| Check | What to do |
|--------|------------|
| **Wrong editor** | Use the **normal** editor, not **Open Dev Editor**. |
| **Build failed** | In the workspace **Components** tab, open the GitHub import and read **build logs**; fix errors, bump `version`, push again. |
| **Wrong place in Add** | Search the **Add** panel for `TanStack` or `Guestwhat`; coded elements are under **Coded** / **Development**, not only “Elements”. See [Components tab](https://docs.weweb.io/settings-billing-code-export/workspace-settings/components-tab.html) and [Coded components](https://docs.weweb.io/editor/development/coded-components.html). |
| **Version not active** | In the component’s version list, set the latest build **active** for the project. |
| **Runtime error** | In the browser **Console** on the page: missing `uid` or other props, or JS errors from the bundle, can block the element. Share the red error line with your team. |
| **Name mismatch** | Hosted bundle name comes from `weweb build name=gw-tanstack-table`; it must match how WeWeb registered the source. |

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
