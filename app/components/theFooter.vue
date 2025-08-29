<template>
  <footer>
    <a
      id="ak-footer"
      href="#ak-footer"
      :title="$t('shortcut.footer')"
      accesskey="Z"
    >
      :::
    </a>
    <div class="footer-container">
      <template v-if="supportedLocales.length != 0">
        <span v-for="loc in supportedLocales" :key="loc.code">
          <nuxt-link
            :to="switchLocalePath(loc.code)"
            :title="$t('action.switch') + loc.name"
          >
            <span class="visually-hidden">{{ $t("action.switch") }}</span>
            {{ loc.name }}
          </nuxt-link>
        </span>
      </template>
      <span>&copy; Neil</span>
      <span>
        {{ $t("words.updateDay") }}：
        <span aria-hidden="true">2025/08/30</span>
        <span v-if="locale === 'en'" class="visually-hidden">
          30 August 2025
        </span>
        <span v-else class="visually-hidden">2025 年 8 月 30 日</span>
      </span>
      <div>
        <nuxt-link
          to="https://accessibility.moda.gov.tw/Applications/Detail?category=20250820134645"
          title="另開視窗前往無障礙網站"
          target="_blank"
          class="a11y-img"
        >
          <img
            src="@/assets/images/a11y-aa.svg"
            width="88"
            height="31"
            alt="通過AA無障礙網頁檢測"
          />
        </nuxt-link>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const switchLocalePath = useSwitchLocalePath();
const { locales, locale } = useI18n();
const supportedLocales = locales.value as Array<LocaleObject>;
</script>

<style scoped>
footer {
  .footer-container {
    padding: 1rem 0.5rem;
    display: flex;
    gap: 1rem;
    justify-content: center;
    color: oklch(var(--footer-color));
    border-top: 1px solid oklch(var(--border-color) / 0.5);
    background-color: oklch(var(--footer-bg));
    @media screen and (width <= 768px) {
      flex-direction: column;
    }
  }
}

.a11y-img {
  display: inline-block;
}
</style>
