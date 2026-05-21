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
const { t, locale } = useI18n()
const runtimeConfig = useRuntimeConfig()
const route = useRoute()
const orgUrl = useOrgUrl()

const pageTitle = computed(() => t('mainMenu.blog'))
const pageDescription = computed(() => t('des.blog'))

usePageSeoMeta(pageTitle, pageDescription)

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

useSchemaOrg([
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
    sameAs:
      locale.value === 'en'
        ? ['https://neil-lin.medium.com/']
        : ['https://vocus.cc/user/@neil-lin'],
  },
])

watchEffect(() => {
  if (breadCrumbsList.value.length > 0) useBreadcrumbSchema(breadCrumbsList.value)
})

defineOgImageComponent('OgImageCustomTemplate', {
  title: pageTitle.value + ' - ' + t('website.name'),
})
</script>
