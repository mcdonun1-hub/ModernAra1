import { useState, useEffect } from 'react';
import { Store } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-lg shadow-dark-900/5'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-center">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-600/30">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${scrolled ? 'text-dark-900' : 'text-white'}`}>
              مُدا<span className="bg-gradient-to-l from-amber-500 to-orange-500 bg-clip-text text-transparent">را</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
