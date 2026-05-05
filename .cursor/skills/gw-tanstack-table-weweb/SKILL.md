---
name: gw-tanstack-table-weweb
description: >-
  gw-tanstack-table: WeWeb coded element wrapping TanStack Table v8. Row/column bindings, client
  filter→paginate pipeline, selection, cell WeWeb templates (wwElement), workflows/trigger-event
  shape, ww-config overview. Load ../tanstack-table/SKILL.md for TanStack doc URLs and Intent notes.
---

# gw-tanstack-table — WeWeb element

**What it is:** A **WeWeb coded element** (Vue 3 SFC + `ww-config.js`) that wraps [**TanStack Table v8**](https://tanstack.com/table/v8/docs/framework/vue/vue-table) (`@tanstack/vue-table`). Same product family as **`gw-ag-grid`** (Guestwhat): bind rows/columns in the editor, drive workflows from table events—**no AG Grid** here; the UI is a plain `<table>` you control in `src/wwElement.vue`.

**WeWeb component contract:** `props`: **`uid`** (required), **`content`**, and in editor builds **`wwEditorState`** inside `/* wwEditor:start */` … `/* wwEditor:end */`. Filter popover code uses **`wwLib.getFrontWindow()`** / **`wwLib.getFrontDocument()`** when available.

**Repo layout:** `src/wwElement.vue` (behavior + template), `ww-config.js` (editor properties + `triggerEvents`), `test/*.js` (formula fixtures mirroring `gw-ag-grid/test`).

**Deeper TanStack/agent context:** use **[tanstack-table](../tanstack-table/SKILL.md)** (Intent vs Code Mode, official Table doc links, column-def patterns).

---

## How the table is supposed to work

### Data pipeline

1. **`content.rowData`** — bound array of row objects. Helpers unwrap WeWeb `{ value: … }` bindings so TanStack always sees a real array (`sanitizeRows` / `unwrapArrayBinding`).
2. **`content.columnDefs`** — JSON-safe column definitions. **`buildColumns` → `mapColumnDef`**: supports TanStack `{ accessorKey, header, … }` and AG Grid–style `{ field, headerName }`. Functions in defs are stripped (`stripFunctionsDeep`); use plain JSON from formulas.
3. **`useVueTable`** — **getters** `get data()` / `get columns()` return `tableData.value` / `tableColumns.value` (do **not** pass `shallowRef` as `data`/`columns`—Vue adapter `IS_REACTIVE` bug → zero rows).
4. **Row models (order matters):** **`getCoreRowModel()` → `getFilteredRowModel()` → optional `getPaginationRowModel()`** when pagination is on. Filtering applies to the **full** bound dataset; pagination slices the **filtered** rows. **Quick filter** (substring on `JSON.stringify(row)`) runs **before** that chain on the copied row list.

### Features (as implemented)

| Area | Behavior |
|------|----------|
| **Column filters** | Popover (`Teleport` to `body`), per-column header trigger; variants `text` / `enum` / `boolean` / `number` / `none` via `filterVariant` + `meta`. **Anchored** under the header cell (`gw-ts-th`), repositioned on scroll/resize/column resize. |
| **Pagination** | Optional; **`enablePagination`**, `pageSize`, `pageSizeOptions`, `showPaginationSummary`. Footer controls in `.gw-ts-pagination`. Changing filters resets page index. |
| **Row selection** | Optional checkbox column; **`getRowId`** from **`rowIdField`** (default `id`). Selection IDs stable across pages. |
| **Inline edit** | Column `editable: true` → text input + **`cell-value-changed`** workflow. |
| **WeWeb cells** | Column **`gwWwDropzoneTarget`** (string id). Shared dropped tree **`content.cellWwSlot`**; **`wwLayout path="cellWwSlot"`**. **`ww-props` / context:** `dropzoneTarget`, `cellValue`, `rowData`, ids — branch slot UI by `dropzoneTarget`. **Wins over `editable`**. Legacy **`gwWwTemplateKey: '_slot'`** → target **`_slot`**. |
| **Appearance** | **`appearanceJson`** → `normalizeAppearance`: root/scroll/table, header/body cells, rows, filter UI, selection/edit inputs, **pagination bar**, sticky header. |
| **Layout** | **`layoutSizing`**: fill / autoHeight / fixed + optional **`height`**, **`fillMinHeightCss`**. |

### Not wired (extend in `wwElement.vue` if needed)

- Column **sorting** UI / state  
- **Row virtualisation**  

---

## `ww-config.js` — properties (cheat sheet)

| Property | Role |
|----------|------|
| `rowData` | Array of records |
| `columnDefs` | Column defs (TanStack or `{ field, headerName }`) |
| `cellWwSlot` | Hidden content field: array of dropped WeWeb nodes for **\_slot** columns (canvas dropzones) |
| `enableRowSelection`, `rowIdField` | Checkbox column + stable ids |
| `enablePagination`, `pageSize`, `pageSizeOptions`, `showPaginationSummary` | Client pagination |
| `quickFilterText` | Global substring filter (bindings coerced to text) |
| `stickyHeader` | Pin header (overridable via appearance) |
| `appearanceJson` | Styling JSON (see main skill + tooltips) |
| `layoutSizing`, `fillMinHeightCss`, `height` | Container height behavior |

---

## Workflows (`triggerEvents`)

All emits go through **`emitWorkflow`**:

`emit('trigger-event', { name, event: data, payload: data })`

Official coded elements (e.g. **ww-stack**) expose workflow data on **`event`**, not only `payload`. **Bind workflows to `Event`** (both keys are set for compatibility).

| Name | Typical `event` payload |
|------|-------------------------|
| `table-ready` | `{ rowCount }` (filtered count) |
| `row-clicked` | `{ data, rowId }` |
| `selection-changed` | `{ selectedRowIds: string[], lastToggledId: string \| null }` |
| `cell-value-changed` | `{ data, oldValue, newValue, columnId, accessorKey }` |

---

## Local dev / publish

```bash
npm install
npm run serve   # WeWeb dev → Add local element from port
npm run build   # Ship bundle; attach source in WeWeb dashboard
```

[WeWeb development process](https://developer.weweb.io/development-process.html).

**Test fixtures:** `test/row-data.js`, `test/column-defs.js`, `test/appearance.js`, `test/quick-filter.js`.

---

## Misc

- **ResizeObserver** warnings in the browser during layout/DEV tools are usually **noise**, not a broken emit.
- Compare patterns to **`gw-ag-grid`** when migrating; this element stays **headless TanStack** (no `gridOptions` blob).
