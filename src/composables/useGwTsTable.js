import {
  computed,
  nextTick,
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
import { SELECTION_COLUMN_ID } from '../gw-ts/constants.js';
import { gwEnumSet, gwBoolean, gwNumberExact } from '../gw-ts/filterFns.js';
import {
  coerceBoundText,
  coerceEnablePagination,
  coerceEnableRowSelection,
  coercePageSize,
  coerceShowPaginationSummary,
  sanitizePageSizeOptions,
} from '../gw-ts/coerce.js';
import { parseAppearance } from '../gw-ts/appearance.js';
import { normalizeCssLength } from '../gw-ts/cssLength.js';
import { sanitizeRows } from '../gw-ts/bindings.js';
import {
  buildColumns,
  mapColumnDef,
  rowsPassQuickFilter,
  selectionColumnDef,
} from '../gw-ts/columns.js';
import { visibleCellsForRow as getVisibleCellsForRow } from '../gw-ts/visibleCells.js';
import { useGwFilterPanel } from './useGwFilterPanel.js';
import { useGwCellWw } from './useGwCellWw.js';

/**
 * WeWeb custom element: TanStack Table instance, layout, WeWeb cell templates, workflows.
 * Single composable so useVueTable + filter panel share one closure (reposition wiring).
 */
export function useGwTsTable(props, { emit }) {
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
      return [...set].sort((x, y) => x - y);
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

    const renderTick = ref(0);
    const scrollElRef = ref(null);
    const selectAllCheckboxRef = ref(null);

    /*
     * Assigned immediately after useGwFilterPanel — table callbacks call this on resize/pagination;
     * must exist before user interaction.
     */
    let repositionOpenFilterPanel = () => {};

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

    /*
     * Do NOT pass data as a Ref to useVueTable: when IS_REACTIVE is true the adapter wraps it in
     * another shallowRef and setState({ data: dataRef.value }) stores the inner Ref, not the rows
     * array — getCoreRowModel then sees a non-array → zero rows.
     * Plain getters make IS_REACTIVE false; watchEffect merges options and reads .value each time.
     */
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

    const filterPanel = useGwFilterPanel({
      table,
      appearance,
      renderTick,
      scrollElRef,
    });
    repositionOpenFilterPanel = filterPanel.repositionOpenFilterPanel;

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

    /** Plain row originals, same order as `bodyRows` — `wwLayoutItemContext` repeated list. */
    const wwCellRepeatContext = computed(() => {
      void renderTick.value;
      return bodyRows.value.map((r) => r.original);
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

    const editBaseline = shallowRef(new Map());

    function editCellKey(row, cell) {
      return `${row.id}:${cell.column.id}`;
    }

    function editableCellDisplay(cell) {
      void renderTick.value;
      const v = cell.getValue();
      return v == null ? '' : String(v);
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

    const {
      cellHasWwDropzone,
      resolveCellWwDescriptor,
      cellWwBindList,
      showEditorCellWwSlotDropzone,
      cellWwForcedProps,
      cellPlainFallback,
    } = useGwCellWw(props, renderTick);

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

    onMounted(() => {
      nextTick(() => {
        emitWorkflow('table-ready', {
          rowCount: filteredRowCount.value,
        });
      });
    });

    return {
      FlexRender,
      SELECTION_COLUMN_ID,
      selectionEnabled,
      headerGroups,
      bodyRows,
      wwCellRepeatContext,
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
      visibleCellsForRow: getVisibleCellsForRow,
      headerWidthStyle,
      cellWidthStyle,
      ...filterPanel,
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
      cellHasWwDropzone,
      resolveCellWwDescriptor,
      cellWwBindList,
      showEditorCellWwSlotDropzone,
      cellWwForcedProps,
    };
}
