<template>
  <div
    style="height: 630px; background-color: #fafafa; font-family: 'Noto Sans TC', sans-serif;"
  >
    <img
      v-if="imagePath"
      :src="imagePath"
      :alt="`${props.title}封面照`"
      style="width: 100%; height: 100%; object-fit: cover"
    />

    <div
      v-else
      style="position: relative; display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center; font-family: 'Noto Sans TC', sans-serif;"
    >
      <img
        src="@/assets/images/sitename.svg"
        style="
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          object-fit: cover;
        "
      />
      <div
        style="font-weight: 700; font-size: 4rem; color: #222; padding: 2rem"
      >
        {{ title }}
      </div>
      <div style="font-size: 2rem; color: #565656; padding: 2rem 4rem">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  imagePath: {
    type: String,
    default: "",
  },
});
</script>
