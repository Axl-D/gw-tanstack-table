/*
 * Avoid TanStack row helpers that chain ColumnVisibility + ColumnPinning memos:
 * getVisibleCells → spread errors; _getAllVisibleCells → can call .filter on undefined when
 * getAllCells() is transiently missing during editor/HMR updates.
 * Build visible cells from getAllCells() + column.getIsVisible() (no pinning in this element).
 */
export function visibleCellsForRow(row) {
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
}
