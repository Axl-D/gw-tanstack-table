<template>
    <div
      class="gw-ts-root"
      :class="[
        rootLayoutClasses,
        appearance.rootClass || undefined,
        { 'gw-ts-root--sticky-header': stickyHeaderOn },
      ]"
      :style="rootInlineStyle"
    >
    <!-- WeWeb dropzone cells: `meta.gwWwDropzoneTarget` set in column def → `wwLayout` / `wwElement`. -->
    <div
      ref="scrollElRef"
      class="gw-ts-scroll"
      :class="appearance.scrollClass || undefined"
      :style="appearance.scrollStyle"
    >
      <table
        class="gw-ts-table"
        :class="appearance.tableClass || undefined"
        :style="appearance.tableStyle"
      >
        <thead>
          <tr v-for="hg in headerGroups" :key="hg.id">
            <th
              v-for="header in hg.headers"
              :key="header.id"
              class="gw-ts-th"
              :data-column-id="header.column.id"
              :colSpan="header.colSpan"
              :style="[headerThunkStyle, headerWidthStyle(header)]"
              :class="appearance.headerCellClass || undefined"
            >
              <template v-if="header.column.id === SELECTION_COLUMN_ID">
                <div class="gw-ts-th-inner gw-ts-th-inner--selection">
                  <input
                    :ref="setSelectAllCheckboxRef"
                    type="checkbox"
                    class="gw-ts-row-select"
                    :class="appearance.selectionCheckboxClass || undefined"
                    :style="appearance.selectionCheckboxStyle"
                    :checked="allRowsSelectedFlag"
                    aria-label="Select all rows"
                    @change="onToggleAllRowsSelected($event)"
                    @click.stop
                  />
                </div>
              </template>
              <template v-else>
                <div class="gw-ts-th-inner">
                  <span class="gw-ts-anchor">
                    <FlexRender
                      v-if="!header.isPlaceholder"
                      :key="header.id"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                  </span>
                  <button
                    v-if="shouldShowColumnFilter(header)"
                    type="button"
                    class="gw-ts-filter-trigger"
                    :class="[
                      appearance.filterTriggerClass || undefined,
                      { 'gw-ts-filter-trigger--active': columnFilterActive(header.column) },
                    ]"
                    :style="appearance.filterTriggerStyle"
                    :aria-expanded="openFilterColumnId === header.column.id ? 'true' : 'false'"
                    aria-haspopup="dialog"
                    :aria-controls="
                      openFilterColumnId === header.column.id
                        ? 'gw-ts-filter-panel-' + header.column.id
                        : undefined
                    "
                    @click.stop="toggleFilterPanel(header, $event)"
                  >
                    <span class="gw-ts-filter-trigger__icon" aria-hidden="true">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </span>
                  </button>
                </div>
              </template>
              <div
                v-if="
                  header.column.id !== SELECTION_COLUMN_ID &&
                  !header.isPlaceholder &&
                  header.column.getCanResize() &&
                  !(header.subHeaders && header.subHeaders.length)
                "
                class="gw-ts-resizer"
                @mousedown="header.getResizeHandler()($event)"
                @touchstart="header.getResizeHandler()($event)"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIdx) in bodyRows"
            :key="row.id"
            :style="rowStyleAt(rowIdx)"
            :class="appearance.bodyRowClass || undefined"
            @click="onRowClicked(row)"
          >
            <td
              v-for="cell in visibleCellsForRow(row)"
              :key="cell.id"
              :style="[cellThunkStyle, cellWidthStyle(cell.column)]"
              :class="appearance.bodyCellClass || undefined"
            >
              <template v-if="cell.column.id === SELECTION_COLUMN_ID">
                <span class="gw-ts-anchor gw-ts-anchor--selection" @click.stop>
                  <input
                    type="checkbox"
                    class="gw-ts-row-select"
                    :class="appearance.selectionCheckboxClass || undefined"
                    :style="appearance.selectionCheckboxStyle"
                    :checked="row.getIsSelected()"
                    aria-label="Select row"
                    @change="onRowSelectionCheckboxChange(row, $event)"
                    @click.stop
                  />
                </span>
              </template>
              <template v-else-if="cellHasWwDropzone(cell)">
                <span class="gw-ts-anchor gw-ts-anchor--ww" @click.stop>
                  <wwLayoutItemContext
                    :index="rowIdx"
                    :item="null"
                    is-repeat
                    :data="cellWwForcedProps(cell, row)"
                    :repeated-items="wwCellRepeatContext"
                  >
                    <wwLayout
                      v-if="showEditorCellWwSlotDropzone(cell)"
                      path="cellWwSlot"
                      direction="column"
                      tag="div"
                      class="gw-ts-cell-template-dropzone gw-ts-cell-template-dropzone--in-cell"
                      :ww-props="cellWwForcedProps(cell, row)"
                    />
                    <template v-else>
                      <template
                        v-for="bundle in cellWwBindList(cell)"
                        :key="row.id + ':' + cell.column.id"
                      >
                        <wwElement
                          v-bind="bundle"
                          :ww-props="cellWwForcedProps(cell, row)"
                        />
                      </template>
                      <template v-if="!resolveCellWwDescriptor(cell)">
                        {{ cellPlainFallback(cell) }}
                      </template>
                    </template>
                  </wwLayoutItemContext>
                </span>
              </template>
              <template v-else-if="cell.column.columnDef.meta?.gwEditable">
                <span class="gw-ts-anchor gw-ts-anchor--editable" @click.stop>
                  <input
                    type="text"
                    class="gw-ts-cell-input"
                    :class="appearance.editableInputClass || undefined"
                    :style="appearance.editableInputStyle"
                    :defaultValue="editableCellDisplay(cell)"
                    @focus="onEditableCellFocus(cell, row)"
                    @blur="onEditableCellBlur(cell, row, $event)"
                    @click.stop
                  />
                </span>
              </template>
              <template v-else>
                <span class="gw-ts-anchor">
                  <FlexRender
                    :key="cell.id"
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="paginationEnabled"
      class="gw-ts-pagination"
      :class="appearance.paginationClass || undefined"
      :style="appearance.paginationStyle"
    >
      <div class="gw-ts-pagination__controls">
        <button
          type="button"
          class="gw-ts-pagination__btn"
          :class="appearance.paginationButtonClass || undefined"
          :style="appearance.paginationButtonStyle"
          :disabled="!canPreviousPage"
          aria-label="Previous page"
          @click="goPrevPage"
        >
          Prev
        </button>
        <span
          class="gw-ts-pagination__page"
          :class="appearance.paginationSummaryClass || undefined"
          :style="appearance.paginationSummaryStyle"
        >
          Page {{ paginationPageDisplay.current }} / {{ paginationPageDisplay.total }}
        </span>
        <button
          type="button"
          class="gw-ts-pagination__btn"
          :class="appearance.paginationButtonClass || undefined"
          :style="appearance.paginationButtonStyle"
          :disabled="!canNextPage"
          aria-label="Next page"
          @click="goNextPage"
        >
          Next
        </button>
      </div>
      <span
        v-if="showPaginationSummary && paginationRangeLabel"
        class="gw-ts-pagination__summary"
        :class="appearance.paginationSummaryClass || undefined"
        :style="appearance.paginationSummaryStyle"
      >
        {{ paginationRangeLabel }}
      </span>
      <label class="gw-ts-pagination__size">
        <span class="gw-ts-pagination__size-label">Rows</span>
        <select
          class="gw-ts-pagination__select"
          :class="appearance.paginationSelectClass || undefined"
          :style="appearance.paginationSelectStyle"
          :value="currentTablePageSize"
          aria-label="Rows per page"
          @change="onPaginationPageSizeChange($event)"
        >
          <option
            v-for="opt in pageSizeOptionsForSelect"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
      </label>
    </div>
    <Teleport to="body">
      <div
        v-if="openFilterColumnId && openFilterColumn"
        :id="'gw-ts-filter-panel-' + openFilterColumnId"
        ref="filterPanelRef"
        data-gw-ts-filter-panel="true"
        class="gw-ts-filter-panel"
        :class="appearance.filterPanelClass || undefined"
        :style="filterPanelBoxStyle"
        role="dialog"
        aria-label="Column filter"
        @click.stop
      >
        <div class="gw-ts-filter-panel__body">
          <select
            v-if="columnFilterVariant(openFilterColumn) === 'enum'"
            :key="'fen-' + openFilterColumn.id + '-' + enumFilterSignature(openFilterColumn)"
            multiple
            class="gw-ts-filter-select gw-ts-filter-select--popover"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            @change="onEnumFilterChange(openFilterColumn, $event)"
          >
            <option
              v-for="opt in enumFilterOptions(openFilterColumn)"
              :key="String(opt)"
              :value="String(opt)"
              :selected="enumOptionSelected(openFilterColumn, opt)"
            >
              {{ opt }}
            </option>
          </select>
          <select
            v-else-if="columnFilterVariant(openFilterColumn) === 'boolean'"
            class="gw-ts-filter-select"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            :value="booleanFilterValue(openFilterColumn)"
            @change="onBooleanFilterChange(openFilterColumn, $event)"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <input
            v-else-if="columnFilterVariant(openFilterColumn) === 'number'"
            class="gw-ts-filter-input"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            type="number"
            :value="numberFilterValue(openFilterColumn)"
            @change="onNumberFilterChange(openFilterColumn, $event)"
          />
          <input
            v-else
            class="gw-ts-filter-input"
            :class="appearance.filterInputClass || undefined"
            :style="appearance.filterInputStyle"
            type="search"
            placeholder="Filter…"
            :value="textFilterValue(openFilterColumn)"
            @input="onTextFilterInput(openFilterColumn, $event)"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>


<script>
import { FlexRender } from '@tanstack/vue-table';
import { useGwTsTable } from './composables/useGwTsTable.js';

/** WeWeb wwobject: TanStack Table (Guestwhat) */
export default {
  name: 'GwTanstackWewebTable',
  components: {
    FlexRender,
  },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    /** WeWeb editor-only; stripped from production builds of this element. */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, ctx) {
    return useGwTsTable(props, ctx);
  },
};
</script>

<style scoped lang="scss" src="./wwElement.vue.scss"></style>
