import React, { useState, useMemo } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking } from '../types/padel';
import { formatTimeRange } from '../utils/timeFormat';
import {
  Search,
  Calendar,
  MessageSquare,
  Plus,
  Lock,
  Edit3,
  Smartphone,
  XCircle,
  AlertTriangle,
  CalendarDays,
  Clock,
  ExternalLink,
  CheckCircle2,
  CalendarRange,
} from 'lucide-react';
import { CancelBookingModal } from './CancelBookingModal';

interface BookingsListProps {
  onOpenNewBooking: () => void;
  onSelectBooking: (booking: Booking) => void;
  onEditBooking?: (booking: Booking) => void;
  onViewInSchedule?: (booking: Booking) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  onOpenNewBooking,
  onSelectBooking,
  onEditBooking,
  onViewInSchedule,
}) => {
  const {
    bookings,
    canViewRevenue,
    clubSettings,
    sendWhatsAppBookingConfirmation,
    sendSmsBookingConfirmation,
    showToast,
    theme,
    setSelectedDate,
  } = usePadel();

  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming' | 'past'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  // Today & Tomorrow
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Summary counts
  const totalCount = bookings.length;
  const todayCount = bookings.filter((b) => b.date === todayStr && b.status !== 'cancelled').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const filteredBookings = useMemo(() => {
    const list = bookings.filter((b) => {
      // 1. Text Search
      const matchesSearch =
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone.includes(searchTerm) ||
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.courtName.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

      // 3. Date Filter
      let matchesDate = true;
      if (customDate) {
        matchesDate = b.date === customDate;
      } else if (dateFilter === 'today') {
        matchesDate = b.date === todayStr;
      } else if (dateFilter === 'tomorrow') {
        matchesDate = b.date === tomorrowStr;
      } else if (dateFilter === 'upcoming') {
        matchesDate = b.date >= todayStr;
      } else if (dateFilter === 'past') {
        matchesDate = b.date < todayStr;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Always sort newest bookings first
    return list.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.startTime || '').localeCompare(a.startTime || '');
    });
  }, [bookings, searchTerm, statusFilter, dateFilter, customDate, todayStr, tomorrowStr]);

  const handleWhatsApp = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    sendWhatsAppBookingConfirmation(booking);
  };

  const handleSms = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    sendSmsBookingConfirmation(booking);
  };

  const handleGoToSchedule = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(booking.date);
    if (onViewInSchedule) {
      onViewInSchedule(booking);
    }
  };

  return (
    <div id="bookings-list-view" className="space-y-5 pb-12">
      {/* Header */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#111C2E] border-[#2A3A50] text-white'
            : 'bg-white border-slate-200 text-[#0F172A]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0369A1] dark:text-[#38BDF8]" />
            <h2 className="text-base sm:text-lg font-black">
              سجل وإدارة الحجوزات
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0073a8]/15 text-[#0073a8] dark:text-sky-300 border border-[#0073a8]/25">
              {totalCount} حجز مسجل
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            عرض ومتابعة كافة الحجوزات، إرسال تذاكر واتساب وSMS، والانتقال المباشر لجدول الملاعب
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0073a8] hover:bg-[#005f8a] text-white text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل حجز جديد</span>
        </button>
      </div>

      {/* KPI Overview Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => { setDateFilter('today'); setStatusFilter('all'); setCustomDate(''); }}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
            dateFilter === 'today'
              ? 'ring-2 ring-[#0073a8] border-transparent'
              : ''
          } ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">حجوزات اليوم</div>
          <div className="text-xl font-black text-sky-500 mt-1">{todayCount}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('confirmed'); setDateFilter('all'); setCustomDate(''); }}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'confirmed'
              ? 'ring-2 ring-emerald-500 border-transparent'
              : ''
          } ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">المؤكدة</div>
          <div className="text-xl font-black text-emerald-500 mt-1">{confirmedCount}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('pending'); setDateFilter('all'); setCustomDate(''); }}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'ring-2 ring-amber-500 border-transparent'
              : ''
          } ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">قيد الانتظار</div>
          <div className="text-xl font-black text-amber-500 mt-1">{pendingCount}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('all'); setDateFilter('all'); setCustomDate(''); }}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
            dateFilter === 'all' && statusFilter === 'all' && !customDate
              ? 'ring-2 ring-[#0073a8] border-transparent'
              : ''
          } ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">إجمالي السجل</div>
          <div className="text-xl font-black text-primary mt-1">{totalCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-3xl border shadow-xs space-y-3 transition-colors ${
          isDark
            ? 'bg-[#111C2E] border-[#2A3A50]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute right-3 top-3 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بالاسم، رقم الجوال أو كود الحجز..."
              className={`w-full pr-9 pl-4 py-2 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0369A1]/30 transition-all ${
                isDark
                  ? 'bg-[#1E293B] border border-[#2A3A50] text-white placeholder-[#64748B]'
                  : 'bg-slate-50 border border-slate-200 text-[#0F172A] placeholder-slate-400'
              }`}
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
            {(
              [
                { key: 'all', label: 'الكل' },
                { key: 'confirmed', label: 'المؤكدة' },
                { key: 'pending', label: 'قيد الانتظار' },
                { key: 'cancelled', label: 'الملغية' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === filter.key
                    ? 'bg-[#0073a8] text-white shadow-xs'
                    : isDark
                    ? 'text-[#94A3B8] hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/5 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            <span>فلترة التاريخ:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setDateFilter('all'); setCustomDate(''); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dateFilter === 'all' && !customDate
                  ? 'bg-primary text-white'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              جميع التواريخ
            </button>
            <button
              onClick={() => { setDateFilter('today'); setCustomDate(''); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dateFilter === 'today' && !customDate
                  ? 'bg-primary text-white'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              اليوم ({todayCount})
            </button>
            <button
              onClick={() => { setDateFilter('tomorrow'); setCustomDate(''); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dateFilter === 'tomorrow' && !customDate
                  ? 'bg-primary text-white'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              غداً
            </button>
            <button
              onClick={() => { setDateFilter('upcoming'); setCustomDate(''); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dateFilter === 'upcoming' && !customDate
                  ? 'bg-primary text-white'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              القادمة
            </button>
            <button
              onClick={() => { setDateFilter('past'); setCustomDate(''); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dateFilter === 'past' && !customDate
                  ? 'bg-primary text-white'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              السابقة
            </button>
          </div>

          <div className="flex items-center gap-1.5 mr-auto">
            <span className="text-[11px] text-slate-400">تاريخ محدد:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                if (e.target.value) setDateFilter('all');
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono border ${
                isDark
                  ? 'bg-[#1E293B] border-[#2A3A50] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
            {customDate && (
              <button
                onClick={() => setCustomDate('')}
                className="text-xs text-rose-500 font-bold hover:underline"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Items List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div
            className={`p-10 rounded-3xl border text-center transition-colors ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#94A3B8]'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-40" />
            <p className="text-sm font-bold">لا توجد حجوزات مطابقة للبحث</p>
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => onSelectBooking(b)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-[#0369A1]/60 ${
                isDark
                  ? 'bg-[#111C2E] border-[#2A3A50] hover:bg-[#152338]'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              {/* Info Column */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                    b.status === 'confirmed'
                      ? 'bg-emerald-500'
                      : b.status === 'cancelled'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                      {b.customerName}
                    </h3>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-[#0369A1]/30 border-[#38BDF8]/40 text-[#38BDF8]'
                          : 'bg-sky-50 border-sky-200 text-[#0369A1]'
                      }`}
                    >
                      {b.bookingCode}
                    </span>
                    {b.status === 'cancelled' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                        ملغي ✕
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
                    <span className="font-bold text-emerald-500 dark:text-emerald-400">{b.courtName}</span>
                    <span className="px-2 py-0.5 rounded-md font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {b.date === todayStr ? 'اليوم' : b.date === tomorrowStr ? 'غداً' : b.date}
                    </span>
                    <span className={isDark ? 'text-[#CBD5E1]' : 'text-slate-600'}>
                      {formatTimeRange(b.startTime, b.endTime)}
                    </span>
                    <span className={`font-mono dir-ltr ${isDark ? 'text-[#CBD5E1]' : 'text-slate-600'}`}>
                      {b.customerPhone}
                    </span>
                    {b.ballsCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        علبة كرات (+15 ر.س)
                      </span>
                    )}
                  </div>

                  {/* Show cancellation reason if cancelled */}
                  {b.status === 'cancelled' && b.cancellationReason && (
                    <div className="text-[11px] font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>سبب الإلغاء: {b.cancellationReason}</span>
                      {b.cancellationNote && <span className="font-normal opacity-80">({b.cancellationNote})</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Action Section */}
              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                {canViewRevenue ? (
                  <div className="text-left sm:text-right ml-2">
                    <span className="text-sm font-black text-emerald-500 font-mono">
                      {b.totalPrice} {clubSettings.currency}
                    </span>
                    <span className={`block text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                      {b.paymentStatus === 'paid' ? 'مدفوع ✓' : 'غير مدفوع'}
                    </span>
                  </div>
                ) : (
                  <div className="text-left sm:text-right ml-2">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>محجوب</span>
                    </span>
                  </div>
                )}

                {/* View in Schedule Button */}
                <button
                  onClick={(e) => handleGoToSchedule(b, e)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isDark
                      ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25'
                      : 'bg-sky-50 border-sky-200 text-[#0073a8] hover:bg-sky-100'
                  }`}
                  title="عرض هذا الحجز في جدول الملاعب"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>عرض في الجدول</span>
                </button>

                {onEditBooking && b.status !== 'cancelled' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBooking(b);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isDark
                        ? 'bg-[#0369A1]/20 border-[#0369A1]/40 text-[#38BDF8] hover:bg-[#0369A1]/30'
                        : 'bg-sky-50 border-sky-200 text-[#0369A1] hover:bg-sky-100'
                    }`}
                    title="تعديل وقت وتفاصيل الحجز"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                )}

                {/* WhatsApp Button */}
                <button
                  onClick={(e) => handleWhatsApp(b, e)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                  title="إرسال تذكرة التأكيد عبر واتساب"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </button>

                {/* SMS Button */}
                <button
                  onClick={(e) => handleSms(b, e)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                  title="إرسال رسالة SMS"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>

                {/* Cancel Booking Button */}
                {b.status !== 'cancelled' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookingToCancel(b);
                    }}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/15 border border-rose-500/30 text-xs font-bold transition-colors"
                    title="إلغاء الحجز وتفريغ الملعب"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancellation Modal */}
      <CancelBookingModal
        booking={bookingToCancel}
        isOpen={Boolean(bookingToCancel)}
        onClose={() => setBookingToCancel(null)}
        onSuccess={() => setBookingToCancel(null)}
      />
    </div>
  );
};
