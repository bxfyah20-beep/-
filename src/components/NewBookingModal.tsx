import React, { useState, useEffect } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking, MatchType, PaymentMethod, PaymentStatus } from '../types/padel';
import { formatTimeRange } from '../utils/timeFormat';
import {
  Plus,
  Tag,
  Calendar,
  Clock,
  User,
  Phone,
  Dumbbell,
  Check,
  X,
  MessageCircle,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourtId?: string;
  defaultStartTime?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  defaultCourtId,
  defaultStartTime,
}) => {
  const {
    courts,
    discounts,
    addBooking,
    selectedDate,
    clubSettings,
    sendWhatsAppBookingConfirmation,
    sendSmsBookingConfirmation,
    showToast,
    theme,
  } = usePadel();

  const isDark = theme === 'dark';

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [courtId, setCourtId] = useState(defaultCourtId || courts[0]?.id || 'court-1');
  const [startTime, setStartTime] = useState(defaultStartTime || '17:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [addBalls, setAddBalls] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    title: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mada');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState<boolean>(true);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (defaultCourtId) setCourtId(defaultCourtId);
    if (defaultStartTime) setStartTime(defaultStartTime);
    setDate(selectedDate);
    setCreatedBooking(null);
  }, [defaultCourtId, defaultStartTime, selectedDate, isOpen]);

  if (!isOpen) return null;

  const selectedCourt = courts.find((c) => c.id === courtId) || courts[0];

  // Calculate End Time
  const calculateEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime(startTime, durationMinutes);

  // Pricing calculation
  const hourlyRate = selectedCourt?.hourlyRate || 130;
  const courtPrice = Math.round((hourlyRate * durationMinutes) / 60);
  const ballsPrice = addBalls ? 15 : 0;
  const subtotal = courtPrice + ballsPrice;
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const totalPrice = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = () => {
    const trimmed = discountCodeInput.trim().toUpperCase();
    if (!trimmed) return;

    const target = discounts.find(
      (d) => d.code.toUpperCase() === trimmed && d.isActive
    );

    if (!target) {
      showToast('كود الخصم غير صالح أو منتهي الصلاحية', 'error');
      setAppliedDiscount(null);
      return;
    }

    let calculatedDiscount = 0;
    if (target.discountType === 'percentage') {
      calculatedDiscount = Math.round((subtotal * target.discountValue) / 100);
    } else {
      calculatedDiscount = target.discountValue;
    }

    if (target.maxDiscountAmount && calculatedDiscount > target.maxDiscountAmount) {
      calculatedDiscount = target.maxDiscountAmount;
    }

    setAppliedDiscount({
      code: target.code,
      amount: calculatedDiscount,
      title: target.title,
    });
    showToast(`تم تطبيق كود الخصم "${target.code}" بنجاح!`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('يرجى تعبئة اسم اللاعب ورقم الجوال', 'error');
      return;
    }

    const saved = addBooking({
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      date,
      startTime,
      endTime,
      durationMinutes,
      status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
      paymentStatus,
      paymentMethod,
      courtPrice,
      racketRentalsCount: 0,
      racketPrice: 0,
      ballsCount: addBalls ? 1 : 0,
      ballsPrice,
      appliedDiscountCode: appliedDiscount?.code,
      discountAmount,
      totalPrice,
      matchType,
      notes: addBalls ? 'مضاف علبة كرات أصلية (+15 ر.س)' : undefined,
      createdBy: 'إدارة بادل منيفة',
    });

    if (autoNotifyWhatsApp && saved) {
      sendWhatsAppBookingConfirmation(saved);
    }

    setCreatedBooking(saved);
  };

  const handleFinish = () => {
    setCreatedBooking(null);
    onClose();
  };

  return (
    <div
      onClick={handleFinish}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto border cursor-default transition-colors ${
          isDark
            ? 'bg-[#0d1f30] border-sky-900/60 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* If booking was just created, show success with instant notification buttons */}
        {createdBooking ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black">تم تسجيل وتأكيد الحجز بنجاح!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                رقم الحجز: <span className="font-mono font-bold text-sky-500">{createdBooking.bookingCode}</span>
              </p>
            </div>

            {/* Booking Recap */}
            <div
              className={`p-4 rounded-2xl border text-xs text-right space-y-2 ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">اللاعب:</span>
                <span className="font-bold">{createdBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">الجوال:</span>
                <span className="font-mono dir-ltr">{createdBooking.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">الملعب والتوقيت:</span>
                <span className="font-bold">{createdBooking.courtName} - {formatTimeRange(createdBooking.startTime, createdBooking.endTime)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-white/10 font-bold">
                <span>المبلغ الكلي:</span>
                <span className="text-emerald-500 font-black">{createdBooking.totalPrice} ر.س</span>
              </div>
            </div>

            {/* Notification Actions */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => sendWhatsAppBookingConfirmation(createdBooking)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال واتساب للعميل</span>
                </button>

                <button
                  type="button"
                  onClick={() => sendSmsBookingConfirmation(createdBooking)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>إرسال رسالة SMS</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                إغلاق والعودة للجدول
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0073a8] dark:text-sky-400" />
                <span>تسجيل حجز جديد في بادل منيفة</span>
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Customer info */}
              <div className="space-y-2">
                <div>
                  <label className="block font-bold mb-1">اسم اللاعب *</label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل اسم اللاعب"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#0073a8]/30 transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500'
                        : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الجوال *</label>
                  <input
                    type="tel"
                    required
                    placeholder="05xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-mono dir-ltr text-right focus:outline-hidden focus:ring-2 focus:ring-[#0073a8]/30 transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500'
                        : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Court, Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">الملعب</label>
                  <select
                    value={courtId}
                    onChange={(e) => setCourtId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0073a8]/30 transition-all ${
                      isDark
                        ? 'bg-[#0d1f30] border border-white/10 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0d1f30] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">وقت البدء</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0073a8]/30 transition-all ${
                      isDark
                        ? 'bg-[#0d1f30] border border-white/10 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="17:00" className="bg-[#0d1f30] text-white">5:00 م</option>
                    <option value="18:30" className="bg-[#0d1f30] text-white">6:30 م</option>
                    <option value="20:00" className="bg-[#0d1f30] text-white">8:00 م</option>
                    <option value="21:30" className="bg-[#0d1f30] text-white">9:30 م</option>
                    <option value="23:00" className="bg-[#0d1f30] text-white">11:00 م</option>
                    <option value="00:30" className="bg-[#0d1f30] text-white">12:30 ص</option>
                    <option value="02:00" className="bg-[#0d1f30] text-white">2:00 ص</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0073a8]/30 transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">المدة</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setDurationMinutes(60)}
                      className={`py-1.5 rounded-lg font-bold text-center transition-all ${
                        durationMinutes === 60
                          ? 'bg-[#0073a8] text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      60 دقيقة
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationMinutes(90)}
                      className={`py-1.5 rounded-lg font-bold text-center transition-all ${
                        durationMinutes === 90
                          ? 'bg-[#0073a8] text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      90 دقيقة
                    </button>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-bold">علبة كرات بادل أصلية جديدة</span>
                      <span className="text-slate-400 block text-[10px]">علبة مختومة 3 كرات</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-500">+15 ر.س</span>
                    <input
                      type="checkbox"
                      checked={addBalls}
                      onChange={(e) => setAddBalls(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0073a8]"
                    />
                  </div>
                </label>
              </div>

              {/* Discount Code */}
              <div className="space-y-1">
                <label className="block font-bold">كود الخصم أو العرض</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثال: MANIFA20"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    className={`flex-1 rounded-xl px-3 py-2 font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-[#0073a8]/30 transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500'
                        : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="px-4 py-2 rounded-xl bg-sky-500/15 text-[#0073a8] dark:text-sky-300 border border-sky-500/30 font-bold hover:bg-sky-500/25 transition-colors"
                  >
                    تطبيق
                  </button>
                </div>
                {appliedDiscount && (
                  <p className="text-[11px] text-emerald-500 font-bold">
                    ✓ تم خصم {appliedDiscount.amount} ر.س ({appliedDiscount.title})
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block font-bold">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mada', 'apple_pay', 'cash'] as PaymentMethod[]).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        paymentMethod === pm
                          ? 'border-[#0073a8] bg-sky-500/15 text-[#0073a8] dark:text-sky-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {pm === 'mada' ? 'مدى 💳' : pm === 'apple_pay' ? 'Apple Pay ' : 'نقداً 💵'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic WhatsApp confirmation toggle */}
              <div
                className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoNotifyWhatsApp}
                    onChange={(e) => setAutoNotifyWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>إرسال تذكرة التأكيد فوراً عبر واتساب للعميل</span>
                  </div>
                </label>
              </div>

              {/* Total Box */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="font-black text-sm">المجموع الكلي:</span>
                <span className="text-xl font-black text-emerald-500 font-mono">
                  {totalPrice} ر.س
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0073a8] hover:bg-[#005f8a] text-white font-bold shadow-xs active:scale-95 transition-all"
                >
                  تأكيد وحفظ الحجز
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
