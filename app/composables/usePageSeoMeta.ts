export function usePageSeoMeta(
  title: Ref<string> | ComputedRef<string>,
  description: Ref<string> | ComputedRef<string>,
  url?: Ref<string> | ComputedRef<string>
) {
  const { t } = useI18n()
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  const resolvedUrl = url ?? computed(() => runtimeConfig.public.baseUrl + route.path)

  useHead(
    computed(() => ({
      title: title.value,
      meta: [
        { hid: 'description', name: 'description', content: description.value },
        { hid: 'og:url', property: 'og:url', content: resolvedUrl.value },
        { hid: 'og:title', property: 'og:title', content: `${title.value} - ${t('website.name')}` },
        { hid: 'og:description', property: 'og:description', content: description.value },
        { hid: 'twitter:url', name: 'twitter:url', content: resolvedUrl.value },
        { hid: 'twitter:title', name: 'twitter:title', content: `${title.value} - ${t('website.name')}` },
        { hid: 'twitter:description', name: 'twitter:description', content: description.value },
      ],
    }))
  )
}
