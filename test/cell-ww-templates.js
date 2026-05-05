/**
 * WeWeb formula → bind to **Cell WeWeb templates** (`cellWwTemplates` on the table element).
 *
 * ## `element undefined`
 *
 * WeWeb needs **`isWwObject: true`** plus a component id: built-ins use **`type`** (e.g. `ww-text`);
 * **reusable library components** use **`libraryComponentBaseId`** (see `wwObjects` in a page export).
 * The table copies that id onto **`type`** for `<wwElement>` when needed.
 *
 * ## Two ways to author
 *
 * | Approach | Config | Column def |
 * |----------|--------|------------|
 * | **Dropzone** | Drag into dashed Cell template (`cellWwSlot`); editor-only UI | `gwWwTemplateKey: '_slot'` |
 * | **Map / formula** | Bind `cellWwTemplates` object | `gwWwTemplateKey: 'badge'` matching a map key |
 *
 * The table renders **`<wwElement v-bind="descriptor" :ww-props="…" />`** (not dynamic `:is`).
 *
 * ## How props work with the TanStack table
 *
 * The table renders:
 *   `<wwElement v-bind="cellWwTemplates[badgeKey]" :ww-props="forced" />`
 *
 * **forced** is always:
 *   `{ cellValue, rowData, rowId, columnId, accessorKey }`
 *
 * Your Badge’s fields (**size**, **iconOnly**, **leadingIcon**, **trailingIcon**, **label**,
 * **colorName**) live in the embedded element’s **`content`** for static defaults.
 *
 * For **per-row** values you usually do one of:
 *
 * 1. **Bind in the WeWeb editor** on the nested Badge: set **label** / **colorName** (etc.) to
 *    formulas that read **ww-props** / forced props from the parent (e.g. map `label` from
 *    the cell value or `rowData.role`). Exact formula path depends on WeWeb’s “element state”
 *    UI for nested `wwElement` children (same idea as `:ww-props="{ text: … }` on `ww-text`).
 *
 * 2. **Keep static** `content` here for layout (size, icons) and drive only text/color from
 *    formulas bound to `cellValue` / `rowData` as above.
 *
 * If you need **arbitrary** keys on `ww-props` (e.g. pass `label` and `colorName` directly from
 * the table code), extend `cellWwForcedProps` in `src/wwElement.vue` — today it only passes
 * the five keys above.
 *
 * @see https://developer.weweb.io/add-element-property.html
 */

/** Reusable component **base** id from WeWeb (`libraryComponentBaseId` in page exports). */
const BADGE_LIBRARY_BASE_UID = '89bf33b3-544d-49ac-931d-7dd2a17fd8f6';

/**
 * Single template entry: key = `gwWwTemplateKey` / `meta.gwWwTemplateKey` in column defs.
 * Key `badge` matches `test/column-defs.js` (preferred_language column).
 */
return {
  badge: {
    isWwObject: true,
    libraryComponentBaseId: BADGE_LIBRARY_BASE_UID,
    _state: {},
    // `type` is derived at render for wwElement when missing; you may also paste a full editor export.
    content: {
      /** @example 'sm' | 'md' | 'lg' — match your Badge’s select options */
      size: 'md',
      iconOnly: false,
      leadingIcon: '',
      trailingIcon: '',
      /** Static placeholder; prefer WeWeb formula → ww-props.cellValue for live cells */
      label: '',
      /** @example token name your Badge maps to a palette */
      colorName: 'neutral',
    },
  },
};
