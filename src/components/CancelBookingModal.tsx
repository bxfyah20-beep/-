import React, { useState } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking } from '../types/padel';
import { formatTimeRange } from '../utils/timeFormat';
import {
  AlertTriangle,
  X,
  MessageCircle,
  Clock,
  Calendar,
  User,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CancelBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CANCELLATION_REASONS = [
  'طلب من العميل',
  'إعادة جدولة وتغيير الموعد',
  'ظروف طارئة أو صيانة للملعب',
  'سوء الأحوال الجوية',
  'عدم حضور العميل في الموعد',
  'أخرى',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { theme, cancelBookingWithReason, clubSettings } = usePadel();
  const isDark = theme === 'dark';

  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !booking) return null;

  const formattedBookingTime = formatTimeRange(booking.startTime, booking.endTime);

  const previewMessage = `مرحباً كابتن ${booking.customerName} 🎾
نحيطك علماً بأنه تم إلغاء حجزك في ${clubSettings.clubName}:
🏷️ رقم الحجز: ${booking.bookingCode}
🏟️ ${booking.courtName}
📅 التاريخ: ${booking.date}
⏰ الوقت: ${formattedBookingTime}

📝 سبب الإلغاء: ${selectedReason}${customNote.trim() ? ` (${customNote.trim()})` : ''}

نعتذر عن أي إزعاج ويسعدنا دائماً استقبالك لحجز موعد جديد في أي وقت مناسب.`;

  const handleConfirmCancel = () => {
    setIsSubmitting(true);
    try {
      const finalReason = selectedReason === 'أخرى' && customNote.trim() ? customNote.trim() : selectedReason;
      cancelBookingWithReason(
        booking.id,
        finalReason,
        customNote.trim() || undefined,
        notifyCustomer
      );
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-6 border cursor-default transition-colors ${
          isDark
            ? 'bg-[#0d1f30] border-rose-500/30 text-white shadow-rose-950/40'
            : 'bg-white border-rose-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-rose-500 dark:text-rose-400">
                تأكيد إلغاء الحجز وتفريغ الملعب
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                حدد سبب الإلغاء لإخطار العميل وتوثيق العملية في سجل النظام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Card Summary */}
        <div
          className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-sky-500" />
              <span>{booking.customerName}</span>
              <span className="text-slate-400 font-mono text-[11px] dir-ltr">
                {booking.customerPhone}
              </span>
            </div>
            <span className="font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-500 border border-sky-500/30 text-[11px]">
              {booking.bookingCode}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              {booking.courtName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {booking.date}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {formattedBookingTime}
            </span>
          </div>
        </div>

        {/* Cancellation Reason Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            سبب الإلغاء:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CANCELLATION_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs'
                      : isDark
                      ? 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{reason}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-rose-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            ملاحظة إضافية أو تفاصيل للإدارة والعميل (اختياري):
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="مثال: تم الاتفاق مع اللاعب على حجز الغد أو تحويل المبلغ"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Notify Customer Switch */}
        <div
          className={`p-3 rounded-2xl border transition-colors ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>إشعار العميل فوراً عبر واتساب مع رسالة اعتذار</span>
              </div>
            </label>

            {notifyCustomer && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>{showPreview ? 'إخفاء المعاينة' : 'معاينة الرسالة'}</span>
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {notifyCustomer && showPreview && (
            <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line leading-relaxed dir-rtl">
              {previewMessage}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs transition-colors"
          >
            تراجع وإبقاء الحجز
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmCancel}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>تأكيد إلغاء الحجز وتفريغ الملعب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
