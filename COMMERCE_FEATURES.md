# قابلیت‌های تجاری مُدارا

## وضعیت نمای ۳۶۰ درجه

در نسخه‌ی فعلی، چرخش ۳۶۰ درجه و افکت‌های مرتبط با آن **به‌طور کامل غیرفعال شده‌اند**. تصاویر محصولات به‌صورت ثابت و استاندارد نمایش داده می‌شوند تا تجربه‌ی کاربری آرام‌تر باشد. اگر در آینده نمای ۳۶۰ درجه لازم شد، باید به‌صورت opt-in و با کنترل `prefers-reduced-motion` اضافه شود؛ اجرای چرخش خودکار برای همه‌ی کاربران توصیه نمی‌شود.

مدل پیشنهادی برای production این است:

```sql
alter table public.products add column if not exists image_urls text[] not null default '{}';
```

سپس در `ProductCard` فریم فعلی را بر اساس `requestAnimationFrame`، pointer/touch و زمان تغییر دهید. برای موبایل، preload فقط فریم‌های نزدیک و برای دسکتاپ preload کل sequence مناسب‌تر است. حجم هر فریم را WebP/AVIF و عرض آن را بر اساس breakpoint تنظیم کنید. حالت `prefers-reduced-motion` باید چرخش خودکار را متوقف کند.

## سیستم تخفیف و کوپن

محاسبه‌ی قیمت نهایی نباید فقط در React انجام شود؛ چون کاربر می‌تواند مقدار فرانت‌اند را تغییر دهد. حداقل جداول زیر را در Supabase بسازید:

```sql
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  kind text not null check (kind in ('percent', 'fixed')),
  value numeric(12,2) not null check (value > 0),
  min_order numeric(12,2) not null default 0,
  max_discount numeric(12,2),
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id),
  user_id uuid not null references auth.users(id),
  order_id uuid not null unique references public.orders(id),
  discount_amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, user_id, order_id)
);
```

در Checkout، کاربر کد را وارد می‌کند و یک Edge Function آن را با حروف بزرگ و بدون فاصله normalize می‌کند، تاریخ اعتبار، حداقل مبلغ، سقف تخفیف و ظرفیت مصرف را بررسی می‌کند. پس از verify موفق پرداخت، redemption و افزایش `used_count` باید در یک تراکنش یا RPC اتمیک ثبت شوند. مبلغی که برای زرین‌پال فرستاده می‌شود باید همان مبلغ نهایی محاسبه‌شده در سرور باشد.

برای جلوگیری از حدس‌زدن کدها، پیام خطا را عمومی نگه دارید؛ برای مثال «کد قابل استفاده نیست». کدهای تخفیف را به‌صورت plaintext در گزارش‌های عمومی نمایش ندهید و برای کوپن‌های یک‌بارمصرف، قید یکتایی را حفظ کنید.

## فعال‌سازی نظرات و امتیازدهی

رابط محصول در پروژه از قبل بخش نمایش و فرم ثبت review دارد و جدول `reviews` را می‌خواند. برای production، جدول و سیاست‌های RLS را با migration ایجاد کنید:

```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 5 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

alter table public.reviews enable row level security;
create policy "approved reviews are public" on public.reviews
  for select to anon, authenticated using (approved = true or auth.uid() = user_id);
create policy "signed-in users create own reviews" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users edit own pending reviews" on public.reviews
  for update to authenticated using (auth.uid() = user_id and approved = false)
  with check (auth.uid() = user_id and approved = false);
```

در پنل مدیریت، یک صف بررسی برای `approved = false` اضافه کنید. میانگین امتیاز را یا هنگام query محاسبه کنید یا با trigger/RPC در ستون cache محصول نگه دارید. برای «خریدار تأییدشده» باید وجود یک order پرداخت‌شده برای همان `user_id` و `product_id` بررسی شود؛ این شرط را در RPC یا Edge Function اعمال کنید، نه در ادعای ارسالی از مرورگر.

