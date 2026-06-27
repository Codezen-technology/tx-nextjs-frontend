import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("https://trainingexcellence.org.uk/", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await p.waitForTimeout(4000);
// dismiss cookie
try {
  await p.getByRole("button", { name: /Reject All/i }).click({ timeout: 3000 });
} catch {}
await p.waitForTimeout(500);
// detect swiper/slick presence
const info = await p.evaluate(() => ({
  swiper: document.querySelectorAll(".swiper, .swiper-container").length,
  slick: document.querySelectorAll(".slick-slider").length,
  swiperPrevDisabled: !!document.querySelector(".swiper-button-prev.swiper-button-disabled"),
  swiperNextDisabled: !!document.querySelector(".swiper-button-next.swiper-button-disabled"),
  bullets: document.querySelectorAll(".swiper-pagination-bullet").length,
  activeBullet: [...document.querySelectorAll(".swiper-pagination-bullet")].findIndex((e) =>
    e.classList.contains("swiper-pagination-bullet-active"),
  ),
  loop: !!document.querySelector(".swiper-slide-duplicate"),
}));
console.log("init:", JSON.stringify(info));
