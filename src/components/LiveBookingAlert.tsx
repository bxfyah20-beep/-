import React, { useEffect, useState, useRef } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking } from '../types/padel';
import { formatArabicTime } from '../utils/timeFormat';
import {
  Bell,
  BellOff,
  X,
  Eye,
  MessageSquare,
  Calendar,
  Clock,
  Phone,
} from 'lucide-react';

interface LiveBookingAlertProps {
  onSelectBookingById?: (bookingId?: string, bookingCode?: string) => void;
}

export const LiveBookingAlert: React.FC<LiveBookingAlertProps> = ({
  onSelectBookingById,
}) => {
  const {
    latestLiveNotification,
    dismissLiveNotification,
    canViewRevenue,
    soundEnabled,
    toggleSoundEnabled,
    clubSettings,
    bookings,
    theme,
  } = usePadel();

  const isDark = theme === 'dark';
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!latestLiveNotification) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 12000; // 12 seconds
    const intervalTime = 100;
    const decrement = (intervalTime / duration) * 100;
    let currentProgress = 100;

    const timer = setInterval(() => {
      if (!isPausedRef.current) {
        currentProgress -= decrement;
        if (currentProgress <= 0) {
          clearInterval(timer);
          setProgress(0);
          dismissLiveNotification();
        } else {
          setProgress(currentProgress);
        }
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [latestLiveNotification, dismissLiveNotification]);

  if (!latestLiveNotification) return null;

  const associatedBooking = bookings.find(
    (b) =>
      (latestLiveNotification.bookingId && b.id === latestLiveNotification.bookingId) ||
      (latestLiveNotification.bookingCode && b.bookingCode === latestLiveNotification.bookingCode)
  );

  const handleOpenDetails = () => {
    if (onSelectBookingById) {
      onSelectBookingById(
        latestLiveNotification.bookingId,
        latestLiveNotification.bookingCode
      );
    }
    dismissLiveNotification();
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = latestLiveNotification.customerPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `أهلاً كابتن ${latestLiveNotification.customerName} 🎾\nوصلنا إشعار حجزك بنجاح في ${clubSettings.clubName}:\n🏷️ رقم الحجز: ${latestLiveNotification.bookingCode || 'مؤكد'}\n🏟️ ${latestLiveNotification.courtName}\n📅 ${latestLiveNotification.date} (${latestLiveNotification.time})\n📍 الموقع: ${clubSettings.location}\n\nننتظركم في الملعب!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div
      id="live-booking-alert-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-md z-50 animate-in fade-in slide-in-from-top-6 duration-300"
    >
      <div
        className={`rounded-3xl border shadow-2xl overflow-hidden transition-all backdrop-blur-md ${
          isDark
            ? 'bg-[#111C2E]/95 border-[#38BDF8]/40 text-white shadow-2xl ring-1 ring-[#38BDF8]/30'
            : 'bg-white/95 border-sky-500/40 text-[#0F172A] shadow-slate-300/80 ring-1 ring-sky-400/20'
        }`}
      >
        {/* Top Progress countdown line */}
        <div className="w-full h-1.5 bg-black/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#38BDF8] via-[#0369A1] to-emerald-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>

              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-[#0369A1]/30 text-[#38BDF8]' : 'bg-sky-100 text-[#0369A1]'
                  }`}
                >
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-none">
                    <span>حجز جديد وارد الآن!</span>
                  </h3>
                  <span className={`text-xs font-semibold mt-1 inline-block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    إشعار إداري فوري • بادل منيفة
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleSoundEnabled}
                title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  soundEnabled
                    ? isDark
                      ? 'text-[#38BDF8] hover:bg-[#0369A1]/20'
                      : 'text-[#0369A1] hover:bg-sky-50'
                    : 'text-slate-400 hover:bg-slate-200/50'
                }`}
              >
                {soundEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={dismissLiveNotification}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Card */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2 text-xs transition-colors ${
              isDark ? 'bg-[#18263B] border-[#2A3A50]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🎾</span>
                <span className={`text-sm font-black ${isDark ? 'text-[#38BDF8]' : 'text-[#0369A1]'}`}>{latestLiveNotification.customerName}</span>
              </div>
              {latestLiveNotification.bookingCode && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-[#0369A1]/20 text-[#38BDF8] border border-[#38BDF8]/40 font-bold">
                  {latestLiveNotification.bookingCode}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {latestLiveNotification.courtName}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className={`font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0369A1]'}`}>
                  {formatArabicTime(latestLiveNotification.time)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`font-mono font-bold ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'}`}>
                  {latestLiveNotification.customerPhone}
                </span>
              </div>

              {canViewRevenue && (
                <div className="text-left font-black text-emerald-400 text-xs">
                  {latestLiveNotification.totalPrice} {clubSettings.currency}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleOpenDetails}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0073a8] hover:bg-[#005f8a] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة تفاصيل الحجز</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
              title="إرسال رسالة واتساب للعميل"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
