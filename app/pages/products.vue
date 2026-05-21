<template>
  <main class="page page--grid">
    <div class="page-container">
      <theBreadcrumbs :list="breadcrumbs" />
      <akContainer />

      <template v-if="!route.params.name || isModal">
        <h2>{{ pageTitle }}</h2>
        <div class="filters">
          <span class="visually-hidden">{{ $t("words.changeByFilter") }}</span>
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
                v-for="(product, idx) in group.items"
                :key="product.id"
                class="portfolio-item animation-fade-out"
              >
                <PortfolioCard
                  :clickable="product.clickable"
                  :to="product.clickable ? { path: localePath(`/products/${encodeURIComponent(product.slug)}`) } : undefined"
                  :title="product.name[$i18n.locale]"
                  @click="product.clickable && onOpenProduct(product.slug)"
                >
                  <h3 class="portfolio-title">
                    {{ product.name[$i18n.locale] }}
                  </h3>
                  <div class="portfolio-content">
                    <img
                      v-if="product.heroImage[$i18n.locale]?.[0]?.src"
                      :src="product.heroImage[$i18n.locale][0]!.src"
                      alt=""
                      class="portfolio-img"
                      :fetchpriority="idx === 0 ? 'high' : ''"
                    />
                    <div v-if="product.intro[$i18n.locale]" class="portfolio-intro">
                      <p>{{ product.intro[$i18n.locale] }}</p>
                    </div>
                  </div>
                  <div class="portfolio-footer">
                    <span class="visually-hidden">{{ $t("words.relatedTags") }}：</span>
                    <span class="tag">
                      <span class="visually-hidden">{{ $t("words.startToEnd") }}：</span>
                      {{ formatYearRange(product.yearRange) }}
                    </span>
                    <span
                      v-if="product.platform.includes('web') || product.platform.includes('app')"
                      class="visually-hidden"
                    >{{ $t("words.platformType") }}：</span>
                    <span v-if="product.platform.includes('web')" class="tag">Web</span>
                    <span v-if="product.platform.includes('app')" class="tag">App</span>
                    <span v-if="product.roles[$i18n.locale].length > 0" class="visually-hidden">
                      {{ $t("words.roles") }}：
                    </span>
                    <span
                      v-for="(item, index) in product.roles[$i18n.locale]"
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
      </template>

      <template v-if="route.params.name && isModal">
        <dialog ref="lightBox" @cancel.prevent="closeProduct">
          <button type="button" class="btn btn--close-dialog" @click="closeProduct">
            {{ t("action.closeDialog") }}
          </button>
          <NuxtPage />
        </dialog>
      </template>
      <template v-if="route.params.name && !isModal">
        <NuxtPage />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import productsData from '~~/data/productsData'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const lightBox = ref<HTMLDialogElement | null>(null)
const runtimeConfig = useRuntimeConfig()
const orgUrl = useOrgUrl()

const pageTitle = computed(() => t('words.products'))
const pageDescription = computed(() => t('words.careerWorks'))

definePageMeta({ scrollToTop: false })

// 燈箱狀態（不寫進 URL，直接用 app state）
const productModalOpen = useState('productModalOpen', () => false)
const savedScrollY = useState('savedScrollY', () => 0)

const isModal = computed(() => Boolean(route.params.name) && productModalOpen.value)

const { sortorder, selectedRole, selectedPlatform, uniqueRoles, groupedList, formatYearRange } =
  usePortfolioFilter(productsData)

const onOpenProduct = (slug: string) => {
  savedScrollY.value = window.scrollY
  productModalOpen.value = true
  router.push({ path: localePath(`/products/${encodeURIComponent(slug)}`) })
}

const closeProduct = () => {
  if (!lightBox.value) return
  lightBox.value.close()
  setTimeout(async () => {
    productModalOpen.value = false
    await router.replace({
      path: localePath('/products'),
      query: {
        role: selectedRole.value || undefined,
        platform: selectedPlatform.value || undefined,
        sortorder: sortorder.value || undefined,
      },
    })
    window.scrollTo(0, savedScrollY.value)
  }, 300)
}

// 瀏覽器上一頁關閉燈箱時，重置 state
watch(
  () => route.params.name,
  (name) => {
    if (!name) {
      productModalOpen.value = false
      lightBox.value?.close()
    }
  }
)

watch(isModal, async (modal) => {
  if (modal) {
    await nextTick()
    lightBox.value?.showModal()
  }
})

onMounted(() => {
  if (isModal.value) {
    lightBox.value?.showModal()
  }
})

// Schema.org：只在列表頁輸出，詳細頁由 [name].vue 負責
useSchemaOrg(
  computed(() =>
    route.params.name
      ? []
      : [
          {
            '@type': 'CollectionPage',
            '@id': `${runtimeConfig.public.baseUrl}${route.path}#collection`,
            name: t('words.portfolio'),
            description: pageDescription.value,
            url: `${runtimeConfig.public.baseUrl}${route.path}`,
            mainEntity: {
              '@type': 'ItemList',
              '@id': `${runtimeConfig.public.baseUrl}${route.path}#productsList`,
              numberOfItems: productsData.length,
              itemListElement: productsData.map((work, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${orgUrl.value}/products/${work.slug}`,
                item: {
                  '@type': 'CreativeWork',
                  '@id': `${orgUrl.value}/products/${work.slug}#creativework`,
                  name: work.name[locale.value],
                  description: work.intro[locale.value] || '',
                  image: `${runtimeConfig.public.baseUrl}${work.schemaImage[locale.value][0]?.src}`,
                  creator: { '@type': 'Person', name: 'Neil', url: orgUrl.value },
                  datePublished: work.yearRange.start,
                  dateModified: work.yearRange.end ?? new Date().getFullYear(),
                  url: `${orgUrl.value}/products/${work.slug}`,
                  inLanguage: locale.value,
                  keywords: work.roles[locale.value].join(', '),
                },
              })),
            },
          },
        ]
  )
)

usePageSeoMeta(pageTitle, pageDescription)

const slug = route.params.name
const product = productsData.find((p) => p.slug === slug)

const breadcrumbs = computed(() => {
  if (slug && product) {
    return [
      { link: '/', title: String(t('action.goToHomePage')) },
      { link: '/products', title: String(t('mainMenu.products')) },
      { title: String(product.name[locale.value] || slug) },
    ]
  }
  return [
    { link: '/', title: String(t('action.goToHomePage')) },
    { title: String(t('mainMenu.products')) },
  ]
})

watchEffect(() => {
  if (breadcrumbs.value.length > 0) useBreadcrumbSchema(breadcrumbs.value)
})

defineOgImageComponent('OgImageCustomTemplate', {
  title: pageTitle.value + ' - ' + t('website.name'),
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

.btn--close-dialog {
  position: sticky;
  top: 0;
}
</style>
