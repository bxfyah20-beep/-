import React, { useState, useEffect, useRef } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  isCourtMatch,
  toOperationalMinutes,
  getOperationalTimeBounds,
  minutesToFormattedTime,
} from '../utils/timeFormat';
import { OperatingHoursModal } from './OperatingHoursModal';
import {
  Calendar,
  Clock,
  ArrowLeft,
  X,
  Lock,
  Ticket,
  MapPin,
  Headset,
  Phone,
  MessageCircle,
  ExternalLink,
  Shield,
  Sun,
  Moon,
  Check,
} from 'lucide-react';

interface ManifaBookingViewProps {
  onSwitchToAdmin: () => void;
}

interface SlotItem {
  id: string;
  type: 'AVAILABLE' | 'BOOKED' | 'MY_BOOKING';
  isMine?: boolean;
  startMin: number;
  endMin: number;
  duration: number;
  time: string;
  period: string;
  fullTime: string;
  endTime: string;
  timeLabel?: string;
  courtName?: string;
  courtKey?: 'court1' | 'court2';
  clientName?: string;
  clientPhone?: string;
  balls?: number;
  totalPrice?: number;
  displayId?: string;
  contextBookingId?: string;
}

interface DateItem {
  index: number;
  day: string;
  dayNum: number;
  monthName: string;
  date: string; // e.g. "21 Sep"
  isoDate: string; // e.g. "2026-09-21"
}

