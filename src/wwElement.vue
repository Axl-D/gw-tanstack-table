<template>
    <div
      class="gw-ts-root"
      :class="[
        rootLayoutClasses,
        appearance.rootClass || undefined,
        { 'gw-ts-root--sticky-header': stickyHeaderOn },
      ]"
      :style="rootInlineStyle"
    >
    <!-- Dropzone for `_slot` / `__editorSlot__` lives inside the first body cell (editor only). -->
    <div
      ref="scrollElRef"
      class="gw-ts-scroll"
      :class="appearance.scrollClass || undefined"
      :style="appearance.scrollStyle"
    >
      <table
        class="gw-ts-table"
        :class="appearance.tableClass || undefined"
        :style="appearance.tableStyle"
      >
        <thead>
          <tr v-for="hg in headerGroups" :key="hg.id">
            <th
              v-for="header in hg.headers"
              :key="header.id"
              class="gw-ts-th"
              :data-column-id="header.column.id"
              :colSpan="header.colSpan"
              :style="[headerThunkStyle, headerWidthStyle(header)]"
              :class="appearance.headerCellClass || undefined"
            >
              <template v-if="header.column.id === SELECTION_COLUMN_ID">
                <div class="gw-ts-th-inner gw-ts-th-inner--selection">
                  <input
                    :ref="setSelectAllCheckboxRef"
                    type="checkbox"
                    class="gw-ts-row-select"
                    :class="appearance.selectionCheckboxClass || undefined"
                    :style="appearance.selectionCheckboxStyle"
                    :checked="allRowsSelectedFlag"
                    aria-label="Select all rows"
                    @change="onToggleAllRowsSelected($event)"
                    @click.stop
                  />
                </div>
              </template>
              <template v-else>
                <div class="gw-ts-th-inner">
                  <span class="gw-ts-anchor">
                    <FlexRender
                      v-if="!header.isPlaceholder"
                      :key="header.id"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                  </span>
                  <button
                    v-if="shouldShowColumnFilter(header)"
                    type="button"
                    class="gw-ts-filter-trigger"
                    :class="[
                      appearance.filterTriggerClass || undefined,
                      { 'gw-ts-filter-trigger--active': columnFilterActive(header.column) },
                    ]"
                    :style="appearance.filterTriggerStyle"
                    :aria-expanded="openFilterColumnId === header.column.id ? 'true' : 'false'"
                    aria-haspopup="dialog"
                    :aria-controls="
                      openFilterColumnId === header.column.id
                        ? 'gw-ts-filter-panel-' + header.column.id
                        : undefined
                    "
                    @click.stop="toggleFilterPanel(header, $event)"
                  >
                    <span class="gw-ts-filter-trigger__icon" aria-hidden="true">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </span>
                  </button>
                </div>
              </template>
              <div
                v-if="
                  header.column.id !== SELECTION_COLUMN_ID &&
                  !header.isPlaceholder &&
                  header.column.getCanResize() &&
                  !(header.subHeaders && header.subHeaders.length)
                "
                class="gw-ts-resizer"
                @mousedown="header.getResizeHandler()($event)"
                @touchstart="header.getResizeHandler()($event)"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIdx) in bodyRows"
            :key="row.id"
            :style="rowStyleAt(rowIdx)"
            :class="appearance.bodyRowClass || undefined"
            @click="onRowClicked(row)"
          >
            <td
              v-for="cell in visibleCellsForRow(row)"
              :key="cell.id"
              :style="[cellThunkStyle, cellWidthStyle(cell.column)]"
              :class="appearance.bodyCellClass || undefined"
            >
              <template v-if="cell.column.id === SELECTION_COLUMN_ID">
                <span class="gw-ts-anchor gw-ts-anchor--selection" @click.stop>
                  <input
                    type="checkbox"
                    class="gw-ts-row-select"
                    :class="appearance.selectionCheckboxClass || undefined"
                    :style="appearance.selectionCheckboxStyle"
                    :checked="row.getIsSelected()"
                    aria-label="Select row"
                    @change="onRowSelectionCheckboxChange(row, $event)"
                    @click.stop
                  />
                </span>
              </template>
              <template v-else-if="cell.column.columnDef.meta?.gwEditable">
                <span class="gw-ts-anchor gw-ts-anchor--editable" @click.stop>
                  <input
                    type="text"
                    class="gw-ts-cell-input"
                    :class="appearance.editableInputClass || undefined"
                    :style="appearance.editableInputStyle"
                    :defaultValue="editableCellDisplay(cell)"
                    @focus="onEditableCellFocus(cell, row)"
                    @blur="onEditableCellBlur(cell, row, $event)"
                    @click.stop
                  />
                </span>
              </template>
              <template v-else-if="cell.column.columnDef.meta?.gwWwTemplateKey">
                <span class="gw-ts-anchor gw-ts-anchor--ww" @click.stop>
                  <wwLayout
                    v-if="showEditorCellWwSlotDropzone(cell, rowIdx)"
                    path="cellWwSlot"
                    direction="column"
                    tag="div"
                    class="gw-ts-cell-template-dropzone gw-ts-cell-template-dropzone--in-cell"
                  />
                  <template v-else>
                    <template
                      v-for="bundle in cellWwBindList(cell)"
                      :key="row.id + ':' + cell.column.id"
                    >
                      <wwElement
                        v-bind="bundle"
                        :ww-props="cellWwForcedProps(cell, row)"
                      />
                    </template>
                    <template v-if="!resolveCellWwDescriptor(cell)">
                      {{ cellPlainFallback(cell) }}
                    </template>
                  </template>
                </span>
              </template>
              <template v-else>
                <span class="gw-ts-anchor">
                  <FlexRender
                    :key="cell.id"
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="paginationEnabled"
      class="gw-ts-pagination"
      :class="appearance.paginationClass || undefined"
      :style="appearance.paginationStyle"
    >
      <div class="gw-ts-pagination__controls">
        <button
          type="button"
          class="gw-ts-pagination__btn"
          :class="appearance.paginationButtonClass || undefined"
          :style="appearance.paginationButtonStyle"
          :disabled="!canPreviousPage"
          aria-label="Previous page"
          @click="goPrevPage"
        >
          Prev
        </button>
        <span
          class="gw-ts-pagination__page"
          :class="appearance.paginationSummaryClass || undefined"
          :style="appearance.paginationSummaryStyle"
        >
          Page {{ paginationPageDisplay.current }} / {{ paginationPageDisplay.total }}
        </span>
        <button
          type="button"
          class="gw-ts-pagination__btn"
          :class="appearance.paginationButtonClass || undefined"
          :style="appearance.paginationButtonStyle"
          :disabled="!canNextPage"
          aria-label="Next page"
          @click="goNextPage"
        >
          Next
        </button>
      </div>
      <span
        v-if="showPaginationSummary && paginationRangeLabel"
        class="gw-ts-pagination__summary"
        :class="appearance.paginationSummaryClass || undefined"
        :style="appearance.paginationSummaryStyle"
      >
        {{ paginationRangeLabel }}
      </span>
      <label class="gw-ts-pagination__size">
        <span class="gw-ts-pagination__size-label">Rows</span>
        <select
          class="gw-ts-pagination__select"
          :class="appearance.paginationSelectClass || undefined"
          :style="appearance.paginationSelectStyle"
          :value="currentTablePageSize"
          aria-label="Rows per page"
          @change="onPaginationPageSizeChange($event)"
        >
          <option
            v-for="opt in pageSizeOptionsForSelect"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
      </label>
    </div>
    <Teleport to="body">
      <div
        v-if="openFilterColumnId && openFilterColumn"
        :id="'gw-ts-filter-panel-' + openFilterColumnId"
        ref="filterPanelRef"
        data-gw-ts-filter-panel="true"
        class="gw-ts-filter-panel"
        :class="appearance.filterPanelClass || undefined"
        :style="filterPanelBoxStyle"
        role="dialog"
        aria-label="Column filter"
        @click.stop
      >
        <div class="gw-ts-filter-panel__body">
          <select
            v-if="columnFilterVariant(openFilterColumn) === 'enum'"
            :key="'fen-' + openFilterColumn.id + '-' + enumFilterSignature(openFilterColumn)"
            multiple
            class="gw-ts-filter-select gw-ts-filter-select--popover"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            @change="onEnumFilterChange(openFilterColumn, $event)"
          >
            <option
              v-for="opt in enumFilterOptions(openFilterColumn)"
              :key="String(opt)"
              :value="String(opt)"
              :selected="enumOptionSelected(openFilterColumn, opt)"
            >
              {{ opt }}
            </option>
          </select>
          <select
            v-else-if="columnFilterVariant(openFilterColumn) === 'boolean'"
            class="gw-ts-filter-select"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            :value="booleanFilterValue(openFilterColumn)"
            @change="onBooleanFilterChange(openFilterColumn, $event)"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <input
            v-else-if="columnFilterVariant(openFilterColumn) === 'number'"
            class="gw-ts-filter-input"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            type="number"
            :value="numberFilterValue(openFilterColumn)"
            @change="onNumberFilterChange(openFilterColumn, $event)"
          />
          <input
            v-else
            class="gw-ts-filter-input"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            type="search"
            placeholder="Filter…"
            :value="textFilterValue(openFilterColumn)"
            @input="onTextFilterInput(openFilterColumn, $event)"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  FlexRender,
  functionalUpdate,
} from '@tanstack/vue-table';

