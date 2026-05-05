import { unwrapBoundPlainObject } from './bindings.js';

function trimClassString(val) {
  return typeof val === 'string' ? val.trim() : '';
}

function plainStyle(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {};
}

export function normalizeAppearance(o) {
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

export function parseAppearance(rawContent) {
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
