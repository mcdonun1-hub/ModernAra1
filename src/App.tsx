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
import AdminLogin from './pages/AdminLogin';
import PaymentCallback from './pages/PaymentCallback';
import Invoice from './pages/Invoice';

type View =
  | { name: 'home' }
  | { name: 'shop'; category?: string }
  | { name: 'product'; slug: string }
  | { name: 'blog' }
  | { name: 'blog-post'; slug: string }
  | { name: 'account' }
  | { name: 'admin' }
  | { name: 'admin-login' }
  | { name: 'payment-callback' }
  | { name: 'invoice'; orderId: string };

function initialView(): View {
  if (window.location.hash === '#admin') return { name: 'admin' };
  if (window.location.hash === '#backoffice-login') return { name: 'admin-login' };
  if (new URLSearchParams(window.location.search).get('payment') === 'zarinpal') return { name: 'payment-callback' };
  if (window.location.hash.startsWith('#invoice/')) return { name: 'invoice', orderId: decodeURIComponent(window.location.hash.slice('#invoice/'.length)) };
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
    else if (name === 'admin-login') {
      window.history.replaceState(null, '', `${window.location.pathname}#backoffice-login`);
      setView({ name: 'admin-login' });
    }
    else if (name === 'invoice') {
      const invoiceId = encodeURIComponent(param || '');
      window.history.replaceState(null, '', `${window.location.pathname}#invoice/${invoiceId}`);
      setView({ name: 'invoice', orderId: param || '' });
    }

    if (name !== 'admin' && name !== 'admin-login' && name !== 'invoice') window.history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') setView({ name: 'admin' });
      else if (window.location.hash === '#backoffice-login') setView({ name: 'admin-login' });
      else if (window.location.hash.startsWith('#invoice/')) setView({ name: 'invoice', orderId: decodeURIComponent(window.location.hash.slice('#invoice/'.length)) });
    };
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('modara:open-cart', handleOpenCart);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('modara:open-cart', handleOpenCart);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const isHome = view.name === 'home';
  const isPaymentCallback = view.name === 'payment-callback';
  const isAdminLogin = view.name === 'admin-login';
  const isInvoice = view.name === 'invoice';
  const isUtilityPage = isPaymentCallback || isAdminLogin || isInvoice;

  return (
    <div className="relative min-h-screen flex flex-col">
      {!isPaymentCallback && <BackgroundDecor />}
      {!isUtilityPage && <Header onNavigate={handleNavigate} />}

      <main className="flex-1">
        {view.name === 'home' && <Home onNavigate={handleNavigate} />}
        {view.name === 'shop' && <Shop onNavigate={handleNavigate} initialCategory={view.category} />}
        {view.name === 'product' && (
          <ProductDetail slug={view.slug} onNavigate={handleNavigate} onOpenAuth={() => setAuthOpen(true)} />
        )}
        {view.name === 'blog' && <Blog onNavigate={handleNavigate} />}
        {view.name === 'blog-post' && <BlogPostPage slug={view.slug} onNavigate={handleNavigate} />}
        {view.name === 'account' && <Account onNavigate={handleNavigate} />}
        {view.name === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}
        {view.name === 'admin' && <AdminPanel onNavigate={handleNavigate} onOpenAuth={() => handleNavigate('admin-login')} />}
        {view.name === 'payment-callback' && <PaymentCallback onNavigate={handleNavigate} />}
        {view.name === 'invoice' && <Invoice orderId={view.orderId} onNavigate={handleNavigate} />}
      </main>

      {!isUtilityPage && <Footer onNavigate={handleNavigate} />}

      {!isUtilityPage && <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />}

      {!isUtilityPage && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}
      {!isUtilityPage && <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onOpenInvoice={(id) => handleNavigate('invoice', id)} />}
      {!isUtilityPage && <ChatWidget />}
      {!isUtilityPage && <ScrollToTop />}
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