const gwEnumSet = (row, columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }
  const v = row.getValue(columnId);
  return filterValue.some((x) => x === v || String(x) === String(v));
};
gwEnumSet.autoRemove = (val) =>
  val == null || !Array.isArray(val) || val.length === 0;

const gwBoolean = (row, columnId, filterValue) => {
  if (filterValue === '' || filterValue === undefined || filterValue === null) {
    return true;
  }
  const want = filterValue === true || filterValue === 'true';
  return Boolean(row.getValue(columnId)) === want;
};
gwBoolean.autoRemove = (val) =>
  val === '' || val === undefined || val === null;

const gwNumberExact = (row, columnId, filterValue) => {
  if (filterValue === '' || filterValue === undefined || filterValue === null) {
    return true;
  }
  const n = Number(filterValue);
  if (Number.isNaN(n)) {
    return true;
  }
  return Number(row.getValue(columnId)) === n;
};
gwNumberExact.autoRemove = (val) =>
  val === '' || val === undefined || val === null;

/** Synthetic checkbox column when row selection is enabled (must match template branches). */
const SELECTION_COLUMN_ID = 'gwRowSelect';

function selectionColumnDef() {
  return {
    id: SELECTION_COLUMN_ID,
    accessorKey: '__gwRowSelect',
    header: '',
    size: 44,
    minSize: 36,
    maxSize: 52,
    enableSorting: false,
    enableResizing: false,
    filterVariant: 'none',
  };
}

function coerceEnableRowSelection(raw) {
  if (raw !== undefined && raw !== null && raw !== '') {
    if (raw === false || raw === 'false' || raw === 0) {
      return false;
    }
    return true;
  }
  return false;
}

function coerceEnablePagination(raw) {
  return coerceEnableRowSelection(raw);
}

function coerceShowPaginationSummary(raw) {
  if (raw !== undefined && raw !== null && raw !== '') {
    if (raw === false || raw === 'false' || raw === 0) {
      return false;
    }
    return true;
  }
  return true;
}

function coercePageSize(val) {
  if (typeof val === 'number' && Number.isFinite(val)) {
    const n = Math.floor(val);
    if (n >= 1) {
      return Math.min(500, n);
    }
  }
  const t = coerceBoundText(val);
  if (t !== '') {
    const n = Number(t);
    if (Number.isFinite(n) && n >= 1) {
      return Math.min(500, Math.floor(n));
    }
  }
  return 25;
}

function sanitizePageSizeOptions(raw) {
  const arr = unwrapArrayBinding(raw);
  if (!Array.isArray(arr) || !arr.length) {
    return [10, 25, 50, 100];
  }
  const nums = arr
    .map((x) => {
      if (typeof x === 'number' && Number.isFinite(x)) {
        return Math.floor(x);
      }
      const n = Number(String(x).trim());
      return Number.isFinite(n) ? Math.floor(n) : null;
    })
    .filter((x) => x != null && x >= 1);
  const uniq = [...new Set(nums)].sort((a, b) => a - b);
  return uniq.length ? uniq.map((n) => Math.min(500, n)) : [10, 25, 50, 100];
}

function unwrapBoundPlainObject(val) {
  if (val == null || typeof val !== 'object' || Array.isArray(val)) {
    return val;
  }
  const keys = Object.keys(val);
  const metaKeys = ['value', 'type', 'id', '__typename'];
  if (
    typeof val.value === 'object' &&
    val.value !== null &&
    !Array.isArray(val.value) &&
    keys.includes('value') &&
    keys.every((k) => metaKeys.includes(k))
  ) {
    return val.value;
  }
  return val;
}

function stripFunctionsDeep(val, depth = 0) {
  if (depth > 6 || val == null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => stripFunctionsDeep(item, depth + 1));
  }
  const out = {};
  for (const key of Object.keys(val)) {
    const v = val[key];
    if (typeof v === 'function') {
      continue;
    }
    out[key] =
      v && typeof v === 'object' && !Array.isArray(v)
        ? stripFunctionsDeep(v, depth + 1)
        : v;
  }
  return out;
}

function parseAppearance(rawContent) {
  let raw = unwrapBoundPlainObject(rawContent?.appearanceJson);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return normalizeAppearance(raw);
  }
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw || '{}');
      return normalizeAppearance(o && typeof o === 'object' && !Array.isArray(o) ? o : {});
    } catch {
      return normalizeAppearance({});
    }
  }
  return normalizeAppearance({});
}

function trimClassString(val) {
  return typeof val === 'string' ? val.trim() : '';
}

function normalizeAppearance(o) {
  const stickyTop =
    typeof o.stickyHeaderTop === 'string' && o.stickyHeaderTop.trim()
      ? o.stickyHeaderTop.trim()
      : '';

  const headerCellStyle = plainStyle(o.headerCellStyle ?? o.headerStyle);
  const bodyCellStyle = plainStyle(o.bodyCellStyle ?? o.cellStyle);
  const headerCellClass =
    trimClassString(o.headerCellClass) || trimClassString(o.headerClass);
  const bodyCellClass =
    trimClassString(o.bodyCellClass) || trimClassString(o.cellClass);

  return {
    /** Legacy aliases (same references as canonical cell/header styles). */
    headerStyle: headerCellStyle,
    cellStyle: bodyCellStyle,
    headerCellStyle,
    bodyCellStyle,
    headerClass: trimClassString(o.headerClass) || headerCellClass,
    cellClass: trimClassString(o.cellClass) || bodyCellClass,
    headerCellClass,
    bodyCellClass,
    rowStyle: plainStyle(o.rowStyle),
    oddRowStyle: plainStyle(o.oddRowStyle),
    evenRowStyle: plainStyle(o.evenRowStyle),
    bodyRowStyle: plainStyle(o.bodyRowStyle),
    bodyRowClass: trimClassString(o.bodyRowClass),
    rootStyle: plainStyle(o.rootStyle),
    rootClass: trimClassString(o.rootClass),
    scrollStyle: plainStyle(o.scrollStyle),
    scrollClass: trimClassString(o.scrollClass),
    tableStyle: plainStyle(o.tableStyle),
    tableClass: trimClassString(o.tableClass),
    filterTriggerStyle: plainStyle(o.filterTriggerStyle),
    filterTriggerClass: trimClassString(o.filterTriggerClass),
    filterPanelStyle: plainStyle(o.filterPanelStyle),
    filterPanelClass: trimClassString(o.filterPanelClass),
    filterInputStyle: plainStyle(o.filterInputStyle),
    filterInputClass: trimClassString(o.filterInputClass),
    selectionCheckboxStyle: plainStyle(o.selectionCheckboxStyle),
    selectionCheckboxClass: trimClassString(o.selectionCheckboxClass),
    editableInputStyle: plainStyle(o.editableInputStyle),
    editableInputClass: trimClassString(o.editableInputClass),
    paginationStyle: plainStyle(o.paginationStyle),
    paginationClass: trimClassString(o.paginationClass),
    paginationButtonStyle: plainStyle(o.paginationButtonStyle),
    paginationButtonClass: trimClassString(o.paginationButtonClass),
    paginationSelectStyle: plainStyle(o.paginationSelectStyle),
    paginationSelectClass: trimClassString(o.paginationSelectClass),
    paginationSummaryStyle: plainStyle(o.paginationSummaryStyle),
    paginationSummaryClass: trimClassString(o.paginationSummaryClass),
    stickyHeader: o.stickyHeader !== false,
    stickyHeaderTop: stickyTop,
  };
}

