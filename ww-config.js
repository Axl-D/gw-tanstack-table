export default {
  editor: {
    label: {
      en: 'TanStack Table (Guestwhat)',
    },
    icon: 'table',
    bubble: {
      icon: 'table',
    },
  },
  options: {
    sizable: true,
  },
  triggerEvents: [
    {
      name: 'table-ready',
      label: { en: 'Table ready' },
    },
    {
      name: 'row-clicked',
      label: { en: 'Row clicked' },
    },
    {
      name: 'selection-changed',
      label: { en: 'Selection changed' },
    },
    {
      name: 'cell-value-changed',
      label: { en: 'Cell value changed' },
    },
  ],
  properties: {
    rowData: {
      label: { en: 'Row data' },
      type: 'Info',
      options: {
        text: {
          en: 'Bind an array of row objects.',
        },
      },
      bindable: 'list',
      defaultValue: [],
      section: 'settings',
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: 'array' }],
        tooltip: 'Array of rows, e.g. `myCollection.data`',
      },
      /* wwEditor:end */
    },
    columnDefs: {
      label: { en: 'Column definitions' },
      type: 'Info',
      options: {
        text: {
          en: 'TanStack-style columns or AG Grid–like `{ field, headerName }`. Leave empty to infer from first row.',
        },
      },
      bindable: 'list',
      defaultValue: [],
      section: 'settings',
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: 'array' }],
        tooltip:
          'Examples: `{ accessorKey: "name", header: "Name" }` or `{ field: "name", headerName: "Name" }`. Optional `editable: true` enables inline edit + cell-value-changed. Function fields are ignored.',
      },
      /* wwEditor:end */
    },
    enableRowSelection: {
      label: { en: 'Enable row selection' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: true, label: { en: 'Yes' } },
          { value: false, label: { en: 'No' } },
        ],
      },
      defaultValue: false,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        tooltip:
          'Adds a checkbox column. selection-changed payload: `{ selectedRowIds: string[], lastToggledId: string|null }` (null for select-all / bulk).',
      },
      /* wwEditor:end */
    },
    rowIdField: {
      label: { en: 'Row id field' },
      type: 'Text',
      section: 'settings',
      defaultValue: 'id',
      bindable: true,
      options: {
        placeholder: 'id',
      },
      /* wwEditor:start */
      bindingValidation: {
        tooltip:
          'Property name on each row object used as stable selection id (must be unique per row). Fallback to row index if missing.',
      },
      /* wwEditor:end */
    },
    enablePagination: {
      label: { en: 'Enable pagination' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: true, label: { en: 'Yes' } },
          { value: false, label: { en: 'No' } },
        ],
      },
      defaultValue: false,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        tooltip:
          'Client-side pagination on the full bound dataset after filters. Page size and options below.',
      },
      /* wwEditor:end */
    },
    pageSize: {
      label: { en: 'Page size' },
      type: 'Text',
      section: 'settings',
      defaultValue: '25',
      bindable: true,
      hidden: (content) => !content.enablePagination,
      options: {
        placeholder: '25',
      },
      /* wwEditor:start */
      bindingValidation: {
        tooltip: 'Number of rows per page (1–500).',
      },
      /* wwEditor:end */
    },
    pageSizeOptions: {
      label: { en: 'Page size options' },
      type: 'Info',
      section: 'settings',
      options: {
        text: {
          en: 'List of allowed page sizes for the footer selector.',
        },
      },
      bindable: 'list',
      defaultValue: [10, 25, 50, 100],
      hidden: (content) => !content.enablePagination,
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: 'array' }],
        tooltip: 'Array of numbers e.g. `[10, 25, 50, 100]`.',
      },
      /* wwEditor:end */
    },
    showPaginationSummary: {
      label: { en: 'Show range summary' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: true, label: { en: 'Yes' } },
          { value: false, label: { en: 'No' } },
        ],
      },
      defaultValue: true,
      bindable: true,
      hidden: (content) => !content.enablePagination,
      /* wwEditor:start */
      bindingValidation: {
        tooltip: 'e.g. "1–25 of 120" in the pagination bar.',
      },
      /* wwEditor:end */
    },
    quickFilterText: {
      label: { en: 'Quick filter' },
      type: 'Text',
      defaultValue: '',
      bindable: true,
      section: 'settings',
    },
    stickyHeader: {
      label: { en: 'Pin header row on scroll' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: true, label: { en: 'Yes' } },
          { value: false, label: { en: 'No' } },
        ],
      },
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        tooltip:
          'Overrides appearance JSON `stickyHeader` when bound. Use appearance `stickyHeaderTop` for offset under fixed UI.',
      },
      /* wwEditor:end */
    },
    appearanceJson: {
      label: { en: 'Appearance (rows, headers, cells)' },
      type: 'Textarea',
      section: 'settings',
      options: {
        placeholder:
          '{"rootStyle":{},"scrollStyle":{},"tableStyle":{},"rowStyle":{},"headerCellStyle":{}}',
      },
      defaultValue: '{}',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: 'object' }],
        tooltip:
          'Plain JSON: Layout — rootStyle/rootClass, scrollStyle/scrollClass, tableStyle/tableClass. Rows — rowStyle, bodyRowStyle/bodyRowClass, oddRowStyle/evenRowStyle. Cells — headerCellStyle/headerCellClass (or headerStyle/headerClass), bodyCellStyle/bodyCellClass (or cellStyle/cellClass). Filters — filterTrigger*, filterPanel*, filterInput*. Selection/edit — selectionCheckbox*, editableInput*. Pagination bar — paginationStyle/Class, paginationButton*, paginationSelect*, paginationSummary*. Sticky — stickyHeader, stickyHeaderTop.',
      },
      /* wwEditor:end */
    },
    layoutSizing: {
      label: { en: 'Height in layout' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          {
            value: 'fill',
            label: { en: 'Fill container (Flex)' },
          },
          {
            value: 'autoHeight',
            label: { en: 'Fit content height' },
          },
          {
            value: 'fixed',
            label: { en: 'Fixed height (below)' },
          },
        ],
      },
      defaultValue: 'fill',
    },
    fillMinHeightCss: {
      label: { en: 'Fill mode: min-height (CSS)' },
      type: 'Text',
      section: 'settings',
      hidden: (content) => content.layoutSizing !== 'fill',
      defaultValue: '',
      bindable: false,
      options: {
        placeholder: 'Empty = min(42vh, 720px)',
      },
    },
    height: {
      label: { en: 'Fixed height' },
      type: 'Length',
      options: {
        unitChoices: [
          { value: 'px', label: 'px', min: 120, max: 2000 },
          { value: '%', label: '%', min: 10, max: 100 },
        ],
      },
      defaultValue: '480px',
      section: 'settings',
      hidden: (content) => content.layoutSizing !== 'fixed',
    },
  },
};
