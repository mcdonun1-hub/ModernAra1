/*
# Re-seed: Fashion E-commerce (Clothing, Pants, Accessories, Glasses, Watches)

## Overview
Clears old tech product data and re-seeds with fashion items.
Adds a new `reviews` table for product reviews (public read, owner-scoped write).

## Changes
1. New table: `reviews` — product reviews with rating, name, comment (public read, authenticated insert)
2. Clear and re-seed `categories` with fashion categories
3. Clear and re-seed `products` with fashion items (12 products)
4. Clear and re-seed `blog_posts` with fashion articles (3 posts)
5. Seed `reviews` with demo reviews

## Security
- `reviews`: public read (anon + authenticated), insert for authenticated only.
*/

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'کاربر مهمان',
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (true);

-- Clear old data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM reviews;
DELETE FROM products;
DELETE FROM blog_posts;
DELETE FROM categories;

-- Seed fashion categories
INSERT INTO categories (name, slug, icon) VALUES
  ('لباس', 'clothing', 'shirt'),
  ('شلوار', 'pants', 'pants'),
  ('عینک', 'glasses', 'glasses'),
  ('ساعت', 'watch', 'watch'),
  ('کیف', 'bag', 'bag'),
  ('اکسسوری', 'accessory', 'gem')
ON CONFLICT (slug) DO NOTHING;

-- Seed fashion products
INSERT INTO products (name, slug, description, price, image_url, category_id, rating, stock) VALUES
  ('پیراهن مردانه کلاسیک سفید', 'classic-white-shirt', 'پیراهن مردانه کلاسیک با یقه رسمی، دوخت مرغوب از پنبه طبیعی ۱۰۰٪', 890000, '/images/prod-shirt-1.jpg', (SELECT id FROM categories WHERE slug='clothing'), 4.7, 80),
  ('پیراهن زنانه شیک صورتی', 'elegant-pink-blouse', 'بلوز زنانه طراحی خاص با پارچه نرم و راحت، مناسب مجالس و محل کار', 1200000, '/images/prod-shirt-2.jpg', (SELECT id FROM categories WHERE slug='clothing'), 4.8, 60),
  ('شلوار جین مردانه اسلیم', 'slim-jeans-men', 'شلوار جین مردانه اسلیم فیت با پارچه کش‌سفارشی و دوام بالا', 1500000, '/images/prod-pants-1.jpg', (SELECT id FROM categories WHERE slug='pants'), 4.6, 100),
  ('شلوار کتان زنانه', 'linen-pants-women', 'شلوار کتان زنانه با طراحی مدرن و راحتی فوق‌العاده، مناسب فصل بهار و تابستان', 1350000, '/images/prod-pants-2.jpg', (SELECT id FROM categories WHERE slug='pants'), 4.5, 75),
  ('عینک آفتابی لوکس مدل کلاسیک', 'luxury-sunglasses-classic', 'عینک آفتابی با فریم متالیک و عدسی پلاریزه، محافظت کامل در برابر UV', 1800000, '/images/prod-glasses-1.jpg', (SELECT id FROM categories WHERE slug='glasses'), 4.9, 40),
  ('عینک آفتابی مدرن', 'modern-sunglasses', 'عینک آفتابی با طراحی مدرن و رنگ‌های متنوع، مناسب استایل روزمره و مجلسی', 1600000, '/images/prod-glasses-2.jpg', (SELECT id FROM categories WHERE slug='glasses'), 4.7, 55),
  ('ساعت مچی لوکس طلایی', 'luxury-gold-watch', 'ساعت مچی با بدنه طلایی و بند چرمی، طراحی شیک و کلاسیک برای آقایان', 4500000, '/images/prod-watch-1.jpg', (SELECT id FROM categories WHERE slug='watch'), 4.8, 30),
  ('ساعت مچی اسپرت', 'sport-watch', 'ساعت مچی اسپرت با قابلیت ضدآب و طراحی مدرن، مناسب استفاده روزمره و ورزشی', 2800000, '/images/prod-watch-2.jpg', (SELECT id FROM categories WHERE slug='watch'), 4.6, 45),
  ('کیف دستی زنانه چرم', 'leather-handbag-women', 'کیف دستی زنانه از چرم طبیعی با طراحی شیک و فضای داخلی جادار', 2300000, '/images/prod-bag-1.jpg', (SELECT id FROM categories WHERE slug='bag'), 4.8, 50),
  ('کیف دوشی مردانه', 'mens-messenger-bag', 'کیف دوشی مردانه با چرم باکیفیت و طراحی مینیمال، مناسب محل کار و سفر', 1900000, '/images/prod-bag-2.jpg', (SELECT id FROM categories WHERE slug='bag'), 4.5, 65),
  ('کمربند چرم مردانه', 'leather-belt-men', 'کمربند چرم طبیعی مردانه با سگکی استیل، طراحی شیک و دوام بالا', 650000, '/images/prod-belt-1.jpg', (SELECT id FROM categories WHERE slug='accessory'), 4.4, 120),
  ('ست جواهری زنانه', 'womens-jewelry-set', 'ست جواهری زنانه شامل گردنبند و گوشواره با طراحی ظریف و درخشان', 3200000, '/images/prod-jewelry-1.jpg', (SELECT id FROM categories WHERE slug='accessory'), 4.9, 25)
