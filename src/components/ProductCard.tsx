import { Eye, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../lib/supabase';
import { asset, formatPrice } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

type ProductCardProps = {
  product: Product;
  onView: (slug: string) => void;
};

export default function ProductCard({ product, onView }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user) return;
    await addToCart(product.id);
    window.dispatchEvent(new CustomEvent('modara:open-cart'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const imageUrl = asset(product.image_url);

  return (
    <div
      onClick={() => onView(product.slug)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dark-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
    >
      {/* Automatic 360-degree product scene */}
      <div
        className="product-360-viewport group-360 relative aspect-[3/4] overflow-hidden bg-dark-50"
        aria-label={`نمای چرخشی ۳۶۰ درجه ${product.name}`}
      >
        <div className="product-360-stage h-full w-full">
          <img src={imageUrl} alt={product.name} className="product-360-face product-360-front" />
          <img src={imageUrl} alt="" aria-hidden="true" className="product-360-face product-360-back" />
        </div>
        <div className="product-360-glint pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/20 bg-dark-950/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> ۳۶۰° استایل
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-dark-950/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {new Intl.NumberFormat('fa-IR').format(product.rating)}
        </div>
        {product.stock < 20 && product.stock > 0 && (
          <div className="absolute top-3 left-3 rounded-full bg-error-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            تنها {new Intl.NumberFormat('fa-IR').format(product.stock)} عدد
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-dark-950/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-dark-900 shadow-lg transition-transform hover:scale-110">
            <Eye className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 font-semibold text-dark-900 transition-colors group-hover:text-amber-700">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-1 text-sm text-dark-500">{product.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-amber-700">{formatPrice(product.price)}</p>
          <button
            onClick={handleAdd}
            disabled={!user}
            aria-label={added ? 'به سبد خرید اضافه شد' : `افزودن ${product.name} به سبد خرید`}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
              added ? 'bg-success-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white'
            } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {added ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
