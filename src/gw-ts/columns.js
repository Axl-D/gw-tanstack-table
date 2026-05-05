import { SELECTION_COLUMN_ID } from './constants.js';
import { stripFunctionsDeep, unwrapArrayBinding } from './bindings.js';
import { coerceBoundText } from './coerce.js';

export function selectionColumnDef() {
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

export function normalizeColumnFilters(base) {
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

/** Legacy: old defs used `gwWwTemplateKey: '_slot'`; migrated to `meta.gwWwDropzoneTarget`. */
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

/** Discriminator for WeWeb cell / dropzone formulas (conditional render). Coerces bindings. */
function coerceGwWwDropzoneTarget(cleaned) {
  const top = cleaned.gwWwDropzoneTarget;
  const fromMeta =
    cleaned.meta &&
    typeof cleaned.meta === 'object' &&
    !Array.isArray(cleaned.meta) &&
    cleaned.meta.gwWwDropzoneTarget != null
      ? cleaned.meta.gwWwDropzoneTarget
      : undefined;
  const raw = top != null && top !== '' ? top : fromMeta;
  if (raw == null || raw === '') {
    return null;
  }
  const s = coerceBoundText(raw).trim();
  return s || null;
}

export function mapColumnDef(c) {
  const cleaned = stripFunctionsDeep(c);
  let wwDropzoneTarget = coerceGwWwDropzoneTarget(cleaned);
  if (wwDropzoneTarget == null) {
    const legacyTpl = coerceGwWwTemplateKey(cleaned);
    if (legacyTpl === '_slot' || legacyTpl === '__editorSlot__') {
      wwDropzoneTarget = '_slot';
    }
  }
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
  delete base.gwWwDropzoneTarget;
  if (base.meta && typeof base.meta === 'object' && !Array.isArray(base.meta)) {
    const { gwWwTemplateKey: _gwWw, gwWwDropzoneTarget: _gwDt, ...metaRest } =
      base.meta;
    base.meta = metaRest;
  }
  const def = normalizeColumnFilters(base);
  const metaBase =
    def.meta && typeof def.meta === 'object' && !Array.isArray(def.meta)
      ? { ...def.meta }
      : {};

  if (wwDropzoneTarget != null) {
    return {
      ...def,
      meta: {
        ...metaBase,
        gwWwDropzoneTarget: wwDropzoneTarget,
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

export function inferColumnsFromRows(rows) {
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

export function buildColumns(columnDefsRaw, rows) {
  const columnDefs = unwrapArrayBinding(columnDefsRaw);
  if (!Array.isArray(columnDefs)) {
    return inferColumnsFromRows(rows);
  }
  if (columnDefs.length) {
    return columnDefs.map((c) => mapColumnDef(c));
  }
  return inferColumnsFromRows(rows);
}

export function rowsPassQuickFilter(rows, q) {
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
