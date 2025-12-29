import enUS from "./i18n/lang/en-US";
import zhHantTW from "./i18n/lang/zh-Hant-TW";
import { productsData } from "./data/productsData";

const dynamicRoutes = productsData
  .filter((p) => p.clickable)
  .map((p) => `/products/${p.slug}`);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: "/",
    head: {
      script: [
        {
          src: "https://accesserty.com/pulse.js",
          defer: true,
          // 這是您的專屬追蹤 ID
          "data-client-id": "Trial_MJR8ONBH_705",
        },
      ],
    },
  },
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  ssr: true,
  nitro: {
    prerender: {
      routes: [...dynamicRoutes],
    },
  },
  modules: [
    "@nuxt/eslint",
    "nuxt-gtag",
    "@vite-pwa/nuxt",
    "@nuxtjs/i18n",
    "@nuxtjs/html-validator",
    "@nuxtjs/seo",
    "nuxt-clarity-analytics",
  ],

  gtag: {
    id: process.env.NUXT_PUBLIC_GTAG_ID,
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      id: "/",
      start_url: process.env.NUXT_PUBLIC_BASE_URL,
      name: "Neil's Portfolio",
      short_name: "Neil's Portfolio",
      categories: [
        "web design",
        "accessibility",
        "data visualization",
        "UI",
        "UX",
      ],
      shortcuts: [
        {
          name: "products",
          short_name: "products",
          url: process.env.NUXT_PUBLIC_BASE_URL + "/products",
          description: "about products of portfolio",
          icons: [
            {
              src: process.env.NUXT_PUBLIC_BASE_URL + "/favicon-96.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
      ],
      description: "Neil's Portfolio",
      theme_color: "#6042a0",
      icons: [
        {
          src: "/favicon-32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          src: "/favicon-64.png",
          sizes: "64x64",
          type: "image/png",
        },
        {
          src: "/favicon-96.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "/favicon-144.png",
          sizes: "144x144",
          type: "image/png",
        },
        {
          src: "/favicon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/favicon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      screenshots: [
        {
          src: "/images/splash/splash-640x1136.png",
          type: "image/png",
          sizes: "640x1136",
          label: "Portfolio",
        },
        {
          src: "/images/splash/splash-1242x2208.png",
          type: "image/png",
          sizes: "1242x2208",
          label: "Portfolio",
        },
      ],
    },
    workbox: {
      navigateFallback: null,
      cleanupOutdatedCaches: true,
    },
    devOptions: {
      enabled: false,
      type: "module",
      navigateFallbackAllowlist: [/^\/$/],
    },
  },

  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000",
    vueI18n: "./i18n.config.ts",
    locales: [
      {
        code: "zh-Hant-TW",
        language: "zh-Hant-TW",
        dir: "ltr",
        name: "繁體中文",
        file: "zh-Hant-TW.ts",
      },
      {
        code: "en",
        language: "en-US",
        dir: "ltr",
        name: "English",
        file: "en-US.ts",
      },
    ],
    lazy: true,
    langDir: "lang",
    // strategy: 'prefix',
    defaultLocale: "zh-Hant-TW",
    detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   useCookie: true,
    //   alwaysRedirect: true,
    //   cookieCrossOrigin: true
    // }
  },

  htmlValidator: {
    usePrettier: true,
  },

  runtimeConfig: {
    env: "",
    baseUrl: process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000",
    public: {
      buildDate: (() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      })(),
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000",
      websiteName: {
        "zh-Hant-TW":
          process.env.NUXT_PUBLIC_WEBSITE_NAME_ZHHANTTW ||
          zhHantTW.website.name,
        en: process.env.NUXT_PUBLIC_WEBSITE_NAME_EN || enUS.website.name,
      },
      websiteDescription: {
        "zh-Hant-TW":
          process.env.NUXT_PUBLIC_WEBSITE_DES_ZHHANTTW || zhHantTW.website.des,
        en: process.env.NUXT_PUBLIC_WEBSITE_DES_EN || enUS.website.des,
      },
    },
  },

  robots: {
    robotsTxt: true,
    sitemap: `${process.env.NUXT_PUBLIC_BASE_URL}/sitemap.xml`,
  },

  site: {
    url: process.env.NUXT_PUBLIC_BASE_URL,
    name: "Neil's portfolio",
    autoLastmod: true,
    cacheMaxAgeSecond: 3600,
  },

  sitemap: {
    sources: ["/api/__sitemap__/urls"],
  },

  ogImage: {
    fonts: ["Noto+Sans+TC:700"],
  },

  routeRules: {
    // Enable prerendering for OG images to generate them at build time (recommended for Netlify/Static)
    "/__og-image__/image/**": { prerender: false },
  },
});
