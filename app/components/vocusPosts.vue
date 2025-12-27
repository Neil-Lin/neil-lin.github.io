<template>
  <div>
    <ul v-if="articles.length" class="blog-list">
      <li
        v-for="article in articles"
        :key="article.url"
        class="blog-item animation-fade-out"
      >
        <h3>
          <nuxt-link
            :to="article.url"
            :title="`${$t('action.openWindow')} ${$t('action.goTo')} ${article.title}`"
            target="_blank"
          >
            {{ article.title }}
          </nuxt-link>
        </h3>
        <p class="des">{{ article.abstract }}</p>
      </li>
    </ul>
    <div v-else>目前沒有文章</div>
  </div>
</template>

<script setup lang="ts">
import vocusPosts from "../../data/vocusPosts";

const articles = vocusPosts;
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
    animation-duration: 1ms;
    animation-timeline: view();
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
