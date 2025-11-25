<template>
  <ClientOnly>
    <div>
      <div v-if="status === 'pending'">Loading...</div>
      <div v-else-if="error">Error: {{ error.message }}</div>
      <template v-else>
        <ul v-if="posts.length" class="blog-list">
          <li
            v-for="post in posts"
            :key="post.link"
            class="blog-item animation-fade-out"
          >
            <h3>
              <nuxt-link
                :to="post.link"
                :title="`${$t('action.openWindow')} ${$t('action.goTo')} ${post.title}`"
                target="_blank"
              >
                {{ post.title }}
              </nuxt-link>
            </h3>
            <p class="des">{{ post.description }}</p>
          </li>
        </ul>
        <div v-else>There are no posts available.</div>
      </template>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
interface MediumPost {
  categories: string[];
  title: string;
  link: string;
  description: string;
}

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
});

const { data, status, error } = await useFetch<{
  status: string;
  items: MediumPost[];
}>(
  `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${props.username}`,
  {
    key: `medium-posts-${props.username}`,
  }
);

const stripHtml = (html: string) => {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

const posts = computed(() => {
  if (data.value && data.value.status === "ok") {
    return data.value.items
      .filter((item) => item.categories.length > 0)
      .map((item) => ({
        title: item.title,
        link: item.link,
        description: stripHtml(item.description),
      }));
  }
  return [];
});
</script>

<style scoped>
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.blog-item {
  padding: 1.5rem;
  display: flex;
  background-color: oklch(var(--card-bg));
  border-radius: 1.5rem;
  flex-direction: column;
  @supports (animation-timeline: view()) {
    animation-name: fade-exit;
    animation-timing-function: ease-out;
    /* requires this to apply the animation */
    animation-duration: 1ms;
    animation-timeline: view();
    /* must have */
    animation-fill-mode: both;
  }
  a {
    text-decoration: none;
    text-wrap: pretty;
  }
  .des {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
  }
}
</style>
