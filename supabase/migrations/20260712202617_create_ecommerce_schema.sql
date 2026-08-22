/*
# E-commerce Schema: Categories, Products, Cart, Orders, Blog

## Overview
Creates a full e-commerce database with user accounts, shopping cart, orders, and blog.
Multi-user app with sign-in — all user-owned tables use `user_id` with `DEFAULT auth.uid()`.

## New Tables
1. `categories` — product categories (public read)
2. `products` — product catalog (public read), price numeric(12,2)
3. `cart_items` — per-user cart (owner-scoped)
4. `orders` — user orders (owner-scoped)
5. `order_items` — items in an order (owner-scoped via orders)
6. `blog_posts` — blog articles (public read)

## Security
- RLS enabled on ALL tables.
- `categories`, `products`, `blog_posts`: public read (anon + authenticated).
- `cart_items`, `orders`: owner-scoped CRUD (auth.uid() = user_id).
- `order_items`: owner-scoped via orders FK check.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  image_url text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  rating numeric(2,1) DEFAULT 4.5,
  stock int DEFAULT 100,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Cart items (owner-scoped)
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cart" ON cart_items;
CREATE POLICY "select_own_cart" ON cart_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cart" ON cart_items;
CREATE POLICY "insert_own_cart" ON cart_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cart" ON cart_items;
CREATE POLICY "update_own_cart" ON cart_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cart" ON cart_items;
CREATE POLICY "delete_own_cart" ON cart_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Orders (owner-scoped)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Order items (owner-scoped via orders)
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_order_items" ON order_items;
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Blog posts (public read)
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  image_url text,
  author text DEFAULT 'تیم تحریریه',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_posts" ON blog_posts;
CREATE POLICY "public_read_blog_posts" ON blog_posts FOR SELECT
  TO anon, authenticated USING (true);

-- Seed categories
INSERT INTO categories (name, slug, icon) VALUES
  ('موبایل', 'mobile', 'smartphone'),
  ('لپ‌تاپ', 'laptop', 'laptop'),
  ('هدفون', 'headphone', 'headphones'),
  ('ساعت هوشمند', 'smartwatch', 'watch'),
  ('دوربین', 'camera', 'camera'),
  ('گیمینگ', 'gaming', 'gamepad')
ON CONFLICT (slug) DO NOTHING;

-- Seed products
INSERT INTO products (name, slug, description, price, image_url, category_id, rating, stock) VALUES
  ('گوشی آیفون ۱۵ پرو مکس', 'iphone-15-pro-max', 'گوشی هوشمند اپل با نمایشگر ۶.۷ اینچی، تراشه A17 Pro و دوربین ۴۸ مگاپیکسلی', 78000000, 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='mobile'), 4.9, 50),
  ('گوشی سامسونگ گلکسی S24', 'samsung-galaxy-s24', 'گوشی پرچم‌دار سامسونگ با قابلیت‌های هوش مصنوعی و نمایشگر AMOLED', 52000000, 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='mobile'), 4.7, 80),
  ('لپ‌تاپ مک‌بوک پرو M3', 'macbook-pro-m3', 'لپ‌تاپ اپل با تراشه M3 Pro، نمایشگر Liquid Retina XDR و عمر باتری ۲۲ ساعته', 95000000, 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='laptop'), 4.8, 30),
  ('لپ‌تاپ ایسوس ROG Strix', 'asus-rog-strix', 'لپ‌تاپ گیمینگ با کارت گرافیک RTX 4070 و پردازنده i9', 87000000, 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='laptop'), 4.6, 25),
  ('هدفون سونی WH-1000XM5', 'sony-wh1000xm5', 'هدفون بی‌سیم با حذف نویز فعال و کیفیت صدای فوق‌العاده', 18000000, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='headphone'), 4.9, 120),
  ('هدفون بیتس استودیو پرو', 'beats-studio-pro', 'هدفون پریمیوم با صدای قدرتمند و طراحی شیک', 15000000, 'https://images.pexels.com/photos/3784221/pexels-photo-3784221.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='headphone'), 4.5, 90),
  ('ساعت اپل واچ سری ۹', 'apple-watch-series-9', 'ساعت هوشمند با قابلیت اندازه‌گیری اکسیژن خون و ECG', 22000000, 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='smartwatch'), 4.7, 60),
  ('ساعت گارمین Fenix 7', 'garmin-fenix-7', 'ساعت ورزشی حرفه‌ای با GPS و عمر باتری طولانی', 31000000, 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='smartwatch'), 4.8, 40),
  ('دوربین کانن EOS R6', 'canon-eos-r6', 'دوربین بدون آینه با سنسور ۲۴ مگاپیکسل و فیلم‌برداری ۴K', 92000000, 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='camera'), 4.8, 15),
  ('دوربین سونی Alpha A7 IV', 'sony-alpha-a7-iv', 'دوربین فول‌فریم با فوکوس خودکار فوق‌العاده', 105000000, 'https://images.pexels.com/photos/51383/photo-camera-subject-photography-film-51383.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='camera'), 4.9, 10),
  ('کنسول پلی‌استیشن ۵', 'playstation-5', 'کنسول بازی نسل نهم با گرافیک ۴K و SSD فوق‌سریع', 38000000, 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='gaming'), 4.8, 70),
  ('کنسول ایکس‌باکس سری X', 'xbox-series-x', 'قدرتمندترین کنسول مایکروسافت با گرافیک فوق‌العاده', 35000000, 'https://images.pexels.com/photos/15406277/pexels-photo-15406277.jpeg?auto=compress&cs=tinysrgb&w=800', (SELECT id FROM categories WHERE slug='gaming'), 4.7, 55)
ON CONFLICT (slug) DO NOTHING;

-- Seed blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author) VALUES
  ('بهترین گوشی‌های ۲۰۲۶ برای خرید', 'best-phones-2026', 'بررسی کامل بهترین گوشی‌های هوشمند سال ۲۰۲۶ از نظر قیمت و کارایی', 'در این مقاله به بررسی کامل بهترین گوشی‌های سال ۲۰۲۶ می‌پردازیم. از آیفون ۱۵ پرو مکس تا سامسونگ گلکسی S24، تمام گزینه‌ها را مقایسه می‌کنیم. عواملی مانند عملکرد، دوربین، باتری و قیمت را در نظر بگیرید تا بهترین انتخاب را داشته باشید. همچنین به بررسی گوشی‌های میان‌رده و اقتصادی نیز می‌پردازیم تا برای هر بودجه‌ای گزینه‌ای داشته باشید.', 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1200', 'سارا احمدی'),
  ('راهنمای خرید لپ‌تاپ گیمینگ', 'gaming-laptop-guide', 'همه چیزهایی که قبل از خرید لپ‌تاپ گیمینگ باید بدانید', 'خرید لپ‌تاپ گیمینگ یکی از مهم‌ترین تصمیمات برای گیمرهاست. در این راهنما به عواملی مانند کارت گرافیک، پردازنده، رم و سیستم خنک‌کننده می‌پردازیم. لپ‌تاپ‌های ایسوس ROG و MSI Dominator از بهترین گزینه‌های بازار هستند. همچنین به بررسی صفحه نمایش با نرخ تازه‌سازی بالا و کیبورد مکانیکی نیز می‌پردازیم.', 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg?auto=compress&cs=tinysrgb&w=1200', 'محمد رضایی'),
  ('مقایسه هدفون‌های بی‌سیم برتر', 'wireless-headphones-comparison', 'سونی در برابر بیتس؛ کدام هدفون بی‌سیم مناسب شماست؟', 'در این مقاله هدفون‌های سونی WH-1000XM5 و بیتس استودیو پرو را مقایسه می‌کنیم. از نظر کیفیت صدا، حذف نویز، راحتی و قیمت، هر کدام مزایای خود را دارند. سونی در حذف نویز برتر است در حالی که بیتس صدای قدرتمندتری دارد. انتخاب نهایی به نیاز و سلیقه شما بستگی دارد.', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1200', 'نگار کریمی')
ON CONFLICT (slug) DO NOTHING;
