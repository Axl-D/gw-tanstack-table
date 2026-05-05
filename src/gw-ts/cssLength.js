export function normalizeCssLength(val) {
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
