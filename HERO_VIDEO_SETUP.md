# راهنمای ویدئوی Hero مُدارا

ویدئوی فعلی Hero از فایل ارسالی کاربر ساخته شده است:

- دسکتاپ: `public/videos/hero-woman-polishing-shoes.mp4`
- موبایل: `public/videos/hero-woman-polishing-shoes-mobile.mp4`
- تصویر fallback/poster: `public/images/hero-woman-polishing-poster.jpg`

## رفتار نمایش

کامپوننت `src/components/HeroSlider.tsx` مسیر فایل را با helper `asset()` می‌سازد تا هم در ریشه و هم در مسیر `/ModernAra1/` گیت‌هاب‌پیجز درست کار کند. ویدئو با `muted`، `playsInline`، `autoPlay` و `loop` نمایش داده می‌شود. پخش خودکار در حالت `prefers-reduced-motion: reduce` غیرفعال است و poster نمایش داده می‌شود.

حرکت اسکرول همچنان زمان ویدئو را با پیشرفت سکشن هماهنگ می‌کند. نسخه موبایل با عرض ۷۲۰ پیکسل و فشرده‌سازی جداگانه استفاده می‌شود تا حجم دانلود روی تلفن کاهش یابد.

## جایگزینی ویدئو در آینده

فایل MP4 جدید را با همین نام‌ها جایگزین کنید، یا مقدار `videoSrc` و `poster` را در `HeroSlider.tsx` تغییر دهید. پس از هر تغییر، این دستورات را اجرا کنید:

```bash
npm run typecheck
npm run lint
npm run build
```

برای انتشار در GitHub Pages، مقدار base باید `/ModernAra1/` باشد. لینک نهایی سایت:

```text
https://mcdonun1-hub.github.io/ModernAra1/
```
