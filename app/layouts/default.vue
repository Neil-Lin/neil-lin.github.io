<template>
  <Html :lang="head.htmlAttrs?.lang" :dir="head.htmlAttrs?.dir">
    <Meta charse="utf-8" />
    <Meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta
      hid="keywords"
      name="keywords"
      :content="
        $t('words.a11y') +
        ', ' +
        $t('words.designManagement') +
        ', ' +
        $t('words.dataVisualization') +
        ', ' +
        $t('words.ui') +
        ', ' +
        $t('words.ux') +
        ', ' +
        $t('words.webLayout')
      "
    />
    <Meta name="author" content="Neil" />
    <Meta name="copyright" content="Neil" />
    <Meta name="format-detection" content="telephone=no" />
    <Meta hid="description" name="description" :content="$t('intro.des2')" />
    <Meta
      hid="og:url"
      property="og:url"
      :content="
        head.htmlAttrs?.lang === 'en-US'
          ? runtimeConfig.public.baseUrl + '/en'
          : runtimeConfig.public.baseUrl
      "
    />
    <Meta hid="og:title" property="og:title" :content="$t('website.name')" />
    <Meta
      hid="og:description"
      property="og:description"
      :content="$t('intro.des2')"
    />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta
      hid="twitter:url"
      name="twitter:url"
      :content="
        head.htmlAttrs?.lang === 'en-US'
          ? runtimeConfig.public.baseUrl + '/en'
          : runtimeConfig.public.baseUrl
      "
    />
    <Meta
      hid="twitter:title"
      name="twitter:title"
      :content="$t('website.name')"
    />
    <Meta
      hid="twitter:description"
      name="twitter:description"
      :content="$t('intro.des2')"
    />
    <Meta name="mobile-web-app-capable" content="yes" />
    <Meta name="apple-touch-fullscreen" content="yes" />
    <Meta name="apple-mobile-web-app-title" :content="$t('website.name')" />
    <Meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <Link
      rel="shortcut icon"
      type="image/x-icon"
      :href="`${runtimeConfig.public.baseUrl}/favicon.ico`"
    />
    <Link rel="preconnect" href="https://fonts.googleapis.com" />
    <Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <Link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&display=swap"
    />

    <!-- https://github.com/nuxt/nuxt/issues/19752 -->
    <!-- Nuxt3  I don't think there's anything Nuxt can action related to this issue -->

    <Body class="wrapper">
      <div class="layout">
        <noscript class="noscript">
          您的瀏覽器不支援 JavaScript
          功能，若網頁功能無法正常使用時，請開啟瀏覽器 JavaScript 狀態。 Your
          browser does not support JavaScript!
        </noscript>
        <TheHeader />
        <slot />
        <TheFooter />
      </div>
      <button
        v-show="scrollDistance > 300"
        type="button"
        class="btn-back-to-top"
        @click="scrollToTop"
      >
        <span class="visually-hidden">{{ $t("action.backToTop") }}</span>
        <span aria-hidden="true">🔝</span>
      </button>
    </Body>
  </Html>
</template>

<script setup lang="ts">
const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const { locale } = useI18n();
const head = useLocaleHead();

const orgUrl = computed(() => {
  if (locale.value === "en") {
    return `${runtimeConfig.public.baseUrl}/en`;
  } else {
    return `${runtimeConfig.public.baseUrl}`;
  }
});

useHead({
  titleTemplate: (pageTitle) => {
    return pageTitle
      ? `${pageTitle} - ` + t("website.name")
      : t("website.name");
  },
  link: [...(head.value.link || [])],
  meta: [...(head.value.meta || [])],
});

const { scrollToTop, scrollDistance } = useScrollToTop();

defineOgImageComponent("OgImageCustomTemplate", {
  title: t("website.name"),
});

useSchemaOrg([
  {
    "@id": `${orgUrl.value}/#website`,
    "@type": "WebSite",
    name: t("website.name"),
    url: `${orgUrl.value}`,
  },
  {
    "@id": `${orgUrl.value}/#person`,
    "@type": "Person",
    name: "Neil Lin", // ← 可改你想呈現的名稱
    url: `${orgUrl.value}`,
  },
]);
</script>

<style>
@import url("@/assets/css/style.css");
</style>
