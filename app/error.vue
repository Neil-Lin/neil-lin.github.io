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
const { t } = useI18n()

defineProps<{
  error: { statusCode: number; statusMessage?: string; message?: string }
}>()

onBeforeUnmount(() => {
  clearError({ redirect: '/' })
})
</script>
