<template>
  <main class="page page--narrow">
    <div class="page-container">
      <theBreadcrumbs :list="breadCrumbsList" />
      <akContainer />
      <h2>{{ pageTitle }}</h2>
      <p>{{ t("page.blog.hint") }}</p>
      <div v-if="locale === 'en'">
        <br />
        <BlogPostList
          :posts="posts"
          empty-text="There are no posts available."
        />
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
        <BlogPostList :posts="posts" empty-text="目前沒有文章" />
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
const route = useRoute();
const orgUrl = useOrgUrl();

const pageTitle = computed(() => t("mainMenu.blog"));
const pageDescription = computed(() => t("des.blog"));

usePageSeoMeta(pageTitle, pageDescription);

type BlogPost = { title: string; url: string; description: string };

// 只抓目前語系需要的來源，避免兩個外部 API 都打。
// 用 reactive URL：切換語言時 URL 改變 → useFetch 自動重抓，且兩語系各自獨立快取
// （避免共用 key 導致切語言時回傳上一語系的快取結果）。
// 方格子的失敗 fallback 由 server/api/vocus-posts.ts 內部處理，這裡不需要再備援。
const { data: posts } = await useFetch<BlogPost[]>(
  () => (locale.value === "en" ? "/api/medium-posts" : "/api/vocus-posts"),
  { default: () => [] },
);

const breadCrumbsList = computed(() => [
  { link: "/", title: t("action.goToHomePage") },
  { link: "", title: t("mainMenu.blog") },
]);

useSchemaOrg(
  computed(() => [
    {
      "@id": `${orgUrl.value}/blog#webpage`,
      "@type": "CollectionPage",
      name: pageTitle.value,
      description: pageDescription.value,
      url: orgUrl.value + route.path,
      inLanguage: locale.value === "zh-Hant-TW" ? "zh-Hant-TW" : "en",
      isPartOf: { "@id": `${orgUrl.value}/#website` },
      mainEntity: { "@id": `${orgUrl.value}/blog#blog` },
      potentialAction: [
        { "@type": "ReadAction", target: [orgUrl.value + route.path] },
      ],
    },
    {
      "@id": `${orgUrl.value}/blog#blog`,
      "@type": "Blog",
      name: pageTitle.value,
      url: `${orgUrl.value}/blog`,
      inLanguage: locale.value === "zh-Hant-TW" ? "zh-Hant-TW" : "en",
      publisher: { "@id": `${orgUrl.value}/#person` },
      sameAs:
        locale.value === "en"
          ? ["https://neil-lin.medium.com/"]
          : ["https://vocus.cc/user/@neil-lin"],
    },
    ...posts.value.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: post.url,
      isPartOf: { "@id": `${orgUrl.value}/blog#blog` },
      author: { "@id": `${orgUrl.value}/#person` },
      publisher: { "@id": `${orgUrl.value}/#person` },
    })),
  ]),
);

useBreadcrumbSchema(breadCrumbsList);

defineOgImage("CustomTemplate", {
  title: pageTitle.value + " - " + t("website.name"),
  description: pageDescription.value,
});
</script>
