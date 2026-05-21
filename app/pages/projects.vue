<template>
  <main class="page page--grid">
    <div class="page-container">
      <theBreadcrumbs :list="breadCrumbsList" />
      <akContainer />

      <h2>{{ pageTitle }}</h2>
      <div class="filters">
        <div>
          <label for="sortorder">{{ $t("words.sort") }}：</label>
          <select id="sortorder" v-model="sortorder">
            <option value="desc">{{ $t("words.newToOld") }}</option>
            <option value="asc">{{ $t("words.oldToNew") }}</option>
          </select>
        </div>
        <div>
          <label for="roleFilter">{{ $t("words.roles") }}：</label>
          <select id="roleFilter" v-model="selectedRole">
            <option value="">{{ $t("words.all") }}</option>
            <option v-for="role in uniqueRoles" :key="role" :value="role">
              {{ role }}
            </option>
          </select>
        </div>
        <div>
          <label for="platformFilter">{{ $t("words.platform") }}：</label>
          <select id="platformFilter" v-model="selectedPlatform">
            <option value="">{{ $t("words.all") }}</option>
            <option value="web">Web</option>
            <option value="app">App</option>
          </select>
        </div>
      </div>

      <div
        v-if="groupedList.length > 0"
        :class="[
          'group-list',
          sortorder === 'desc' ? 'group-list--top-space' : 'group-list--bottom-space',
        ]"
        aria-live="polite"
      >
        <div class="group-year-present">{{ $t("words.today") }}</div>
        <div
          v-for="group in groupedList"
          :key="group.year"
          class="portfolio-area"
        >
          <ul class="portfolio-list">
            <li
              v-for="(project, idx) in group.items"
              :key="project.id"
              class="portfolio-item animation-fade-out"
            >
              <PortfolioCard
                :clickable="Boolean(project.clickable && project.link)"
                :to="project.link"
                :title="project.clickable && project.link
                  ? `${$t('action.openWindow')} ${$t('action.goTo')}${project.name[$i18n.locale]}`
                  : undefined"
                :external="true"
              >
                <h3 class="portfolio-title">{{ project.name[$i18n.locale] }}</h3>
                <div class="portfolio-content">
                  <img
                    v-if="project.heroImage && project.heroImage[$i18n.locale].length > 0"
                    :src="project.heroImage[$i18n.locale][0]!.src"
                    :alt="project.clickable ? '' : project.name[$i18n.locale]"
                    class="portfolio-img"
                    :fetchpriority="idx === 0 ? 'high' : ''"
                  />
                  <div v-if="project.intro?.[$i18n.locale]" class="portfolio-intro">
                    <p>{{ project.intro[$i18n.locale] }}</p>
                  </div>
                </div>
                <div class="portfolio-footer">
                  <span class="visually-hidden">{{ $t("words.relatedTags") }}：</span>
                  <span class="tag">
                    <span class="visually-hidden">{{ $t("words.startToEnd") }}：</span>
                    {{ formatYearRange(project.yearRange) }}
                  </span>
                  <span
                    v-if="project.platform.includes('web') || project.platform.includes('app')"
                    class="visually-hidden"
                  >{{ $t("words.platformType") }}：</span>
                  <span v-if="project.platform.includes('web')" class="tag">Web</span>
                  <span v-if="project.platform.includes('app')" class="tag">App</span>
                  <span v-if="project.roles[$i18n.locale].length > 0" class="visually-hidden">
                    {{ $t("words.roles") }}：
                  </span>
                  <span
                    v-for="(item, index) in project.roles[$i18n.locale]"
                    :key="index"
                    class="tag"
                  >{{ item }}</span>
                </div>
              </PortfolioCard>
            </li>
          </ul>
          <div
            :class="['group-year', sortorder === 'desc' ? 'group-year--bottom' : 'group-year--top']"
          >
            {{ group.year }}
          </div>
        </div>
      </div>
      <emptyBlock v-else>{{ $t("data.nodata") }}</emptyBlock>
    </div>
  </main>
</template>

<script setup lang="ts">
import projectsData from '~~/data/projectsData'

const { t, locale } = useI18n()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const orgUrl = useOrgUrl()

const pageTitle = computed(() => t('words.projects'))
const pageDescription = computed(() => t('words.careerWorks'))

definePageMeta({ scrollToTop: false })

const { sortorder, selectedRole, selectedPlatform, uniqueRoles, groupedList, formatYearRange } =
  usePortfolioFilter(projectsData)

useSchemaOrg([
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${runtimeConfig.public.baseUrl}${route.path}#projectsList`,
    name: t('words.portfolio'),
    description: pageDescription.value,
    url: `${runtimeConfig.public.baseUrl}${route.path}`,
    numberOfItems: projectsData.length,
    itemListElement: projectsData.map((work, index) => {
      const hasExternal = Boolean(work.link) && work.clickable !== false
      const imageSrc = work.heroImage?.[locale.value]?.[0]?.src
        ? `${runtimeConfig.public.baseUrl}${work.heroImage[locale.value][0]!.src}`
        : undefined

      const creativeWork: Record<string, unknown> = {
        '@type': 'CreativeWork',
        '@id': `${runtimeConfig.public.baseUrl}${route.path}#${work.slug}`,
        name: work.name?.[locale.value] ?? work.name?.['zh-Hant-TW'] ?? '',
        description: work.intro?.[locale.value] || '',
        ...(imageSrc ? { image: imageSrc } : {}),
        creator: { '@type': 'Person', name: 'Neil', url: runtimeConfig.public.baseUrl },
        datePublished: work.yearRange?.start,
        dateModified: work.yearRange?.end ?? new Date().getFullYear(),
        inLanguage: locale.value,
        keywords: Array.isArray(work.roles?.[locale.value])
          ? work.roles[locale.value].join(', ')
          : '',
        audience: { '@type': 'EducationalAudience', educationalRole: 'Designer, Developer' },
      }

      if (hasExternal && work.link) {
        creativeWork.url = work.link
      } else {
        creativeWork.creativeWorkStatus = 'Archived'
      }

      const listItem: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        item: creativeWork,
      }
      if (hasExternal && work.link) listItem.url = work.link

      return listItem
    }),
  },
])

usePageSeoMeta(pageTitle, pageDescription)

const breadCrumbsList = computed(() => [
  { link: '/', title: t('action.goToHomePage') },
  { link: '', title: t('mainMenu.projects') },
])

watchEffect(() => {
  if (breadCrumbsList.value.length > 0) useBreadcrumbSchema(breadCrumbsList.value)
})

defineOgImageComponent('OgImageCustomTemplate', {
  title: pageTitle.value + ' - ' + t('website.name'),
  description: pageDescription.value,
})
</script>

<style scoped>
.page-container {
  grid-column: 4 / -4;
  @media screen and (width <= 1920px) {
    grid-column: 2 / -2;
  }
  @media screen and (width <= 768px) {
    grid-column: 1 / -1;
  }
}

.group-list {
  @media screen and (width <= 768px) {
    margin-left: 3rem;
  }
}
</style>
