import React, { useState, useMemo } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking } from '../types/padel';
import {
  formatTimeRange,
  formatArabicTime,
  toOperationalMinutes,
  isCourtMatch,
  generateScheduleTimeSlots,
  getOperationalTimeBounds,
} from '../utils/timeFormat';
import { OperatingHoursModal } from './OperatingHoursModal';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Edit3,
  Plus,
  ShieldAlert,
  CalendarDays,
  User,
  Phone,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface ScheduleViewProps {
  onOpenNewBookingWithSlot: (courtId: string, time: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onEditBooking?: (booking: Booking) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  onOpenNewBookingWithSlot,
  onSelectBooking,
  onEditBooking,
}) => {
  const {
    courts,
    bookings,
    selectedDate,
    setSelectedDate,
    theme,
    canViewRevenue,
    currentUser,
    clubSettings,
  } = usePadel();

  const isDark = theme === 'dark';
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  // Strictly the 2 official courts
  const officialCourts = courts.slice(0, 2);

  // Operational schedule generated dynamically from clubSettings (متى يفتح ومتى يسكر)
  const slots = useMemo(() => {
    return generateScheduleTimeSlots(
      clubSettings.openingTime || '4:00 م',
      clubSettings.closingTime || '3:00 ص',
      30
    );
  }, [clubSettings.openingTime, clubSettings.closingTime]);

  // Today and Tomorrow strings YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Bookings for selected date
  const selectedDayBookings = useMemo(() => {
    return bookings.filter((b) => b.date === selectedDate && b.status !== 'cancelled');
  }, [bookings, selectedDate]);

  // Bookings for today
  const todayBookings = useMemo(() => {
    return bookings.filter((b) => b.date === todayStr && b.status !== 'cancelled');
  }, [bookings, todayStr]);

  // Bookings for tomorrow
  const tomorrowBookings = useMemo(() => {
    return bookings.filter((b) => b.date === tomorrowStr && b.status !== 'cancelled');
  }, [bookings, tomorrowStr]);

  // Formatted date in Arabic (e.g. السبت، 26 سبتمبر 2026)
  const formattedArabicDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(dateObj);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Determine slot occupancy and state
  const getSlotDetails = (court: (typeof officialCourts)[0], slotTime: string, slotIndex: number) => {
    // 1. Check if court is in maintenance
    if (!court.isActive) {
      return {
        type: 'maintenance' as const,
        reason: court.maintenanceReason || 'صيانة دورية للملعب',
      };
    }

    const slotMins = toOperationalMinutes(slotTime);

    // 2. CHECK FOR ACTIVE BOOKINGS FIRST (active reservations are never overridden by past status!)
    for (const b of bookings) {
      if (!isCourtMatch(b.courtId, court.id, b.courtName, court.name)) {
        continue;
      }
      if (b.date !== selectedDate || b.status === 'cancelled') {
        continue;
      }

      const bStart = toOperationalMinutes(b.startTime);
      const bDuration = Number(b.durationMinutes) || 90;
      const bEnd = bStart + bDuration;

      // Start block: exact match, or falls within the first 30 mins, or earliest visible slot
      if (slotMins >= bStart && slotMins < bStart + 30) {
        return {
          type: 'booking-start' as const,
          booking: b,
        };
      }

      // If booking started earlier than our visible table (e.g. 15:30) and this is the first slot
      if (slotIndex === 0 && slotMins > bStart && slotMins < bEnd) {
        return {
          type: 'booking-start' as const,
          booking: b,
        };
      }

      // Continuation block
      if (slotMins >= bStart + 30 && slotMins < bEnd) {
        return {
          type: 'booking-continuation' as const,
          booking: b,
        };
      }
    }

    // 3. Check if this is an unoccupied past slot (only if viewing today and during operating window)
    const isToday = selectedDate === todayStr;
    if (isToday) {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentOperationalMins = toOperationalMinutes(
        `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`
      );
      const { openMins, closeMins } = getOperationalTimeBounds(
        clubSettings.openingTime,
        clubSettings.closingTime
      );
      if (
        currentOperationalMins >= openMins &&
        currentOperationalMins < closeMins &&
        slotMins < currentOperationalMins - 15
      ) {
        return { type: 'past' as const };
      }
    }

    // 4. Slot is available
    return { type: 'available' as const };
  };

  // Generate 7 rolling days for quick date selector
  const quickDaysList = useMemo(() => {
    const list = [];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = bookings.filter((b) => b.date === iso && b.status !== 'cancelled').length;
      list.push({
        iso,
        label: i === 0 ? 'اليوم' : i === 1 ? 'غداً' : arabicDays[d.getDay()],
        dayNum: d.getDate(),
        month: arabicMonths[d.getMonth()],
        bookingsCount: count,
      });
    }
    return list;
  }, [bookings]);

  return (
    <div id="schedule-view" className="space-y-4 pb-12">
      {/* Quick 7-Day Date Bar with Live Reservation Badges */}
      <div
        className={`p-3 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-[#E2E8F0] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickDaysList.map((day) => {
            const isSelected = selectedDate === day.iso;
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelectedDate(day.iso)}
                className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl border flex flex-col items-center justify-between transition-all select-none ${
                  isSelected
                    ? 'border-[#0369A1] bg-[#0369A1] text-white shadow-md scale-[1.02]'
                    : isDark
                    ? 'border-[#2A3A50] bg-[#18263B] text-slate-300 hover:border-slate-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {day.label}
                </span>
                <span className="text-base font-black leading-tight my-0.5">
                  {day.dayNum}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  day.bookingsCount > 0
                    ? isSelected
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isSelected
                    ? 'bg-white/20 text-white'
                    : 'text-slate-500'
                }`}>
                  {day.bookingsCount > 0 ? `${day.bookingsCount} حجز 🔥` : 'متاح'}
                </span>
              </button>
            );
          })}
          {/* Custom Date Input directly in quick bar */}
          <div className="flex items-center px-1.5 shrink-0">
            <input
              id="input-schedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`rounded-xl px-2.5 py-2.5 text-xs font-bold border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                  : 'bg-slate-100 border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
              }`}
              title="اختيار تاريخ مخصص"
            />
          </div>
        </div>
      </div>
      {/* Summary Strip of Bookings for this Selected Date */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-[#E2E8F0] shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-current/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold">
              قائمة حجوزات ({formattedArabicDate}): {selectedDayBookings.length} حجز
            </h3>
          </div>
          <button
            onClick={() => onOpenNewBookingWithSlot(officialCourts[0]?.id || 'court-1', '17:00')}
            className="flex items-center gap-1 text-xs font-bold text-[#0369A1] dark:text-[#38BDF8] hover:underline self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل حجز جديد في هذا اليوم</span>
          </button>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-400">
            لا توجد حجوزات مجدولة حتى الآن لتاريخ ({selectedDate}). كلا الملعبين متاحان للحجز!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {selectedDayBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between gap-2 shadow-2xs ${
                  isDark
                    ? 'bg-[#18263B] border-[#2A3A50] hover:border-sky-500/50'
                    : 'bg-slate-50 border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs truncate">{b.customerName}</span>
                    <span className="font-mono text-[10px] px-1 rounded bg-black/10 dark:bg-white/10 font-bold">
                      {b.bookingCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="font-semibold text-emerald-500">{b.courtName}</span>
                    <span>•</span>
                    <span className="text-primary font-medium">
                      {formatTimeRange(b.startTime, b.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onEditBooking && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBooking(b);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-sky-400 transition-colors"
                      title="تعديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBooking(b);
                    }}
                    className="px-2 py-1 rounded-lg bg-[#0369A1] hover:bg-[#0284C7] text-white text-[11px] font-bold shadow-2xs"
                  >
                    تفاصيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Timetable Card with Sticky Court Headers & Sticky Time Column */}
      <div
        className={`border rounded-2xl overflow-hidden transition-colors ${
          isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-[#E2E8F0] shadow-xs'
        }`}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Table Header: Sticky Court Columns */}
            <div
              className={`grid grid-cols-12 border-b text-xs font-bold py-3 px-2 sticky top-16 z-20 ${
                isDark
                  ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9]'
                  : 'bg-slate-100 border-slate-200 text-[#0F172A]'
              }`}
            >
              {/* Sticky Time Header */}
              <div className="col-span-2 text-center text-[#94A3B8] font-bold flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>الوقت</span>
              </div>

              {/* Court 1 & Court 2 Headers */}
              {officialCourts.map((court) => (
                <div key={court.id} className="col-span-5 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          court.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-sm">{court.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      {court.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-semibold border border-emerald-500/25 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>جاهز للعب</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/25 flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          <span>تحت الصيانة</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] font-normal truncate mt-0.5">
                    {court.surface}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className={`divide-y ${isDark ? 'divide-[#2A3A50]' : 'divide-slate-100'}`}>
              {slots.map((slot, slotIndex) => (
                <div
                  key={slot.time}
                  className={`grid grid-cols-12 min-h-[54px] items-stretch transition-colors ${
                    isDark ? 'hover:bg-[#18263B]/60' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Sticky Time Column */}
                  <div
                    className={`col-span-2 border-l p-2 flex flex-col items-center justify-center text-center sticky right-0 z-10 ${
                      isDark
                        ? 'bg-[#111C2E] border-[#2A3A50]'
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono text-primary">
                      {slot.label}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      {slot.time.startsWith('00') ||
                      slot.time.startsWith('01') ||
                      slot.time.startsWith('02')
                        ? 'فجر التالي'
                        : 'مساءً'}
                    </span>
                  </div>

                  {/* The 2 Court Slot Columns */}
                  {officialCourts.map((court) => {
                    const status = getSlotDetails(court, slot.time, slotIndex);

                    return (
                      <div
                        key={court.id}
                        className={`col-span-5 p-1.5 border-l last:border-l-0 flex items-center justify-center ${
                          isDark ? 'border-[#2A3A50]' : 'border-slate-100'
                        }`}
                      >
                        {/* 1. Maintenance mode */}
                        {status.type === 'maintenance' && (
                          <div className="w-full h-full min-h-[42px] px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Wrench className="w-3.5 h-3.5 shrink-0" />
                              <span>{status.reason}</span>
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20">
                              مغلق للصيانة
                            </span>
                          </div>
                        )}

                        {/* 2. Past time */}
                        {status.type === 'past' && (
                          <div className="w-full h-full min-h-[42px] px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-[#2A3A50] text-[#94A3B8] text-xs flex items-center justify-center gap-1.5 bg-slate-100/40 dark:bg-white/2">
                            <Clock className="w-3 h-3 text-[#94A3B8]" />
                            <span className="text-[11px]">فترة مضت</span>
                          </div>
                        )}

                        {/* 3. Booking Start Card (Full Details & Duration Badge) */}
                        {status.type === 'booking-start' && (
                          <div
                            onClick={() => onSelectBooking(status.booking)}
                            className={`w-full h-full p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                              status.booking.status === 'confirmed'
                                ? isDark
                                  ? 'bg-[#0C4A6E]/40 border-[#0284C7]/60 text-white hover:border-[#38BDF8]'
                                  : 'bg-sky-50/90 border-[#0284C7]/40 text-[#0F172A] hover:border-[#0284C7]'
                                : isDark
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-400'
                                : 'bg-amber-50 border-amber-300 text-[#0F172A] hover:border-amber-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-xs truncate">
                                  {status.booking.customerName}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/20">
                                  {status.booking.durationMinutes} دقيقة
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {onEditBooking && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditBooking(status.booking);
                                    }}
                                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary transition-colors"
                                    title="تعديل وقت وحالة الحجز"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                                <span className="text-[10px] font-mono font-bold opacity-85">
                                  {status.booking.bookingCode}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-1 pt-1 border-t border-current/10">
                              <span className="font-mono">{status.booking.customerPhone}</span>
                              <span className="font-medium text-primary">
                                {formatTimeRange(status.booking.startTime, status.booking.endTime)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4. Booking Continuation (Visually connected occupied slot) */}
                        {status.type === 'booking-continuation' && (
                          <div
                            onClick={() => onSelectBooking(status.booking)}
                            className={`w-full h-full min-h-[42px] px-3 py-1 rounded-lg border-r-4 border border-dashed cursor-pointer transition-all flex items-center justify-between ${
                              status.booking.status === 'confirmed'
                                ? isDark
                                  ? 'bg-[#0C4A6E]/20 border-r-[#0284C7] border-[#0284C7]/30 text-[#B6C2D2] hover:bg-[#0C4A6E]/30'
                                  : 'bg-sky-50/50 border-r-[#0284C7] border-[#0284C7]/30 text-slate-700 hover:bg-sky-50'
                                : isDark
                                ? 'bg-amber-950/20 border-r-amber-500 border-amber-500/30 text-amber-300'
                                : 'bg-amber-50/50 border-r-amber-500 border-amber-500/30 text-slate-700'
                            }`}
                            title={`تابع لحجز ${status.booking.customerName} (${formatTimeRange(status.booking.startTime, status.booking.endTime)})`}
                          >
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                              <span className="font-medium text-[11px]">
                                محجوز (تابع لحجز {status.booking.customerName})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-medium opacity-75">
                              حتى {status.booking.endTime}
                            </span>
                          </div>
                        )}

                        {/* 5. Available Slot (Click to Book) */}
                        {status.type === 'available' && (
                          <button
                            id={`btn-book-slot-${court.id}-${slot.time.replace(':', '')}`}
                            onClick={() => onOpenNewBookingWithSlot(court.id, slot.time)}
                            className={`w-full h-full min-h-[42px] rounded-lg border border-dashed text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                              isDark
                                ? 'border-[#2A3A50] hover:border-[#38BDF8] hover:bg-[#18263B] text-[#94A3B8] hover:text-[#38BDF8]'
                                : 'border-slate-300 hover:border-[#0369A1] hover:bg-sky-50/60 text-slate-500 hover:text-[#0369A1]'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>متاح للحجز</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <OperatingHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
      />
    </div>
  );
};
