/**
 * WeWeb formula → bind only to **Column definitions** (`columnDefs`).
 *
 * Uses TanStack’s native column-def shape (`accessorKey`, `header`, sizing props).
 * See: https://tanstack.com/table/v8/docs/guide/column-defs
 *
 * The coded element still accepts AG Grid–style `{ field, headerName }` for migrations;
 * this fixture sticks to TanStack so tests mirror the docs.
 *
 * Column filters (plain JSON): `filterVariant` (`text` | `enum` | `boolean` | `number` | `none`),
 * plus `filterEnumValues` for enums. Example: role → admin/editor/viewer.
 * `editable: true` enables inline text edit + WeWeb `cell-value-changed`.
 *
 * **WeWeb cell (dropzone):** set **`gwWwDropzoneTarget`** to a non-empty string (top-level or
 * `meta`). That id is passed as **`dropzoneTarget`** on `ww-props`; use it in the dropped UI to
 * render the right variant. Content lives in **`content.cellWwSlot`**. Legacy **`gwWwTemplateKey:
 * '_slot'`** is still read and mapped to **`gwWwDropzoneTarget: '_slot'`**.
 *
 * Only plain JSON survives bindings (no `cell` / `accessorFn` from formulas).
 */

return [
  {
    accessorKey: 'first_name',
    header: 'Prénom',
    minSize: 100,
    size: 120,
    editable: true,
    gwWwDropzoneTarget: 'text',
  },
  {
    accessorKey: 'last_name',
    header: 'Nom',
    minSize: 100,
    size: 120,
    gwWwDropzoneTarget: 'text',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    minSize: 180,
    size: 220,
    gwWwDropzoneTarget: 'text',
  },
  {
    accessorKey: 'organisation_name',
    header: 'Organisation',
    minSize: 140,
    size: 180,
    gwWwDropzoneTarget: 'text',
  },
  {
    accessorKey: 'role',
    header: 'Rôle',
    size: 100,
    filterVariant: 'enum',
    filterEnumValues: ['admin', 'editor', 'viewer'],
    gwWwDropzoneTarget: 'badges',
  },
  {
    accessorKey: 'preferred_language',
    header: 'Langue',
    size: 80,
    filterVariant: 'enum',
    filterEnumValues: ['fr', 'en'],
    gwWwDropzoneTarget: 'badges',
  },
  {
    accessorKey: 'has_accepted_tos',
    header: 'CGU',
    size: 72,
    filterVariant: 'boolean',
    gwWwDropzoneTarget: 'checkbox',
  },
  {
    accessorKey: 'is_super_admin',
    header: 'Super admin',
    size: 110,
    filterVariant: 'boolean',
    gwWwDropzoneTarget: 'checkbox',
  },
  {
    accessorKey: 'created_at',
    header: 'Créé le',
    minSize: 140,
    size: 165,
    gwWwDropzoneTarget: 'date',
  },
];