## گزارش مالی و خروجی Excel

پنل مدیریت اکنون خلاصه‌ی سفارش‌ها، درآمد تأییدشده، میانگین ارزش سفارش و دکمه‌ی **خروجی اکسل** دارد. خروجی فعلی یک CSV با BOM UTF-8 و جداکننده‌ی `;` است تا در Excel فارسی بدون به‌هم‌ریختگی باز شود. این فایل شامل خلاصه درآمد و ردیف‌های سفارش، محصول، تعداد، قیمت، وضعیت، تلفن، آدرس و کد رهگیری است.

برای گزارش‌های production، مدیر باید فقط سفارش‌های مجاز را از Supabase با RLS بخواند. در حجم زیاد، به‌جای بارگذاری همه سفارش‌ها در مرورگر، یک view یا RPC تجمیعی برای بازه‌ی تاریخ، status، دسته‌بندی و روش پرداخت بسازید و خروجی را با pagination تولید کنید. برای فایل واقعی `.xlsx` نیز می‌توانید تولید را در یک Edge Function یا سرور انجام دهید و با کتابخانه‌ی مخصوص Excel فایل را به‌صورت stream تحویل دهید؛ CSV فعلی سبک‌تر، ارزان‌تر و برای شروع کافی است.

## پنل مدیریت کامل

پنل مدیریت در فایل `src/pages/AdminPanel.tsx` به ساختار تب‌محور توسعه یافته است. هر تب عملیات مستقل افزودن، ویرایش، حذف، جستجو و فیلتر دارد:

| تب | عملیات اصلی |
|---|---|
| نمای کلی | KPIهای سفارش، درآمد تاییدشده، میانگین سفارش، موجودی کم و کوپن فعال |
| سفارش‌ها | تغییر وضعیت پرداخت/ارسال، ثبت کد رهگیری، مشاهده اقلام و خروجی CSV |
| محصولات | افزودن، ویرایش، حذف، تغییر قیمت، موجودی، تصویر، slug و دسته‌بندی |
| دسته‌بندی‌ها | افزودن، ویرایش، حذف و مدیریت slug و آیکن |
| محتوای بلاگ | مدیریت عنوان، slug، خلاصه، متن، نویسنده و تصویر |
| نظرات | افزودن، ویرایش، حذف و تعیین وضعیت منتشرشده، در انتظار بررسی یا مخفی |
| تخفیف و کوپن | مدیریت کد، نوع، مقدار، حداقل سبد، سقف مصرف، فعال/غیرفعال و انقضا |
| مشتریان | مدیریت نام، ایمیل، تلفن، آدرس و وضعیت فعال/مسدود |
| تنظیمات | هویت فروشگاه، واحد پول، اطلاعیه، پشتیبانی، ارسال رایگان و حالت تعمیر |

در حالت Demo، داده‌های این تب‌ها در `localStorage` ذخیره می‌شوند. برای Production، ابتدا migration زیر را در Supabase اجرا کنید:

```text
supabase/migrations/20260822130000_admin_backoffice.sql
```

این migration ستون `tracking_code` سفارش و `status` نظر را اضافه می‌کند، جدول‌های `coupons`، `customer_profiles` و `store_settings` را می‌سازد و مجوزهای CRUD را فقط به کاربری می‌دهد که در `app_metadata.role` مقدار `admin` داشته باشد. پس از اجرای migration، در Supabase برای حساب مدیر مقدار زیر را در `auth.users.app_metadata` ثبت کنید:

```json
{"role": "admin"}
```

مسیر ورود پنل:

```text
https://mcdonun1-hub.github.io/ModernAra1/#backoffice-login
```

در محیط Demo می‌توانید با `admin` و `admin 1234` وارد شوید. این حساب فقط برای آزمایش رابط کاربری است و نباید در Production استفاده شود.
