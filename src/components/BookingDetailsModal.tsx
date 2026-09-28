import React, { useState } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking } from '../types/padel';
import { formatTimeRange } from '../utils/timeFormat';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  Printer,
  CheckCircle,
  XCircle,
  Dumbbell,
  X,
  Share2,
  Edit3,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { CancelBookingModal } from './CancelBookingModal';

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onEdit?: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  onEdit,
}) => {
  const {
    clubSettings,
    sendWhatsAppBookingConfirmation,
    sendSmsBookingConfirmation,
    theme,
  } = usePadel();

  const isDark = theme === 'dark';
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div
        className={`rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 my-6 border transition-colors ${
          isDark
            ? 'bg-[#0d1f30] border-sky-900/60 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-[#0073a8] dark:text-sky-300 border border-sky-500/20 flex items-center justify-center font-bold text-lg">
              🎾
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                تذكرة حجز بادل منيفة
              </h3>
              <span className="font-mono text-xs font-bold text-[#0073a8] dark:text-sky-400">
                {booking.bookingCode}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onEdit && booking.status !== 'cancelled' && (
              <button
                id="btn-edit-booking-header"
                onClick={() => {
                  onEdit(booking);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-[#0073a8] dark:text-sky-300 border border-sky-500/30 text-xs font-bold transition-all"
                title="تعديل وقت وتفاصيل الحجز"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cancellation Notice Banner (If Cancelled) */}
        {booking.status === 'cancelled' && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>هذا الحجز ملغي</span>
            </div>
            {booking.cancellationReason && (
              <p className="text-[11px] text-rose-600 dark:text-rose-300">
                <span className="font-bold">سبب الإلغاء:</span> {booking.cancellationReason}
                {booking.cancellationNote && ` (${booking.cancellationNote})`}
              </p>
            )}
            {booking.cancelledAt && (
              <p className="text-[10px] text-rose-500/80 font-mono">
                تاريخ الإلغاء: {booking.cancelledAt}
              </p>
            )}
          </div>
        )}

        {/* Ticket Box */}
        <div
          className={`rounded-2xl border p-4 space-y-3 text-xs ${
            isDark
              ? 'border-white/10 bg-white/5 text-slate-300'
              : 'border-slate-200 bg-slate-50/70 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                booking.status === 'confirmed'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : booking.status === 'cancelled'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {booking.status === 'confirmed'
                ? 'مؤكد ✓'
                : booking.status === 'cancelled'
                ? 'ملغي ✕'
                : 'قيد الانتظار'}
            </span>
            <span className="text-slate-400">{booking.date}</span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">اسم اللاعب:</span>
              <span className="font-bold text-slate-900 dark:text-white">{booking.customerName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">رقم الجوال:</span>
              <span className="font-mono font-bold dir-ltr">{booking.customerPhone}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">الملعب:</span>
              <span className="font-bold text-[#0073a8] dark:text-sky-300">{booking.courtName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">الوقت:</span>
              <span className="font-mono font-bold">
                {formatTimeRange(booking.startTime, booking.endTime)} ({booking.durationMinutes} دقيقة)
              </span>
            </div>

            {booking.ballsCount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>المعدات:</span>
                <span className="font-bold">علبة كور جديدة (+15 ر.س)</span>
              </div>
            )}

            {booking.appliedDiscountCode && (
              <div className="flex justify-between text-[#0073a8] dark:text-sky-400 font-bold">
                <span>كود الخصم ({booking.appliedDiscountCode}):</span>
                <span>-{booking.discountAmount} ر.س</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-sm font-black">
              <span>المبلغ الإجمالي:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                {booking.totalPrice} ر.س
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {onEdit && booking.status !== 'cancelled' && (
            <button
              id="btn-edit-booking-footer"
              onClick={() => {
                onEdit(booking);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0073a8] hover:bg-[#005f8a] text-white transition-all shadow-xs active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل وقت وتفاصيل الحجز (نقل الحجز/الساعة) ✏️</span>
            </button>
          )}

          {/* Quick Notification Dispatch (WhatsApp & SMS) */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
              إرسال إشعار التأكيد للعميل:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => sendWhatsAppBookingConfirmation(booking)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال واتساب</span>
              </button>

              <button
                type="button"
                onClick={() => sendSmsBookingConfirmation(booking)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>رسالة SMS</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التذكرة</span>
            </button>

            {booking.status !== 'cancelled' && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="py-2 px-3.5 rounded-xl text-rose-600 hover:text-white dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="إلغاء الحجز"
              >
                <XCircle className="w-4 h-4" />
                <span>إلغاء الحجز</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
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
