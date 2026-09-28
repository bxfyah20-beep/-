import React, { useState, useEffect } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking, BookingStatus, MatchType, PaymentMethod, PaymentStatus } from '../types/padel';
import { formatArabicTime } from '../utils/timeFormat';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Edit3,
  AlertTriangle,
  Check,
  X,
  XCircle,
  RefreshCw,
  Dumbbell,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { CancelBookingModal } from './CancelBookingModal';

interface EditBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  const {
    courts,
    bookings,
    updateBooking,
    cancelBooking,
    clubSettings,
    showToast,
    theme,
  } = usePadel();

  const isDark = theme === 'dark';

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mada');
  const [ballsCount, setBallsCount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(190);
  const [notes, setNotes] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // When booking changes, populate fields
  useEffect(() => {
    if (booking) {
      setCustomerName(booking.customerName || '');
      setCustomerPhone(booking.customerPhone || '');
      setCourtId(booking.courtId || courts[0]?.id || 'court-1');
      setDate(booking.date || '');
      setStartTime(booking.startTime || '17:00');
      setDurationMinutes(booking.durationMinutes || 90);
      setStatus(booking.status || 'confirmed');
      setPaymentStatus(booking.paymentStatus || 'paid');
      setPaymentMethod(booking.paymentMethod || 'mada');
      setBallsCount(booking.ballsCount || 0);
      setTotalPrice(booking.totalPrice || 190);
      setNotes(booking.notes || '');
    }
  }, [booking, courts]);

  // Support closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  // Selected court object
  const selectedCourt = courts.find((c) => c.id === courtId) || courts[0] || {
    id: courtId,
    name: booking.courtName,
  };

  // Calculate End Time
  const calculateEndTime = (start: string, duration: number) => {
    try {
      const [h, m] = start.split(':').map(Number);
      const totalMin = h * 60 + (m || 0) + duration;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return start;
    }
  };

  const calculatedEndTime = calculateEndTime(startTime, durationMinutes);

  // Check for conflicts with other active bookings
  const conflictingBooking = bookings.find(
    (b) =>
      b.id !== booking.id &&
      b.courtId === courtId &&
      b.date === date &&
      b.status !== 'cancelled' &&
      b.startTime === startTime
  );

  // Time slot options
  const timeSlots = [
    { time: '17:00', label: '5:00 م' },
    { time: '17:30', label: '5:30 م' },
    { time: '18:00', label: '6:00 م' },
    { time: '18:30', label: '6:30 م' },
    { time: '19:00', label: '7:00 م' },
    { time: '19:30', label: '7:30 م' },
    { time: '20:00', label: '8:00 م' },
    { time: '20:30', label: '8:30 م' },
    { time: '21:00', label: '9:00 م' },
    { time: '21:30', label: '9:30 م' },
    { time: '22:00', label: '10:00 م' },
    { time: '22:30', label: '10:30 م' },
    { time: '23:00', label: '11:00 م' },
    { time: '23:30', label: '11:30 م' },
    { time: '00:00', label: '12:00 ص' },
    { time: '00:30', label: '12:30 ص' },
    { time: '01:00', label: '1:00 ص' },
    { time: '01:30', label: '1:30 ص' },
    { time: '02:00', label: '2:00 ص' },
    { time: '02:30', label: '2:30 ص' },
  ];

  // Auto Recalculate price helper
  const handleRecalculatePrice = () => {
    const durationPricing: Record<number, number> = {
      60: 140,
      90: 190,
      120: 240,
    };
    const courtBase = durationPricing[durationMinutes] || 190;
    const ballsTotal = (ballsCount || 0) * 15;
    const finalPrice = courtBase + ballsTotal - (booking.discountAmount || 0);
    setTotalPrice(Math.max(0, finalPrice));
    showToast('تمت إعادة احتساب السعر تلقائياً بناءً على الوقت والمعدات', 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('يرجى إدخال اسم اللاعب ورقم الجوال', 'error');
      return;
    }

    const durationPricing: Record<number, number> = {
      60: 140,
      90: 190,
      120: 240,
    };
    const courtPrice = durationPricing[durationMinutes] || 190;

    updateBooking(booking.id, {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      date,
      startTime,
      endTime: calculatedEndTime,
      durationMinutes,
      status,
      paymentStatus,
      paymentMethod,
      courtPrice,
      ballsCount,
      ballsPrice: ballsCount * 15,
      totalPrice: Number(totalPrice),
      notes: notes.trim(),
    });

    onClose();
  };

  const handleQuickCancel = () => {
    setIsCancelModalOpen(true);
  };

  return (
    <div
      id="modal-edit-booking"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-6 max-h-[94vh] overflow-y-auto border animate-in fade-in zoom-in-95 cursor-default transition-colors ${
          isDark
            ? 'bg-[#0d1f30] border-sky-900/60 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-[#0073a8] dark:text-sky-300 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base">
                  تعديل حجز اللاعب
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/15 text-[#0073a8] dark:text-sky-300 border border-sky-500/30">
                  {booking.bookingCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يمكنك تغيير التوقيت، اليوم، الملعب، والبيانات بكل سهولة
              </p>
            </div>
          </div>

          <button
            id="btn-close-edit-booking-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict Warning Banner if another booking exists */}
        {conflictingBooking && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                تنبيه تعارض توقيت:
              </span>
              <span>
                الملعب المحدد ({selectedCourt.name}) يحتوي بالفعل على حجز آخر في نفس الساعة ({formatArabicTime(startTime)}) للاعب:{' '}
                <strong className="underline">{conflictingBooking.customerName}</strong> ({conflictingBooking.bookingCode}).
                بصفتك مديراً يمكنك حفظ التعديل أو اختيار ساعة/ملعب آخر.
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Section 1: Customer info */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5">
            <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0073a8] dark:text-sky-400" />
              <span>بيانات اللاعب والتواصل</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold mb-1">اسم اللاعب *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اسم اللاعب"
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-black/20 border-white/15 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">رقم الجوال *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-black/20 border-white/15 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Court, Date & Time Modification (User's primary request) */}
          <div className="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3">
            <div className="text-[11px] font-black text-[#0073a8] dark:text-sky-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>تعديل التوقيت والملعب واليوم ⏱️</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                (نقل الحجز من ساعة لأخرى)
              </span>
            </div>

            {/* Court & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold mb-1">الملعب</label>
                <select
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0d1f30] border-white/20 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'panoramic' ? 'بانورامي' : c.surface})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">تاريخ الحجز (اليوم)</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0d1f30] border-white/20 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                />
              </div>
            </div>

            {/* Start Time Select (e.g. modify from 7:00 to 8:00) */}
            <div className="space-y-1.5">
              <label className="block font-bold">
                وقت بدء الحجز (الساعة) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
                {timeSlots.map((slot) => {
                  const isSelected = startTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setStartTime(slot.time)}
                      className={`p-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-[#0073a8] text-white shadow-xs'
                          : isDark
                          ? 'text-slate-300 hover:bg-white/10'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>

              {/* Direct Time Selection Feedback */}
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                <span>
                  الوقت المحدد حالياً:{' '}
                  <strong className="text-[#0073a8] dark:text-sky-300 font-mono text-xs">
                    {formatArabicTime(startTime)}
                  </strong>
                </span>
                <span>
                  وقت الانتهاء المحسوب:{' '}
                  <strong className="text-emerald-500 font-mono text-xs">
                    {formatArabicTime(calculatedEndTime)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block font-bold mb-1">مدة الحجز</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 60, label: '60 دقيقة (ساعة)' },
                  { min: 90, label: '90 دقيقة (ساعة ونصف)' },
                  { min: 120, label: '120 دقيقة (ساعتان)' },
                ].map((d) => (
                  <button
                    key={d.min}
                    type="button"
                    onClick={() => setDurationMinutes(d.min)}
                    className={`py-2 px-1 rounded-xl border text-center font-bold transition-all text-[11px] ${
                      durationMinutes === d.min
                        ? 'border-2 border-[#0073a8] text-[#0073a8] dark:text-sky-300 bg-sky-50 dark:bg-sky-500/20'
                        : isDark
                        ? 'border-white/10 text-slate-300 bg-black/20 hover:bg-white/5'
                        : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Status & Payment */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5">
            <div className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              حالة الحجز والسداد
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold mb-1">حالة الحجز</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className={`w-full rounded-xl px-2.5 py-2 text-xs font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0d1f30] border-white/20 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                >
                  <option value="confirmed">مؤكد ✓</option>
                  <option value="pending">بانتظار السداد ⏳</option>
                  <option value="completed">مكتمل 🏁</option>
                  <option value="cancelled">ملغي ✕</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">حالة الدفع</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className={`w-full rounded-xl px-2.5 py-2 text-xs font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0d1f30] border-white/20 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                >
                  <option value="paid">مدفوع بالكامل</option>
                  <option value="unpaid">غير مدفوع (عند الحضور)</option>
                  <option value="partial">دفعة جزئية (عربون)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className={`w-full rounded-xl px-2.5 py-2 text-xs font-bold border focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0d1f30] border-white/20 text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
                  }`}
                >
                  <option value="mada">مدى</option>
                  <option value="apple_pay">Apple Pay</option>
                  <option value="cash">نقداً (كاش)</option>
                  <option value="visa_master">فيزا / ماستركارد</option>
                  <option value="transfer">تحويل بنكي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Equipment & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-xs">
                <input
                  type="checkbox"
                  checked={ballsCount > 0}
                  onChange={(e) => {
                    const count = e.target.checked ? 1 : 0;
                    setBallsCount(count);
                  }}
                  className="w-4 h-4 rounded text-[#0073a8] focus:ring-0"
                />
                <span>إضافة علبة كرات بادل جديدة (+15 ر.س)</span>
              </label>
            </div>

            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-2">
              <div>
                <label className="block font-bold text-[11px] mb-0.5">المبلغ الإجمالي (ر.س)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    className={`w-24 rounded-xl px-2.5 py-1 text-xs font-black border focus:outline-none ${
                      isDark
                        ? 'bg-black/30 border-white/20 text-emerald-400'
                        : 'bg-white border-slate-200 text-emerald-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleRecalculatePrice}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#0073a8] transition-colors"
                    title="إعادة الاحتساب التلقائي"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div>
            <label className="block font-bold mb-1 text-[11px]">ملاحظات إضافية على الحجز</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم التعديل هاتفياً مع الكابتن / طلب مضارب إضافية"
              className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-black/20 border-white/15 text-white focus:border-sky-400'
                  : 'bg-white border-slate-200 text-slate-900 focus:border-[#0073a8]'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                id="btn-save-booking-edits"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات ✓</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleQuickCancel}
                className="px-3.5 py-2.5 rounded-xl text-rose-600 hover:text-white dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="إلغاء الحجز"
              >
                <XCircle className="w-4 h-4" />
                <span>إلغاء الحجز</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cancellation with Reason and WhatsApp notice Modal */}
      <CancelBookingModal
        booking={booking}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          setIsCancelModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
