/**
 * WeWeb formula → bind to **Appearance** (`appearanceJson`) on **TanStack Table (Guestwhat)**.
 * Plain objects + class strings only (see `normalizeAppearance` in `src/wwElement.vue`).
 *
 * Layout / shell
 * - rootStyle, rootClass — outer `.gw-ts-root` (merged after layout height/min-height)
 * - scrollStyle, scrollClass — `.gw-ts-scroll` scroll area
 * - tableStyle, tableClass — `<table class="gw-ts-table">`
 *
 * Rows / cells
 * - rowStyle — base row styles (every body row)
 * - bodyRowStyle, bodyRowClass — extra base styles / class on `<tr>` (merged after rowStyle)
 * - oddRowStyle / evenRowStyle — zebra (merged with rowStyle + bodyRowStyle)
 * - headerCellStyle, headerCellClass — `<th>` (aliases: headerStyle, headerClass)
 * - bodyCellStyle, bodyCellClass — `<td>` (aliases: cellStyle, cellClass)
 *
 * Filters / inputs
 * - filterTriggerStyle, filterTriggerClass — column filter icon button
 * - filterPanelStyle, filterPanelClass — teleported panel shell (position top/left/maxHeight/minWidth set by table)
 * - filterInputStyle, filterInputClass — selects + text/number inputs inside the panel
 *
 * Selection / edit (when those features are enabled)
 * - selectionCheckboxStyle, selectionCheckboxClass — row + “select all” checkboxes
 * - editableInputStyle, editableInputClass — inline `editable` cell inputs
 *
 * Pagination bar (when **Enable pagination** is on in element settings)
 * - paginationStyle, paginationClass — footer container `.gw-ts-pagination`
 * - paginationButtonStyle, paginationButtonClass — Prev / Next
 * - paginationSelectStyle, paginationSelectClass — rows-per-page `<select>`
 * - paginationSummaryStyle, paginationSummaryClass — page label + range text
 *
 * Sticky header
 * - stickyHeader — boolean (default true if omitted)
 * - stickyHeaderTop — CSS length for sticky offset (e.g. under fixed nav)
 */

return {
  /** Optional: tune shell (example keeps defaults subtle). */
  rootStyle: {},
  rootClass: '',
  scrollStyle: {},
  scrollClass: '',
  tableStyle: {},
  tableClass: '',

  rowStyle: {
    transition: 'background-color 0.15s ease',
  },

  bodyRowStyle: {},
  bodyRowClass: '',

  oddRowStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  evenRowStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },

  /** Legacy names `headerStyle` / `cellStyle` still work; canonical is headerCellStyle / bodyCellStyle. */
  headerStyle: {
    fontWeight: '600',
    fontSize: '12px',
    letterSpacing: '0.02em',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },

  cellStyle: {
    fontSize: '13px',
    lineHeight: '1.35',
    color: '#1f2937',
    paddingTop: '6px',
    paddingBottom: '6px',
  },

  headerClass: 'gw-ts-demo-header',
  cellClass: 'gw-ts-demo-cell',

  /** Example filter theming (override in project as needed). */
  filterTriggerStyle: {},
  filterTriggerClass: '',
  filterPanelStyle: {},
  filterPanelClass: '',
  filterInputStyle: {},
  filterInputClass: '',

  selectionCheckboxStyle: {},
  selectionCheckboxClass: '',
  editableInputStyle: {},
  editableInputClass: '',

  paginationStyle: {},
  paginationClass: '',
  paginationButtonStyle: {},
  paginationButtonClass: '',
  paginationSelectStyle: {},
  paginationSelectClass: '',
  paginationSummaryStyle: {},
  paginationSummaryClass: '',
};
