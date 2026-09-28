import React, { useState } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  Tag,
  Sparkles,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  ArrowRight,
  Flame,
  Copy,
  Plus,
  X,
} from 'lucide-react';

interface CustomerBookingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlotToBook: (courtId: string, time: string) => void;
}

export const CustomerBookingPreviewModal: React.FC<CustomerBookingPreviewModalProps> = ({
  isOpen,
  onClose,
  onSelectSlotToBook,
}) => {
  const { courts, discounts, clubSettings, showToast } = usePadel();

  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || 'court-1');
  const [selectedTime, setSelectedTime] = useState('18:30');
  const [testPromoInput, setTestPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number; title: string } | null>(null);

  if (!isOpen) return null;

  const activeDiscounts = discounts.filter((d) => d.isActive);
  const heroDiscount = activeDiscounts.find((d) => d.highlightBanner) || activeDiscounts[0];
  const selectedCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];

  const handleTestPromo = (code: string) => {
    const target = discounts.find((d) => d.code.toUpperCase() === code.toUpperCase() && d.isActive);
    if (target) {
      setAppliedPromo({
        code: target.code,
        percent: target.value,
        title: target.title,
      });
      setTestPromoInput(target.code);
      showToast(`تم تفعيل كود الخصم: ${target.code}`, 'success');
    } else {
      showToast('كود غير صالح', 'error');
    }
  };

  const courtBasePrice = selectedCourt.peakHourlyRate;
  const discountAmount = appliedPromo ? Math.round((courtBasePrice * appliedPromo.percent) / 100) : 0;
  const finalPrice = courtBasePrice - discountAmount;

  return (
    <div id="modal-customer-preview" className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 p-5 sm:p-8 animate-in fade-in text-right">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="font-black text-white text-sm sm:text-base flex items-center gap-2">
                <span>معاينة صفحة حجز العميل (Customer Booking Experience)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                  واجهة العميل العامة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                هكذا تظهر العروض والكوبونات والملاعب التي يدخلها المدير في لوحة التحكم للاعبين.
              </p>
            </div>
          </div>

          <button
            id="btn-close-customer-preview"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            <span>العودة للإدارة</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Hero Promotional Banner (Created by Admin!) */}
        {heroDiscount ? (
          <div className="relative rounded-2xl bg-gradient-to-r from-purple-900/60 via-emerald-950/60 to-slate-900 border border-purple-500/40 p-6 overflow-hidden shadow-xl">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {heroDiscount.badgeText || 'عرض حصري 🔥'}
                  </span>
                  <span className="text-xs text-purple-300 font-bold">خصم رسمي من النادي</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{heroDiscount.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300">{heroDiscount.description}</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-purple-500/40 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-400 block">كود الخصم:</span>
                  <span className="font-mono font-black text-lg text-emerald-400 tracking-widest">
                    {heroDiscount.code}
                  </span>
                </div>
                <button
                  id="btn-copy-hero-code"
                  onClick={() => {
                    handleTestPromo(heroDiscount.code);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all"
                >
                  استخدم العرض
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-800 text-center text-xs text-slate-400">
            لا توجد عروض نشطة حالياً. يمكن للمدير إضافة عروض من قسم &quot;العروض والخصومات&quot;.
          </div>
        )}

        {/* 2. Active Coupons Slider/Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-slate-200">كوبونات وخصومات متاحة للاعبين اليوم:</span>
            <span>اضغط للتجربة الفورية</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeDiscounts.map((disc) => (
              <div
                key={disc.id}
                onClick={() => handleTestPromo(disc.code)}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{disc.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    وفر {disc.type === 'percentage' ? `%${disc.value}` : `${disc.value} ر.س`}
                  </div>
                </div>
                <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {disc.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Court Selection & Booking Simulation */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-white text-base">اختر الملعب المفضل:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {courts.map((court) => (
              <div
                key={court.id}
                onClick={() => setSelectedCourtId(court.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedCourtId === court.id
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <img
                  src={court.image}
                  alt={court.name}
                  className="w-full h-24 object-cover rounded-xl mb-2"
                />
                <div className="font-bold text-white text-xs truncate">{court.name.split('-')[0]}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{court.surface.split('(')[0]}</div>
                <div className="mt-2 text-xs font-black text-emerald-400">
                  {court.peakHourlyRate} {clubSettings.currency} / ساعة
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Checkout Simulation with Live Discount */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">الملعب المحدد:</span>
            <div className="text-base font-black text-white">{selectedCourt.name}</div>
            <div className="text-xs text-slate-400">
              سعر الساعة: <span className="line-through">{courtBasePrice} {clubSettings.currency}</span>{' '}
              {appliedPromo && (
                <span className="text-emerald-400 font-bold mr-2">
                  بعد خصم ({appliedPromo.code}): {finalPrice} {clubSettings.currency}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-book-from-customer-preview"
              onClick={() => {
                onClose();
                onSelectSlotToBook(selectedCourtId, selectedTime);
              }}
              className="px-6 py-3 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
              حجز هذا الملعب الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