function plainStyle(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {};
}

/**
 * Coerce text bindings (quick filter, etc.). WeWeb often passes `{ value: '…' }`:
 * `String(that)` → '[object Object]' and breaks substring filters (zero rows).
 */
function coerceBoundText(val) {
  if (val == null || val === '') {
    return '';
  }
  if (typeof val === 'string') {
    return val;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  const u = unwrapBoundPlainObject(val);
  if (typeof u === 'string') {
    return u;
  }
  if (typeof u === 'number' || typeof u === 'boolean') {
    return String(u);
  }
  if (u && typeof u === 'object') {
    const inner = u.value;
    if (typeof inner === 'string') {
      return inner;
    }
    if (typeof inner === 'number' || typeof inner === 'boolean') {
      return String(inner);
    }
  }
  return '';
}

function unwrapArrayBinding(val, depth = 0) {
  if (depth > 10) {
    return [];
  }
  if (Array.isArray(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const t = val.trim();
    if (
      (t.startsWith('[') && t.endsWith(']')) ||
      (t.startsWith('{') && t.endsWith('}'))
    ) {
      try {
        return unwrapArrayBinding(JSON.parse(t), depth + 1);
      } catch {
        return [];
      }
    }
    return [];
  }
  const u = unwrapBoundPlainObject(val);
  if (Array.isArray(u)) {
    return u;
  }
  if (u && typeof u === 'object') {
    if (Array.isArray(u.edges)) {
      return u.edges
        .map((e) =>
          e && typeof e === 'object' ? (e.node !== undefined ? e.node : e) : null,
        )
        .filter((x) => x != null);
    }
    const directKeys = [
      'value',
      'data',
      'result',
      'results',
      'records',
      'items',
      'rows',
      'list',
      'collectionData',
    ];
    for (const key of directKeys) {
      const inner = u[key];
      if (Array.isArray(inner)) {
        return inner;
      }
    }
    for (const key of directKeys) {
      const inner = u[key];
      if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
        const nested = unwrapArrayBinding(inner, depth + 1);
        if (nested.length) {
          return nested;
        }
      }
    }
  }
  return [];
}

function sanitizeRows(rowData) {
  return unwrapArrayBinding(rowData);
}

function buildColumns(columnDefsRaw, rows) {
  const columnDefs = unwrapArrayBinding(columnDefsRaw);
  if (!Array.isArray(columnDefs)) {
    return inferColumnsFromRows(rows);
  }
  if (columnDefs.length) {
    return columnDefs.map((c) => mapColumnDef(c));
  }
  return inferColumnsFromRows(rows);
}

function inferColumnsFromRows(rows) {
  const sample = rows[0];
  if (sample && typeof sample === 'object' && !Array.isArray(sample)) {
    return Object.keys(sample).map((key) => ({
      accessorKey: key,
      header: key,
    }));
  }
  return [
    {
      accessorKey: '_empty',
      header: 'Bind row data',
      cell: () => '',
    },
  ];
}

function normalizeColumnFilters(base) {
  if (base.id === SELECTION_COLUMN_ID || base.accessorKey === '__gwRowSelect') {
    const baseMeta =
      base.meta && typeof base.meta === 'object' && !Array.isArray(base.meta)
        ? { ...base.meta }
        : {};
    return {
      ...base,
      enableColumnFilter: false,
      enableSorting: false,
      meta: { ...baseMeta, gwFilterVariant: 'none' },
    };
  }
  if (base.accessorKey === '_empty') {
    return { ...base, enableColumnFilter: false };
  }
  const variantRaw =
    base.filterVariant ??
    (Array.isArray(base.filterEnumValues) && base.filterEnumValues.length
      ? 'enum'
      : 'text');
  const variant = String(variantRaw).toLowerCase();
  const baseMeta =
    base.meta && typeof base.meta === 'object' && !Array.isArray(base.meta)
      ? { ...base.meta }
      : {};

  if (variant === 'none' || variant === 'off') {
    return {
      ...base,
      enableColumnFilter: false,
      meta: { ...baseMeta, gwFilterVariant: 'none' },
    };
  }

  let filterFn = base.filterFn;
  if (typeof filterFn !== 'string') {
    if (variant === 'enum') {
      filterFn = 'gwEnumSet';
    } else if (variant === 'boolean') {
      filterFn = 'gwBoolean';
    } else if (variant === 'number') {
      filterFn = 'gwNumberExact';
    } else {
      filterFn = 'includesString';
    }
  }

  const gwVariant =
    variant === 'enum'
      ? 'enum'
      : variant === 'boolean'
        ? 'boolean'
        : variant === 'number'
          ? 'number'
          : 'text';

  const meta = {
    ...baseMeta,
    gwFilterVariant: gwVariant,
    gwEnumValues: Array.isArray(base.filterEnumValues)
      ? [...base.filterEnumValues]
      : undefined,
  };

  return {
    ...base,
    filterFn,
    meta,
    enableColumnFilter: base.enableColumnFilter !== false,
  };
}

function coerceGwWwTemplateKey(cleaned) {
  const top = cleaned.gwWwTemplateKey;
  const fromMeta =
    cleaned.meta &&
    typeof cleaned.meta === 'object' &&
    !Array.isArray(cleaned.meta) &&
    cleaned.meta.gwWwTemplateKey != null
      ? cleaned.meta.gwWwTemplateKey
      : undefined;
  const raw = top != null && top !== '' ? top : fromMeta;
  if (raw == null || raw === '') {
    return null;
  }
  const s = String(raw).trim();
  return s || null;
}

function mapColumnDef(c) {
  const cleaned = stripFunctionsDeep(c);
  const wwTemplateKey = coerceGwWwTemplateKey(cleaned);
  let base;
  if (cleaned.accessorKey || cleaned.accessorFn) {
    base = { ...cleaned };
  } else {
    const field = cleaned.field ?? cleaned.accessorKey;
    const header = cleaned.headerName ?? cleaned.header ?? field;
    const { field: _f, headerName: _h, ...rest } = cleaned;
    base = {
      ...rest,
      accessorKey: field,
      header: header ?? field,
    };
  }
  delete base.gwWwTemplateKey;
  if (base.meta && typeof base.meta === 'object' && !Array.isArray(base.meta)) {
    const { gwWwTemplateKey: _gwWw, ...metaRest } = base.meta;
    base.meta = metaRest;
  }
  const def = normalizeColumnFilters(base);
  const metaBase =
    def.meta && typeof def.meta === 'object' && !Array.isArray(def.meta)
      ? { ...def.meta }
      : {};

  if (wwTemplateKey) {
    return {
      ...def,
      meta: {
        ...metaBase,
        gwWwTemplateKey: wwTemplateKey,
      },
    };
  }

  const metaEditable =
    cleaned.editable === true ||
    (cleaned.meta &&
      typeof cleaned.meta === 'object' &&
      !Array.isArray(cleaned.meta) &&
      cleaned.meta.editable === true);
  if (!metaEditable || def.accessorKey === '__gwRowSelect') {
    return def;
  }
  return {
    ...def,
    meta: {
      ...metaBase,
      gwEditable: true,
    },
  };
}

function rowsPassQuickFilter(rows, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter((row) => {
    try {
      return JSON.stringify(row).toLowerCase().includes(needle);
    } catch {
      return false;
    }
  });
}

/** Built-in elements use `type`; reusable library components use `libraryComponentBaseId` in exports. */
function wwDescriptorTypeOrLibraryId(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return '';
  }
  const t = val.type;
  if (t != null && String(t).trim() !== '') {
    return String(t).trim();
  }
  const lib = val.libraryComponentBaseId;
  if (lib != null && String(lib).trim() !== '') {
    return String(lib).trim();
  }
  return '';
}

