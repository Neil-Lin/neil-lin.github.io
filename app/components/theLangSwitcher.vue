<template>
  <div class="lang-switcher">
    <span>
      <span id="lang-text" class="visually-hidden">
        {{ $t("words.language") }}
      </span>
      <span aria-hidden="true">🌐</span>
      <span class="visually-hidden">{{ $t("words.changeByFilter") }}</span>
    </span>
    <select aria-labelledby="lang-text" @change="onLocaleChanged">
      <option
        v-for="loc in supportedLocales"
        :key="loc.code"
        :value="loc.code"
        :selected="locale === loc.code"
      >
        {{ loc.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { LocaleObject } from "@nuxtjs/i18n";

const { locale, locales } = useI18n();
const supportedLocales = locales.value as Array<LocaleObject>;

// 引入 useRoute 來取得當前路由資訊
const route = useRoute();
const switchLocalePath = useSwitchLocalePath();

async function onLocaleChanged(event: Event) {
  const target = event.target as HTMLInputElement;

  // 取得新的語言路徑
  const newPath = switchLocalePath(target.value as "zh-Hant-TW" | "en");

  // 取得當前的查詢參數
  const currentQueries = route.query;

  // 使用 navigateTo 函數，並將新路徑和現有的查詢參數一起傳遞
  await navigateTo({
    path: newPath,
    query: currentQueries,
  });
}
</script>
