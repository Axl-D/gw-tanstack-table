export const gwEnumSet = (row, columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }
  const v = row.getValue(columnId);
  return filterValue.some((x) => x === v || String(x) === String(v));
};
gwEnumSet.autoRemove = (val) =>
  val == null || !Array.isArray(val) || val.length === 0;

export const gwBoolean = (row, columnId, filterValue) => {
  if (filterValue === '' || filterValue === undefined || filterValue === null) {
    return true;
  }
  const want = filterValue === true || filterValue === 'true';
  return Boolean(row.getValue(columnId)) === want;
};
gwBoolean.autoRemove = (val) =>
  val === '' || val === undefined || val === null;

export const gwNumberExact = (row, columnId, filterValue) => {
  if (filterValue === '' || filterValue === undefined || filterValue === null) {
    return true;
  }
  const n = Number(filterValue);
  if (Number.isNaN(n)) {
    return true;
  }
  return Number(row.getValue(columnId)) === n;
};
gwNumberExact.autoRemove = (val) =>
  val === '' || val === undefined || val === null;
