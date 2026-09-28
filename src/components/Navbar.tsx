import React, { useState, useRef, useEffect } from 'react';
import { usePadel } from '../context/PadelContext';
import { formatArabicTime } from '../utils/timeFormat';
import { IpnLogsModal } from './IpnLogsModal';
import { OperatingHoursModal } from './OperatingHoursModal';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  KeyRound,
  Moon,
  Sun,
  LogIn,
  LogOut,
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Trash2,
  ChevronDown,
  Camera,
  User,
  Lock,
  History,
} from 'lucide-react';

interface NavbarProps {
  currentView?: 'booking' | 'admin';
  setCurrentView?: (view: 'booking' | 'admin') => void;
  onOpenNewBooking: () => void;
  onOpenQuickPasswordModal?: () => void;
  onSelectBookingById?: (bookingId?: string, bookingCode?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenNewBooking,
  onSelectBookingById,
}) => {
  const {
    currentUser,
    clubSettings,
    showToast,
    theme,
    toggleTheme,
    setIsLoginModalOpen,
    openProfileModal,
    notifications,
    unreadNotificationsCount,
    soundEnabled,
    toggleSoundEnabled,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    lockWithIpn,
    bookings,
  } = usePadel();

  const isDark = theme === 'dark';
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isIpnLogsModalOpen, setIsIpnLogsModalOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="main-navbar-header"
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#0B1220]/95 border-[#2A3A50] text-[#F1F5F9]'
          : 'bg-white/95 border-[#CBD5E1] text-[#0F172A] shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Far Right: Clean Logo "بادل منيفة" */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0369A1] text-white flex items-center justify-center font-serif font-black text-lg shadow-xs shadow-[#0369A1]/30">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight">
                {clubSettings.clubName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8] border border-[#0369A1]/25">
                {clubSettings.location}
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsHoursModalOpen(true)}
                className="hover:text-[#0369A1] dark:hover:text-[#38BDF8] transition-colors cursor-pointer flex items-center gap-1 group"
                title="اضغط لتعديل ساعات العمل ووقت فتح وإغلاق الملاعب"
              >
                <span>ساعات العمل: {formatArabicTime(clubSettings.openingTime)} إلى {formatArabicTime(clubSettings.closingTime)}</span>
                <span className="text-[10px] text-[#0369A1] dark:text-[#38BDF8] underline font-bold opacity-80 group-hover:opacity-100">(تعديل)</span>
              </button>
              <span className="text-slate-300 dark:text-white/20">•</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>الملعبين جاهزة</span>
              </span>
            </div>
          </div>
        </div>

        {/* Far Left: User Info (سالم - المدير/العامل) next to Theme Toggle and Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Switch to Customer Booking Page */}
          {setCurrentView && (
            <button
              id="btn-nav-customer-booking"
              onClick={() => setCurrentView('booking')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                isDark
                  ? 'bg-sky-500/10 border-sky-400/30 text-sky-300 hover:bg-sky-500/20'
                  : 'bg-sky-50 border-sky-200 text-[#0073a8] hover:bg-sky-100'
              }`}
              title="الانتقال إلى صفحة حجز الملاعب للعملاء"
            >
              <span>🎾</span>
              <span className="hidden sm:inline">صفحة حجز اللاعبين</span>
              {bookings.filter((b) => b.status !== 'cancelled').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#0369A1] text-white">
                  {bookings.filter((b) => b.status !== 'cancelled').length}
                </span>
              )}
            </button>
          )}

          {/* Quick New Booking Button */}
          <button
            id="btn-nav-new-booking"
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0369A1] hover:bg-[#0284C7] text-white shadow-xs transition-all active:scale-95"
            title="إضافة حجز جديد"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">حجز جديد</span>
          </button>

          {/* Notifications Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              id="admin-notification-bell-btn"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className={`relative p-2 rounded-xl border transition-all ${
                unreadNotificationsCount > 0
                  ? isDark
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm shadow-sky-500/30'
                    : 'bg-sky-50 border-sky-300 text-[#0073a8] shadow-sm'
                  : isDark
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="تنبيهات الحجوزات الفورية"
            >
              {unreadNotificationsCount > 0 ? (
                <BellRing className="w-4 h-4 animate-bounce text-sky-400" />
              ) : (
                <Bell className="w-4 h-4" />
              )}

              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotifOpen && (
              <div
                className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-3xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-right ${
                  isDark
                    ? 'bg-[#0a1826] border-sky-500/30 text-white shadow-black/80'
                    : 'bg-white border-slate-200 text-slate-800 shadow-slate-300'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                      <Bell className="w-4 h-4" />
                    </span>
                    <span className="font-black text-xs sm:text-sm">
                      تنبيهات الحجوزات الفورية
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        {unreadNotificationsCount} جديد
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleSoundEnabled}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        soundEnabled
                          ? isDark
                            ? 'text-sky-300 hover:bg-sky-500/20'
                            : 'text-[#0073a8] hover:bg-sky-100'
                          : 'text-slate-400 hover:bg-slate-200/50'
                      }`}
                      title={soundEnabled ? 'صوت التنبيهات مفعّل (انقر للكتم)' : 'صوت التنبيهات مكتوم (انقر للتفعيل)'}
                    >
                      {soundEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    </button>

                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="تحديد الكل كمقروء"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="p-1.5 rounded-lg text-xs transition-colors text-slate-400 hover:text-rose-400"
                        title="مسح الإشعارات"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5 p-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                      <p className="font-bold">لا توجد إشعارات حالياً</p>
                      <p className="text-[11px] opacity-75">
                        أي شخص يحجز ملعباً سيصلك إشعار فوري هنا بصوت جرس وتفاصيل الحجز كاملاً.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (onSelectBookingById) {
                            onSelectBookingById(n.bookingId, n.bookingCode);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-3 rounded-2xl cursor-pointer transition-colors text-xs space-y-1.5 ${
                          !n.read
                            ? isDark
                              ? 'bg-sky-950/40 hover:bg-sky-950/60 text-white'
                              : 'bg-sky-50/70 hover:bg-sky-50 text-slate-900'
                            : isDark
                            ? 'hover:bg-white/5 text-slate-300'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-black">
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            )}
                            <span className="text-[#0073a8] font-bold">{n.customerName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.timestamp}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] opacity-85">
                          <span>{n.courtName} ({formatArabicTime(n.time)})</span>
                          {n.bookingCode && (
                            <span className="font-mono font-bold text-sky-400 text-[10px]">
                              {n.bookingCode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="font-mono text-slate-400">{n.customerPhone}</span>
                          <span className="text-[#0073a8] font-bold hover:underline">
                            عرض التفاصيل ←
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button (الوضع الفاتح / الداكن) */}
          <button
            id="theme-toggle-btn-nav"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
            title={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="hidden md:inline">الوضع الفاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#0073a8]" />
                <span className="hidden md:inline">الوضع الداكن</span>
              </>
            )}
          </button>

          {/* Clean Vertical Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/15" />

          {/* Quick Instant Lock with IPN Button */}
          <button
            type="button"
            id="nav-quick-ipn-lock-btn"
            onClick={() => lockWithIpn()}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isDark
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300 hover:bg-rose-900/40 hover:border-rose-500/50'
                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
            title="قفل الموقع فوراً برمز الـ IPN (لحماية الموقع وقسم الإدارة)"
          >
            <Lock className="w-4 h-4 text-rose-500" />
            <span className="hidden xl:inline text-[11px]">قفل بالـ IPN</span>
          </button>

          {/* User Info Profile (سالم - المدير العام / العامل) on Far Left */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="nav-user-account-btn"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-2xl border transition-all text-right ${
                currentUser.role === 'admin'
                  ? isDark
                    ? 'bg-[#0369A1]/15 border-[#0369A1]/30 hover:border-[#38BDF8] text-white'
                    : 'bg-sky-50/70 border-sky-200 hover:border-[#0369A1] text-slate-800'
                  : isDark
                  ? 'bg-amber-950/30 border-amber-500/30 hover:border-amber-400 text-white'
                  : 'bg-amber-50/70 border-amber-200 hover:border-amber-400 text-slate-800'
              }`}
              title="انقر لتبديل الدور (المدير / العامل) أو تسجيل الدخول"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-white/25 shrink-0"
              />
              <div className="text-right">
                <div className="text-xs font-black leading-tight flex items-center gap-1">
                  <span>{currentUser.name.split(' ')[0]}</span>
                  <KeyRound className="w-3 h-3 text-[#0369A1] dark:text-[#38BDF8]" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      currentUser.role === 'admin'
                        ? 'bg-[#0369A1]/20 text-[#0369A1] dark:text-[#38BDF8]'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'المدير العام' : 'العامل'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </div>
              </div>
            </button>

            {/* User Dropdown Menu for Roles & Auth */}
            {isUserMenuOpen && (
              <div
                className={`absolute left-0 mt-2 w-72 rounded-3xl border shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 text-right ${
                  isDark
                    ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9] shadow-black/80'
                    : 'bg-white border-slate-200 text-[#0F172A] shadow-slate-300'
                }`}
              >
                <div className="p-2.5 border-b border-slate-200 dark:border-[#2A3A50] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black">{currentUser.name}</div>
                    <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/30">
                      IPN: {currentUser.ipnCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] font-mono">{currentUser.phone}</div>
                  <div className="pt-0.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        currentUser.role === 'admin'
                          ? 'bg-[#0369A1]/20 text-[#38BDF8] border border-[#0369A1]/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {currentUser.role === 'admin'
                        ? 'صلاحيات المدير: عرض الأرباح والإحصائيات'
                        : 'صلاحيات العامل: حجب الأرباح المالية'}
                    </span>
                  </div>
                </div>

                {/* Profile Customization & Password & Switch Actions */}
                <div className="space-y-1 pt-1">
                  {/* IPN Logs Audit Viewer Button */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsIpnLogsModalOpen(true);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isDark
                        ? 'hover:bg-white/10 text-sky-400'
                        : 'hover:bg-sky-50 text-[#0369A1]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span>سجل دخول الـ IPN (من دخل؟)</span>
                    </div>
                    <span className="text-[10px] bg-sky-500/15 px-1.5 py-0.5 rounded font-mono">سجل الأمان</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openProfileModal('avatar');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isDark
                        ? 'hover:bg-white/10 text-[#B6C2D2]'
                        : 'hover:bg-slate-100 text-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>تغيير صورتي الشخصية</span>
                    </div>
                    <span className="text-[10px] opacity-75">متاح للجميع</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openProfileModal('password');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isDark
                        ? 'hover:bg-white/10 text-[#B6C2D2]'
                        : 'hover:bg-slate-100 text-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      <span>تغيير كلمة المرور</span>
                    </div>
                    <span className="text-[10px] text-amber-500 font-normal">بكلمة المرور الحالية</span>
                  </button>

                  {/* Lock Screen with IPN */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      lockWithIpn();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isDark
                        ? 'hover:bg-rose-950/30 text-rose-300'
                        : 'hover:bg-rose-50 text-rose-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-500" />
                      <span>قفل الموقع برمز الـ IPN الآن</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-75">قفل الشاشة</span>
                  </button>
                </div>

                {/* Logout / Exit Session Button */}
                <div className="pt-2 border-t border-slate-200 dark:border-[#2A3A50]">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all active:scale-98"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج وقفل الجلسة</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IPN Security Access Logs Modal */}
      <IpnLogsModal
        isOpen={isIpnLogsModalOpen}
        onClose={() => setIsIpnLogsModalOpen(false)}
      />

      {/* Operating Hours Quick Modal */}
      <OperatingHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
      />
    </header>
  );
};
