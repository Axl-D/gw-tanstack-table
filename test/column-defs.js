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
 * **Editor dropzone (recommended):** set `gwWwTemplateKey: '_slot'` (or `__editorSlot__`).
 * In the editor, drag **one** component into the dashed zone in the **first row** of that column.
 * The dropzone is **editor-only** (`wwEditorState`); published pages use `content.cellWwSlot` only.
 *
 * **Map mode (`cellWwTemplates`):** each value must match a WeWeb object: **`isWwObject: true`**
 * and **`type`** (built-in) or **`libraryComponentBaseId`** (reusable component base id from exports).
 * Prefer copying from the editor export. Hand-rolled JSON may yield “element undefined”.
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
  },
  {
    accessorKey: 'last_name',
    header: 'Nom',
    minSize: 100,
    size: 120,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    minSize: 180,
    size: 220,
  },
  {
    accessorKey: 'organisation_name',
    header: 'Organisation',
    minSize: 140,
    size: 180,
  },
  {
    accessorKey: 'role',
    header: 'Rôle',
    size: 100,
    filterVariant: 'enum',
    filterEnumValues: ['admin', 'editor', 'viewer'],
  },
  {
    accessorKey: 'preferred_language',
    header: 'Langue',
    size: 80,
    filterVariant: 'enum',
    filterEnumValues: ['fr', 'en'],
    gwWwTemplateKey: '_slot',
  },
  {
    accessorKey: 'has_accepted_tos',
    header: 'CGU',
    size: 72,
    filterVariant: 'boolean',
  },
  {
    accessorKey: 'is_super_admin',
    header: 'Super admin',
    size: 110,
    filterVariant: 'boolean',
  },
  {
    accessorKey: 'created_at',
    header: 'Créé le',
    minSize: 140,
    size: 165,
  },
];
