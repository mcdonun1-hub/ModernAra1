import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import BackgroundDecor from './components/BackgroundDecor';
import FloatingSearch from './components/FloatingSearch';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Blog from './pages/Blog';
import BlogPostPage from './pages/BlogPostPage';
import Account from './pages/Account';

type View =
  | { name: 'home' }
  | { name: 'shop'; category?: string }
  | { name: 'product'; slug: string }
  | { name: 'blog' }
  | { name: 'blog-post'; slug: string }
  | { name: 'account' };

function AppContent() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleNavigate = (name: string, param?: string) => {
    if (name === 'home') setView({ name: 'home' });
    else if (name === 'shop') setView({ name: 'shop', category: param });
    else if (name === 'product') setView({ name: 'product', slug: param || '' });
    else if (name === 'blog') setView({ name: 'blog' });
    else if (name === 'blog-post') setView({ name: 'blog-post', slug: param || '' });
    else if (name === 'account') setView({ name: 'account' });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const isHome = view.name === 'home';

  return (
    <div className="relative min-h-screen flex flex-col">
      <BackgroundDecor />

      <Header />

      <main className="flex-1">
        {view.name === 'home' && <Home onNavigate={handleNavigate} />}
        {view.name === 'shop' && <Shop onNavigate={handleNavigate} initialCategory={view.category} />}
        {view.name === 'product' && (
          <ProductDetail slug={view.slug} onNavigate={handleNavigate} onOpenAuth={() => setAuthOpen(true)} />
        )}
        {view.name === 'blog' && <Blog onNavigate={handleNavigate} />}
        {view.name === 'blog-post' && <BlogPostPage slug={view.slug} onNavigate={handleNavigate} />}
        {view.name === 'account' && <Account onNavigate={handleNavigate} />}
      </main>

      {isHome && <Footer onNavigate={handleNavigate} />}
      {!isHome && <Footer onNavigate={handleNavigate} />}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      <ChatWidget />
      <ScrollToTop />
      {isHome && <FloatingSearch onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
