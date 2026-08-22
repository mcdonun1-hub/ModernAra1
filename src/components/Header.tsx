import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

type HeaderProps = {
  onNavigate: (view: string, param?: string) => void;
};

export default function Header({ onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            aria-label="بازگشت به صفحه اصلی مُدارا"
            onClick={() => onNavigate('home')}
            className={`pointer-events-auto group flex items-center gap-2 rounded-xl px-1 py-1 transition-transform hover:scale-[1.02] ${scrolled ? 'text-dark-900' : 'text-white'}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-600/30 transition-transform group-hover:rotate-3">
              <Store className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-bold drop-shadow-sm">
              مُدا<span className="bg-gradient-to-l from-amber-500 to-orange-500 bg-clip-text text-transparent">را</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
