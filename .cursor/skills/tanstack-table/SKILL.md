---
name: tanstack-table
description: >-
  TanStack Table v8 for this WeWeb element (gw-tanstack-table): useVueTable, column defs,
  filtering, row models, WeWeb bindings. Use when editing wwElement.vue, ww-config.js,
  test/ formulas, @tanstack/vue-table, vue-table, FlexRender, column filters, quick filter,
  or comparing to AG Grid patterns.
---

# TanStack Table v8 — gw-tanstack-table

## TanStack “official” agent skills (Intent) vs this file

- **TanStack Intent** ships **`SKILL.md` files inside some npm packages** and syncs them via `npx @tanstack/intent install` into `AGENTS.md`, `.cursorrules`, etc. See [Agent Skills (TanStack AI / Intent overview)](https://tanstack.com/ai/latest/docs/getting-started/agent-skills) and [TanStack Intent docs](https://tanstack.com/intent/latest/docs/overview). The [skills registry](https://tanstack.com/intent/registry) lists intent-enabled packages.
- **`@tanstack/vue-table` / `@tanstack/table-core`** in this repo do **not** include an embedded `skills/` tree (no substitute for this project skill today). If TanStack publishes Table skills later, prefer loading those **and** keep this file for **WeWeb-specific** behaviour.

## Not the same as “Code Mode with Skills”

- [Code Mode with Skills](https://tanstack.com/ai/latest/docs/code-mode/code-mode-with-skills) documents **`@tanstack/ai-code-mode-skills`** — runtime skills for **TanStack AI Code Mode** (LLM inside a sandbox), **not** Cursor Agent Skills.
- **Do not** add `@tanstack/ai-code-mode-skills` (or `@tanstack/ai`) to this **WeWeb component library** unless the product actually uses TanStack AI in app code. It would not improve the table element and would bloat dependencies.

## Authoritative TanStack Table v8 documentation

Read these in order when changing table behaviour:

1. [Vue Table — `useVueTable`, `FlexRender`](https://tanstack.com/table/v8/docs/framework/vue/vue-table)
2. [Column definitions](https://tanstack.com/table/v8/docs/guide/column-defs) — `accessorKey`, `accessorFn` + `id`, headers, `filterFn` / `meta`
3. [Row models](https://tanstack.com/table/v8/docs/guide/row-models) — `getCoreRowModel()`, chaining filtered/sorted/paginated models
4. [Filtering](https://tanstack.com/table/v8/docs/guide/filtering) — global vs column filters, `getFilteredRowModel()`, filter state
5. [Column filtering](https://tanstack.com/table/v8/docs/api/features/column-filtering) — `columnFilters`, `enableColumnFilters`, custom `filterFn`

Optional later features (not fully wired in README “limits” may lag code — check `wwElement.vue`):

- [Sorting](https://tanstack.com/table/v8/docs/guide/sorting)
- Row virtualisation

## APIs and patterns used in **this** codebase

Follow **actual imports and options** in `src/wwElement.vue`:

- **Table factory:** `useVueTable` from `@tanstack/vue-table`
- **Row models:** `getCoreRowModel()`, `getFilteredRowModel()`, optional `getPaginationRowModel()`
- **Rendering:** `FlexRender`, embedded **`wwElement`** for `meta.gwWwTemplateKey` cells; `functionalUpdate` for controlled state updaters
- **Table options in use (typical):** `enableColumnFilters`, `enableFilters`, `filterFns` (e.g. `gwEnumSet`, `gwBoolean`, `gwNumberExact`), `columnResizeMode`, `enableColumnResizing`, `onColumnSizingChange`, `onColumnFiltersChange`, `defaultColumn` sizing; pagination when enabled; when selection is on: `enableRowSelection`, `enableMultiRowSelection`, `getRowId`, `onRowSelectionChange`
- **Data / columns:** use **getters** `get data() { return tableData.value }` and `get columns() { return tableColumns.value }` — do **not** pass `shallowRef` as `data`/`columns` directly (Vue adapter `IS_REACTIVE` pitfall → zero rows). See comments in `wwElement.vue`.
- **Column defs:** `mapColumnDef` accepts AG Grid–like `{ field, headerName }` but TanStack-native shape is `{ accessorKey, header }` or `accessorFn` + `id`.

## WeWeb project conventions

| Area | Location |
|------|----------|
| Element implementation | `src/wwElement.vue` — sanitize rows, unwrap bindings, `buildColumns` / `mapColumnDef`, table state, template |
| Editor bindings / properties | `ww-config.js` — `rowData`, `columnDefs`, `cellWwTemplates`, `quickFilterText`, `enableRowSelection`, `rowIdField`, appearance, triggers (`table-ready`, `row-clicked`, `selection-changed`, `cell-value-changed`) |
| Example formula sources | `test/row-data.js`, `test/column-defs.js`, `test/appearance.js`, `test/quick-filter.js` |

**Binding pitfalls:** unwrap array/text bindings (`coerceBoundText` for quick filter — avoid `[object Object]`). Bind **columnDefs** to the correct property or headers infer from the first row only.

**WeWeb cells:** `mapColumnDef` sets `meta.gwWwTemplateKey` from `gwWwTemplateKey` or `meta.gwWwTemplateKey`. Template wins over `gwEditable`. Template: `<component :is="'wwElement'" v-bind="descriptor" :ww-props="..." />` (global `wwElement` at runtime). Registry: `content.cellWwTemplates[key]`.

**Triggers:** `emitWorkflow` sends `{ name, event, payload }` to match WeWeb (`event` is what workflows usually bind).

**Appearance (`appearanceJson`):** `normalizeAppearance` maps shell (`root*`, `scroll*`, `table*`), rows (`rowStyle`, `bodyRow*`, odd/even), cells (`headerCell*` / `bodyCell*` or legacy `headerStyle` / `cellStyle` + `*Class`), filter UI (`filterTrigger*`, `filterPanel*`, `filterInput*`), selection/edit inputs (`selectionCheckbox*`, `editableInput*`), pagination (`pagination*`), sticky (`stickyHeader`, `stickyHeaderTop`). Panel position keys set by the element override user `filterPanelStyle` for anchor geometry.

## Mental model: not AG Grid

TanStack Table is **headless**. There is no `gridOptions` blob; configuration is **`useVueTable({ ... })`** plus row models and column defs. Extend features by **TanStack v8 APIs** and keep WeWeb-specific unwrapping consistent with existing helpers.
