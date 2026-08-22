import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase, type Product, type Category } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

type ShopProps = {
  onNavigate: (view: string, param?: string) => void;
  initialCategory?: string;
};

export default function Shop({ onNavigate, initialCategory }: ShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory ?? null);
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc' | 'newest'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, category:categories(*)');

    if (activeCategory) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', activeCategory).maybeSingle();
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    if (sortBy === 'rating') query = query.order('rating', { ascending: false });
    else if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  }, [activeCategory, search, sortBy]);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="pt-20 min-h-screen bg-dark-50" dir="rtl">
      {/* Page header */}
      <div className="bg-gradient-to-br from-dark-950 to-amber-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">فروشگاه مُدارا</h1>
          <p className="text-white/60">شیک‌ترین لباس‌ها و اکسسوری‌ها را با ما تجربه کنید</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی محصول..."
              className="input-field pr-11"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input-field w-auto cursor-pointer"
            >
              <option value="rating">محبوب‌ترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="newest">جدیدترین</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl border border-dark-200 bg-white text-dark-700"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-56 shrink-0`}>
            <div className="sticky top-24 space-y-4">
              <div className="card p-4">
                <h3 className="font-bold text-dark-900 mb-3">دسته‌بندی‌ها</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveCategory(null); setShowFilters(false); }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      !activeCategory
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    همه محصولات
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.slug); setShowFilters(false); }}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === cat.slug
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-dark-600 hover:bg-dark-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-2xl border border-dark-100 bg-white p-4">
                    <div className="aspect-square rounded-xl shimmer-bg mb-4" />
                    <div className="h-4 w-3/4 rounded shimmer-bg mb-2" />
                    <div className="h-4 w-1/2 rounded shimmer-bg" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-16 w-16 text-dark-300 mb-4" />
                <p className="text-lg font-medium text-dark-700 mb-2">محصولی یافت نشد</p>
                <p className="text-sm text-dark-400">عبارت جستجو یا دسته‌بندی را تغییر دهید</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-dark-500 mb-4">
                  {new Intl.NumberFormat('fa-IR').format(products.length)} محصول یافت شد
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} onView={(slug) => onNavigate('product', slug)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
