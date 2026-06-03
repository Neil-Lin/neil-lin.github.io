<template>
  <NuxtLayout name="default">
    <main class="page">
      <akContainer />
      <h2>{{ t("error.title") }}</h2>
      <p>{{ t("error.errorCode") }}：{{ error.statusCode }}</p>
      <div v-if="error.statusCode === 404">
        <p>
          {{ t("error.notFound") }}
        </p>
      </div>
      <div v-else>
        <p>{{ error.message }}</p>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  error: { statusCode: number; statusMessage?: string; message?: string };
}>();

useSeoMeta({
  robots: () =>
    props.error.statusCode >= 400
      ? "noindex, follow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
});

onBeforeUnmount(() => {
  clearError({ redirect: "/" });
});
</script>
