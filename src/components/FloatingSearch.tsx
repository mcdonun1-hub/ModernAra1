import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { formatPrice, asset } from '../lib/format';

type FloatingSearchProps = {
  onNavigate: (view: string, param?: string) => void;
};

export default function FloatingSearch({ onNavigate }: FloatingSearchProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkVisibility = () => {
      let foundHeading: Element | null = null;
      document.querySelectorAll('h2').forEach((h) => {
        if (h.textContent?.includes('دسته‌بندی محصولات')) foundHeading = h;
      });
      if (foundHeading) {
        const rect = (foundHeading as HTMLElement).getBoundingClientRect();
        setVisible(rect.bottom < 0);
      }
    };
    checkVisibility();
    window.addEventListener('scroll', checkVisibility, { passive: true });
    return () => window.removeEventListener('scroll', checkVisibility);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .ilike('name', `%${query.trim()}%`)
        .limit(5);
      setResults(data || []);
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleResultClick = (slug: string) => {
    onNavigate('product', slug);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 transition-all duration-500 sm:bottom-6 sm:w-[92%] ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative">
        {/* Results dropdown */}
        {showResults && query.trim() && (
          <div className="absolute bottom-full left-0 right-0 mb-2 max-h-[min(20rem,calc(100svh-8rem))] overflow-y-auto rounded-2xl border border-dark-100 bg-white shadow-2xl shadow-dark-900/10 animate-scale-in">
            {loading ? (
              <div className="p-6 text-center text-dark-500 text-sm">در حال جستجو...</div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-dark-500 text-sm">نتیجه‌ای یافت نشد</div>
            ) : (
              <div className="p-2 space-y-1">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleResultClick(p.slug)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-right transition-all hover:bg-amber-50"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-dark-50">
                      {p.image_url && (
                        <img src={asset(p.image_url)} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark-900 text-sm line-clamp-1">{p.name}</p>
                      <p className="text-xs text-amber-700 font-semibold">{formatPrice(p.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search input */}
        <div className="flex items-center gap-2 rounded-2xl border border-dark-100 bg-white/90 backdrop-blur-lg shadow-2xl shadow-dark-900/15 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-amber-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="جستجوی محصول..."
            className="flex-1 bg-transparent text-sm text-dark-900 placeholder:text-dark-400 outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="shrink-0 text-dark-400 hover:text-dark-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
