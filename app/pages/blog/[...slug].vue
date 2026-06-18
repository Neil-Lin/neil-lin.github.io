<template>
  <main class="page page--narrow">
    <div class="page-container">
      <theBreadcrumbs :list="breadCrumbsList" />
      <akContainer />
      <article v-if="article" class="article">
        <h2>{{ article.title }}</h2>
        <div class="article-meta">
          <time :datetime="article.date">{{ formatDate(article.date) }}</time>
          <span v-for="tag in article.tags" :key="tag" class="tag">{{
            tag
          }}</span>
        </div>
        <ContentRenderer :value="article" class="article-body" />

        <nav v-if="related.length" class="related" aria-labelledby="related-h">
          <h3 id="related-h">{{ t("page.blog.related") }}</h3>
          <ul>
            <li v-for="post in related" :key="post.slug">
              <nuxt-link
                :to="localePath(`/blog/${post.slug}`)"
                :title="`${$t('action.goTo')} ${post.title}`"
              >
                {{ post.title }}
              </nuxt-link>
            </li>
          </ul>
        </nav>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const runtimeConfig = useRuntimeConfig();
const orgUrl = useOrgUrl();

// 文章頁自管 hreflang/canonical（layout 會略過全站自動版本）
definePageMeta({ customHreflang: true });

const langDir = computed(() => (locale.value === "en" ? "en" : "zh"));
const collection = computed(() =>
  locale.value === "en" ? "blog_en" : "blog_zh",
);
const otherCollection = computed(() =>
  locale.value === "en" ? "blog_zh" : "blog_en",
);
const slug = computed(() => {
  const s = route.params.slug;
  return Array.isArray(s) ? s.join("/") : (s ?? "");
});
const contentPath = computed(() => `/${langDir.value}/blog/${slug.value}`);

const { data: article } = await useAsyncData(
  () => `article-${contentPath.value}`,
  () => queryCollection(collection.value).path(contentPath.value).first(),
  { watch: [contentPath] },
);

if (!article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Article not found",
    fatal: true,
  });
}

// 對照版（只在 frontmatter 有 translationKey 時才查）
const { data: counterpart } = await useAsyncData(
  () => `article-alt-${contentPath.value}`,
  async () => {
    const key = article.value?.translationKey;
    if (!key) return null;
    return await queryCollection(otherCollection.value)
      .where("translationKey", "=", key)
      .first();
  },
  { watch: [contentPath] },
);

const counterpartPath = computed(() => {
  if (!counterpart.value) return null;
  const cslug = counterpart.value.stem.split("/").pop();
  // 對照版在「另一語言」：目前是 en → 對照版是 zh（無前綴）；反之加 /en
  return locale.value === "en" ? `/blog/${cslug}` : `/en/blog/${cslug}`;
});

// 相關文章：同 tag、同語言、排除自己
const { data: rawRelated } = await useAsyncData(
  () => `article-related-${contentPath.value}`,
  () =>
    queryCollection(collection.value)
      .where("draft", "=", false)
      .order("date", "DESC")
      .all(),
  { watch: [contentPath], default: () => [] },
);
const related = computed(() => {
  const tags = new Set(article.value?.tags ?? []);
  return (rawRelated.value ?? [])
    .filter(
      (p) =>
        p.path !== article.value?.path &&
        (p.tags ?? []).some((tg: string) => tags.has(tg)),
    )
    .slice(0, 3)
    .map((p) => ({ slug: p.stem.split("/").pop() as string, title: p.title }));
});

// Option A：語言切換鈕目標
const switchOverride = useLocaleSwitchTarget();
watchEffect(() => {
  const otherCode = locale.value === "en" ? "zh-Hant-TW" : "en";
  const fallback = otherCode === "en" ? "/en/blog" : "/blog";
  switchOverride.value = { [otherCode]: counterpartPath.value ?? fallback };
});
onScopeDispose(() => {
  switchOverride.value = null;
});

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(locale.value === "en" ? "en-GB" : "zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const pageTitle = computed(() => article.value?.title ?? "");
const pageDescription = computed(() => article.value?.description ?? "");
const ogImageUrl = computed(() =>
  article.value?.ogImage
    ? (runtimeConfig.public.baseUrl as string) + article.value.ogImage
    : "",
);

usePageSeoMeta(pageTitle, pageDescription);
useArticleSeo(counterpartPath);

useSeoMeta({
  ogType: "article",
  articlePublishedTime: () => article.value?.date,
  articleModifiedTime: () => article.value?.updatedAt ?? article.value?.date,
  ...(ogImageUrl.value
    ? { ogImage: () => ogImageUrl.value, twitterImage: () => ogImageUrl.value }
    : {}),
});

if (!ogImageUrl.value) {
  defineOgImage("CustomTemplate", {
    title: pageTitle.value,
    description: pageDescription.value,
  });
}

useSchemaOrg(
  computed(() => [
    {
      "@type": "BlogPosting",
      headline: pageTitle.value,
      description: pageDescription.value,
      url: runtimeConfig.public.baseUrl + route.path,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": runtimeConfig.public.baseUrl + route.path,
      },
      datePublished: article.value?.date,
      dateModified: article.value?.updatedAt ?? article.value?.date,
      author: { "@id": `${orgUrl.value}/#person` },
      publisher: { "@id": `${orgUrl.value}/#person` },
      inLanguage: locale.value,
      keywords: (article.value?.tags ?? []).join(", "),
      ...(ogImageUrl.value ? { image: ogImageUrl.value } : {}),
    },
  ]),
);

const breadCrumbsList = computed(() => [
  { link: "/", title: String(t("action.goToHomePage")) },
  { link: "/blog", title: String(t("mainMenu.blog")) },
  { title: pageTitle.value },
]);
useBreadcrumbSchema(breadCrumbsList);
</script>

<style scoped>
.article {
  max-width: 48rem;
  margin: 0 auto;
}
.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin: 1rem 0 2rem;
  font-size: 0.875rem;
  color: oklch(var(--footer-color));
}
.article-body {
  :deep(h2),
  :deep(h3) {
    margin: 2rem 0 1rem;
  }
  :deep(p) {
    margin-bottom: 1rem;
    line-height: 1.8;
  }
  :deep(ul),
  :deep(ol) {
    list-style: revert;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  :deep(pre) {
    padding: 1rem;
    border-radius: 0.75rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  :deep(a) {
    text-wrap: pretty;
  }
}
.related {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px dashed oklch(var(--border-color));
  ul {
    list-style: revert;
    padding-left: 1.5rem;
  }
}
</style>
