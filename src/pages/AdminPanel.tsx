import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle, Clock3, LogIn, Package, RefreshCw, Search, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { isDemoMode, supabase, type Order, type OrderItem } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { asset, formatDateTime, formatPrice } from '../lib/format';

type AdminPanelProps = {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
};

type StatusMeta = {
  label: string;
  color: string;
  icon: typeof Clock3;
};

const statusConfig: Record<string, StatusMeta> = {
  pending: { label: 'در انتظار پرداخت', color: 'bg-warning-50 text-warning-700', icon: Clock3 },
  paid: { label: 'پرداخت شده', color: 'bg-success-50 text-success-700', icon: CheckCircle },
  shipped: { label: 'ارسال شده', color: 'bg-amber-50 text-amber-700', icon: Truck },
  delivered: { label: 'تحویل داده شده', color: 'bg-success-50 text-success-700', icon: CheckCircle },
  cancelled: { label: 'لغو شده', color: 'bg-error-50 text-error-700', icon: XCircle },
};

const statusOptions = Object.entries(statusConfig).map(([value, meta]) => ({ value, label: meta.label }));

export default function AdminPanel({ onNavigate, onOpenAuth }: AdminPanelProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Demo mode is intentionally previewable for a signed-in demo user. In production,
  // access is restricted to users with app_metadata.role === 'admin' and matching RLS.
  const isAdmin = Boolean(user) && (isDemoMode || user?.app_metadata?.role === 'admin');

  const loadOrders = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    const { data, error: queryError } = await supabase
      .from('orders')
      .select('*, order_items:order_items(*, product:products(*))')
      .order('created_at', { ascending: false });

    if (queryError) setError(queryError.message);
    setOrders((data as unknown as Order[]) || []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const haystack = [order.id, order.address, order.phone].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    paid: orders.filter((order) => order.status === 'paid').length,
    revenue: orders.filter((order) => ['paid', 'shipped', 'delivered'].includes(order.status)).reduce((sum, order) => sum + Number(order.total || 0), 0),
  }), [orders]);

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateStatus = async (order: Order, status: string) => {
    if (status === order.status) return;
    setUpdatingId(order.id);
    setError(null);
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (updateError) setError(updateError.message);
    else setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item));
    setUpdatingId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-50 pt-24" dir="rtl">
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <LogIn className="mx-auto mb-4 h-14 w-14 text-amber-500" />
          <h1 className="mb-2 text-2xl font-bold text-dark-900">ورود مدیر مورد نیاز است</h1>
          <p className="mb-6 text-dark-500">برای مشاهده پنل مدیریت ابتدا وارد حساب کاربری خود شوید.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={onOpenAuth} className="btn-primary">ورود مدیر</button>
            <button onClick={() => onNavigate('home')} className="btn-ghost">بازگشت به فروشگاه</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-50 pt-24" dir="rtl">
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto mb-4 h-14 w-14 text-error-500" />
          <h1 className="mb-2 text-2xl font-bold text-dark-900">دسترسی غیرمجاز</h1>
          <p className="mb-6 text-dark-500">این صفحه فقط برای مدیرانی فعال است که نقش آن‌ها در `app_metadata.role` روی `admin` تنظیم شده باشد.</p>
          <button onClick={() => onNavigate('home')} className="btn-primary">بازگشت به فروشگاه</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 pt-24" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <ShieldCheck className="h-4 w-4" /> پنل مدیریت
            </div>
            <h1 className="text-3xl font-bold text-dark-900">مدیریت سفارش‌ها</h1>
            <p className="mt-1 text-sm text-dark-500">پیگیری سفارش‌ها و به‌روزرسانی وضعیت ارسال</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('home')} className="btn-ghost px-4 py-2 text-sm">
              <ArrowRight className="h-4 w-4" /> فروشگاه
            </button>
            <button onClick={refresh} disabled={refreshing} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> بروزرسانی
            </button>
          </div>
        </div>

        {isDemoMode && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            این پنل در حالت دمو فعال است. در محیط production، نقش مدیر و سیاست‌های RLS پایگاه‌داده تعیین‌کننده دسترسی هستند.
          </div>
        )}

        {error && <div className="mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">خطا: {error}</div>}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="کل سفارش‌ها" value={new Intl.NumberFormat('fa-IR').format(stats.total)} icon={Package} />
          <StatCard label="در انتظار پرداخت" value={new Intl.NumberFormat('fa-IR').format(stats.pending)} icon={Clock3} />
          <StatCard label="پرداخت شده" value={new Intl.NumberFormat('fa-IR').format(stats.paid)} icon={CheckCircle} />
          <StatCard label="درآمد ثبت‌شده" value={formatPrice(stats.revenue)} icon={ShieldCheck} />
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-dark-100 bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pr-11" placeholder="جستجو با کد سفارش، تلفن یا آدرس..." />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field cursor-pointer sm:w-56">
            <option value="all">همه وضعیت‌ها</option>
            {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="card h-48 shimmer-bg" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="card p-14 text-center">
            <Package className="mx-auto mb-4 h-14 w-14 text-dark-300" />
            <p className="font-medium text-dark-700">سفارشی با این فیلتر پیدا نشد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const meta = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = meta.icon;
              return (
                <article key={order.id} className="card overflow-hidden p-5">
                  <div className="flex flex-col gap-4 border-b border-dark-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-dark-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}><StatusIcon className="h-3.5 w-3.5" />{meta.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-dark-500">{formatDateTime(order.created_at)} · {order.phone || 'بدون تلفن'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-dark-500">تغییر وضعیت</span>
                      <select value={order.status} disabled={updatingId === order.id} onChange={(event) => updateStatus(order, event.target.value)} className="rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm disabled:opacity-60">
                        {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="my-4 space-y-2">
                    {order.order_items?.map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl bg-dark-50 p-3">
                        <img src={asset(item.product?.image_url)} alt={item.product?.name || ''} className="h-12 w-12 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-dark-900">{item.product?.name || 'محصول حذف‌شده'}</p>
                          <p className="text-xs text-dark-500">{new Intl.NumberFormat('fa-IR').format(item.quantity)} عدد × {formatPrice(item.price)}</p>
                        </div>
                        <span className="text-sm font-bold text-dark-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 border-t border-dark-100 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-dark-500">آدرس: {order.address || 'ثبت نشده'}</p>
                    <p className="font-bold text-amber-700">مجموع: {formatPrice(order.total)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Package }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Icon className="h-5 w-5" /></div>
      <p className="text-xs text-dark-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold text-dark-900">{value}</p>
    </div>
  );
}
