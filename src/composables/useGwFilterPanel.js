import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';

/** WeWeb isolation: prefer host APIs; fall back for local/dev outside the editor. */
function getFrontWindow() {
  const lib = typeof globalThis !== 'undefined' ? globalThis.wwLib : undefined;
  if (lib && typeof lib.getFrontWindow === 'function') {
    try {
      const w = lib.getFrontWindow();
      if (w) {
        return w;
      }
    } catch {
      /* noop */
    }
  }
  return typeof globalThis !== 'undefined' && globalThis.window
    ? globalThis.window
    : undefined;
}

function getFrontDocument() {
  const lib = typeof globalThis !== 'undefined' ? globalThis.wwLib : undefined;
  if (lib && typeof lib.getFrontDocument === 'function') {
    try {
      const d = lib.getFrontDocument();
      if (d) {
        return d;
      }
    } catch {
      /* noop */
    }
  }
  return getFrontWindow()?.document;
}

export function useGwFilterPanel({ table, appearance, renderTick, scrollElRef }) {
  const openFilterColumnId = ref(null);
  const filterPanelRef = ref(null);
  const filterAnchorThEl = shallowRef(null);

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

  function clampPopoverPosition(thEl) {
    const margin = 8;
    const gap = 6;
    const fw = getFrontWindow();
    const vw = fw?.innerWidth ?? 1024;
    const vh = fw?.innerHeight ?? 768;
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

  const filterCloseListenerWindows = [];
  const filterOutsideClickDocs = [];
  let detachResize = null;

  onMounted(() => {
    const frontWin = getFrontWindow();
    const frontDoc = getFrontDocument();
    if (frontWin) {
      filterCloseListenerWindows.push(frontWin);
      try {
        if (frontWin.top && frontWin.top !== frontWin) {
          filterCloseListenerWindows.push(frontWin.top);
        }
      } catch {
        /* cross-origin top */
      }
      for (const w of filterCloseListenerWindows) {
        w.addEventListener('pointerdown', onGlobalPointerDown, true);
        w.addEventListener('mousedown', onGlobalPointerDown, true);
        w.addEventListener('keydown', onDocumentKeydown, true);
      }
      frontWin.addEventListener('resize', repositionOpenFilterPanel, {
        passive: true,
      });
      detachResize = () => {
        frontWin.removeEventListener('resize', repositionOpenFilterPanel);
      };
    }
    if (frontDoc) {
      frontDoc.addEventListener('click', onFilterOutsideClick, false);
      filterOutsideClickDocs.push(frontDoc);
      try {
        const td = frontWin?.top?.document;
        if (td && td !== frontDoc) {
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
    });
  });

  onBeforeUnmount(() => {
    scrollElRef.value?.removeEventListener(
      'scroll',
      repositionOpenFilterPanel,
    );
    detachResize?.();
    detachResize = null;
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
    openFilterColumnId,
    filterPanelRef,
    openFilterColumn,
    filterPanelBoxStyle,
    toggleFilterPanel,
    repositionOpenFilterPanel,
    columnFilterVariant,
    shouldShowColumnFilter,
    columnFilterActive,
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
  };
}
