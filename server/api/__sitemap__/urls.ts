import type { productsData as ProductsData } from "~~/data/productsData";

export default defineSitemapEventHandler(async () => {
  // 動態引入產品資料
  const { default: productsData }: { default: typeof ProductsData } =
    await import("~~/data/productsData");

  // 只為可點擊的產品產生 sitemap 項目
  const clickableProducts = productsData.filter((p) => p.clickable);

  return clickableProducts.map((p) => ({
    loc: `/products/${p.slug}`,
    _i18nTransform: true,
  }));
});
