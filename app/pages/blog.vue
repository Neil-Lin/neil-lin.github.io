<template>
  <main class="page page--narrow">
    <div class="page-container">
      <theBreadcrumbs :list="breadCrumbsList" />
      <akContainer />
      <h2>{{ pageTitle }}</h2>
      <p>{{ t("page.blog.hint") }}</p>
      <div v-if="locale === 'en'">
        <br />
        <BlogPostList :posts="mediumPosts" empty-text="There are no posts available." />
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
        <BlogPostList :posts="vocusPosts" empty-text="目前沒有文章" />
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
import vocusPostsRaw from '~~/data/vocusPosts'

const { t, locale } = useI18n()
const route = useRoute()
const orgUrl = useOrgUrl()

const pageTitle = computed(() => t('mainMenu.blog'))
const pageDescription = computed(() => t('des.blog'))

usePageSeoMeta(pageTitle, pageDescription)

const { data: mediumData } = useFetch<{ title: string; url: string; description: string }[]>(
  '/api/medium-posts',
  { default: () => [] }
)
const mediumPosts = computed(() => mediumData.value ?? [])

const vocusPosts = vocusPostsRaw.map(p => ({
  title: p.title,
  url: p.url,
  description: p.abstract,
}))

const breadCrumbsList = computed(() => [
  { link: '/', title: t('action.goToHomePage') },
  { link: '', title: t('mainMenu.blog') },
])

useSchemaOrg(computed(() => [
  {
    '@id': `${orgUrl.value}/blog#webpage`,
    '@type': 'CollectionPage',
    name: pageTitle.value,
    description: pageDescription.value,
    url: orgUrl.value + route.path,
    inLanguage: locale.value === 'zh-Hant-TW' ? 'zh-Hant-TW' : 'en',
    isPartOf: { '@id': `${orgUrl.value}/#website` },
    potentialAction: [{ '@type': 'ReadAction', target: [orgUrl.value + route.path] }],
  },
  {
    '@id': `${orgUrl.value}/blog#blog`,
    '@type': 'Blog',
    name: pageTitle.value,
    url: `${orgUrl.value}/blog`,
    inLanguage: locale.value === 'zh-Hant-TW' ? 'zh-Hant-TW' : 'en',
    publisher: { '@id': `${orgUrl.value}/#person` },
    sameAs: locale.value === 'en'
      ? ['https://neil-lin.medium.com/']
      : ['https://vocus.cc/user/@neil-lin'],
  },
  ...(locale.value === 'en' ? mediumPosts.value : vocusPosts).map(post => ({
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: post.url,
    isPartOf: { '@id': `${orgUrl.value}/blog#blog` },
    author: { '@id': `${orgUrl.value}/#person` },
    publisher: { '@id': `${orgUrl.value}/#person` },
  })),
]))

watchEffect(() => {
  if (breadCrumbsList.value.length > 0) useBreadcrumbSchema(breadCrumbsList.value)
})

defineOgImage('CustomTemplate', {
  cacheKey: 'noto-tc-v2',
  title: pageTitle.value + ' - ' + t('website.name'),
  description: pageDescription.value,
})
</script>
