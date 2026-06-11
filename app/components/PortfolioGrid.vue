<template>
  <div
    v-if="groupedList.length > 0"
    :class="[
      'group-list',
      sortorder === 'desc'
        ? 'group-list--top-space'
        : 'group-list--bottom-space',
    ]"
    aria-live="polite"
  >
    <div class="group-year-present">{{ $t("words.today") }}</div>
    <div v-for="group in groupedList" :key="group.year" class="portfolio-area">
      <ul class="portfolio-list">
        <li
          v-for="(item, idx) in group.items"
          :key="item.id"
          class="portfolio-item animation-fade-out"
        >
          <slot name="card" :item="item" :idx="idx" />
        </li>
      </ul>
      <div
        :class="[
          'group-year',
          sortorder === 'desc' ? 'group-year--bottom' : 'group-year--top',
        ]"
      >
        {{ group.year }}
      </div>
    </div>
  </div>
  <emptyBlock v-else>{{ $t("data.nodata") }}</emptyBlock>
</template>

<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  groupedList: { year: number; items: T[] }[];
  sortorder: string;
}>();

defineSlots<{
  card(props: { item: T; idx: number }): unknown;
}>();
</script>

<style scoped>
.group-list {
  @media screen and (width <= 768px) {
    margin-left: 3rem;
  }
}
</style>