function isLikelyWwElementDescriptor(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }
  if (val.isWwObject !== true) {
    return false;
  }
  return wwDescriptorTypeOrLibraryId(val) !== '';
}

/**
 * wwElement historically expects `type`; library components on disk often only set
 * `libraryComponentBaseId`. Pass a shallow copy so we do not mutate editor state.
 */
function normalizeWwElementBindProps(desc) {
  if (!desc || typeof desc !== 'object') {
    return desc;
  }
  const needsType = desc.type == null || desc.type === '';
  if (needsType && desc.libraryComponentBaseId) {
    return {
      ...desc,
      type: desc.libraryComponentBaseId,
    };
  }
  return desc;
}

/** Follow WeWeb binding wrappers until we reach a real element descriptor or give up. */
function peelWewebElementDescriptor(val, depth = 0) {
  if (depth > 12 || val == null) {
    return val;
  }
  if (isLikelyWwElementDescriptor(val)) {
    return val;
  }
  const u = unwrapBoundPlainObject(val);
  if (u !== val) {
    return peelWewebElementDescriptor(u, depth + 1);
  }
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const inner = val.value;
    if (inner != null && typeof inner === 'object') {
      const peeled = peelWewebElementDescriptor(inner, depth + 1);
      if (isLikelyWwElementDescriptor(peeled)) {
        return peeled;
      }
    }
  }
  return val;
}

