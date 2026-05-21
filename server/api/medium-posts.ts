interface MediumFeedItem {
  categories: string[]
  title: string
  link: string
  description: string
}

interface MediumFeedResponse {
  status: string
  items: MediumFeedItem[]
}

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<MediumFeedResponse>(
      'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@neil-lin'
    )
    if (data.status !== 'ok') return []
    return data.items
      .filter(item => item.categories.length > 0)
      .map(item => ({
        title: item.title,
        url: item.link,
        description: item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 300).trim(),
      }))
  } catch {
    return []
  }
})
