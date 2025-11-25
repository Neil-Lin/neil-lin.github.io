export const useBreadcrumbSchema = (
  breadcrumbs: { title: string; link?: string }[]
) => {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()

  useSchemaOrg([
    {
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.title,
        "item": item.link
          ? `${runtimeConfig.public.baseUrl}${item.link}`
          : `${runtimeConfig.public.baseUrl}${route.fullPath}`
      }))
    }
  ])
}