export default {
  components: {
    FlexRender,
  },
  props: {
    content: { type: Object, required: true },
    /** Present only in WeWeb Editor; use for dropzone / editor-only UI. */
    wwEditorState: { type: Object, required: false, default: undefined },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    const emitWorkflow = (name, data) => {
      emit('trigger-event', { name, event: data, payload: data });
    };

    const layoutSizing = computed(() => props.content.layoutSizing || 'fill');

    const appearance = computed(() => parseAppearance(props.content));

    const tableData = shallowRef([]);
    const tableColumns = shallowRef([]);

    /*
     * TanStack Vue: drive the table with ref-backed arrays so row models stay in sync (see
     * https://tanstack.com/table/v8/docs/framework/vue/vue-table ).
     * Deep-watch bindings so in-place updates from formulas/collections still refresh.
     * Quick filter: coerce bindings — String({value:'x'}) breaks filtering (zero rows).
     */
    const selectionEnabled = computed(() =>
      coerceEnableRowSelection(props.content.enableRowSelection),
    );

    const rowIdFieldResolved = computed(() => {
      const t = coerceBoundText(props.content.rowIdField);
      return typeof t === 'string' && t.trim() ? t.trim() : 'id';
    });

    const paginationEnabled = computed(() =>
      coerceEnablePagination(props.content.enablePagination),
    );

    const pageSizeResolved = computed(() =>
      coercePageSize(props.content.pageSize),
    );

    const pageSizeOptionsResolved = computed(() =>
      sanitizePageSizeOptions(props.content.pageSizeOptions),
    );

    const pageSizeOptionsForSelect = computed(() => {
      const set = new Set(pageSizeOptionsResolved.value);
      set.add(pageSizeResolved.value);
      return [...set].sort((a, b) => a - b);
    });

    const showPaginationSummary = computed(() =>
      coerceShowPaginationSummary(props.content.showPaginationSummary),
    );

    const lastToggledRowId = ref(null);

    watch(
      () => ({
        rowSrc: props.content.rowData,
        colSrc: props.content.columnDefs,
        qSrc: props.content.quickFilterText,
        sel: props.content.enableRowSelection,
        rowIdField: props.content.rowIdField,
      }),
      () => {
        const rows = sanitizeRows(props.content.rowData);
        const q = coerceBoundText(props.content.quickFilterText);
        tableData.value = rowsPassQuickFilter(rows, q);
        let cols = buildColumns(props.content.columnDefs, rows);
        if (selectionEnabled.value) {
          cols = [mapColumnDef(selectionColumnDef()), ...cols];
        }
        tableColumns.value = cols;
      },
      { deep: true, immediate: true },
    );

    const openFilterColumnId = ref(null);
    const filterPanelRef = ref(null);
    const filterAnchorThEl = shallowRef(null);
    /** Ignore outside-close briefly after open so the same gesture does not toggle twice. */
    let filterOutsideIgnoreUntil = 0;
    function markFilterPanelJustOpened() {
      const t =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      filterOutsideIgnoreUntil = t + 320;
    }
    function shouldIgnoreFilterOutsideClose() {
      const now =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      return now < filterOutsideIgnoreUntil;
    }
    const filterPanelAnchor = ref({
      top: 0,
      left: 0,
      maxH: 320,
      minWidth: 200,
    });
    const scrollElRef = ref(null);
    const selectAllCheckboxRef = ref(null);

    function clampPopoverPosition(thEl) {
      const margin = 8;
      const gap = 6;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
      if (!thEl || typeof thEl.getBoundingClientRect !== 'function') {
        return { top: margin, left: margin, maxH: 320, minWidth: 200 };
      }
      const thRect = thEl.getBoundingClientRect();
      const btn = thEl.querySelector('.gw-ts-filter-trigger');
      const btnRect = btn?.getBoundingClientRect?.() ?? thRect;
      const anchorRect = btnRect;
      const minWidth = Math.min(
        Math.max(220, thRect.width),
        vw - 2 * margin,
      );
      let left = anchorRect.left;
      left = Math.max(margin, Math.min(left, vw - minWidth - margin));
      if (left + minWidth > thRect.right + 8) {
        left = Math.max(margin, thRect.right - minWidth);
      }
      if (left + minWidth > vw - margin) {
        left = Math.max(margin, vw - minWidth - margin);
      }
      if (left < thRect.left - 8) {
        left = Math.min(thRect.left, vw - minWidth - margin);
      }
      left = Math.max(margin, Math.min(left, vw - minWidth - margin));
      // Anchor below the filter chip (not the full <th>), so the panel sits under the control.
      let top = anchorRect.bottom + gap;
      let maxH = Math.max(120, Math.min(360, vh - top - margin));
      const spaceAbove = anchorRect.top - margin - gap;
      if (maxH < 160 && spaceAbove > 180) {
        maxH = Math.max(120, Math.min(360, spaceAbove - gap));
        top = Math.max(margin, anchorRect.top - gap - maxH);
      }
      return { top, left, maxH, minWidth };
    }

    function repositionOpenFilterPanel() {
      if (!openFilterColumnId.value) {
        return;
      }
      const th = filterAnchorThEl.value;
      if (th && typeof th.getBoundingClientRect === 'function') {
        filterPanelAnchor.value = clampPopoverPosition(th);
      }
    }

    /*
     * Do NOT pass data as a Ref to useVueTable: when IS_REACTIVE is true the adapter wraps it in
     * another shallowRef and setState({ data: dataRef.value }) stores the inner Ref, not the rows
     * array — getCoreRowModel then sees a non-array → zero rows.
     * Plain getters make IS_REACTIVE false; watchEffect merges options and reads .value each time.
     */
    const renderTick = ref(0);

    function emitSelectionChanged() {
      if (!selectionEnabled.value) {
        return;
      }
      void renderTick.value;
      try {
        const rows = table.getSelectedRowModel().rows;
        emitWorkflow('selection-changed', {
          selectedRowIds: rows.map((r) => r.id),
          lastToggledId: lastToggledRowId.value,
        });
      } catch {
        emitWorkflow('selection-changed', {
          selectedRowIds: [],
          lastToggledId: lastToggledRowId.value,
        });
      }
    }

    const table = useVueTable({
      get data() {
        return tableData.value;
      },
      get columns() {
        return tableColumns.value;
      },
      get enableRowSelection() {
        return selectionEnabled.value;
      },
      get enableMultiRowSelection() {
        return selectionEnabled.value;
      },
      getRowId(originalRow, index) {
        const field = rowIdFieldResolved.value;
        const v =
          originalRow && typeof originalRow === 'object'
            ? originalRow[field]
            : undefined;
        return v != null && v !== '' ? String(v) : String(index);
      },
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      get getPaginationRowModel() {
        return paginationEnabled.value ? getPaginationRowModel() : undefined;
      },
      enableColumnFilters: true,
      enableFilters: true,
      columnResizeMode: 'onChange',
      filterFns: {
        gwEnumSet,
        gwBoolean,
        gwNumberExact,
      },
      enableColumnResizing: true,
      defaultColumn: {
        minSize: 48,
        maxSize: 1600,
        enableResizing: true,
      },
      onRowSelectionChange(updater) {
        table.setState((old) => ({
          ...old,
          rowSelection: functionalUpdate(updater, old.rowSelection ?? {}),
        }));
        renderTick.value += 1;
        nextTick(() => emitSelectionChanged());
      },
      onPaginationChange(updater) {
        if (!paginationEnabled.value) {
          return;
        }
        table.setState((old) => ({
          ...old,
          pagination: functionalUpdate(
            updater,
            old.pagination ?? {
              pageIndex: 0,
              pageSize: pageSizeResolved.value,
            },
          ),
        }));
        renderTick.value += 1;
        nextTick(() => repositionOpenFilterPanel());
      },
      onColumnSizingChange(updater) {
        table.setState((old) => ({
          ...old,
          columnSizing: functionalUpdate(updater, old.columnSizing ?? {}),
        }));
        renderTick.value += 1;
        nextTick(() => repositionOpenFilterPanel());
      },
      onColumnFiltersChange(updater) {
        table.setState((old) => {
          const nextFilters = functionalUpdate(
            updater,
            old.columnFilters ?? [],
          );
          if (!paginationEnabled.value) {
            return {
              ...old,
              columnFilters: nextFilters,
            };
          }
          const basePag = old.pagination ?? {
            pageIndex: 0,
            pageSize: pageSizeResolved.value,
          };
          return {
            ...old,
            columnFilters: nextFilters,
            pagination: { ...basePag, pageIndex: 0 },
          };
        });
        renderTick.value += 1;
        nextTick(() => repositionOpenFilterPanel());
      },
    });

    watch(selectionEnabled, (on, prevOn) => {
      if (!on) {
        table.setState((old) => ({
          ...old,
          rowSelection: {},
        }));
        renderTick.value += 1;
        if (prevOn === true) {
          nextTick(() =>
            emitWorkflow('selection-changed', {
              selectedRowIds: [],
              lastToggledId: null,
            }),
          );
        }
      }
    });

    watch(
      paginationEnabled,
      (on) => {
        if (on) {
          table.setState((old) => ({
            ...old,
            pagination: {
              pageIndex: 0,
              pageSize: pageSizeResolved.value,
            },
          }));
          renderTick.value += 1;
        }
      },
    );

    watch(pageSizeResolved, (size) => {
      if (!paginationEnabled.value) {
        return;
      }
      table.setState((old) => ({
        ...old,
        pagination: {
          pageIndex: 0,
          pageSize: size,
        },
      }));
      renderTick.value += 1;
    });

    watch(
      () => tableData.value,
      () => {
        if (!paginationEnabled.value) {
          return;
        }
        nextTick(() => {
          table.setState((old) => ({
            ...old,
            pagination: {
              ...(old.pagination ?? {
                pageIndex: 0,
                pageSize: pageSizeResolved.value,
              }),
              pageIndex: 0,
            },
          }));
          renderTick.value += 1;
        });
      },
    );

    const stickyHeaderOn = computed(() => {
      const raw = props.content.stickyHeader;
      if (raw !== undefined && raw !== null && raw !== '') {
        if (raw === false || raw === 'false' || raw === 0) {
          return false;
        }
        return true;
      }
      return appearance.value.stickyHeader !== false;
    });

    const headerGroups = computed(() => {
      void renderTick.value;
      return table.getHeaderGroups();
    });

    const bodyRows = computed(() => {
      void renderTick.value;
      return table.getRowModel().rows;
    });

    const filteredRowCount = computed(() => {
      void renderTick.value;
      try {
        return table.getFilteredRowModel().rows.length;
      } catch {
        return 0;
      }
    });

    const canPreviousPage = computed(() => {
      void renderTick.value;
      if (!paginationEnabled.value) {
        return false;
      }
      try {
        return table.getCanPreviousPage();
      } catch {
        return false;
      }
    });

    const canNextPage = computed(() => {
      void renderTick.value;
      if (!paginationEnabled.value) {
        return false;
      }
      try {
        return table.getCanNextPage();
      } catch {
        return false;
      }
    });

    const paginationPageDisplay = computed(() => {
      void renderTick.value;
      if (!paginationEnabled.value) {
        return { current: 1, total: 1 };
      }
      const idx = table.getState().pagination?.pageIndex ?? 0;
      let total = 1;
      try {
        const n = table.getPageCount();
        total = Number.isFinite(n) && n > 0 ? n : 1;
      } catch {
        total = 1;
      }
      return { current: idx + 1, total };
    });

    const currentTablePageSize = computed(() => {
      void renderTick.value;
      if (!paginationEnabled.value) {
        return pageSizeResolved.value;
      }
      return (
        table.getState().pagination?.pageSize ?? pageSizeResolved.value
      );
    });

    const paginationRangeLabel = computed(() => {
      void renderTick.value;
      if (!paginationEnabled.value || !showPaginationSummary.value) {
        return '';
      }
      const total = filteredRowCount.value;
      if (total === 0) {
        return '0–0 of 0';
      }
      const p = table.getState().pagination;
      const pageIndex = p?.pageIndex ?? 0;
      const pageSize = p?.pageSize ?? pageSizeResolved.value;
      const start = pageIndex * pageSize + 1;
      const end = Math.min((pageIndex + 1) * pageSize, total);
      return `${start}–${end} of ${total}`;
    });

    const headerWidthStyle = (header) => {
      void renderTick.value;
      if (header.subHeaders?.length || header.colSpan > 1) {
        return {};
      }
      const sizing = table.getState().columnSizing ?? {};
      if (!(header.column.id in sizing)) {
        return {};
      }
      const w = Math.round(header.getSize());
      return {
        width: `${w}px`,
        minWidth: `${w}px`,
        boxSizing: 'border-box',
      };
    };

    const cellWidthStyle = (column) => {
      void renderTick.value;
      const sizing = table.getState().columnSizing ?? {};
      if (!(column.id in sizing)) {
        return {};
      }
      const w = Math.round(column.getSize());
      return {
        width: `${w}px`,
        minWidth: `${w}px`,
        boxSizing: 'border-box',
      };
    };

    const headerThunkStyle = computed(() => appearance.value.headerCellStyle);

    const cellThunkStyle = computed(() => appearance.value.bodyCellStyle);

    const rowStyleAt = (index) => {
      const a = appearance.value;
      const base = { ...a.rowStyle, ...a.bodyRowStyle };
      const odd = a.oddRowStyle;
      const even = a.evenRowStyle;
      const hasStripe =
        Object.keys(odd).length > 0 || Object.keys(even).length > 0;
      if (hasStripe) {
        let globalIndex = index;
        if (paginationEnabled.value) {
          void renderTick.value;
          try {
            const p = table.getState().pagination;
            if (p) {
              globalIndex = p.pageIndex * p.pageSize + index;
            }
          } catch {
            globalIndex = index;
          }
        }
        const stripe = globalIndex % 2 === 0 ? even : odd;
        return { ...base, ...stripe };
      }
      return base;
    };

    const rootLayoutClasses = computed(() => {
      const ls = layoutSizing.value;
      const layout =
        ls === 'fixed' ? 'gw-ts-root--fixed' : ls === 'autoHeight' ? 'gw-ts-root--auto-height' : 'gw-ts-root--fill';
      return [layout];
    });

    const containerStyle = computed(() => {
      const ls = layoutSizing.value;
      if (ls === 'fixed') {
        const h = normalizeCssLength(props.content.height) || '480px';
        return {
          width: '100%',
          height: h,
          minHeight: h,
          flexShrink: 0,
        };
      }
      if (ls === 'fill') {
        const raw = props.content.fillMinHeightCss;
        const custom =
          typeof raw === 'string' && raw.trim().length ? raw.trim() : null;
        return {
          minHeight: custom || 'min(42vh, 720px)',
        };
      }
      return {};
    });

    const rootInlineStyle = computed(() => {
      const top = appearance.value.stickyHeaderTop || '0px';
      return {
        ...containerStyle.value,
        '--gw-ts-sticky-top': top,
        ...appearance.value.rootStyle,
      };
    });

    function columnFilterVariant(column) {
      if (!column) {
        return 'none';
      }
      void renderTick.value;
      const v = column.columnDef.meta?.gwFilterVariant ?? 'text';
      return v === 'none' ? 'none' : v;
    }

    function shouldShowColumnFilter(header) {
      return (
        !header.isPlaceholder &&
        !(header.subHeaders && header.subHeaders.length) &&
        header.column.getCanFilter?.() &&
        columnFilterVariant(header.column) !== 'none'
      );
    }

    function columnFilterActive(column) {
      if (!column) {
        return false;
      }
      void renderTick.value;
      const v = column.getFilterValue();
      if (v === undefined || v === null) {
        return false;
      }
      if (Array.isArray(v)) {
        return v.length > 0;
      }
      if (v === '') {
        return false;
      }
      return true;
    }

    const openFilterColumn = computed(() => {
      void renderTick.value;
      const id = openFilterColumnId.value;
      if (!id) {
        return null;
      }
      try {
        return table.getColumn(id) ?? null;
      } catch {
        return null;
      }
    });

    const filterPanelBoxStyle = computed(() => {
      void renderTick.value;
      const { top, left, maxH, minWidth } = filterPanelAnchor.value;
      return {
        ...appearance.value.filterPanelStyle,
        top: `${top}px`,
        left: `${left}px`,
        maxHeight: `${maxH}px`,
        minWidth: `${minWidth}px`,
      };
    });

    function toggleFilterPanel(header, e) {
      const col = header.column;
      const id = col.id;
      if (openFilterColumnId.value === id) {
        openFilterColumnId.value = null;
        filterAnchorThEl.value = null;
        return;
      }
      markFilterPanelJustOpened();
      openFilterColumnId.value = id;
      const btn = e.currentTarget;
      const th = btn?.closest?.('.gw-ts-th');
      filterAnchorThEl.value = th || null;
      if (th && typeof th.getBoundingClientRect === 'function') {
        filterPanelAnchor.value = clampPopoverPosition(th);
      }
      nextTick(() => {
        repositionOpenFilterPanel();
        requestAnimationFrame(() => repositionOpenFilterPanel());
      });
    }

    function eventPathTouchesFilterPanel(ev) {
      const panelEl = filterPanelRef.value;
      const target = ev.target;
      if (target instanceof Node && panelEl && panelEl.contains(target)) {
        return true;
      }
      const path =
        typeof ev.composedPath === 'function'
          ? ev.composedPath()
          : [ev.target];
      for (const n of path) {
        if (!(n instanceof Node)) {
          continue;
        }
        if (panelEl && (n === panelEl || panelEl.contains(n))) {
          return true;
        }
        if (
          n instanceof Element &&
          n.matches?.('[data-gw-ts-filter-panel], .gw-ts-filter-panel')
        ) {
          return true;
        }
      }
      return false;
    }

    function eventPathTouchesFilterTrigger(ev) {
      const target = ev.target;
      if (
        target instanceof Element &&
        typeof target.closest === 'function' &&
        target.closest('.gw-ts-filter-trigger')
      ) {
        return true;
      }
      const path =
        typeof ev.composedPath === 'function'
          ? ev.composedPath()
          : [ev.target];
      for (const n of path) {
        if (
          n instanceof Element &&
          typeof n.closest === 'function' &&
          n.closest('.gw-ts-filter-trigger')
        ) {
          return true;
        }
      }
      return false;
    }

    function onGlobalPointerDown(ev) {
      if (!openFilterColumnId.value) {
        return;
      }
      if (shouldIgnoreFilterOutsideClose()) {
        return;
      }
      if (eventPathTouchesFilterPanel(ev)) {
        return;
      }
      if (eventPathTouchesFilterTrigger(ev)) {
        return;
      }
      openFilterColumnId.value = null;
      filterAnchorThEl.value = null;
    }

    function onFilterOutsideClick(ev) {
      if (!openFilterColumnId.value) {
        return;
      }
      if (shouldIgnoreFilterOutsideClose()) {
        return;
      }
      if (eventPathTouchesFilterPanel(ev)) {
        return;
      }
      if (eventPathTouchesFilterTrigger(ev)) {
        return;
      }
      openFilterColumnId.value = null;
      filterAnchorThEl.value = null;
    }

    function onDocumentKeydown(ev) {
      if (ev.key !== 'Escape' || !openFilterColumnId.value) {
        return;
      }
      openFilterColumnId.value = null;
      filterAnchorThEl.value = null;
    }

    watch(openFilterColumnId, (id) => {
      if (!id) {
        filterAnchorThEl.value = null;
        return;
      }
      nextTick(() => {
        if (!openFilterColumn.value) {
          openFilterColumnId.value = null;
          filterAnchorThEl.value = null;
          return;
        }
        repositionOpenFilterPanel();
        requestAnimationFrame(() => repositionOpenFilterPanel());
      });
    });

    watch(
      [renderTick, selectionEnabled],
      () => {
        nextTick(() => {
          const el = selectAllCheckboxRef.value;
          if (el && el instanceof HTMLInputElement) {
            try {
              el.indeterminate =
                table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
            } catch {
              el.indeterminate = false;
            }
          }
        });
      },
      { flush: 'post' },
    );

    function enumFilterOptions(column) {
      const raw = column.columnDef.meta?.gwEnumValues;
      return Array.isArray(raw) ? raw : [];
    }

    function enumFilterSignature(column) {
      void renderTick.value;
      const v = column.getFilterValue();
      return Array.isArray(v) ? v.join('|') : '';
    }

    function enumOptionSelected(column, opt) {
      void renderTick.value;
      const cur = column.getFilterValue();
      if (!Array.isArray(cur)) {
        return false;
      }
      return cur.some((x) => String(x) === String(opt));
    }

    function onEnumFilterChange(column, e) {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
      column.setFilterValue(selected.length ? selected : undefined);
    }

    function booleanFilterValue(column) {
      void renderTick.value;
      const v = column.getFilterValue();
      if (v === true || v === 'true') {
        return 'true';
      }
      if (v === false || v === 'false') {
        return 'false';
      }
      return '';
    }

    function onBooleanFilterChange(column, e) {
      const v = e.target.value;
      column.setFilterValue(v === '' ? undefined : v);
    }

    function numberFilterValue(column) {
      void renderTick.value;
      const v = column.getFilterValue();
      return v === undefined || v === null ? '' : v;
    }

    function onNumberFilterChange(column, e) {
      const raw = e.target.value;
      column.setFilterValue(raw === '' ? undefined : raw);
    }

    function textFilterValue(column) {
      void renderTick.value;
      const v = column.getFilterValue();
      return v == null ? '' : String(v);
    }

    function onTextFilterInput(column, e) {
      const raw = e.target.value;
      column.setFilterValue(raw === '' ? undefined : raw);
    }

    function normalizeCssLength(val) {
      if (val == null || val === '') {
        return null;
      }
      if (typeof val === 'number' && !Number.isNaN(val)) {
        return `${val}px`;
      }
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'auto' || s === '') {
          return null;
        }
        return val.trim();
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const unit = val.unit ?? val.unitChoice ?? 'px';
        const rawScalar = val.value ?? val.amount ?? val.size;
        if (rawScalar != null && rawScalar !== '') {
          if (typeof rawScalar === 'number' && !Number.isNaN(rawScalar)) {
            return `${rawScalar}${unit}`;
          }
          if (typeof rawScalar === 'string') {
            const num = Number(rawScalar.trim());
            if (!Number.isNaN(num)) {
              return `${num}${unit}`;
            }
            return rawScalar.trim();
          }
        }
        const len = val.length;
        if (typeof len === 'number' && !Number.isNaN(len)) {
          return `${len}${unit}`;
        }
        if (typeof len === 'string' && len.trim()) {
          const lt = len.trim().toLowerCase();
          if (lt !== 'auto') {
            return len.trim();
          }
        }
      }
      return null;
    }

    const editBaseline = shallowRef(new Map());

    function editCellKey(row, cell) {
      return `${row.id}:${cell.column.id}`;
    }

    function editableCellDisplay(cell) {
      void renderTick.value;
      const v = cell.getValue();
      return v == null ? '' : String(v);
    }

    function cellPlainFallback(cell) {
      void renderTick.value;
      const v = cell.getValue();
      return v == null ? '' : String(v);
    }

    function resolveCellWwDescriptor(cell) {
      void renderTick.value;
      const key = cell?.column?.columnDef?.meta?.gwWwTemplateKey;
      if (!key || typeof key !== 'string') {
        return null;
      }
      const normalizedKey = key.trim();
      if (
        normalizedKey === '__editorSlot__' ||
        normalizedKey === '_slot'
      ) {
        const slotArr = unwrapArrayBinding(props.content?.cellWwSlot);
        for (const item of slotArr) {
          const raw = unwrapBoundPlainObject(item) ?? item;
          const el = peelWewebElementDescriptor(raw);
          if (isLikelyWwElementDescriptor(el)) {
            return normalizeWwElementBindProps(el);
          }
        }
        return null;
      }
      const rawMap = unwrapBoundPlainObject(props.content?.cellWwTemplates);
      if (
        !rawMap ||
        typeof rawMap !== 'object' ||
        Array.isArray(rawMap)
      ) {
        return null;
      }
      const desc = rawMap[normalizedKey];
      if (desc == null) {
        return null;
      }
      const unwrapped = peelWewebElementDescriptor(
        unwrapBoundPlainObject(desc) ?? desc,
      );
      if (!isLikelyWwElementDescriptor(unwrapped)) {
        return null;
      }
      return normalizeWwElementBindProps(unwrapped);
    }

    function cellWwBindList(cell) {
      void renderTick.value;
      const b = resolveCellWwDescriptor(cell);
      return b ? [b] : [];
    }

    function showEditorCellWwSlotDropzone(cell, rowIdx) {
      if (!props.wwEditorState) {
        return false;
      }
      if (rowIdx !== 0) {
        return false;
      }
      const k = cell?.column?.columnDef?.meta?.gwWwTemplateKey;
      const nk = typeof k === 'string' ? k.trim() : '';
      if (nk !== '_slot' && nk !== '__editorSlot__') {
        return false;
      }
      void renderTick.value;
      return !resolveCellWwDescriptor(cell);
    }

    function cellWwForcedProps(cell, row) {
      void renderTick.value;
      const orig = row?.original;
      const rowData =
        orig && typeof orig === 'object' && !Array.isArray(orig)
          ? { ...orig }
          : orig;
      return {
        cellValue: cell.getValue(),
        rowData,
        rowId: row.id,
        columnId: cell.column.id,
        accessorKey: cell.column.columnDef.accessorKey,
      };
    }

    function onEditableCellFocus(cell, row) {
      editBaseline.value.set(editCellKey(row, cell), cell.getValue());
    }

    function onEditableCellBlur(cell, row, ev) {
      const key = editCellKey(row, cell);
      const oldValue = editBaseline.value.has(key)
        ? editBaseline.value.get(key)
        : cell.getValue();
      editBaseline.value.delete(key);
      const newValue = ev.target.value;
      const oldStr = oldValue == null ? '' : String(oldValue);
      if (oldStr === newValue) {
        return;
      }
      emitWorkflow('cell-value-changed', {
        data: row.original,
        oldValue,
        newValue,
        columnId: cell.column.id,
        accessorKey: cell.column.columnDef.accessorKey,
      });
    }

    const allRowsSelectedFlag = computed(() => {
      void renderTick.value;
      if (!selectionEnabled.value) {
        return false;
      }
      try {
        return table.getIsAllRowsSelected();
      } catch {
        return false;
      }
    });

    function onToggleAllRowsSelected(ev) {
      lastToggledRowId.value = null;
      table.getToggleAllRowsSelectedHandler()(ev);
    }

    function onRowSelectionCheckboxChange(row, ev) {
      lastToggledRowId.value = row.id;
      row.getToggleSelectedHandler()(ev);
    }

    function goPrevPage() {
      if (!paginationEnabled.value) {
        return;
      }
      try {
        table.previousPage();
      } catch {
        /* noop */
      }
    }

    function goNextPage() {
      if (!paginationEnabled.value) {
        return;
      }
      try {
        table.nextPage();
      } catch {
        /* noop */
      }
    }

    function onPaginationPageSizeChange(ev) {
      const n = Number(ev.target.value);
      if (!paginationEnabled.value || !Number.isFinite(n) || n < 1) {
        return;
      }
      try {
        table.setPageSize(Math.min(500, Math.floor(n)));
      } catch {
        /* noop */
      }
    }

    function setSelectAllCheckboxRef(el) {
      selectAllCheckboxRef.value = el;
    }

    const onRowClicked = (row) => {
      emitWorkflow('row-clicked', {
        data: row.original,
        rowId: row.id,
      });
    };

    /*
     * Avoid TanStack row helpers that chain ColumnVisibility + ColumnPinning memos:
     * getVisibleCells → spread errors; _getAllVisibleCells → can call .filter on undefined when
     * getAllCells() is transiently missing during editor/HMR updates.
     * Build visible cells from getAllCells() + column.getIsVisible() (no pinning in this element).
     */
    const visibleCellsForRow = (row) => {
      if (!row || typeof row.getAllCells !== 'function') {
        return [];
      }
      try {
        const all = row.getAllCells();
        if (!Array.isArray(all)) {
          return [];
        }
        return all.filter((cell) => {
          const col = cell?.column;
          if (!col || typeof col.getIsVisible !== 'function') {
            return true;
          }
          return col.getIsVisible();
        });
      } catch {
        return [];
      }
    };

    const filterCloseListenerWindows = [];
    const filterOutsideClickDocs = [];

    onMounted(() => {
      if (typeof window !== 'undefined') {
        filterCloseListenerWindows.push(window);
        try {
          if (window.top && window.top !== window) {
            filterCloseListenerWindows.push(window.top);
          }
        } catch {
          /* cross-origin top */
        }
        for (const w of filterCloseListenerWindows) {
          w.addEventListener('pointerdown', onGlobalPointerDown, true);
          w.addEventListener('mousedown', onGlobalPointerDown, true);
          w.addEventListener('keydown', onDocumentKeydown, true);
        }
        window.addEventListener('resize', repositionOpenFilterPanel, {
          passive: true,
        });
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('click', onFilterOutsideClick, false);
        filterOutsideClickDocs.push(document);
        try {
          const td = window.top?.document;
          if (td && td !== document) {
            td.addEventListener('click', onFilterOutsideClick, false);
            filterOutsideClickDocs.push(td);
          }
        } catch {
          /* cross-origin */
        }
      }
      nextTick(() => {
        scrollElRef.value?.addEventListener('scroll', repositionOpenFilterPanel, {
          passive: true,
        });
        emitWorkflow('table-ready', {
          rowCount: filteredRowCount.value,
        });
      });
    });

    onBeforeUnmount(() => {
      scrollElRef.value?.removeEventListener(
        'scroll',
        repositionOpenFilterPanel,
      );
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', repositionOpenFilterPanel);
      }
      for (const w of filterCloseListenerWindows) {
        w.removeEventListener('pointerdown', onGlobalPointerDown, true);
        w.removeEventListener('mousedown', onGlobalPointerDown, true);
        w.removeEventListener('keydown', onDocumentKeydown, true);
      }
      filterCloseListenerWindows.length = 0;
      for (const d of filterOutsideClickDocs) {
        d.removeEventListener('click', onFilterOutsideClick, false);
      }
      filterOutsideClickDocs.length = 0;
    });

    return {
      FlexRender,
      SELECTION_COLUMN_ID,
      selectionEnabled,
      headerGroups,
      bodyRows,
      appearance,
      headerThunkStyle,
      cellThunkStyle,
      rowStyleAt,
      rootLayoutClasses,
      containerStyle,
      rootInlineStyle,
      stickyHeaderOn,
      scrollElRef,
      onRowClicked,
      visibleCellsForRow,
      headerWidthStyle,
      cellWidthStyle,
      columnFilterVariant,
      shouldShowColumnFilter,
      columnFilterActive,
      openFilterColumnId,
      openFilterColumn,
      filterPanelRef,
      filterPanelBoxStyle,
      toggleFilterPanel,
      enumFilterOptions,
      enumFilterSignature,
      enumOptionSelected,
      onEnumFilterChange,
      booleanFilterValue,
      onBooleanFilterChange,
      numberFilterValue,
      onNumberFilterChange,
      textFilterValue,
      onTextFilterInput,
      allRowsSelectedFlag,
      paginationEnabled,
      showPaginationSummary,
      filteredRowCount,
      canPreviousPage,
      canNextPage,
      paginationPageDisplay,
      currentTablePageSize,
      paginationRangeLabel,
      pageSizeOptionsForSelect,
      goPrevPage,
      goNextPage,
      onPaginationPageSizeChange,
      onRowSelectionCheckboxChange,
      onToggleAllRowsSelected,
      setSelectAllCheckboxRef,
      editableCellDisplay,
      onEditableCellFocus,
      onEditableCellBlur,
      cellPlainFallback,
      resolveCellWwDescriptor,
      cellWwBindList,
      showEditorCellWwSlotDropzone,
      cellWwForcedProps,
    };
  },
};
</script>

