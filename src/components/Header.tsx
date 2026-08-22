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
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-center">
          <button
            type="button"
            aria-label="بازگشت به صفحه اصلی مُدارا"
            onClick={() => onNavigate('home')}
            className={`pointer-events-auto group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl border px-3 py-2 transition-all duration-300 hover:scale-[1.03] ${scrolled
              ? 'border-dark-200/80 bg-white/90 text-dark-900 shadow-lg shadow-dark-900/10 backdrop-blur-xl'
              : 'border-white/20 bg-dark-950/35 text-white shadow-2xl shadow-black/20 backdrop-blur-xl'
            }`}
          >
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 via-orange-500 to-amber-700 shadow-lg shadow-amber-600/35 ring-1 ring-white/35 transition-transform duration-300 group-hover:rotate-3">
              <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/25 blur-md" />
              <Store className="relative h-5 w-5 text-white drop-shadow" strokeWidth={2.2} />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-lg font-black tracking-tight sm:text-xl">
                مُدا<span className="bg-gradient-to-l from-amber-500 to-orange-500 bg-clip-text text-transparent">را</span>
              </span>
              <span className={`mt-1 text-[8px] font-bold uppercase tracking-[0.34em] ${scrolled ? 'text-dark-400' : 'text-white/60'}`}>MODARA</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
