import { Star, ShoppingCart, Eye } from 'lucide-react';
import type { Product } from '../lib/supabase';
import { formatPrice, asset } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

type ProductCardProps = {
  product: Product;
  onView: (slug: string) => void;
};

export default function ProductCard({ product, onView }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await addToCart(product.id);
    window.dispatchEvent(new CustomEvent('modara:open-cart'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onView(product.slug)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dark-100 bg-white shadow-sm transition-all hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-dark-50">
        <img
          src={asset(product.image_url)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-dark-950/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {new Intl.NumberFormat('fa-IR').format(product.rating)}
        </div>
        {product.stock < 20 && product.stock > 0 && (
          <div className="absolute top-3 left-3 rounded-full bg-error-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            تنها {new Intl.NumberFormat('fa-IR').format(product.stock)} عدد
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-dark-950/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-dark-900 shadow-lg transition-transform hover:scale-110">
            <Eye className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-dark-900 line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-dark-500 line-clamp-1 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-amber-700">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={!user}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
              added
                ? 'bg-success-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
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
