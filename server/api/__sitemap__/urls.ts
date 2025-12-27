import type { productsData as ProductsData } from "~~/data/productsData";

export default defineSitemapEventHandler(async () => {
  // 動態引入產品資料
  const { default: productsData }: { default: typeof ProductsData } =
    await import("~~/data/productsData");

  // 只為可點擊的產品產生 sitemap 項目
  const clickableProducts = productsData.filter((p) => p.clickable);

  return clickableProducts.map((p) => {
    const images: any[] = [];
    // 確認產品有圖片資料，並且有預設語系 'zh-Hant-TW' 的圖片
    if (p.images && p.images["zh-Hant-TW"]) {
      p.images["zh-Hant-TW"].forEach((img, index) => {
        // Sitemap 模組的圖片物件格式
        const imageEntry: any = {
          loc: img.src, // 圖片網址
          title: img.figcaption, // 圖片標題
        };

        // 如果有英文語系的圖片，就加入翻譯
        // _i18n 屬性用來提供其他語系的翻譯
        if (p.images.en && p.images.en[index]) {
          imageEntry._i18n = {
            en: {
              title: p.images.en[index].figcaption,
            },
          };
        }
        images.push(imageEntry);
      });
    }

    const videos: any[] = [];
    // 確認產品有影片資料，並且有預設語系 'zh-Hant-TW' 的影片
    if (p.videos && p.videos["zh-Hant-TW"]) {
      p.videos["zh-Hant-TW"].forEach((video, index) => {
        // Sitemap 模組的影片物件格式
        const videoEntry: any = {
          title: video.title,
          description: video.description,
          // 影片縮圖是必要欄位
          thumbnail_loc: video.thumbnail_loc,
          // 影片檔案位置
          content_loc: video.src,
        };

        // 如果有英文語系的影片，就加入翻譯
        if (p.videos.en && p.videos.en[index]) {
          videoEntry._i18n = {
            en: {
              title: p.videos.en[index].title,
              description: p.videos.en[index].description,
            },
          };
        }
        videos.push(videoEntry);
      });
    }

    // 將處理好的圖片陣列加入回傳的物件中
    const config = useRuntimeConfig();
    return {
      loc: `/products/${p.slug}`,
      lastmod: p.updatedAt ? new Date(config.public.buildDate as string).toISOString() : undefined,
      _i18nTransform: true,
      images,
      videos,
    };
  });
});
