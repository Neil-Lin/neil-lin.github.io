import type { Context } from 'https://edge.netlify.com'

export const config = { path: '/*' }

export default async function handler(req: Request, context: Context) {
  const accept = req.headers.get('accept') ?? ''
  if (!accept.includes('text/markdown')) {
    return context.next()
  }

  const { pathname } = new URL(req.url)
  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|mp4|m4a|json|xml|txt)$/i.test(pathname)) {
    return context.next()
  }

  const response = await context.next()
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) {
    return response
  }

  const html = await response.text()
  const markdown = htmlToMarkdown(html)

  return new Response(markdown, {
    status: response.status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
    },
  })
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
}

function htmlToMarkdown(html: string): string {
  // Extract page title (strip site name suffix)
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch
    ? decodeEntities(titleMatch[1].replace(/\s*-[^-]*$/, '').trim())
    : ''

  // Focus on <main> content only — skip nav/header/footer boilerplate
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
  const content = mainMatch ? mainMatch[1] : html

  const body = content
    // Strip screen-reader-only content (visually-hidden)
    .replace(/<[^>]+class="[^"]*visually-hidden[^"]*"[^>]*>[\s\S]*?<\/\w+>/gi, '')
    // Strip scripts and styles
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    // Headings (h2 as ## because # is the page title above)
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n## $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
    // Links and images
    .replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img\b[^>]*\balt="([^"]*)"[^>]*\bsrc="([^"]*)"[^>]*\/?>/gi, '![$1]($2)')
    .replace(/<img\b[^>]*\bsrc="([^"]*)"[^>]*\balt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    // Emphasis
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**')
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*')
    // Unordered lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) =>
      '\n' +
      inner.replace(
        /<li[^>]*>([\s\S]*?)<\/li>/gi,
        (_li: string, t: string) => `- ${t.replace(/<[^>]+>/g, '').trim()}\n`,
      ) +
      '\n',
    )
    // Ordered lists
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
      let n = 1
      return (
        '\n' +
        inner.replace(
          /<li[^>]*>([\s\S]*?)<\/li>/gi,
          (_li: string, t: string) => `${n++}. ${t.replace(/<[^>]+>/g, '').trim()}\n`,
        ) +
        '\n'
      )
    })
    // Paragraphs, breaks, rules
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    // Code
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    // Collapse excess blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return title ? `# ${title}\n\n${body}` : body
}