<style scoped lang="scss">
.gw-ts-editor-only-cell-slot {
  width: 100%;
  min-width: 0;
}

.gw-ts-cell-template-dropzone {
  box-sizing: border-box;
  min-height: 48px;
  min-width: 160px;
  margin: 0 0 8px;
  padding: 4px;
  border: 1px dashed rgba(15, 23, 42, 0.2);
  border-radius: 6px;
  background: rgba(249, 250, 251, 0.9);
}

.gw-ts-cell-template-dropzone--in-cell {
  margin: 0;
  min-height: 2.25rem;
  min-width: 0;
  width: 100%;
}


.gw-ts-root--fill {
  flex: 1 1 0%;
  align-self: stretch;
  height: 100%;
}

.gw-ts-root--fixed {
  flex: 0 0 auto;
  align-self: stretch;
  min-height: 120px;
}

.gw-ts-root--auto-height {
  height: auto;
  align-self: flex-start;
  flex: 0 0 auto;
}

.gw-ts-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.gw-ts-table {
  border-collapse: collapse;
  table-layout: auto;
  width: max-content;
  max-width: 100%;
}

.gw-ts-th {
  vertical-align: bottom;
  position: relative;
}

.gw-ts-th-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.gw-ts-th-inner .gw-ts-anchor {
  flex: 1 1 auto;
  min-width: 0;
}

