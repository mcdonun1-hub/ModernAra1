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
            className={`pointer-events-auto group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-300 hover:scale-[1.04] ${scrolled
              ? 'bg-white/55 text-dark-900 shadow-[0_10px_35px_rgba(28,25,20,0.12)] backdrop-blur-md'
              : 'bg-dark-950/10 text-white shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur-sm'
            }`}
          >
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1.1rem] bg-gradient-to-br from-amber-200 via-orange-500 to-amber-800 shadow-[0_8px_24px_rgba(217,119,6,0.45)] ring-1 ring-white/45 transition-transform duration-300 group-hover:rotate-3">
              <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/25 blur-md" />
              <Store className="relative h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-xl font-black tracking-tight drop-shadow-sm sm:text-2xl">
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
