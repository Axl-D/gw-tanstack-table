import { unwrapArrayBinding, unwrapBoundPlainObject } from '../gw-ts/bindings.js';
import {
  isLikelyWwElementDescriptor,
  normalizeWwElementBindProps,
  peelWewebElementDescriptor,
} from '../gw-ts/wwElementDescriptor.js';

/**
 * WeWeb cell dropzones: columns with **`meta.gwWwDropzoneTarget`** resolve the shared dropped
 * tree from `content.cellWwSlot`. **`dropzoneTarget`** on `ww-props` / context matches that meta
 * value so slot content can branch per target id.
 */
export function useGwCellWw(props, renderTick) {
  function cellHasWwDropzone(cell) {
    void renderTick.value;
    const t = cell?.column?.columnDef?.meta?.gwWwDropzoneTarget;
    if (t == null) {
      return false;
    }
    return String(t).trim() !== '';
  }

  function resolveCellWwDescriptor(cell) {
    void renderTick.value;
    if (!cellHasWwDropzone(cell)) {
      return null;
    }
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

  function cellWwBindList(cell) {
    void renderTick.value;
    const b = resolveCellWwDescriptor(cell);
    return b ? [b] : [];
  }

  /**
   * Editor: show `wwLayout path="cellWwSlot"` until the designer drops a template
   * (`resolveCellWwDescriptor` then supplies `wwElement`).
   */
  function showEditorCellWwSlotDropzone(cell) {
    if (!props.wwEditorState) {
      return false;
    }
    if (!cellHasWwDropzone(cell)) {
      return false;
    }
    void renderTick.value;
    return !resolveCellWwDescriptor(cell);
  }

  function cellWwForcedProps(cell, row) {
    void renderTick.value;
    const meta = cell?.column?.columnDef?.meta;
    const dropzoneTarget =
      meta &&
      typeof meta === 'object' &&
      !Array.isArray(meta) &&
      meta.gwWwDropzoneTarget != null
        ? String(meta.gwWwDropzoneTarget).trim()
        : '';
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
      dropzoneTarget,
    };
  }

  function cellPlainFallback(cell) {
    void renderTick.value;
    const v = cell.getValue();
    return v == null ? '' : String(v);
  }

  return {
    cellHasWwDropzone,
    resolveCellWwDescriptor,
    cellWwBindList,
    showEditorCellWwSlotDropzone,
    cellWwForcedProps,
    cellPlainFallback,
  };
}
