export function unwrapBoundPlainObject(val) {
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

export function stripFunctionsDeep(val, depth = 0) {
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

export function unwrapArrayBinding(val, depth = 0) {
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

export function sanitizeRows(rowData) {
  return unwrapArrayBinding(rowData);
}
