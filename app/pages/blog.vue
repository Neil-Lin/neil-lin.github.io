<template>
  <main class="page page--narrow">
    <div class="page-container">
      <theBreadcrumbs :list="breadCrumbsList" />
      <akContainer />
      <h2>{{ pageTitle }}</h2>
      <p>{{ t("page.blog.hint") }}</p>
      <div v-if="locale === 'en'">
        <br />
        <medium-posts username="neil-lin" />
        <br />
        <nuxt-link
          to="https://neil-lin.medium.com/"
          :title="`${$t('action.openWindow')} ${$t('action.goTo')} Medium`"
          target="_blank"
          class="btn"
        >
          {{ t("page.blog.forward") }}
        </nuxt-link>
      </div>
      <div v-else>
        <br />
        <vocus-posts />
        <br />
        <nuxt-link
          to="https://vocus.cc/user/@neil-lin"
          :title="`${$t('action.openWindow')} ${$t('action.goTo')} 方格子`"
          target="_blank"
          class="btn"
        >
          {{ t("page.blog.forward") }}
        </nuxt-link>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t, locale } = useI18n();
const runtimeConfig = useRuntimeConfig();
const pageTitle = ref(t("mainMenu.blog"));
const pageDescription = ref(t("des.blog"));
const route = useRoute();

const orgUrl = computed(() => {
  if (locale.value === "en") {
    return `${runtimeConfig.public.baseUrl}/en`;
  } else {
    return `${runtimeConfig.public.baseUrl}`;
  }
});

useHead({
  title: pageTitle,
  meta: [
    {
      hid: "description",
      name: "description",
      content: pageDescription.value,
    },
    {
      hid: "og:url",
      property: "og:url",
      content: runtimeConfig.public.baseUrl + route.path,
    },
    {
      hid: "og:title",
      property: "og:title",
      content: pageTitle.value + " - " + t("website.name"),
    },
    {
      hid: "og:description",
      property: "og:description",
      content: pageDescription.value,
    },
    {
      hid: "twitter:url",
      name: "twitter:url",
      content: runtimeConfig.public.baseUrl + route.path,
    },
    {
      hid: "twitter:title",
      name: "twitter:title",
      content: pageTitle.value + " - " + t("website.name"),
    },
    {
      hid: "twitter:description",
      name: "twitter:description",
      content: pageDescription.value,
    },
  ],
});

const breadCrumbsList = computed(() => [
  {
    link: "/",
    title: t("action.goToHomePage"),
  },
  {
    link: "",
    title: t("mainMenu.blog"),
  },
]);

// useSchemaOrg([
//   {
//     "@type": "CollectionPage",
//     name: pageTitle.value,
//     description: pageDescription.value,
//     url: runtimeConfig.public.baseUrl + route.path,
//     inLanguage: locale.value === "zh-Hant-TW" ? "zh-Hant-TW" : "en",
//     isPartOf: {
//       "@type": "WebSite",
//       name: t("website.name"),
//       url: runtimeConfig.public.baseUrl,
//     },
//   },
// ]);

useSchemaOrg([
  // 直接覆寫掉模組自動產生的 WebPage（同一個 @id）
  {
    "@id": `${orgUrl.value}/blog#webpage`,
    "@type": "CollectionPage",
    name: pageTitle.value,
    description: pageDescription.value,
    url: orgUrl.value + route.path, // => .../blog 或 .../en/blog
    inLanguage: locale.value === "zh-Hant-TW" ? "zh-Hant-TW" : "en",
    isPartOf: { "@id": `${orgUrl.value}/#website` },
    potentialAction: [
      {
        "@type": "ReadAction",
        target: [orgUrl.value + route.path],
      },
    ],
  },

  // Blog 節點（保留）
  {
    "@id": `${orgUrl.value}/blog#blog`,
    "@type": "Blog",
    name: pageTitle.value,
    url: `${orgUrl.value}/blog`,
    inLanguage: locale.value === "zh-Hant-TW" ? "zh-Hant-TW" : "en",
    publisher: { "@id": `${orgUrl.value}/#person` }, // 由 layout 提供
    sameAs:
      locale.value === "en"
        ? ["https://neil-lin.medium.com/"]
        : ["https://vocus.cc/user/@neil-lin"],
  },
]);

watchEffect(() => {
  if (breadCrumbsList.value.length > 0) {
    useBreadcrumbSchema(breadCrumbsList.value);
  }
});

defineOgImageComponent("OgImageCustomTemplate", {
  title: pageTitle.value + " - " + t("website.name"),
});
</script>
