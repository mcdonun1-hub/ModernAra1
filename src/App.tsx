import { useEffect, useState } from 'react';
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
import AdminPanel from './pages/AdminPanel';
import PaymentCallback from './pages/PaymentCallback';

type View =
  | { name: 'home' }
  | { name: 'shop'; category?: string }
  | { name: 'product'; slug: string }
  | { name: 'blog' }
  | { name: 'blog-post'; slug: string }
  | { name: 'account' }
  | { name: 'admin' }
  | { name: 'payment-callback' };

function initialView(): View {
  if (window.location.hash === '#admin') return { name: 'admin' };
  if (new URLSearchParams(window.location.search).get('payment') === 'zarinpal') return { name: 'payment-callback' };
  return { name: 'home' };
}

function AppContent() {
  const [view, setView] = useState<View>(initialView);
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
    else if (name === 'admin') {
      window.history.replaceState(null, '', `${window.location.pathname}#admin`);
      setView({ name: 'admin' });
    }

    if (name !== 'admin') window.history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') setView({ name: 'admin' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const isHome = view.name === 'home';
  const isPaymentCallback = view.name === 'payment-callback';

  return (
    <div className="relative min-h-screen flex flex-col">
      {!isPaymentCallback && <BackgroundDecor />}
      {!isPaymentCallback && <Header />}

      <main className="flex-1">
        {view.name === 'home' && <Home onNavigate={handleNavigate} />}
        {view.name === 'shop' && <Shop onNavigate={handleNavigate} initialCategory={view.category} />}
        {view.name === 'product' && (
          <ProductDetail slug={view.slug} onNavigate={handleNavigate} onOpenAuth={() => setAuthOpen(true)} />
        )}
        {view.name === 'blog' && <Blog onNavigate={handleNavigate} />}
        {view.name === 'blog-post' && <BlogPostPage slug={view.slug} onNavigate={handleNavigate} />}
        {view.name === 'account' && <Account onNavigate={handleNavigate} />}
        {view.name === 'admin' && <AdminPanel onNavigate={handleNavigate} onOpenAuth={() => setAuthOpen(true)} />}
        {view.name === 'payment-callback' && <PaymentCallback onNavigate={handleNavigate} />}
      </main>

      {!isPaymentCallback && <Footer onNavigate={handleNavigate} />}

      {!isPaymentCallback && <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />}

      {!isPaymentCallback && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}
      {!isPaymentCallback && <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />}
      {!isPaymentCallback && <ChatWidget />}
      {!isPaymentCallback && <ScrollToTop />}
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
