import { unwrapArrayBinding, unwrapBoundPlainObject } from './bindings.js';

/**
 * Coerce text bindings (quick filter, etc.). WeWeb often passes `{ value: '…' }`:
 * `String(that)` → '[object Object]' and breaks substring filters (zero rows).
 */
export function coerceBoundText(val) {
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

export function coerceEnableRowSelection(raw) {
  if (raw !== undefined && raw !== null && raw !== '') {
    if (raw === false || raw === 'false' || raw === 0) {
      return false;
    }
    return true;
  }
  return false;
}

export function coerceEnablePagination(raw) {
  return coerceEnableRowSelection(raw);
}

export function coerceShowPaginationSummary(raw) {
  if (raw !== undefined && raw !== null && raw !== '') {
    if (raw === false || raw === 'false' || raw === 0) {
      return false;
    }
    return true;
  }
  return true;
}

export function coercePageSize(val) {
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

export function sanitizePageSizeOptions(raw) {
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
