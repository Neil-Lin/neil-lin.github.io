import type { Product } from '~~/data/types'

interface SitemapImage {
  loc: string
  title: string
  _i18n?: Record<string, { title: string }>
}

interface SitemapVideo {
  title: string
  description: string
  thumbnail_loc: string
  content_loc: string
  _i18n?: Record<string, { title: string; description: string }>
}

interface SitemapEntry {
  loc: string
  lastmod?: string
  _i18nTransform: boolean
  images: SitemapImage[]
  videos: SitemapVideo[]
}

export default defineSitemapEventHandler(async () => {
  const { default: productsData }: { default: Product[] } =
    await import('~~/data/productsData')

  const clickableProducts = productsData.filter((p) => p.clickable)
  const config = useRuntimeConfig()

  return clickableProducts.map((p): SitemapEntry => {
    const images: SitemapImage[] = []
    if (p.images?.['zh-Hant-TW']) {
      p.images['zh-Hant-TW'].forEach((img, index) => {
        const entry: SitemapImage = { loc: img.src, title: img.figcaption }
        if (p.images?.en?.[index]) {
          entry._i18n = { en: { title: p.images.en[index]!.figcaption } }
        }
        images.push(entry)
      })
    }

    const videos: SitemapVideo[] = []
    if (p.videos?.['zh-Hant-TW']) {
      p.videos['zh-Hant-TW'].forEach((video, index) => {
        const entry: SitemapVideo = {
          title: video.title,
          description: video.description,
          thumbnail_loc: video.thumbnail_loc,
          content_loc: video.src,
        }
        if (p.videos?.en?.[index]) {
          entry._i18n = {
            en: {
              title: p.videos.en[index]!.title,
              description: p.videos.en[index]!.description,
            },
          }
        }
        videos.push(entry)
      })
    }

    return {
      loc: `/products/${p.slug}`,
      lastmod: p.updatedAt ? new Date(config.public.buildDate as string).toISOString() : undefined,
      _i18nTransform: true,
      images,
      videos,
    }
  })
})