.gw-ts-th-inner--selection {
  justify-content: center;
  align-items: center;
  min-height: 1.25rem;
}

.gw-ts-row-select {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.gw-ts-cell-input {
  display: block;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  font: inherit;
  padding: 2px 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: #fff;
}

.gw-ts-anchor--ww {
  display: block;
  min-width: 0;
}

.gw-ts-anchor--ww :deep(.ww-element) {
  max-width: 100%;
}

.gw-ts-filter-trigger {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 2px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(15, 23, 42, 0.45);
  cursor: pointer;
  line-height: 0;
}

.gw-ts-filter-trigger:hover {
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.75);
}

.gw-ts-filter-trigger--active {
  color: #2563eb;
}

.gw-ts-filter-trigger--active:hover {
  color: #1d4ed8;
}

.gw-ts-filter-panel {
  position: fixed;
  z-index: 2147483000;
  min-width: 200px;
  max-width: min(360px, calc(100vw - 16px));
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 6px;
  background: #fff;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.08),
    0 10px 24px -4px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.gw-ts-filter-panel__body {
  padding: 10px;
  max-height: inherit;
  overflow: auto;
  box-sizing: border-box;
}

.gw-ts-table th,
.gw-ts-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  vertical-align: top;
}

.gw-ts-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  background: transparent;
}

