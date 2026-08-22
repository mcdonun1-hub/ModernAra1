# راه‌اندازی پیامک تأیید سفارش

## معماری پیشنهادی

ارسال پیامک باید بعد از تأیید پرداخت و تغییر وضعیت سفارش به `paid` انجام شود، نه هنگام کلیک اولیه روی پرداخت. کلید API سرویس پیامکی فقط باید در Supabase Edge Function یا سرور نگهداری شود و هرگز داخل `VITE_*`، bundle فرانت‌اند یا GitHub Pages قرار نگیرد.

دو نقطه‌ی مناسب برای اجرای ارسال وجود دارد: اول، در انتهای `zarinpal-callback` پس از verify موفق؛ دوم، یک تابع جدا که با Database Webhook یا job داخلی، تغییر وضعیت سفارش به `paid` را دریافت کند. گزینه‌ی دوم برای retry، گزارش تحویل و جلوگیری از ارسال تکراری قابل‌کنترل‌تر است.

| رویکرد | مزیت | ملاحظه | هزینه و پیچیدگی |
| --- | --- | --- | --- |
| ارسال مستقیم در `zarinpal-callback` | ساده و سریع؛ یک مسیر کمتر برای استقرار | اگر سرویس پیامک موقتاً خطا دهد، callback نباید دوباره تراکنش را verify کند؛ به retry و idempotency نیاز دارد | کم / مناسب شروع |
| تابع جدا با trigger تغییر وضعیت سفارش | پرداخت از اعلان مشتری جدا می‌ماند؛ retry و ثبت `message_id` تمیزتر است | نیازمند تنظیم webhook یا job و جدول لاگ پیامک است | متوسط / مناسب production |

## گزینه‌های سرویس

### کاوه‌نگار

کاوه‌نگار REST API را روی HTTPS ارائه می‌کند و احراز هویت با API Key انجام می‌شود. متد ارسال ساده از مسیر زیر استفاده می‌کند:

```text
https://api.kavenegar.com/v1/{API-KEY}/sms/send.json
```

پارامترهای اصلی `receptor`، `message` و در صورت نیاز `sender` هستند. پاسخ شامل وضعیت و `messageid` است؛ همین شناسه را در جدول log ذخیره کنید تا retry باعث ارسال تکراری نشود. برای متن تأیید سفارش، الگوی ثابت یا پیامک خدماتی را از پنل سرویس استفاده کنید و متن را کوتاه نگه دارید.

نمونه‌ی هسته‌ی Edge Function:

```ts
const apiKey = Deno.env.get('KAVENEGAR_API_KEY')!;
const sender = Deno.env.get('KAVENEGAR_SENDER')!;

const params = new URLSearchParams({
  receptor: phone,
  sender,
  message: `مُدارا: سفارش ${shortOrderId} با موفقیت ثبت شد. مبلغ: ${total} تومان`,
});

const response = await fetch(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json?${params}`);
const payload = await response.json();
const messageId = payload?.entries?.[0]?.messageid;
```

مستندات رسمی: <https://kavenegar.com/rest.html>

### ملی‌پیامک

ملی‌پیامک وب‌سرویس و API ارائه می‌کند و در مستندات فعلی خود هم نمونه‌ی SDK و هم کنسول جدید مبتنی بر REST و Auth Token را معرفی کرده است. در production، نمونه‌ی REST/Token همان پنلی را که در حساب شما فعال است مبنا قرار دهید و نام کاربری، رمز یا token را فقط به‌عنوان secret در Edge Function تنظیم کنید.

مستندات رسمی: <https://www.melipayamak.com/api/>

## داده‌های پیشنهادی برای ثبت وضعیت

برای جلوگیری از ارسال تکراری، جدولی مانند نمونه‌ی زیر اضافه کنید:

```sql
create table public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  recipient text not null,
  template text,
  provider_message_id text,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, provider, template)
);
```

تابع ارسال باید ابتدا با `order_id + provider + template` یک رکورد یکتا ایجاد کند؛ اگر رکورد موفق وجود دارد، بدون ارسال دوباره خارج شود. در خطای موقت، `attempts` و `last_error` را ثبت کنید و با backoff محدود retry کنید. اطلاعات حساس کارت بانکی را هرگز در متن پیامک، log یا جدول پیامک ذخیره نکنید.

## Secretهای لازم

در پروژه Supabase نمونه‌ی زیر را با مقادیر واقعی حساب خود تنظیم کنید:

```bash
supabase secrets set \
  KAVENEGAR_API_KEY=YOUR_API_KEY \
  KAVENEGAR_SENDER=YOUR_SENDER_NUMBER
```

برای ملی‌پیامک، نام secretها را مطابق پیاده‌سازی provider خود تعیین کنید؛ مثلاً `MELIPAYAMAK_USERNAME`، `MELIPAYAMAK_PASSWORD` یا `MELIPAYAMAK_AUTH_TOKEN`. این مقادیر را در GitHub Pages یا فایل `.env` commit‌شده قرار ندهید.

## جریان کامل سفارش

ابتدا Edge Function پرداخت سفارش را با وضعیت `pending` می‌سازد. پس از بازگشت از زرین‌پال، callback مبلغ و authority را server-to-server verify می‌کند و سفارش را به `paid` تغییر می‌دهد. فقط بعد از این تغییر، تابع پیامک یک پیام خدماتی کوتاه برای مشتری می‌فرستد؛ نتیجه‌ی provider در `sms_logs` ذخیره می‌شود و پنل مدیریت می‌تواند وضعیت ارسال و خطا را نمایش دهد.
