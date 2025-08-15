<template>
  <div class="thumbnail">
    <div v-if="imagePath !== ''">
      <img
        :src="imagePath"
        :alt="`${props.title}封面照`"
        style="
          width: 100%;
          height: 600px;
          object-fit: cover;
          aspect-ratio: 12 / 6;
        "
      />
    </div>
    <div v-else>
      {{ title }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  imagePath: {
    type: String,
    default: "",
  },
});
</script>
<style scoped>
.thumbnail {
  display: grid;
  place-content: center;
}
</style>
