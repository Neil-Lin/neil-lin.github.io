import vocusPostsFallback from "~~/data/vocusPosts";

interface VocusArticle {
  _id: string;
  title: string;
  abstract?: string;
  lastPublishAt?: string;
  publishAt?: string;
  createdAt?: string;
  isPay?: boolean;
}

interface VocusContent {
  type: string;
  contentId?: string;
  publishAt?: string;
  article?: VocusArticle;
}

interface VocusContentsResponse {
  contents: VocusContent[];
}

interface BlogPost {
  title: string;
  url: string;
  description: string;
}

const VOCUS_SALON_ID = "65bcfbb4fd89780001c97e98";
const VOCUS_ARTICLE_URL = "https://vocus.cc/article/";

const fallbackPosts = vocusPostsFallback.slice(0, 10).map(
  (post): BlogPost => ({
    title: post.title,
    url: post.url,
    description: post.abstract,
  }),
);

export default defineEventHandler(async (): Promise<BlogPost[]> => {
  try {
    const data = await $fetch<VocusContentsResponse>(
      "https://api.vocus.cc/api/contents",
      {
        query: {
          num: 10,
          page: 1,
          salonId: VOCUS_SALON_ID,
        },
      },
    );

    const posts = data.contents
      .filter((content) => content.type === "article" && content.article)
      .map((content): BlogPost | null => {
        const article = content.article;
        if (!article) return null;

        const articleId = article._id || content.contentId;
        if (!articleId || !article.title) return null;

        return {
          title: article.title,
          url: `${VOCUS_ARTICLE_URL}${articleId}`,
          description: (article.abstract ?? "").trim(),
        };
      })
      .filter((post): post is BlogPost => post !== null)
      .slice(0, 10);

    return posts.length > 0 ? posts : fallbackPosts;
  } catch {
    return fallbackPosts;
  }
});
