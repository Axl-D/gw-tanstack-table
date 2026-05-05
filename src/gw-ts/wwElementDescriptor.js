import { unwrapBoundPlainObject } from './bindings.js';

/** Built-in elements use `type`; reusable library components use `libraryComponentBaseId` in exports. */
export function wwDescriptorTypeOrLibraryId(val) {
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

export function isLikelyWwElementDescriptor(val) {
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
export function normalizeWwElementBindProps(desc) {
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
export function peelWewebElementDescriptor(val, depth = 0) {
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