export const ManifaBookingView: React.FC<ManifaBookingViewProps> = ({ onSwitchToAdmin }) => {
  const {
    bookings: contextBookings,
    addBooking,
    updateBookingStatus,
    showToast,
    theme,
    toggleTheme,
    clubSettings,
  } = usePadel();

  const isDark = theme === 'dark';

  // Persistent Client User ID for tracking "حجوزاتي"
  const [currentUserId] = useState<string>(() => {
    let saved = localStorage.getItem('manifa_user_id');
    if (!saved) {
      saved = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('manifa_user_id', saved);
    }
    return saved;
  });

  const [userSavedPhone, setUserSavedPhone] = useState<string>(() => {
    return localStorage.getItem('manifa_user_phone') || '';
  });

  const [lastCreatedBookingId, setLastCreatedBookingId] = useState<string>('');

  const BALL_PRICE = 15;
  const STEP_MINUTES = 30;

  // Operational schedule bounds dynamically linked to management settings (متى يفتح ومتى يسكر)
  const {
    openMins: OPEN_TIME,
    closeMins: CLOSE_TIME,
    totalOperatingHours,
    openLabel,
    closeLabel,
  } = React.useMemo(() => {
    return getOperationalTimeBounds(
      clubSettings.openingTime || '4:00 م',
      clubSettings.closingTime || '3:00 ص'
    );
  }, [clubSettings.openingTime, clubSettings.closingTime]);

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  // Dynamic midpoint for period filters
  const midMins = React.useMemo(() => {
    return Math.round((OPEN_TIME + CLOSE_TIME) / 2 / 30) * 30;
  }, [OPEN_TIME, CLOSE_TIME]);

  const midFormatted = React.useMemo(() => {
    return minutesToFormattedTime(midMins);
  }, [midMins]);

  const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // State
  const [datesList, setDatesList] = useState<DateItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(90);
  const [baseCourtPrice, setBaseCourtPrice] = useState<number>(190);
  const [showUnavailable, setShowUnavailable] = useState<boolean>(true);
  const [timePeriodFilter, setTimePeriodFilter] = useState<'all' | 'evening' | 'night'>('all');
  const [slotsLayoutMode, setSlotsLayoutMode] = useState<'grid' | 'slider'>('grid');

  // Storage Bookings map (matching user's site structure)
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, { court1: any[]; court2: any[] }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('manifa_bookings') || '{}');
    } catch {
      return {};
    }
  });

  // Selected slot & sticky bar
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  // Checkout Form State
  const [hasBalls, setHasBalls] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'apple'>('apple');
  const [checkoutTimer, setCheckoutTimer] = useState<number>(600); // 10 minutes

  // Active Ticket Data
  const [currentTicketData, setCurrentTicketData] = useState<any | null>(null);

  // Drag scroll refs
  const datePickerRef = useRef<HTMLDivElement>(null);
  const court1SlotsRef = useRef<HTMLDivElement>(null);
  const court2SlotsRef = useRef<HTMLDivElement>(null);

  // Operational base date
  const getOperationalBaseDate = () => {
    const now = new Date();
    if (now.getHours() < 3) {
      now.setDate(now.getDate() - 1);
    }
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Generate Rolling 14 days
  useEffect(() => {
    const base = getOperationalBaseDate();
    const newDates: DateItem[] = [];
    const bCopy = { ...bookingsByDate };

    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateKey = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dayNumStr = String(d.getDate()).padStart(2, '0');
      const isoDate = `${year}-${monthNum}-${dayNumStr}`;

      if (!bCopy[dateKey]) {
        bCopy[dateKey] = { court1: [], court2: [] };
      }

      newDates.push({
        index: i,
        day: i === 0 ? 'اليوم' : i === 1 ? 'غداً' : ARABIC_DAYS[d.getDay()],
        dayNum: d.getDate(),
        monthName: MONTH_NAMES[d.getMonth()],
        date: dateKey,
        isoDate,
      });
    }

    setBookingsByDate(bCopy);
    setDatesList(newDates);

    if (!selectedDate || !newDates.some((item) => item.date === selectedDate)) {
      setSelectedDate(newDates[0]?.date || '');
      setSelectedIsoDate(newDates[0]?.isoDate || '');
    }
  }, []);

  // Save bookings to localStorage
  const saveBookingsToStorage = (updated: Record<string, { court1: any[]; court2: any[] }>) => {
    setBookingsByDate(updated);
    try {
      localStorage.setItem('manifa_bookings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Format 12-hour Arabic time
  const formatTime12 = (totalMinutes: number) => {
    const normalized = totalMinutes % 1440;
    const hours24 = Math.floor(normalized / 60);
    const hours12 = hours24 % 12 || 12;
    const mins = String(normalized % 60).padStart(2, '0');
    const period = hours24 >= 12 ? 'م' : 'ص';
    return {
      full: `${String(hours12).padStart(2, '0')}:${mins} ${period}`,
      time: `${String(hours12).padStart(2, '0')}:${mins}`,
      period,
      raw24: `${String(hours24).padStart(2, '0')}:${mins}`,
    };
  };

  const getDurationLabel = (duration: number) => {
    return duration === 60 ? '60 دقيقة' : duration === 90 ? '90 دقيقة' : '120 دقيقة';
  };

  // Convert raw 24h string (e.g. "17:00" or "01:30") to operational minutes (where 00:00 = 1440, 01:00 = 1500, etc.)
  const rawTimeToOperationalMinutes = (raw: string) => {
    const [h, m] = raw.split(':').map(Number);
    let total = h * 60 + (m || 0);
    if (h < 4) {
      total += 1440; // post midnight
    }
    return total;
  };

  // Generate slots for a court
  const generateCourtSlots = (courtKey: 'court1' | 'court2', duration: number): SlotItem[] => {
    if (!selectedDate || !bookingsByDate[selectedDate]) return [];

    const dayLocalBookings = bookingsByDate[selectedDate][courtKey] || [];
    const courtId = courtKey === 'court1' ? 'court-1' : 'court-2';
    const courtName = courtKey === 'court1' ? 'Court 1 - بادل 1' : 'Court 2 - بادل 2';

    // Also collect bookings from contextBookings for this court and day
    const dayContextBookings = contextBookings.filter(
      (b) =>
        isCourtMatch(b.courtId, courtId, b.courtName, courtName) &&
        b.date === selectedIsoDate &&
        b.status !== 'cancelled'
    );

    // Build unified booked ranges
    const bookedRanges: { startMin: number; endMin: number; bData?: any }[] = [];

    // 1. From local storage
    dayLocalBookings.forEach((b) => {
      bookedRanges.push({
        startMin: b.startMin,
        endMin: b.endMin,
        bData: b,
      });
    });

    // 2. From context
    dayContextBookings.forEach((cb) => {
      const sMin = toOperationalMinutes(cb.startTime);
      const eMin = sMin + (Number(cb.durationMinutes) || duration);
      // Avoid duplicate if already in local
      if (!bookedRanges.some((r) => Math.abs(r.startMin - sMin) < 15)) {
        const isThisUser =
          cb.createdBy?.includes(currentUserId) ||
          (userSavedPhone && cb.customerPhone && cb.customerPhone.replace(/\D/g, '') === userSavedPhone.replace(/\D/g, '')) ||
          cb.id === lastCreatedBookingId;

        bookedRanges.push({
          startMin: sMin,
          endMin: eMin,
          bData: {
            id: cb.id,
            displayId: cb.bookingCode,
            startMin: sMin,
            endMin: eMin,
            duration: Number(cb.durationMinutes) || duration,
            clientName: cb.customerName,
            clientPhone: cb.customerPhone,
            courtName,
            courtKey,
            userId: isThisUser ? currentUserId : 'other',
            totalPrice: cb.totalPrice,
            contextBookingId: cb.id,
          },
        });
      }
    });

    const allSlots: SlotItem[] = [];

    // Loop through every 30-minute interval from 4:00 PM (960) to 3:00 AM (1620)
    for (let start = OPEN_TIME; start <= CLOSE_TIME; start += STEP_MINUTES) {
      const end = start + duration;
      const s = formatTime12(start);
      const e = formatTime12(end);

      // 1. Is this start time inside an active booking?
      const coveringBooking = bookedRanges.find(
        (b) => start >= b.startMin && start < b.endMin
      );

      // 2. Does a booking start at this exact time?
      const exactBooking = bookedRanges.find(
        (b) => Math.abs(b.startMin - start) < 15
      );

      // 3. If user wants `duration` from this start, does it overlap with any booking?
      const overlappingBooking = bookedRanges.find(
        (b) => Math.max(start, b.startMin) < Math.min(end, b.endMin)
      );

      if (coveringBooking || exactBooking) {
        const b = (exactBooking || coveringBooking)!.bData;
        const isMine =
          b.userId === currentUserId ||
          (userSavedPhone && b.clientPhone && b.clientPhone.replace(/\D/g, '') === userSavedPhone.replace(/\D/g, '')) ||
          (lastCreatedBookingId && (b.id === lastCreatedBookingId || b.contextBookingId === lastCreatedBookingId));

        allSlots.push({
          id: `${courtKey}-${start}-booked`,
          type: isMine ? 'MY_BOOKING' : 'BOOKED',
          isMine,
          startMin: start,
          endMin: b.endMin || end,
          duration: Number(b.duration) || duration,
          time: s.time,
          period: s.period,
          fullTime: s.full,
          endTime: e.full,
          timeLabel: b.timeLabel || `من ${s.full} إلى ${e.full}`,
          courtName,
          courtKey,
          clientName: isMine ? b.clientName : '',
          clientPhone: isMine ? b.clientPhone : '',
          balls: b.balls,
          totalPrice: b.totalPrice,
          displayId: b.displayId,
          contextBookingId: b.contextBookingId,
        });
      } else if (overlappingBooking) {
        // Starts free, but next booking starts before requested duration ends
        const b = overlappingBooking.bData;
        allSlots.push({
          id: `${courtKey}-${start}-conflict`,
          type: 'BOOKED',
          isMine: false,
          startMin: start,
          endMin: end,
          duration,
          time: s.time,
          period: s.period,
          fullTime: s.full,
          endTime: e.full,
          timeLabel: `محجوز (${b.displayId || 'فترة متداخلة'})`,
          courtName,
          courtKey,
          displayId: b.displayId,
        });
      } else {
        // Completely available
        allSlots.push({
          id: `${courtKey}-${start}`,
          type: 'AVAILABLE',
          startMin: start,
          endMin: end,
          duration,
          time: s.time,
          period: s.period,
          fullTime: s.full,
          endTime: e.full,
          timeLabel: `من ${s.full} إلى ${e.full}`,
          courtName,
          courtKey,
        });
      }
    }

    return allSlots;
  };

  // Drag scroll helper
  const setupDragScroll = (el: HTMLDivElement | null) => {
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => {
      isDown = false;
    };
    const onMouseUp = () => {
      isDown = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  };

  useEffect(() => {
    const cleanDate = setupDragScroll(datePickerRef.current);
    const cleanC1 = setupDragScroll(court1SlotsRef.current);
    const cleanC2 = setupDragScroll(court2SlotsRef.current);
    return () => {
      cleanDate?.();
      cleanC1?.();
      cleanC2?.();
    };
  }, [datesList]);

  // Duration selection
  const handleSelectDuration = (mins: number, price: number) => {
    setSelectedDuration(mins);
    setBaseCourtPrice(price);
    setSelectedSlot(null);
  };

  // Slot click
  const handleChooseSlot = (slot: SlotItem) => {
    const timeLabel = `من ${slot.fullTime} إلى ${slot.endTime}`;
    setSelectedSlot({
      ...slot,
      timeLabel,
    });
  };

  // Count my bookings
  const myBookingsCount = Object.keys(bookingsByDate).reduce((acc, d) => {
    const c1 = (bookingsByDate[d]?.court1 || []).filter((b) => b.userId === currentUserId).length;
    const c2 = (bookingsByDate[d]?.court2 || []).filter((b) => b.userId === currentUserId).length;
    return acc + c1 + c2;
  }, 0);

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (!selectedSlot) return;
    setHasBalls(false);
    setCustName('');
    setCustPhone('');
    setSelectedPayment('apple');
    setCheckoutTimer(600); // 10 minutes
    setIsCheckoutOpen(true);
  };

  // Checkout timer countdown
  useEffect(() => {
    let interval: any;
    if (isCheckoutOpen && checkoutTimer > 0) {
      interval = setInterval(() => {
        setCheckoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsCheckoutOpen(false);
            showToast('انتهى وقت الحجز المخصص، يرجى إعادة المحاولة.', 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckoutOpen, checkoutTimer]);

  const formatCheckoutTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Finalize booking
  const handleFinalizeBooking = () => {
    if (!selectedSlot) return;

    const trimmedName = custName.trim();
    const trimmedPhone = custPhone.trim();

    if (!trimmedName) {
      showToast('يرجى كتابة اسم الحاجز', 'error');
      return;
    }
    if (!trimmedPhone) {
      showToast('يرجى كتابة رقم الجوال', 'error');
      return;
    }

    const finalPrice = baseCourtPrice + (hasBalls ? BALL_PRICE : 0);
    const randomCodeNum = Math.floor(1000 + Math.random() * 9000);
    const displayId = `#MNF-${randomCodeNum}`;

    const paymentLabelMap: Record<string, string> = {
      cash: 'نقداً',
      card: 'بطاقة دفع',
      apple: 'Apple Pay',
    };
    const methodLabel = paymentLabelMap[selectedPayment] || 'غير محدد';

    // 1. Sync with Admin Context
    const courtId = selectedSlot.courtKey === 'court1' ? 'court-1' : 'court-2';
    const courtName = selectedSlot.courtKey === 'court1' ? 'ملعب منيفة 1' : 'ملعب منيفة 2';
    const sTime = formatTime12(selectedSlot.startMin).raw24;
    const eTime = formatTime12(selectedSlot.endMin).raw24;

    const contextCreatedBooking = addBooking({
      courtId,
      courtName,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      date: selectedIsoDate,
      startTime: sTime,
      endTime: eTime,
      durationMinutes: selectedSlot.duration,
      status: 'confirmed',
      paymentStatus: selectedPayment === 'cash' ? 'unpaid' : 'paid',
      paymentMethod: selectedPayment === 'apple' ? 'apple_pay' : selectedPayment === 'card' ? 'mada' : 'cash',
      courtPrice: baseCourtPrice,
      racketRentalsCount: 0,
      racketPrice: 0,
      ballsCount: hasBalls ? 1 : 0,
      ballsPrice: hasBalls ? BALL_PRICE : 0,
      totalPrice: finalPrice,
      matchType: 'friendly',
      notes: hasBalls ? 'مضاف علبة كور جديدة أصلية (+15 ر.س)' : undefined,
    });

    // 2. Save in local storage structure matching the user's booking site
    const newBookingRecord = {
      ...selectedSlot,
      id: randomCodeNum,
      displayId,
      contextBookingId: contextCreatedBooking?.id,
      userId: currentUserId,
      clientName: trimmedName,
      clientPhone: trimmedPhone,
      bookedDate: selectedDate,
      balls: hasBalls ? 1 : 0,
      paymentMethod: methodLabel,
      totalPrice: finalPrice,
      durationLabel: getDurationLabel(selectedSlot.duration),
    };

    const bCopy = { ...bookingsByDate };
    if (!bCopy[selectedDate]) {
      bCopy[selectedDate] = { court1: [], court2: [] };
    }
    const cKey = selectedSlot.courtKey || 'court1';
    bCopy[selectedDate][cKey] = [...(bCopy[selectedDate][cKey] || []), newBookingRecord];

    saveBookingsToStorage(bCopy);

    localStorage.setItem('manifa_user_phone', trimmedPhone);
    setUserSavedPhone(trimmedPhone);
    if (contextCreatedBooking?.id) {
      setLastCreatedBookingId(contextCreatedBooking.id);
    }

    // Close checkout, clear selection, show ticket modal
    setIsCheckoutOpen(false);
    setSelectedSlot(null);
    setCurrentTicketData(newBookingRecord);
    setIsTicketOpen(true);
  };

  // Cancel my booking
  const handleCancelBooking = (dateKey: string, courtKey: 'court1' | 'court2', bookingId: any, ctxId?: string) => {
    const bCopy = { ...bookingsByDate };
    if (bCopy[dateKey] && bCopy[dateKey][courtKey]) {
      bCopy[dateKey][courtKey] = bCopy[dateKey][courtKey].filter((b: any) => b.id != bookingId);
      saveBookingsToStorage(bCopy);
    }

    if (ctxId) {
      updateBookingStatus(ctxId, 'cancelled');
    }

    showToast('تم إلغاء الحجز بنجاح وإعادة الوقت للجدول', 'info');
  };

  // Slots lists: exactly 23 slots spanning from 4:00 PM to 3:00 AM
  const court1Slots = generateCourtSlots('court1', selectedDuration);
  const court2Slots = generateCourtSlots('court2', selectedDuration);

  const filterSlots = (slots: SlotItem[]) => {
    return slots.filter((s) => {
      // Dynamic Time Period Filter based on operational bounds
      const matchesPeriod =
        timePeriodFilter === 'all'
          ? true
          : timePeriodFilter === 'evening'
          ? s.startMin < midMins
          : s.startMin >= midMins;

      const matchesUnavailable =
        showUnavailable || s.type === 'AVAILABLE' || s.type === 'MY_BOOKING';

      return matchesPeriod && matchesUnavailable;
    });
  };

  const visibleC1 = filterSlots(court1Slots);
  const visibleC2 = filterSlots(court2Slots);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="manifa-booking-page"
      className="min-h-screen bg-[#f1f5f9] text-slate-800 antialiased flex flex-col items-center selection:bg-[#0273a8] selection:text-white pb-12"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      {/* Top Header Admin Navigation Bar */}
      <div className="w-full max-w-md bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-xs z-30 shadow-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSwitchToAdmin}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition active:scale-95 border border-white/20 text-[11px]"
            title="العودة إلى لوحة تحكم الإدارة"
          >
            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>لوحة الإدارة</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHoursModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition active:scale-95 border border-amber-400/30 text-[11px]"
            title="تعديل وقت فتح وإغلاق الملعبين (للإدارة)"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>أوقات التشغيل ({openLabel} - {closeLabel})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            مزامنة لحظية
          </span>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition"
            title="تبديل المظهر"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Single Column Card identical to user's site */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-x-hidden">
        {/* Hero Image & Title Banner */}
        <div className="relative w-full h-48 sm:h-56 bg-slate-900 overflow-hidden rounded-b-2xl shrink-0">
          <img
            id="heroImage"
            src="https://i.postimg.cc/Hndnyxqt/d43a379f-df9e-42d2-9d8a-6e5f4b10b75f.jpg"
            alt="Manifa Header"
            className="w-full h-auto object-contain object-top transition-all duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-4 inset-x-0 px-5 text-white z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">بادل منيفة</h1>
              <p className="text-[11px] text-white/80 font-medium mt-0.5">Manifa Camp</p>
            </div>

            {/* My Bookings Quick Button */}
            {myBookingsCount > 0 && (
              <button
                id="myBookingsQuickBtn"
                onClick={() => setIsMyBookingsOpen(true)}
                className="py-1.5 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-lg"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-300" />
                <span>حجوزاتي (<span id="myBookingsBadge">{myBookingsCount}</span>)</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div
          id="mainContent"
          className={`flex-1 p-4 space-y-5 transition-all duration-300 ${
            selectedSlot ? 'pb-36' : 'pb-24'
          }`}
        >
          {/* Section: Amenities (المرفقات) */}
          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-2">المرفقات</h2>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs shrink-0">
                <span>بادل</span>
                <span className="text-[#0273a8] font-bold">🎾</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs shrink-0">
                <span>مياه</span>
                <i className="fa-solid fa-bottle-water text-cyan-600"></i>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs shrink-0">
                <span>دورات مياه</span>
                <i className="fa-solid fa-restroom text-purple-600"></i>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs shrink-0">
                <span>مواقف</span>
                <i className="fa-solid fa-square-parking text-emerald-600"></i>
              </div>
            </div>
          </section>

          {/* Section: Working Hours & Location Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs text-center">
              <div>
                <span className="text-xs font-bold text-slate-800 block">أوقات العمل:</span>
                <span className="text-[11px] font-bold text-[#0273a8] block mt-1">
                  {openLabel} - {closeLabel}
                </span>
              </div>
              <button
                onClick={() => setIsContactOpen(true)}
                className="mt-3 w-full py-2 bg-[#0273a8] hover:bg-[#015780] text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95"
              >
                تواصل معنا
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs text-center">
              <div>
                <span className="text-xs font-bold text-slate-800 block">مكان الملعب</span>
                <span className="text-[11px] font-semibold text-slate-500 block mt-1">الخفجي - منيفة</span>
              </div>
              <button
                onClick={() => setIsDirectionsOpen(true)}
                className="mt-3 w-full py-2 bg-[#0273a8] hover:bg-[#015780] text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95"
              >
                الإتجاهات
              </button>
            </div>
          </div>

          {/* Section: Date Picker (اختار اليوم) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-800">اختار اليوم</h2>
            </div>
            <div
              ref={datePickerRef}
              id="datePickerContainer"
              className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 cursor-grab active:cursor-grabbing select-none scroll-smooth touch-pan-x"
            >
              {datesList.map((item) => {
                const isSel = item.date === selectedDate;
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.date);
                      setSelectedIsoDate(item.isoDate);
                      setSelectedSlot(null);
                    }}
                    className={`py-2 px-3 rounded-2xl border flex flex-col items-center justify-between min-w-[76px] h-[74px] transition shrink-0 select-none ${
                      isSel
                        ? 'border-2 border-[#0273a8] bg-blue-50/70 text-[#0273a8] font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 font-semibold hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px]">{item.day}</span>
                    <span className="text-base font-black">{item.dayNum}</span>
                    <span className="text-[10px]">{item.monthName}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section: Duration Selection (المدة) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-800">المدة</h2>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectDuration(60, 140)}
                id="dur-60"
                className={`duration-btn py-2.5 px-1 min-h-[60px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                  selectedDuration === 60
                    ? 'border-2 border-[#0273a8] bg-blue-50/70 text-[#0273a8] font-extrabold text-xs shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 font-bold text-xs'
                }`}
              >
                <span className="whitespace-nowrap">60 دقيقة</span>
                <span
                  className={`text-[10px] font-bold ${
                    selectedDuration === 60 ? 'text-[#0273a8] font-black' : 'text-slate-400'
                  }`}
                >
                  140 ر.س
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDuration(90, 190)}
                id="dur-90"
                className={`duration-btn py-2.5 px-1 min-h-[60px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                  selectedDuration === 90
                    ? 'border-2 border-[#0273a8] bg-blue-50/70 text-[#0273a8] font-extrabold text-xs shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 font-bold text-xs'
                }`}
              >
                <span className="whitespace-nowrap">90 دقيقة</span>
                <span
                  className={`text-[10px] font-bold ${
                    selectedDuration === 90 ? 'text-[#0273a8] font-black' : 'text-slate-400'
                  }`}
                >
                  190 ر.س
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDuration(120, 240)}
                id="dur-120"
                className={`duration-btn py-2.5 px-1 min-h-[60px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                  selectedDuration === 120
                    ? 'border-2 border-[#0273a8] bg-blue-50/70 text-[#0273a8] font-extrabold text-xs shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 font-bold text-xs'
                }`}
              >
                <span className="whitespace-nowrap">120 دقيقة</span>
                <span
                  className={`text-[10px] font-bold ${
                    selectedDuration === 120 ? 'text-[#0273a8] font-black' : 'text-slate-400'
                  }`}
                >
                  240 ر.س
                </span>
              </button>
            </div>
          </section>

          {/* Section: Operating Window & Filter Controls */}
          <section className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Layout Switcher (Grid vs Slider) */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 w-fit">
                <button
                  type="button"
                  onClick={() => setSlotsLayoutMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    slotsLayoutMode === 'grid'
                      ? 'bg-white text-[#0273a8] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="عرض جميع الفترات في شبكة متكاملة"
                >
                  شبكة كاملة
                </button>
                <button
                  type="button"
                  onClick={() => setSlotsLayoutMode('slider')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    slotsLayoutMode === 'slider'
                      ? 'bg-white text-[#0273a8] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="عرض في شريط تمرير أفقي"
                >
                  شريط تمرير
                </button>
              </div>

              {/* Unavailable Slots Toggle */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">عرض الساعات المحجوزة وغير المتاحة</span>
                  <span className="text-[10px] text-slate-400">مفعل لإظهار كافة الأوقات المحجوزة بوضوح</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="toggleUnavailable"
                    checked={showUnavailable}
                    onChange={(e) => setShowUnavailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0273a8]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Courts Slots Sections */}
          <section className="space-y-4">
            {/* Court 1 - بادل 1 */}
            <div className="court-block bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs" id="court1-block">
              <div className="court-header flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] inline-block animate-pulse"></span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">Court 1 - بادل 1</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {openLabel} إلى {closeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                    {visibleC1.filter((s) => s.type === 'AVAILABLE').length} متاح
                  </span>
                  <span className="font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
                    {visibleC1.filter((s) => s.type !== 'AVAILABLE').length} محجوز
                  </span>

                  {slotsLayoutMode === 'slider' && (
                    <div className="flex items-center gap-1 mr-1">
                      <button
                        type="button"
                        onClick={() => scrollContainer(court1SlotsRef, 'right')}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black transition"
                        title="تمرير للأمام"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollContainer(court1SlotsRef, 'left')}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black transition"
                        title="تمرير للسهرة والفجر"
                      >
                        ←
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Slot Cards Container */}
              <div
                ref={court1SlotsRef}
                id="court1-slots"
                className={
                  slotsLayoutMode === 'grid'
                    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 py-1.5 dir-rtl'
                    : 'grid grid-rows-2 grid-flow-col auto-cols-[84px] gap-2 overflow-x-auto no-scrollbar py-1.5 scroll-smooth touch-pan-x cursor-grab active:cursor-grabbing select-none dir-rtl'
                }
              >
                {visibleC1.length === 0 ? (
                  <div className="col-span-full w-full py-6 text-center text-xs text-slate-400">
                    لا توجد فترات مطابقة للفلتر المحدد
                  </div>
                ) : (
                  visibleC1.map((slot) => {
                    const isSelected = selectedSlot && selectedSlot.id === slot.id;

                    if (slot.type === 'MY_BOOKING') {
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setIsMyBookingsOpen(true)}
                          className="w-full min-h-[58px] py-1.5 px-1 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center shrink-0 shadow-2xs hover:bg-emerald-100 transition-colors"
                          title="حجزك المؤكد - اضغط لعرض التذكرة"
                        >
                          <span className="text-[9px] font-black text-emerald-600 mb-0.5">✓ حجزك</span>
                          <span className="font-black text-xs">
                            {slot.time} {slot.period}
                          </span>
                        </button>
                      );
                    }

                    if (slot.type === 'BOOKED') {
                      return (
                        <div
                          key={slot.id}
                          className="w-full min-h-[58px] py-1.5 px-1 rounded-xl border border-dashed border-rose-300 bg-rose-50/90 text-rose-700 flex flex-col items-center justify-center shrink-0 shadow-2xs select-none"
                          title={slot.timeLabel || 'هذا الوقت محجوز بالفعل'}
                        >
                          <span className="line-through text-xs font-bold text-slate-400">{slot.time} {slot.period}</span>
                          <span className="text-[9px] font-black text-rose-600 bg-rose-500/15 px-1.5 py-0.2 rounded mt-0.5">محجوز 🔒</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleChooseSlot(slot)}
                        className={`w-full min-h-[58px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'border-2 border-[#0273a8] bg-blue-50/80 text-[#0273a8] shadow-xs font-bold'
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-black text-sm tracking-tight">
                          {slot.time} {slot.period}
                        </span>
                        <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-[#0273a8]' : 'text-emerald-600'}`}>
                          {isSelected ? 'محدد' : 'متاح'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Court 2 - بادل 2 */}
            <div className="court-block bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs" id="court2-block">
              <div className="court-header flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] inline-block animate-pulse"></span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">Court 2 - بادل 2</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {openLabel} إلى {closeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                    {visibleC2.filter((s) => s.type === 'AVAILABLE').length} متاح
                  </span>
                  <span className="font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
                    {visibleC2.filter((s) => s.type !== 'AVAILABLE').length} محجوز
                  </span>

                  {slotsLayoutMode === 'slider' && (
                    <div className="flex items-center gap-1 mr-1">
                      <button
                        type="button"
                        onClick={() => scrollContainer(court2SlotsRef, 'right')}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black transition"
                        title="تمرير للأمام"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollContainer(court2SlotsRef, 'left')}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black transition"
                        title="تمرير للسهرة والفجر"
                      >
                        ←
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Slot Cards Container */}
              <div
                ref={court2SlotsRef}
                id="court2-slots"
                className={
                  slotsLayoutMode === 'grid'
                    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 py-1.5 dir-rtl'
                    : 'grid grid-rows-2 grid-flow-col auto-cols-[84px] gap-2 overflow-x-auto no-scrollbar py-1.5 scroll-smooth touch-pan-x cursor-grab active:cursor-grabbing select-none dir-rtl'
                }
              >
                {visibleC2.length === 0 ? (
                  <div className="col-span-full w-full py-6 text-center text-xs text-slate-400">
                    لا توجد فترات مطابقة للفلتر المحدد
                  </div>
                ) : (
                  visibleC2.map((slot) => {
                    const isSelected = selectedSlot && selectedSlot.id === slot.id;

                    if (slot.type === 'MY_BOOKING') {
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setIsMyBookingsOpen(true)}
                          className="w-full min-h-[58px] py-1.5 px-1 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center shrink-0 shadow-2xs hover:bg-emerald-100 transition-colors"
                          title="حجزك المؤكد - اضغط لعرض التذكرة"
                        >
                          <span className="text-[9px] font-black text-emerald-600 mb-0.5">✓ حجزك</span>
                          <span className="font-black text-xs">
                            {slot.time} {slot.period}
                          </span>
                        </button>
                      );
                    }

                    if (slot.type === 'BOOKED') {
                      return (
                        <div
                          key={slot.id}
                          className="w-full min-h-[58px] py-1.5 px-1 rounded-xl border border-dashed border-rose-300 bg-rose-50/90 text-rose-700 flex flex-col items-center justify-center shrink-0 shadow-2xs select-none"
                          title={slot.timeLabel || 'هذا الوقت محجوز بالفعل'}
                        >
                          <span className="line-through text-xs font-bold text-slate-400">{slot.time} {slot.period}</span>
                          <span className="text-[9px] font-black text-rose-600 bg-rose-500/15 px-1.5 py-0.2 rounded mt-0.5">محجوز 🔒</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleChooseSlot(slot)}
                        className={`w-full min-h-[58px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'border-2 border-[#0273a8] bg-blue-50/80 text-[#0273a8] shadow-xs font-bold'
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-black text-sm tracking-tight">
                          {slot.time} {slot.period}
                        </span>
                        <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-[#0273a8]' : 'text-emerald-600'}`}>
                          {isSelected ? 'محدد' : 'متاح'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Bottom Bar (Slides in when slot is selected) */}
        {selectedSlot && (
          <div
            id="bookingStickyBar"
            className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-white border-t border-slate-200 p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.1)] z-40 flex flex-col gap-3 rounded-t-3xl transition-transform duration-300"
          >
            <div className="text-[11px] text-slate-700 font-bold bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200 flex items-center justify-center text-center">
              <Calendar className="w-3.5 h-3.5 ml-1.5 text-[#0273a8]" />
              <span id="barSummary">
                {selectedSlot.courtName?.split(' - ').pop()} • {selectedDate} • {selectedSlot.timeLabel} |{' '}
                {selectedSlot.duration} دقيقة
              </span>
            </div>

            <div className="flex justify-between items-center gap-4">
              <div className="text-right whitespace-nowrap min-w-[70px]">
                <span className="block text-[10px] text-slate-400 font-bold mb-0.5">المبلغ النهائي</span>
                <span className="text-xl font-black text-[#0273a8]" id="barPrice">
                  {baseCourtPrice} ر.س
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenCheckout}
                className="w-full bg-[#0273a8] hover:bg-[#015780] text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>احجز الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Checkout Modal (Slide in from bottom) */}
        {isCheckoutOpen && selectedSlot && (
          <div
            id="checkoutModal"
            onClick={() => setIsCheckoutOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-end justify-center cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl p-0 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-white rounded-t-3xl shrink-0">
                <h3 className="text-base font-black text-slate-800">تأكيد الحجز</h3>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Court Details Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
                  <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-[#0273a8]/20 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#10b981] tracking-wider uppercase block mb-0.5">
                        بادل منيفة
                      </span>
                      <h4 className="text-base font-black text-white" id="receiptCourt">
                        {selectedSlot.courtName}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#0273a8]" />
                        <span>منطقة الخفجي - منيفة</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0">
                      🎾
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex flex-col gap-2 text-xs font-bold text-slate-200 mt-2">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-slate-400">اليوم والتاريخ:</span>
                      <span id="receiptDate">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-slate-400">فترة الحجز:</span>
                      <span className="text-[#10b981] text-sm" id="receiptTime">
                        {selectedSlot.timeLabel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-slate-400">المدة:</span>
                      <span id="receiptDurationStr">{getDurationLabel(selectedSlot.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Tennis Balls Toggle */}
                <div
                  id="modalBallsToggle"
                  onClick={() => setHasBalls((prev) => !prev)}
                  className={`cursor-pointer border-2 rounded-2xl p-3 flex items-center justify-between transition-all duration-200 select-none shadow-xs ${
                    hasBalls ? 'border-[#0273a8] bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#0273a8] flex items-center justify-center text-xl shrink-0 transition">
                      🎾
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">إضافة علبة كور جديدة</span>
                      <span className="text-[10px] text-slate-400 font-medium">علبة أصلية مختومة (3 كرات)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-[#0273a8]">+15 ر.س</span>
                    <div
                      id="modalBallsCheckbox"
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-white transition text-[10px] ${
                        hasBalls ? 'bg-[#0273a8] border-[#0273a8]' : 'border-slate-300'
                      }`}
                    >
                      {hasBalls && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Customer Inputs (Empty initially as requested in user's html) */}
                <div className="space-y-3 bg-white border border-slate-100 p-3 rounded-2xl shadow-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم الحاجز</label>
                    <input
                      type="text"
                      id="custName"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0273a8] focus:bg-white transition"
                      placeholder="أدخل اسمك الكريم"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الجوال</label>
                    <input
                      type="tel"
                      id="custPhone"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0273a8] focus:bg-white transition text-left dir-ltr"
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 mb-2 px-1">طريقة الدفع</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment('cash')}
                      id="pay-cash"
                      className={`payment-method-btn py-3 px-1 border-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedPayment === 'cash'
                          ? 'border-[#0273a8] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-money-bill-wave text-lg text-slate-600"></i>
                      <span className="text-[10px] font-bold text-slate-600">نقداً</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment('card')}
                      id="pay-card"
                      className={`payment-method-btn py-3 px-1 border-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedPayment === 'card'
                          ? 'border-[#0273a8] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200'
                      }`}
                    >
                      <i className="fa-regular fa-credit-card text-lg text-slate-600"></i>
                      <span className="text-[10px] font-bold text-slate-600">بطاقة الدفع</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment('apple')}
                      id="pay-apple"
                      className={`payment-method-btn py-3 px-1 border-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selectedPayment === 'apple'
                          ? 'border-[#0273a8] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200'
                      }`}
                    >
                      <i className="fa-brands fa-apple text-xl text-slate-800"></i>
                      <span className="text-[10px] font-bold text-slate-800">Apple Pay</span>
                    </button>
                  </div>
                </div>

                {/* Final Price Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">إيجار الملعب:</span>
                    <span className="font-bold text-slate-800" id="receiptBasePrice">
                      {baseCourtPrice} ر.س
                    </span>
                  </div>

                  {hasBalls && (
                    <div className="flex justify-between text-[#0273a8] font-bold" id="receiptBallsRow">
                      <span>كور بادل جديدة:</span>
                      <span id="receiptBallsTotal">+15 ر.س</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm mt-1">
                    <span className="font-black text-slate-900">الإجمالي النهائي:</span>
                    <span className="font-black text-[#0273a8] text-lg" id="receiptFinalTotal">
                      {baseCourtPrice + (hasBalls ? BALL_PRICE : 0)} ر.س
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Submit & Timer */}
              <div className="border-t border-slate-100 p-4 bg-white shrink-0 pb-6 sm:pb-4 rounded-t-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-center gap-2 mb-3 text-[11px] font-bold text-red-500 animate-timer-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    الوقت المتبقي لإتمام الحجز: <span id="checkoutTimer">{formatCheckoutTimer(checkoutTimer)}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFinalizeBooking}
                  className="w-full py-3.5 bg-[#0273a8] hover:bg-[#015780] text-white font-extrabold text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>تأكيد الحجز</span>
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Modal (Success QR) */}
        {isTicketOpen && currentTicketData && (
          <div
            id="ticketModal"
            onClick={() => setIsTicketOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 shadow-2xl relative border border-slate-200 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-200 cursor-default"
            >
              <button
                type="button"
                onClick={() => setIsTicketOpen(false)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#0273a8] flex items-center justify-center text-3xl select-none mt-2 shadow-xs">
                <span>🎾</span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#0273a8] px-3.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                <Check className="w-3.5 h-3.5 text-[#0273a8]" />
                <span>تم تأكيد الحجز بنجاح</span>
              </div>

              <div className="space-y-1">
                <h3 id="ticketCourtTitle" className="text-base font-black text-slate-900 tracking-tight">
                  {currentTicketData.courtName}
                </h3>
                <p id="ticketDateTime" className="text-xs font-bold text-slate-600">
                  {currentTicketData.bookedDate} ▪ {currentTicketData.timeLabel}
                </p>
              </div>

              {/* Real QR Code Generated with QRServer */}
              <div className="w-56 h-56 bg-slate-50 rounded-3xl p-4 flex items-center justify-center border border-slate-200 shadow-inner my-1 relative">
                <img
                  id="ticketQrImage"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${currentTicketData.displayId}-PADEL-MANIFA`}
                  alt="باركود الدخول"
                  className="w-full h-full object-contain mix-blend-multiply relative z-10"
                />
              </div>

              <div className="space-y-1.5 pb-1 w-full flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-800 px-4 py-1.5 rounded-xl text-xs font-black">
                  <span>رقم الحجز:</span>
                  <span className="text-[#0273a8] font-black tracking-widest text-sm" id="ticketCodeDisplay">
                    {currentTicketData.displayId}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  يرجى إبراز هذا الرمز عند وصولك للملعب
                </span>
              </div>

              <div className="w-full pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = (currentTicketData.clientPhone || '').replace(/[^0-9]/g, '');
                    const message = encodeURIComponent(
                      `أهلاً كابتن ${currentTicketData.clientName} 🎾\nتذكرة حجزك في بادل منيفة:\n🏷️ رقم الحجز: ${currentTicketData.displayId}\n🏟️ ${currentTicketData.courtName}\n📅 التاريخ: ${currentTicketData.bookedDate}\n⏰ الوقت: ${currentTicketData.timeLabel}\n💰 المبلغ: ${currentTicketData.totalPrice} ريال\n📍 الموقع: الخفجي - منيفة\n\nنتمنى لك مباراة ممتعة!`
                    );
                    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال التذكرة عبر واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTicketOpen(false)}
                  className="w-full py-2.5 bg-[#0273a8] hover:bg-[#015780] text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
                >
                  <span>تم / إغلاق</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTicketOpen(false);
                    onSwitchToAdmin();
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <span>مشاهدة الحجز في لوحة الإدارة ←</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Bookings Modal */}
        {isMyBookingsOpen && (
          <div
            id="myBookingsModal"
            onClick={() => setIsMyBookingsOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-end justify-center cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0273a8] flex items-center justify-center text-sm">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">حجوزاتي المؤكدة</h3>
                    <p className="text-[10px] text-slate-400">تظهر لك وحدك ويمكنك إلغاؤها واستعادة الوقت للجدول</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMyBookingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div id="myBookingsListContainer" className="space-y-2.5">
                {(() => {
                  const my: any[] = [];
                  Object.keys(bookingsByDate).forEach((d) => {
                    ['court1', 'court2'].forEach((court) => {
                      (bookingsByDate[d]?.[court as 'court1' | 'court2'] || []).forEach((b) => {
                        if (b.userId === currentUserId) {
                          my.push({ ...b, dateKey: d, courtKey: court });
                        }
                      });
                    });
                  });

                  if (my.length === 0) {
                    return (
                      <div className="text-center py-6 text-xs text-slate-400">
                        لا توجد لديك حجوزات مؤكدة
                      </div>
                    );
                  }

                  return my.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {b.courtName} - {b.dateKey}
                        </div>
                        <div className="mt-0.5 text-slate-500 flex items-center gap-1.5">
                          <span>{b.timeLabel}</span>
                          <span className="text-[9px] font-black text-[#0273a8]">{b.displayId}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b.dateKey, b.courtKey, b.id, b.contextBookingId)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold active:scale-95 transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  ));
                })()}
              </div>

              <button
                type="button"
                onClick={() => setIsMyBookingsOpen(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {isContactOpen && (
          <div
            id="contactModal"
            onClick={() => setIsContactOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5 text-center space-y-4 shadow-2xl cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0273a8] flex items-center justify-center text-xl mx-auto">
                <Headset className="w-6 h-6 text-[#0273a8]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">إدارة ملاعب منيفة</h3>
                <p className="text-xs text-slate-500 mt-1">الخفجي - منيفة</p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      'https://wa.me/966549631314?text=السلام%20عليكم،%20استفسار%20بخصوص%20حجز%20ملعب%20بادل%20منيفة',
                      '_blank'
                    )
                  }
                  className="w-full py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <i className="fa-brands fa-whatsapp text-sm"></i>
                  <span>محادثة واتساب مباشرة</span>
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.href = 'tel:+966549631314')}
                  className="w-full py-2.5 bg-[#0273a8] hover:bg-[#015780] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال هاتفي مباشر</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold pt-1"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* Directions Modal */}
        {isDirectionsOpen && (
          <div
            id="directionsModal"
            onClick={() => setIsDirectionsOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5 text-center space-y-4 shadow-2xl cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0273a8] flex items-center justify-center text-xl mx-auto">
                <MapPin className="w-6 h-6 text-[#0273a8]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">موقع الملعب</h3>
                <p className="text-xs text-slate-500 mt-1">الخفجي - منيفة</p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.open('https://maps.google.com/?q=27.595417,48.933167', '_blank')}
                  className="w-full py-2.5 bg-[#0273a8] hover:bg-[#015780] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في خرائط جوجل</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectionsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold pt-1"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>

      <OperatingHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
      />
    </div>
  );
};