.gw-ts-resizer:hover {
  background: rgba(59, 130, 246, 0.25);
}

.gw-ts-table thead th {
  font-weight: 600;
  background: #f9fafb;
}

.gw-ts-root--sticky-header .gw-ts-table thead th {
  position: sticky;
  top: var(--gw-ts-sticky-top, 0px);
  z-index: 2;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
}

.gw-ts-filter-input,
.gw-ts-filter-select {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  padding: 4px 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: #fff;
}

.gw-ts-filter-select[multiple] {
  min-height: 52px;
  padding: 2px;
}

.gw-ts-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  padding: 8px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
  font-size: 12px;
  color: #374151;
}

.gw-ts-pagination__controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.gw-ts-pagination__btn {
  margin: 0;
  padding: 4px 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: #fff;
  font: inherit;
  cursor: pointer;
  color: #1f2937;
}

.gw-ts-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.gw-ts-pagination__page {
  padding: 0 4px;
  white-space: nowrap;
}

.gw-ts-pagination__summary {
  flex: 1 1 auto;
  text-align: center;
  min-width: 0;
  white-space: nowrap;
}

.gw-ts-pagination__size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.gw-ts-pagination__size-label {
  color: #6b7280;
}

.gw-ts-pagination__select {
  margin: 0;
  padding: 4px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: #fff;
  font: inherit;
  min-width: 4rem;
}
</style>
