import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Clock3, Gem, Glasses, ShoppingBag, Sparkles } from 'lucide-react';
import { asset } from '../lib/format';

type HeroSliderProps = {
  onNavigate: (view: string, param?: string) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function HeroSlider({ onNavigate }: HeroSliderProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  const syncToScroll = useCallback(() => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);

    frameRef.current = window.requestAnimationFrame(() => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollDistance, 0, 1);
      progressRef.current = progress;
      setScrollProgress(progress);

      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const targetTime = progress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.04) {
          video.currentTime = targetTime;
        }
      }
    });
  }, []);

  useEffect(() => {
    syncToScroll();
    window.addEventListener('scroll', syncToScroll, { passive: true });
    window.addEventListener('resize', syncToScroll);

    return () => {
      window.removeEventListener('scroll', syncToScroll);
      window.removeEventListener('resize', syncToScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [syncToScroll]);

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = progressRef.current * video.duration;
    setVideoReady(true);
  };

  const progressPercent = Math.round(scrollProgress * 100);
  const contentShift = scrollProgress * -28;
  const detailOpacity = clamp(0.35 + scrollProgress * 0.65, 0, 1);

  return (
    <section ref={sectionRef} className="relative h-[220vh] min-h-[1420px] w-full bg-dark-950" aria-label="کمپین ویدئویی کالکشن جدید مُدارا">
      <div className="sticky top-0 h-screen min-h-[620px] w-full overflow-hidden bg-dark-950">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={asset('/images/hero-fashion-poster.png')}
          muted
          playsInline
          preload="auto"
          aria-label="ویدئوی تبلیغاتی کالکشن جدید مُدارا"
          onLoadedMetadata={handleVideoMetadata}
        >
          <source src={asset('/videos/hero-fashion-placeholder.mp4')} type="video/mp4" />
          مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
        </video>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,158,11,0.22),transparent_32%),linear-gradient(100deg,rgba(10,10,12,0.2),rgba(10,10,12,0.88))]" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-dark-950/35" />
        <div className="absolute inset-0 opacity-60 mix-blend-screen" style={{ background: 'linear-gradient(115deg, transparent 24%, rgba(245,158,11,0.13) 48%, transparent 72%)' }} />

        <div className="absolute inset-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" dir="rtl">
          <div
            className="flex h-full max-w-2xl items-center pb-20 pt-24 transition-transform duration-100"
            style={{ transform: `translate3d(0, ${contentShift}px, 0)` }}
          >
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/25 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-amber-300" />
                کمپین ویدئویی کالکشن پاییز
              </div>

              <p className="mb-3 text-sm font-semibold tracking-[0.24em] text-amber-300/90">MODARA / AUTUMN EDIT</p>
              <h1 className="text-5xl font-bold leading-[1.08] text-white sm:text-6xl lg:text-7xl text-balance">
                استایل شما
                <br />
                <span className="bg-gradient-to-l from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">بیان شخصیت شماست</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
                از ساعت طلایی تا کیف چرمی و پوشاک مشکی؛ جزئیات درست، استایل شما را کامل می‌کند.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('shop')}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-dark-900 shadow-2xl shadow-black/20 transition-all hover:bg-amber-50 active:scale-95"
                >
                  مشاهده کالکشن
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </button>
                <button
                  onClick={() => onNavigate('blog')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                >
                  راهنمای استایل
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/75">
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-md">ساختار مینیمال</span>
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-md">جزئیات طلایی</span>
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-md">استایل شهری</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-28 left-4 right-4 hidden items-end justify-between gap-4 md:flex lg:left-8 lg:right-8">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white/80 backdrop-blur-md" style={{ opacity: detailOpacity }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><Clock3 className="h-5 w-5" /></div>
              <div><p className="text-xs text-white/50">جزئیات کمپین</p><p className="font-semibold">ساعت / اکسسوری</p></div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 text-xs text-white/55">
                <span>{videoReady ? 'ویدئو آماده است' : 'نسخه نمایشی کمپین'}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-white/85"><Glasses className="h-4 w-4 text-amber-300" /> اکسسوری</div>
                <div className="h-5 w-px bg-white/15" />
                <div className="flex items-center gap-2 text-white/85"><ShoppingBag className="h-4 w-4 text-amber-300" /> کیف چرمی</div>
                <div className="h-5 w-px bg-white/15" />
                <div className="flex items-center gap-2 text-white/85"><Gem className="h-4 w-4 text-amber-300" /> جزئیات</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/65">
          <span className="text-[10px] uppercase tracking-[0.32em]">اسکرول کنید</span>
          <ChevronDown className="h-5 w-5 animate-bounce text-amber-300" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
          <div className="h-full bg-gradient-to-l from-amber-300 via-orange-500 to-transparent transition-[width] duration-100" style={{ width: `${Math.max(progressPercent, 3)}%` }} />
        </div>
        <div className="absolute bottom-6 left-4 z-20 font-mono text-xs text-white/45 sm:left-8">{String(progressPercent).padStart(2, '0')} / 100</div>
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-dark-50 to-transparent" />
      </div>
    </section>
  );
}
