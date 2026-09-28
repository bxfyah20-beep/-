import React, { useState, useEffect, useMemo } from 'react';
import { usePadel } from '../context/PadelContext';
import { Booking } from '../types/padel';
import { getTodayDateString } from '../data/mockData';
import { formatArabicTime, formatTimeRange } from '../utils/timeFormat';
import { NavTab } from './Sidebar';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Tag,
  Lock,
  Eye,
  KeyRound,
  Bell,
  BellOff,
  CheckCheck,
  CalendarDays,
  RotateCcw,
  Trash2,
  Info,
  Layers,
  ArrowLeft,
  Plus,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface DashboardOverviewProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenNewBooking: () => void;
  onOpenCustomerBookingView: () => void;
  onSelectBookingById?: (bookingId?: string, bookingCode?: string) => void;
  onViewInSchedule?: (booking: Booking) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  onOpenNewBooking,
  onOpenCustomerBookingView,
  onSelectBookingById,
  onViewInSchedule,
}) => {
  const {
    bookings,
    courts,
    canViewRevenue,
    clubSettings,
    currentUser,
    theme,
    notifications,
    unreadNotificationsCount,
    soundEnabled,
    toggleSoundEnabled,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    desktopPermission,
    requestDesktopPermission,
    setIsDesktopModalOpen,
    clearPastNotifications,
    clearAllNotifications,
    setSelectedDate,
    sendWhatsAppBookingConfirmation,
  } = usePadel();

  const isDark = theme === 'dark';
  const [overviewBookingsFilter, setOverviewBookingsFilter] = useState<'all' | 'today' | 'confirmed' | 'pending'>('all');

  // Dynamic daily state - auto-renews when the day changes
  const [todayDateStr, setTodayDateStr] = useState<string>(getTodayDateString());
  const [activeDayFilter, setActiveDayFilter] = useState<'today' | 'past' | 'all'>('today');

  // Listen for date rollover (at midnight or when user focuses the tab)
  useEffect(() => {
    const updateDay = () => {
      const nowToday = getTodayDateString();
      if (nowToday !== todayDateStr) {
        setTodayDateStr(nowToday);
      }
    };
    const timer = setInterval(updateDay, 30000); // Check every 30s
    window.addEventListener('focus', updateDay);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', updateDay);
    };
  }, [todayDateStr]);

  // Arabic formatted date for today
  const formatArabicToday = () => {
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const now = new Date();
    const day = arabicDays[now.getDay()];
    const dateNum = now.getDate();
    const month = arabicMonths[now.getMonth()];
    const year = now.getFullYear();
    return `${day}، ${dateNum} ${month} ${year}`;
  };

  // Helper to format any date string to friendly Arabic (without bright green dot)
  const formatNotificationDate = (dateStr?: string) => {
    if (!dateStr || dateStr === todayDateStr) return 'اليوم';
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${arabicDays[d.getDay()]} (${d.getDate()} ${arabicMonths[d.getMonth()]})`;
  };

  // Filter notifications based on today vs past
  const todayNotifications = notifications.filter(
    (n) => n.date === todayDateStr || (!n.date && n.timestamp === 'الآن')
  );
  const pastNotifications = notifications.filter(
    (n) => n.date && n.date !== todayDateStr
  );

  const displayedNotifications =
    activeDayFilter === 'today'
      ? todayNotifications
      : activeDayFilter === 'past'
      ? pastNotifications
      : notifications;

  // Metrics - Today focused & Verified Financial Calculations
  const activeCourtsCount = courts.filter((c) => c.isActive).length;
  const todayBookings = bookings.filter((b) => b.date === todayDateStr);
  const confirmedBookings = todayBookings.filter((b) => b.status === 'confirmed');
  const pendingBookings = todayBookings.filter((b) => b.status === 'pending');
  const activeTodayBookings = todayBookings.filter((b) => b.status !== 'cancelled');

  // 1. Actually collected / received payments today (paid bookings)
  const totalCollectedToday = activeTodayBookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // 2. Total monetary value of all today's active bookings
  const totalBookingsValue = activeTodayBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // 3. Pending collection amounts today (unpaid / cash on arrival)
  const totalPendingAmount = activeTodayBookings
    .filter((b) => b.paymentStatus !== 'paid')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const totalBallsSold = confirmedBookings.reduce((sum, b) => sum + b.ballsCount, 0);

  const displayedOverviewBookings = useMemo(() => {
    let list = bookings;
    if (overviewBookingsFilter === 'today') {
      list = bookings.filter((b) => b.date === todayDateStr);
    } else if (overviewBookingsFilter === 'confirmed') {
      list = bookings.filter((b) => b.status === 'confirmed');
    } else if (overviewBookingsFilter === 'pending') {
      list = bookings.filter((b) => b.status === 'pending');
    }

    return [...list].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.startTime || '').localeCompare(a.startTime || '');
    });
  }, [bookings, overviewBookingsFilter, todayDateStr]);

  // Common card style with contrast enhancement
  const cardBgClass = isDark
    ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9] shadow-xs'
    : 'bg-white border-[#CBD5E1] text-[#0F172A] shadow-xs';

  return (
    <div id="dashboard-overview" className="space-y-6 pb-12">
      {/* Top Welcome Bar: Shortened title to 'نظرة عامة' and removed duplicate 'حجز جديد' */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${cardBgClass}`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                currentUser.role === 'admin'
                  ? 'bg-[#0369A1]/20 text-[#38BDF8] border border-[#0369A1]/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {currentUser.role === 'admin' ? 'حساب المدير العام' : 'حساب موظف الملاعب'}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {clubSettings.location}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            نظرة عامة
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            متابعة تشغيل ملعبي {clubSettings.clubName}، تنظيم الحجوزات، وضبط العروض والأسعار.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onOpenCustomerBookingView}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              isDark
                ? 'bg-[#18263B] hover:bg-[#18263B]/80 text-[#F1F5F9] border-[#2A3A50]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
            <span>صفحة حجز اللاعبين</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Accurate Collected Payments with Wallet Icon */}
        {canViewRevenue ? (
          <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                المبالغ المحصلة اليوم
              </span>
              <div className="w-9 h-9 rounded-2xl bg-[#0369A1]/15 text-[#0369A1] dark:bg-[#0369A1]/20 dark:text-[#38BDF8] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2.5">
              <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                {totalCollectedToday}{' '}
                <span className={`text-base font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0369A1]'}`}>
                  {clubSettings.currency}
                </span>
              </div>
              <div className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                من إجمالي قيمة حجوزات اليوم: {totalBookingsValue} {clubSettings.currency}
              </div>
            </div>
            <div className={`text-xs font-semibold flex items-center justify-between pt-2 border-t ${
              isDark ? 'text-slate-300 border-white/10' : 'text-slate-600 border-slate-200'
            }`}>
              <span>المتبقي للتحصيل:</span>
              <span className={totalPendingAmount > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                {totalPendingAmount} {clubSettings.currency}
              </span>
            </div>
          </div>
        ) : (
          <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                المبالغ المحصلة اليوم
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2.5">
              <div className={`text-2xl font-black tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                •••••• {clubSettings.currency}
              </div>
              <div className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                محجوب عن حساب العامل 🔒
              </div>
            </div>
            <div className={`text-xs font-semibold pt-2 border-t ${
              isDark ? 'text-slate-400 border-white/10' : 'text-slate-500 border-slate-200'
            }`}>
              <span>يتطلب صلاحية المدير العام</span>
            </div>
          </div>
        )}

        {/* Card 2: Confirmed Bookings */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              الحجوزات المؤكدة
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#0369A1]/15 text-[#0369A1] dark:bg-[#0369A1]/25 dark:text-[#38BDF8] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              {bookings.filter((b) => b.status === 'confirmed').length}{' '}
              <span className={`text-sm font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0369A1]'}`}>حجز</span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {confirmedBookings.length} اليوم • {bookings.filter((b) => b.status !== 'cancelled').length} إجمالي الحجوزات
            </div>
          </div>
          <div className={`text-xs font-semibold pt-2 border-t ${
            isDark ? 'text-[#CBD5E1] border-white/10' : 'text-slate-600 border-slate-200'
          }`}>
            <span className={pendingBookings.length > 0 ? 'text-amber-500 font-bold' : ''}>
              {pendingBookings.length}
            </span>{' '}
            قيد الانتظار أو السداد
          </div>
        </div>

        {/* Card 3: Active Courts */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              حالة الملاعب
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#0369A1]/15 text-[#0369A1] dark:bg-[#0369A1]/25 dark:text-[#38BDF8] flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className={`text-3xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              <span>{activeCourtsCount} / {courts.length}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                جاهزة للعب
              </span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-slate-600'}`}>
              Court 1 و Court 2
            </div>
          </div>
          <div className={`text-xs font-semibold pt-2 border-t ${
            isDark ? 'text-slate-300 border-white/10' : 'text-slate-600 border-slate-200'
          }`}>
            مفتوحة حتى <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatArabicTime(clubSettings.closingTime)}</span>
          </div>
        </div>

        {/* Card 4: Equipment & Balls */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              علب الكرات والمعدات
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#0369A1]/15 text-[#0369A1] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              {totalBallsSold}{' '}
              <span className={`text-sm font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0369A1]'}`}>علبة مباعة</span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              سعر العلبة 15 ر.س
            </div>
          </div>
          <div className={`text-xs font-semibold pt-2 border-t ${
            isDark ? 'text-slate-300 border-white/10' : 'text-slate-600 border-slate-200'
          }`}>
            تسليم مباشر عند وصول اللاعبين
          </div>
        </div>
      </div>

      {/* Real-time Booking Notifications Section (Compact, Row Layout, Calm Blue Badge, No Test Tools) */}
      <div
        id="dashboard-live-notifications-panel"
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${cardBgClass}`}
      >
        {/* Header: Clean Title + Calm Blue Badge + Sound & Permission Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <h2 className={`text-base font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#0F172A]'
            }`}>
              تنبيهات الحجوزات المباشرة
            </h2>
            {unreadNotificationsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800/60">
                {unreadNotificationsCount} جديد
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Desktop Notification Switch */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                desktopPermission === 'granted'
                  ? isDark
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark
                  ? 'bg-black/20 border-white/10 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={desktopPermission === 'granted'}
                  onChange={() => {
                    if (desktopPermission !== 'granted') {
                      requestDesktopPermission();
                    } else {
                      setIsDesktopModalOpen(true);
                    }
                  }}
                />
                <div className="w-8 h-4.5 bg-slate-400/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0073a8] relative" />
                <span className="text-xs">إشعارات المتصفح</span>
              </label>
              {desktopPermission === 'granted' ? (
                <span className="text-xs font-bold text-emerald-500">مفعّلة ✓</span>
              ) : (
                <button
                  onClick={requestDesktopPermission}
                  className="text-xs text-[#0073a8] dark:text-sky-400 underline font-bold"
                >
                  تفعيل
                </button>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSoundEnabled}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? isDark
                    ? 'bg-sky-500/20 border-sky-400/40 text-sky-300 hover:bg-sky-500/30'
                    : 'bg-sky-50 border-sky-200 text-[#0073a8] hover:bg-sky-100'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-400 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'صوت التنبيهات مفعّل (انقر للكتم)' : 'صوت التنبيهات مكتوم (انقر للتفعيل)'}
            >
              {soundEnabled ? <Bell className="w-4 h-4 text-sky-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Mark All Read */}
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-all"
                title="تحديد الكل كمقروء"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            {/* Info Modal */}
            <button
              onClick={() => setIsDesktopModalOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-all"
              title="دليل الإشعارات"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs and Clear Action */}
        <div className="pt-3 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-5">
              <button
                id="tab-notifs-today"
                onClick={() => setActiveDayFilter('today')}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${
                  activeDayFilter === 'today'
                    ? 'text-[#0073a8] dark:text-sky-400 font-black border-b-2 border-[#0073a8] -mb-px'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>تنبيهات اليوم</span>
                <span className="mr-1.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-[#0073a8]/15 text-[#0073a8] dark:text-sky-300">
                  {todayNotifications.length}
                </span>
              </button>

              <button
                id="tab-notifs-past"
                onClick={() => setActiveDayFilter('past')}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${
                  activeDayFilter === 'past'
                    ? 'text-[#0073a8] dark:text-sky-400 font-black border-b-2 border-[#0073a8] -mb-px'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>الأيام السابقة</span>
                <span className="mr-1.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-slate-500/15 text-slate-500 dark:text-slate-400">
                  {pastNotifications.length}
                </span>
              </button>

              <button
                id="tab-notifs-all"
                onClick={() => setActiveDayFilter('all')}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${
                  activeDayFilter === 'all'
                    ? 'text-[#0073a8] dark:text-sky-400 font-black border-b-2 border-[#0073a8] -mb-px'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>كافة التنبيهات</span>
                <span className="mr-1.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-slate-500/15 text-slate-500 dark:text-slate-400">
                  {notifications.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 pb-2 sm:pb-0 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-[#0073a8] dark:text-sky-400" />
                <span>اليوم: {formatArabicToday()}</span>
              </div>

              {pastNotifications.length > 0 && activeDayFilter === 'past' && (
                <button
                  onClick={clearPastNotifications}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-sky-500 transition-all"
                  title="مسح إشعارات الأيام السابقة"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تجديد لليوم</span>
                </button>
              )}

              {/* Accurately named 'مسح التنبيهات' instead of 'تفريغ' */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-500 text-xs font-bold transition-all"
                  title="مسح سجل التنبيهات (لا يؤثر على الحجوزات)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح التنبيهات</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Organized Row Layout for Notifications */}
        <div className="pt-1">
          {displayedNotifications.length === 0 ? (
            <div
              className={`p-4 sm:p-5 text-center rounded-2xl border border-dashed space-y-1.5 transition-colors ${
                isDark
                  ? 'bg-black/20 border-white/10 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="w-9 h-9 mx-auto rounded-xl bg-[#0073a8]/15 text-[#0073a8] dark:text-sky-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {activeDayFilter === 'today'
                  ? `لا توجد تنبيهات جديدة حتى الآن ليوم (${formatArabicToday()})`
                  : activeDayFilter === 'past'
                  ? 'لا توجد تنبيهات مسجلة للأيام السابقة'
                  : 'لا توجد أي تنبيهات مسجلة حالياً'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {activeDayFilter === 'today'
                  ? 'يتجدد هذا القسم تلقائياً عند قيام أي لاعب بحجز ملعب اليوم.'
                  : 'يمكنك مراجعة تبويب تنبيهات اليوم لمتابعة الحجوزات الواردة.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedNotifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (onSelectBookingById) {
                      onSelectBookingById(notif.bookingId, notif.bookingCode);
                    } else {
                      setActiveTab('bookings');
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    !notif.read
                      ? isDark
                        ? 'bg-[#18263B] border-sky-600/50 shadow-xs'
                        : 'bg-sky-50/80 border-sky-200 shadow-xs'
                      : isDark
                      ? 'bg-[#111C2E] border-[#2A3A50] hover:bg-[#18263B]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Customer details & Code */}
                  <div className="flex items-center gap-2.5 min-w-[210px]">
                    {!notif.read ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" title="تنبيه جديد" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400/30 shrink-0" />
                    )}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {notif.customerName}
                        </span>
                        {notif.bookingCode && (
                          <span className={`font-mono text-xs px-2 py-0.5 rounded-md font-bold ${
                            isDark
                              ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                              : 'bg-sky-100 text-[#0369A1] border border-sky-200'
                          }`}>
                            {notif.bookingCode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                        {notif.customerPhone}
                      </div>
                    </div>
                  </div>

                  {/* Court Name */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8] shrink-0" />
                    <span>{notif.courtName}</span>
                  </div>

                  {/* Clear time range with proper Arabic text & bidi numbers */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0369A1] dark:text-[#38BDF8]" dir="rtl">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <bdi className="font-semibold">{formatArabicTime(notif.time)}</bdi>
                    </div>

                    {notif.date === todayDateStr || (!notif.date && notif.timestamp === 'الآن') ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        اليوم
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                        {formatNotificationDate(notif.date)}
                      </span>
                    )}
                  </div>

                  {/* Action Button: عرض الحجز */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(notif.id);
                        if (onSelectBookingById) {
                          onSelectBookingById(notif.bookingId, notif.bookingCode);
                        } else {
                          setActiveTab('bookings');
                        }
                      }}
                      className="w-full md:w-auto px-3.5 py-1.5 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span>عرض الحجز</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Bookings Management List directly on Dashboard Overview */}
      <div
        id="dashboard-live-bookings-list"
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${cardBgClass}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-[#0073a8]/15 text-[#0073a8] dark:text-sky-300">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  سجل الحجوزات الواردة واليومية
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0073a8]/15 text-[#0073a8] dark:text-sky-300 border border-[#0073a8]/25">
                  {bookings.length} مسجل ({todayBookings.length} اليوم)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديث فوري ومباشر لجميع حجوزات الملاعب، إمكانية الانتقال لجدول الملاعب وتأكيد التذاكر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewBooking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0073a8] hover:bg-[#005f8a] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل حجز جديد</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
            >
              <span>كامل السجل ({bookings.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3 pb-3 overflow-x-auto">
          {[
            { key: 'all', label: 'كافة الحجوزات', count: bookings.length },
            { key: 'today', label: 'حجوزات اليوم', count: todayBookings.length },
            { key: 'confirmed', label: 'المؤكدة', count: bookings.filter((b) => b.status === 'confirmed').length },
            { key: 'pending', label: 'قيد الانتظار', count: bookings.filter((b) => b.status === 'pending').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setOverviewBookingsFilter(tab.key as any)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                overviewBookingsFilter === tab.key
                  ? 'bg-[#0073a8] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                overviewBookingsFilter === tab.key ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bookings Cards */}
        <div className="pt-1">
          {displayedOverviewBookings.length === 0 ? (
            <div className={`p-6 text-center rounded-2xl border border-dashed space-y-2 ${
              isDark ? 'bg-black/20 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <Calendar className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {overviewBookingsFilter === 'today'
                  ? `لا توجد حجوزات مجدولة لهذا اليوم حتى الآن (${formatArabicToday()})`
                  : 'لا توجد حجوزات مطابقة للفلتر المحدد'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onOpenNewBooking}
                  className="px-3 py-1.5 rounded-xl bg-[#0073a8] text-white text-xs font-bold hover:bg-[#005f8a]"
                >
                  تسجيل حجز جديد
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  عرض جدول الملاعب
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedOverviewBookings.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    if (onSelectBookingById) onSelectBookingById(b.id, b.bookingCode);
                    else setActiveTab('bookings');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-[#0369A1]/60 ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] hover:bg-[#1C2C44]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Player & Court Details */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-500 shadow-xs'
                          : b.status === 'cancelled'
                          ? 'bg-rose-500'
                          : 'bg-amber-500 animate-pulse'
                      }`}
                      title={b.status === 'confirmed' ? 'مؤكد' : b.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {b.customerName}
                        </span>
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          isDark
                            ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                            : 'bg-sky-100 text-[#0369A1] border border-sky-200'
                        }`}>
                          {b.bookingCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                        <span>{b.customerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Court, Date & Time */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {b.courtName}
                    </span>

                    <span className="px-2 py-0.5 rounded-md font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {b.date === todayDateStr ? 'اليوم' : b.date}
                    </span>

                    <div className="flex items-center gap-1.5 font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{formatTimeRange(b.startTime, b.endTime)}</span>
                    </div>

                    {b.ballsCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        كرة جديدة (+15)
                      </span>
                    )}
                  </div>

                  {/* Right: Price & Quick Action Buttons */}
                  <div className="flex items-center gap-2 justify-end">
                    {canViewRevenue && (
                      <div className="text-left ml-2 hidden sm:block">
                        <span className="text-sm font-black text-emerald-500 font-mono">
                          {b.totalPrice} {clubSettings.currency}
                        </span>
                        <span className={`block text-[10px] ${b.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {b.paymentStatus === 'paid' ? 'مدفوع ✓' : 'غير مدفوع'}
                        </span>
                      </div>
                    )}

                    {/* View in Schedule */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(b.date);
                        if (onViewInSchedule) {
                          onViewInSchedule(b);
                        } else {
                          setActiveTab('schedule');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-bold transition-all border border-sky-500/30 flex items-center gap-1 shrink-0"
                      title="عرض هذا الحجز في جدول الملاعب"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>عرض في الجدول</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sendWhatsAppBookingConfirmation(b);
                      }}
                      className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0"
                      title="إرسال تذكرة التأكيد عبر واتساب"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Manage Details */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectBookingById) onSelectBookingById(b.id, b.bookingCode);
                        else setActiveTab('bookings');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                    >
                      <span>تفاصيل الحجز</span>
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The 2 Courts Live Operational Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courts.slice(0, 2).map((court) => (
          <div
            key={court.id}
            className={`p-5 rounded-3xl border flex flex-col justify-between transition-colors ${cardBgClass}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    {court.name}
                  </h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                  isDark
                    ? 'bg-[#0369A1]/20 text-[#38BDF8] border-[#0369A1]/40'
                    : 'bg-sky-100 text-[#0369A1] border-sky-300'
                }`}>
                  90 دقيقة = 190 ر.س
                </span>
              </div>

              <div className={`space-y-1.5 text-xs mb-4 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <div>الأرضية: <strong className={isDark ? 'text-white' : 'text-[#0F172A]'}>{court.surface}</strong></div>
                <div>المرفقات: مواقف مخصصة، مياه شرب باردة، دورات مياه، إضاءة ليلية LED.</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`text-xs font-bold hover:underline ${isDark ? 'text-[#38BDF8]' : 'text-[#0369A1]'}`}
              >
                عرض جدول الملعب ←
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className="px-3.5 py-1.5 rounded-xl bg-[#0369A1] text-white text-xs font-bold hover:bg-[#0284C7] shadow-xs"
              >
                سجل الحجوزات
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('discounts')}
          className={`p-4 rounded-3xl border hover:border-[#0369A1] cursor-pointer transition-all space-y-1 ${cardBgClass}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <Tag className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
            <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>قسم العروض والخصومات</span>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            إضافة وتعديل كوبونات الخصم التي تظهر للاعبين في صفحة الحجز.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('users_security')}
          className={`p-4 rounded-3xl border hover:border-[#0369A1] cursor-pointer transition-all space-y-1 ${cardBgClass}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>تغيير كلمات سر العامل والمدير</span>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            إدارة وتغيير كلمات المرور لعمال وموظفي النادي وحساب الإدارة.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('bookings')}
          className={`p-4 rounded-3xl border hover:border-[#0369A1] cursor-pointer transition-all space-y-1 ${cardBgClass}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>سجل الحجوزات وإرسال واتساب</span>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            إرسال تذاكر الحجوزات وتعديل وإلغاء الحجوزات.
          </p>
        </div>
      </div>
    </div>
  );
};