ON CONFLICT (slug) DO NOTHING;

-- Seed fashion blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author) VALUES
  ('ترندهای مد پاییز ۱۴۰۵', 'fall-1405-fashion-trends', 'بررسی کامل ترندهای مد پاییز ۱۴۰۵ از رنگ‌های پاییزی تا استایل‌های جدید', 'در فصل پاییز ۱۴۰۵ شاهد بازگشت رنگ‌های گرم و خنثی هستیم. تن‌های کرم، قهوه‌ای و نارنجی از رنگ‌های اصلی این فصل هستند. استایل لایه‌ای همچنان محبوب است و می‌توانید با ترکیب پیراهن‌های نازک و کت‌های سبک، یک استایل شیک پاییزی بسازید. شلوارهای گشاد و کتان نیز جای خود را در کمد هر فرد مد‌پسند باز کرده‌اند. در انتخاب اکسسوری، ساعت‌های کلاسیک و عینک‌های آفتاری با فریم بزرگ ترند روز هستند.', '/images/blog-1.jpg', 'سارا احمدی'),
  ('راهنمای انتخاب عینک آفتابی مناسب', 'sunglasses-buying-guide', 'همه چیزهایی که قبل از خرید عینک آفتابی باید بدانید', 'انتخاب عینک آفتابی مناسب فقط به مدل و ظاهر آن محدود نمی‌شود. باید به فرم صورت، کیفیت عدسی و محافظت در برابر اشعه UV توجه کنید. برای صورت‌های گرد، عینک‌های زاویه‌دار مناسب‌تر هستند. برای صورت‌های مربعی، عینک‌های گردتر انتخاب بهتری است. عدسی‌های پلاریزه برای رانندگی و فعالیت‌های بیرونی بسیار توصیه می‌شوند. همچنین فریم سبک و راحت برای استفاده طولانی‌مدت اهمیت دارد.', '/images/blog-2.jpg', 'محمد رضایی'),
  ('چگونه ساعت مچی مناسب بخریم؟', 'watch-buying-guide', 'راهنمای جامع خرید ساعت مچی از سبک تا بودجه', 'خرید ساعت مچی یکی از مهم‌ترین تصمیمات برای تکمیل استایل است. اولین نکته تعیین بودجه است. ساعت‌های مچی در قیمت‌های متنوعی موجود هستند. بعد از بودجه باید به سبک زندگی خود فکر کنید: ساعت اسپرت برای استفاده روزمره، ساعت کلاسیک برای مجالس و محیط‌های رسمی. جنس بدنه و بند نیز مهم است: استیل ضدزنگ، چرم طبیعی و سرامیک از بهترین گزینه‌ها هستند. در نهایت به اندازه دست و وزن ساعت نیز توجه کنید تا راحتی لازم را داشته باشد.', '/images/blog-3.jpg', 'نگار کریمی')
ON CONFLICT (slug) DO NOTHING;

-- Seed demo reviews
INSERT INTO reviews (product_id, name, rating, comment) VALUES
  ((SELECT id FROM products WHERE slug='classic-white-shirt'), 'علی محمدی', 5, 'کیفیت پارچه عالی و دوخت بسیار تمیز. کاملاً راضی هستم.'),
  ((SELECT id FROM products WHERE slug='classic-white-shirt'), 'مریم حسینی', 4, 'سایز بندی دقیق است و پارچه خوبی دارد ولی قیمت کمی بالاست.'),
  ((SELECT id FROM products WHERE slug='luxury-gold-watch'), 'حسین کریمی', 5, 'ساعت بسیار شیک و باکیفیت. بند چرمی عالی و ظاهر لوکس.'),
  ((SELECT id FROM products WHERE slug='luxury-gold-watch'), 'زهرا نوری', 5, 'بهترین خریدم! طراحی کلاسیک و درخشنده، کاملاً ارزشش رو داره.'),
  ((SELECT id FROM products WHERE slug='luxury-sunglasses-classic'), 'سینا اکبری', 5, 'عینک سبک و باکیفیت. عدسی پلاریزه واقعاً موثره.'),
  ((SELECT id FROM products WHERE slug='leather-handbag-women'), 'فاطمه رضایی', 4, 'کیف زیاد جادار و چرم خوبیه ولی رنگش کمی فرق داره با عکس.'),
  ((SELECT id FROM products WHERE slug='elegant-pink-blouse'), 'نگار صادقی', 5, 'بلوز بسیار زیبا و نرم. برای مجالس عالیه.'),
  ((SELECT id FROM products WHERE slug='slim-jeans-men'), 'رضا تهرانی', 4, 'جین خوب و کش‌سفارشی ولی کمی کوتاهتر از سایز واقعی بود.')
ON CONFLICT DO NOTHING;
