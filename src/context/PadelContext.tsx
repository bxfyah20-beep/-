import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Booking,
  Court,
  DiscountOffer,
  UserAccount,
  UserRole,
  ClubSettings,
  BookingStatus,
  PaymentStatus,
  AdminNotification,
  IpnAccessLog,
} from '../types/padel';
import {
  initialBookings,
  initialCourts,
  initialDiscounts,
  initialUsers,
  initialClubSettings,
  initialIpnLogs,
  getTodayDateString,
} from '../data/mockData';
import { formatArabicTime, formatTimeRange } from '../utils/timeFormat';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PadelContextType {
  currentUser: UserAccount;
  currentRole: UserRole;
  users: UserAccount[];
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  switchUserWithPassword: (userId: string, pass: string) => { success: boolean; message: string };
  loginUser: (username: string, pass: string) => { success: boolean; message: string; user?: UserAccount };
  logoutUser: () => void;
  isIpnUnlocked: boolean;
  verifyIpnCode: (code: string) => { success: boolean; message: string; user?: UserAccount };
  lockWithIpn: () => void;
  ipnLogs: IpnAccessLog[];
  clearIpnLogs: () => void;
  updateUserIpn: (userId: string, newIpn: string) => { success: boolean; message: string };
  changePassword: (userId: string, newPass: string) => { success: boolean; message: string };
  changePasswordWithCurrent: (userId: string, currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  updateUserAvatar: (userId: string, avatar: string) => Promise<void>;
  addUser: (userData: { name: string; username: string; password?: string; role: UserRole; phone: string; avatar?: string; ipnCode?: string }) => void;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileModalDefaultTab: 'avatar' | 'password';
  openProfileModal: (tab?: 'avatar' | 'password') => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setThemeMode: (mode: 'dark' | 'light') => void;
  courts: Court[];
  updateCourt: (court: Court) => void;
  toggleCourtActive: (courtId: string) => void;
  discounts: DiscountOffer[];
  addDiscount: (discount: Omit<DiscountOffer, 'id' | 'usageCount'>) => void;
  updateDiscount: (discount: DiscountOffer) => void;
  toggleDiscountActive: (id: string) => void;
  deleteDiscount: (id: string) => void;
  bookings: Booking[];
  addBooking: (bookingData: Omit<Booking, 'id' | 'bookingCode' | 'createdAt'>) => Booking;
  updateBooking: (bookingId: string, updatedData: Partial<Booking>) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus, paymentStatus?: PaymentStatus) => void;
  cancelBooking: (bookingId: string) => void;
  cancelBookingWithReason: (
    bookingId: string,
    reason: string,
    customNote?: string,
    notifyCustomerWhatsApp?: boolean
  ) => void;
  sendWhatsAppBookingConfirmation: (booking: Booking) => void;
  sendSmsBookingConfirmation: (booking: Booking) => void;
  sendWhatsAppCancellationNotice: (booking: Booking, reason: string) => void;
  deleteBooking: (bookingId: string) => void;
  clearAllBookings: () => void;
  clubSettings: ClubSettings;
  updateClubSettings: (settings: Partial<ClubSettings>) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Permissions helper
  canViewRevenue: boolean; // TRUE only for admin, FALSE for staff
  // Real-time Booking Notifications for Administration
  notifications: AdminNotification[];
  unreadNotificationsCount: number;
  latestLiveNotification: AdminNotification | null;
  soundEnabled: boolean;
  toggleSoundEnabled: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  clearPastNotifications: () => void;
  dismissLiveNotification: () => void;
  triggerTestBookingNotification: () => void;
  playNotificationSound: () => void;
  // Desktop OS Push Notifications (Outside Browser / Background while watching YouTube)
  desktopPermission: NotificationPermission | 'unsupported';
  requestDesktopPermission: () => Promise<void>;
  isInIframe: boolean;
  openInIndependentTab: () => void;
  triggerDelayedBookingNotification: (seconds?: number) => void;
  delayedCountdown: number | null;
  isDesktopModalOpen: boolean;
  setIsDesktopModalOpen: (open: boolean) => void;
  canInstallPwa: boolean;
  installPwaApp: () => Promise<void>;
  directAppUrl: string;
}

const PadelContext = createContext<PadelContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'padel_users_v3',
  CURRENT_USER_ID: 'padel_current_user_id_v3',
  COURTS: 'padel_courts_v3',
  DISCOUNTS: 'padel_discounts_v2',
  BOOKINGS: 'padel_bookings_v3',
  SETTINGS: 'padel_settings_v2',
  THEME: 'padel_theme_v2',
  NOTIFICATIONS: 'padel_admin_notifications_v1',
  SOUND: 'padel_sound_enabled_v1',
  IPN_LOGS: 'padel_ipn_logs_v1',
  IPN_UNLOCKED: 'padel_ipn_unlocked_v1',
};

export const PadelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Theme state: Default to 'dark' luxury mode or 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (mode: 'dark' | 'light') => {
    setTheme(mode);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // 1. Users state with guaranteed passwords & IPN codes
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (parsed.length > 0) {
          return parsed.map((u) => ({
            ...u,
            password: u.password || '123',
            ipnCode: u.ipnCode || (u.role === 'admin' ? '9988' : u.id === 'user-staff-2' ? '3344' : '1122'),
          }));
        }
      }
      return initialUsers;
    } catch {
      return initialUsers;
    }
  });

  // Global IPN Gate Lock State: When false, all access requires entering an authorized IPN
  const [isIpnUnlocked, setIsIpnUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.IPN_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });

  // IPN Access Audit Logs
  const [ipnLogs, setIpnLogs] = useState<IpnAccessLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IPN_LOGS);
      return saved ? JSON.parse(saved) : initialIpnLogs;
    } catch {
      return initialIpnLogs;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IPN_LOGS, JSON.stringify(ipnLogs));
    } catch (e) {
      console.error(e);
    }
  }, [ipnLogs]);

  // Current logged in user ID (default to Admin)
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-admin';
    } catch {
      return 'user-admin';
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalDefaultTab, setProfileModalDefaultTab] = useState<'avatar' | 'password'>('avatar');

  const openProfileModal = (tab: 'avatar' | 'password' = 'avatar') => {
    setProfileModalDefaultTab(tab);
    setIsProfileModalOpen(true);
  };

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentRole: UserRole = currentUser.role;
  const canViewRevenue = currentRole === 'admin';

  // 2. Strict 2 Courts guarantee for Manifa Padel
  const [courts, setCourts] = useState<Court[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURTS);
      if (saved) {
        const parsed: Court[] = JSON.parse(saved);
        const filtered = parsed.filter((c) => c.id === 'court-1' || c.id === 'court-2');
        if (filtered.length === 2) return filtered;
      }
      return initialCourts;
    } catch {
      return initialCourts;
    }
  });

  // 3. Discounts state
  const [discounts, setDiscounts] = useState<DiscountOffer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
      return saved ? JSON.parse(saved) : initialDiscounts;
    } catch {
      return initialDiscounts;
    }
  });

  // 4. Bookings state
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return saved ? JSON.parse(saved) : initialBookings;
    } catch {
      return initialBookings;
    }
  });

  // 5. Club Settings state
  const [clubSettings, setClubSettings] = useState<ClubSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.openingTime = formatArabicTime(parsed.openingTime || '4:00 م');
        parsed.closingTime = formatArabicTime(parsed.closingTime || '3:00 ص');
        return parsed;
      }
      return initialClubSettings;
    } catch {
      return initialClubSettings;
    }
  });

  // Date filter
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } catch (e) {
      console.error(e);
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COURTS, JSON.stringify(courts));
    } catch (e) {
      console.error(e);
    }
  }, [courts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
    } catch (e) {
      console.error(e);
    }
  }, [discounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(clubSettings));
    } catch (e) {
      console.error(e);
    }
  }, [clubSettings]);

  // 6. Sound & Live Notifications state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed: AdminNotification[] = JSON.parse(saved);
        return parsed.map((n) => ({
          ...n,
          time: formatArabicTime(n.time),
        }));
      }
      return [
        {
          id: 'notif-initial-1',
          title: '🎾 حجز جديد وارد',
          message: 'تم تسجيل حجز جديد في ملعب منيفة 1',
          bookingCode: 'PDL-5420',
          customerName: 'سعود الشمري',
          customerPhone: '0559871234',
          courtName: 'ملعب منيفة 1',
          date: getTodayDateString(),
          time: '8:00 م - 9:30 م',
          totalPrice: 190,
          timestamp: 'منذ قليل',
          read: false,
          type: 'new_booking',
        },
      ];
    } catch {
      return [];
    }
  });

  const [latestLiveNotification, setLatestLiveNotification] = useState<AdminNotification | null>(null);

  // Desktop OS Push Notifications (Outside Browser / Background while watching YouTube)
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [delayedCountdown, setDelayedCountdown] = useState<number | null>(null);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const titleIntervalRef = useRef<any>(null);

  const isInIframe = typeof window !== 'undefined' ? window.self !== window.top : false;
  const directAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Register service worker on mount & catch install prompt
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Manifa Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration note:', err);
        });
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installPwaApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('تم بدء تثبيت تطبيق بادل منيفة على جهازك بنجاح! 🎾', 'success');
      }
      setDeferredInstallPrompt(null);
      setCanInstallPwa(false);
    } else {
      setIsDesktopModalOpen(true);
    }
  };

  const openInIndependentTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  // Audio synthesizer chime: high-crisp pleasant chime (A5 -> E6 -> G6)
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Note 1: crisp bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12); // E6
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Note 2: pleasant harmonic ring
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1567.98, now + 0.08); // G6
      gain2.gain.setValueAtTime(0.28, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }, []);

  const PADEL_BALL_ICON = '/icon.svg';

  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('المتصفح الحالي لا يدعم إشعارات سطح المكتب', 'error');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === 'granted') {
        showToast('تم تفعيل إشعارات سطح المكتب بنجاح! ستصلك تنبيهات في زاوية الشاشة حتى وأنت في يوتيوب 🔔', 'success');
        
        // Immediate system test notification via Service Worker
        const testOptions: any = {
          body: 'أهلاً بك! تم ربط الإشعارات بنجاح. ستصلك تنبيهات الحجوزات الواردة فوراً مثل الواتساب.',
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `manifa-welcome-${Date.now()}`,
          renotify: true,
          silent: false,
          requireInteraction: true,
          vibrate: [250, 100, 250],
          data: { url: window.location.href },
        };

        let delivered = false;
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification('🎾 بادل منيفة - الإشعارات مفعّلة بنجاح', testOptions);
              delivered = true;
            }
          } catch (e) {
            console.warn('SW test notif error:', e);
          }
        }

        if (!delivered) {
          try {
            const testN = new Notification('🎾 بادل منيفة - الإشعارات مفعّلة بنجاح', testOptions);
            testN.onclick = () => {
              window.focus();
              testN.close();
            };
          } catch (e) {
            console.warn('Window test notif error:', e);
          }
        }

        if (soundEnabled) {
          playNotificationSound();
        }
      } else if (perm === 'denied') {
        showToast('تم حظر الإشعارات في المتصفح. يمكنك السماح بها عبر النقر على علامة القفل بجانب شريط العنوان أو إعدادات الماك.', 'error');
      }
    } catch (e) {
      console.warn('Request notification permission failed:', e);
      showToast('إذا كنت داخل شاشة المعاينة، اضغط "فتح في نافذة مستقلة" لتفعيل الإشعارات خارج المتصفح.', 'info');
    }
  };

  const sendSystemNotification = useCallback(async (notif: AdminNotification) => {
    // 1. Play sound chime
    if (soundEnabled) {
      playNotificationSound();
    }

    // 2. Native OS Desktop & Mobile Push Notification (pops outside browser on Mac/Windows/Android/iOS PWA)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      // Unique tag per notification so Chrome/macOS never groups, overrides, or stops after 3 notifications
      const uniqueTag = `manifa-booking-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const options: any = {
        body: `اللاعب: ${notif.customerName} - ${notif.courtName} (${notif.time})`,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: uniqueTag,
        renotify: true,
        silent: false,
        requireInteraction: true,
        vibrate: [250, 100, 250, 100, 250],
        data: {
          url: window.location.href,
          bookingCode: notif.bookingCode,
          id: notif.id,
        },
      };

      let deliveredViaSW = false;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(notif.title, options);
            deliveredViaSW = true;
          }
        } catch (swErr) {
          console.warn('Service worker showNotification fallback:', swErr);
        }
      }

      // Fallback to standard Window Notification if ServiceWorker wasn't ready
      if (!deliveredViaSW) {
        try {
          const nativeN = new Notification(notif.title, options);
          nativeN.onclick = () => {
            window.focus();
            nativeN.close();
            setLatestLiveNotification(notif);
          };
        } catch (err) {
          console.warn('Native notification fallback trigger error:', err);
        }
      }
    }

    // 3. Tab Title Flashing (Blinking browser tab when on YouTube or background tab)
    if (typeof document !== 'undefined') {
      const originalTitle = 'بادل منيفة | نظام حجز الملاعب';
      let toggle = false;
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
      titleIntervalRef.current = setInterval(() => {
        document.title = toggle
          ? `🔔 (حجز وارد!) ${notif.customerName}`
          : `🎾 بادل منيفة - تفقد الحجز`;
        toggle = !toggle;
      }, 1000);

      const handleWindowFocus = () => {
        if (titleIntervalRef.current) {
          clearInterval(titleIntervalRef.current);
          titleIntervalRef.current = null;
        }
        document.title = originalTitle;
        window.removeEventListener('focus', handleWindowFocus);
      };
      window.addEventListener('focus', handleWindowFocus);
    }
  }, [soundEnabled, playNotificationSound]);

  const toggleSoundEnabled = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        showToast('تم تفعيل صوت التنبيهات الفورية 🔔', 'info');
        playNotificationSound();
      } else {
        showToast('تم كتم صوت التنبيهات 🔕', 'info');
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(soundEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  const dismissLiveNotification = useCallback(() => {
    setLatestLiveNotification(null);
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('تم تحديد جميع الإشعارات كمقروءة ✓', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setLatestLiveNotification(null);
    showToast('تم مسح سجل الإشعارات', 'info');
  };

  const clearPastNotifications = () => {
    const todayStr = getTodayDateString();
    setNotifications((prev) => prev.filter((n) => n.date === todayStr));
    showToast('تم تنظيف الأيام السابقة وتجديد التنبيهات لليوم الحالي ✓', 'success');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Real-time synchronization ref to avoid stale state
  const bookingsRef = useRef<Booking[]>(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  // Polling server for real-time synchronization with external website and second site
  const fetchServerBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) return;
      const serverData: Booking[] = await res.json();

      const currentList = bookingsRef.current;
      const currentIds = new Set(currentList.map((b) => b.id));

      // Check if there are newly arrived bookings from the external website or other users
      const newlyArrived = serverData.filter(
        (sb) => !currentIds.has(sb.id) && sb.status !== 'cancelled'
      );

      if (newlyArrived.length > 0 && currentList.length > 0) {
        newlyArrived.forEach((nb) => {
          const formattedBookingTime = formatTimeRange(nb.startTime, nb.endTime);
          const notif: AdminNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: '🎾 حجز جديد وارد من الموقع الخارجي!',
            message: `قام ${nb.customerName} بحجز ${nb.courtName} (${formattedBookingTime}) [${nb.createdBy || 'الموقع الخارجي'}]`,
            bookingId: nb.id,
            bookingCode: nb.bookingCode,
            customerName: nb.customerName,
            customerPhone: nb.customerPhone,
            courtName: nb.courtName,
            date: nb.date,
            time: formattedBookingTime,
            totalPrice: nb.totalPrice,
            timestamp: 'الآن',
            read: false,
            type: 'new_booking',
          };

          setNotifications((prevN) => [notif, ...prevN]);
          setLatestLiveNotification(notif);
          sendSystemNotification(notif);
          showToast(`🔔 حجز وارد جديد من الموقع الخارجي: ${nb.customerName} - ${nb.courtName}`, 'success');
        });
      }

      // Smart non-destructive merge:
      // Keep serverData + any locally created booking not yet in serverData
      const serverIdSet = new Set(serverData.map((b) => b.id));
      const serverCodeSet = new Set(serverData.map((b) => b.bookingCode));

      const unconfirmedLocal = currentList.filter(
        (b) => !serverIdSet.has(b.id) && !serverCodeSet.has(b.bookingCode)
      );

      const mergedList = [...serverData, ...unconfirmedLocal];
      // Sort newest bookings first
      mergedList.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.startTime || '').localeCompare(a.startTime || '');
      });

      const currentSignature = currentList.map((b) => `${b.id}:${b.status}:${b.startTime}:${b.courtId}`).join('|');
      const mergedSignature = mergedList.map((b) => `${b.id}:${b.status}:${b.startTime}:${b.courtId}`).join('|');
      if (currentSignature !== mergedSignature) {
        setBookings(mergedList);
      }
    } catch {
      // Offline fallback silent catch
    }
  }, [sendSystemNotification]);

  // Start real-time sync polling every 3 seconds
  useEffect(() => {
    fetchServerBookings();
    const syncTimer = setInterval(fetchServerBookings, 3000);
    return () => clearInterval(syncTimer);
  }, [fetchServerBookings]);

  const triggerTestBookingNotification = () => {
    const testNames = ['محمد العتيبي', 'سلطان الدوسري', 'فيصل القحطاني', 'عبدالله الشمري', 'راشد المطيري'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomCourt = Math.random() > 0.5 ? 'ملعب منيفة 1' : 'ملعب منيفة 2';
    const randomHours = ['6:30 م', '8:00 م', '9:30 م', '11:00 م', '12:30 ص', '1:00 ص'];
    const randomHour = randomHours[Math.floor(Math.random() * randomHours.length)];
    const code = `PDL-${Math.floor(1000 + Math.random() * 9000)}`;

    const notif: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: '🎾 حجز جديد وارد الآن!',
      message: `قام اللاعب ${randomName} بحجز ${randomCourt} (${randomHour})`,
      bookingCode: code,
      customerName: randomName,
      customerPhone: '05' + Math.floor(10000000 + Math.random() * 90000000),
      courtName: randomCourt,
      date: getTodayDateString(),
      time: randomHour,
      totalPrice: 190,
      timestamp: 'الآن',
      read: false,
      type: 'new_booking',
    };

    setNotifications((prev) => [notif, ...prev]);
    setLatestLiveNotification(notif);
    sendSystemNotification(notif);
    showToast(`🔔 وصول إشعار فوري: ${randomName} حجز ${randomCourt}`, 'success');
  };

  const triggerDelayedBookingNotification = (seconds: number = 5) => {
    setDelayedCountdown(seconds);
    showToast(`⏱️ بدأ المؤقت (${seconds} ثوانٍ)... انتقل إلى يوتيوب الآن أو صغّر المتصفح لتجربة ظهور الإشعار في زاوية الشاشة!`, 'info');

    let current = seconds;
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setDelayedCountdown(null);
        triggerTestBookingNotification();
      } else {
        setDelayedCountdown(current);
      }
    }, 1000);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Secure Switch User: requires password authentication
  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === currentUserId) {
      showToast('أنت مسجل بهذا الحساب حالياً', 'info');
      return;
    }
    // Strict requirement: Prompt for password via Login Modal
    setIsLoginModalOpen(true);
    showToast(`يرجى إدخال كلمة المرور للتبديل إلى حساب (${target.name})`, 'info');
  };

  // Secure Switch Role: requires password authentication
  const switchRole = (role: UserRole) => {
    const target = users.find((u) => u.role === role);
    if (!target) return;
    if (target.id === currentUserId) {
      showToast(`أنت مسجل بصلاحية ${role === 'admin' ? 'المدير العام' : 'العامل'} حالياً`, 'info');
      return;
    }
    setIsLoginModalOpen(true);
    showToast(`أدخل كلمة المرور لتأكيد التبديل إلى حساب (${target.name})`, 'info');
  };

  const switchUserWithPassword = (userId: string, pass: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'الحساب غير موجود' };
    }

    const correctPass = target.password || '123';
    if (pass.trim() !== correctPass) {
      return { success: false, message: 'كلمة المرور غير صحيحة، يرجى كتابة كلمة مرور هذا الشخص للتأكيد' };
    }

    // Update lastLogin
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, lastLogin: 'الآن' }
          : u
      )
    );

    setCurrentUserId(userId);
    showToast(
      `تم التحقق وتسجيل الدخول بنجاح: ${target.name} (${target.role === 'admin' ? 'المدير العام' : 'عامل الملاعب'})`,
      'success'
    );
    return { success: true, message: 'تم التحقق وتسجيل الدخول بنجاح' };
  };

  const loginUser = (username: string, pass: string) => {
    const target = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!target) {
      return { success: false, message: 'اسم المستخدم غير صحيح' };
    }

    const correctPass = target.password || '123';
    if (pass.trim() !== correctPass) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    setCurrentUserId(target.id);
    showToast(`تم تسجيل الدخول: ${target.name}`, 'success');
    return { success: true, message: 'تم تسجيل الدخول بنجاح', user: target };
  };

  const logoutUser = () => {
    // Lock the site with IPN immediately upon logout
    setIsIpnUnlocked(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.IPN_UNLOCKED);
    } catch (e) {
      console.error(e);
    }
    // Switch to staff or default reception user
    const staffUser = users.find((u) => u.role === 'staff') || users[0];
    if (staffUser) {
      setCurrentUserId(staffUser.id);
    }
    showToast('تم تسجيل الخروج وقفل النظام برقم الـ IPN بنجاح ✓', 'info');
  };

  // Verify IPN Code entered at the gateway lock screen
  const verifyIpnCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { success: false, message: 'يرجى إدخال رقم الـ IPN المعتمد' };
    }

    const matchedUser = users.find((u) => u.active && u.ipnCode === trimmed);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (matchedUser) {
      // 1. Switch to the matched user
      setCurrentUserId(matchedUser.id);

      // 2. Set unlocked and persist in session
      setIsIpnUnlocked(true);
      try {
        sessionStorage.setItem(STORAGE_KEYS.IPN_UNLOCKED, 'true');
      } catch (e) {
        console.error(e);
      }

      // 3. Record verified access audit log
      const newLog: IpnAccessLog = {
        id: 'ipn-' + Date.now(),
        timestamp: now.toISOString(),
        date: dateStr,
        time: timeStr,
        ipnCode: trimmed,
        status: 'granted',
        userId: matchedUser.id,
        userName: matchedUser.name,
        userRole: matchedUser.role,
        notes: `دخول مصرح به - ${matchedUser.role === 'admin' ? 'صلاحية الإدارة العامة' : 'صلاحية موظف التشغيل والاستقبال'}`,
        device: typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'جوال / هاتف ذكي' : 'كمبيوتر مكتبي / لوحة العرض',
      };

      setIpnLogs((prev) => [newLog, ...prev.slice(0, 99)]);
      showToast(`أهلاً بك ${matchedUser.name} - تم التحقق من رقم الـ IPN بنجاح ✓`, 'success');
      return { success: true, message: `مرحباً ${matchedUser.name}، تم التحقق والتسجيل بنجاح`, user: matchedUser };
    } else {
      // Record denied access attempt
      const rejectedLog: IpnAccessLog = {
        id: 'ipn-' + Date.now(),
        timestamp: now.toISOString(),
        date: dateStr,
        time: timeStr,
        ipnCode: trimmed,
        status: 'denied',
        userName: 'محاولة دخول غير مصرح بها (مرفوضة)',
        notes: 'تم حظر محاولة الدخول: رقم الـ IPN غير مسجل في النظام',
        device: typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'جوال / هاتف ذكي' : 'كمبيوتر مكتبي / لوحة العرض',
      };

      setIpnLogs((prev) => [rejectedLog, ...prev.slice(0, 99)]);
      showToast('رقم الـ IPN غير صحيح! تم تسجيل محاولة الدخول وتنبيه الأمان.', 'error');
      return { success: false, message: 'رقم الـ IPN غير صحيح. الدخول مقصور فقط على الإدارة والموظفين المعتمدين.' };
    }
  };

  // Lock site immediately with IPN gate
  const lockWithIpn = () => {
    setIsIpnUnlocked(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.IPN_UNLOCKED);
    } catch (e) {
      console.error(e);
    }
    showToast('تم قفل الموقع برمز الـ IPN بنجاح 🔒', 'info');
  };

  // Clear IPN Audit Logs
  const clearIpnLogs = () => {
    setIpnLogs([]);
    showToast('تم مسح سجلات دخول الـ IPN بنجاح', 'info');
  };

  // Update user's IPN code
  const updateUserIpn = (userId: string, newIpn: string) => {
    const clean = newIpn.trim();
    if (!clean || clean.length < 3) {
      return { success: false, message: 'يجب أن يتكون رقم الـ IPN من 3 أرقام على الأقل' };
    }
    const existing = users.find((u) => u.id !== userId && u.ipnCode === clean);
    if (existing) {
      return { success: false, message: `رقم الـ IPN (${clean}) مستخدم بالفعل للمستخدم: ${existing.name}` };
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ipnCode: clean } : u)));
    showToast('تم تحديث رقم الـ IPN للمستخدم بنجاح ✓', 'success');
    return { success: true, message: 'تم تحديث رقم الـ IPN بنجاح' };
  };

  // Change password for user with current password verification
  const changePasswordWithCurrent = async (
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    // Must verify current password
    if (!currentPass || target.password !== currentPass.trim()) {
      return {
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة، لا يمكن تغيير كلمة المرور إلا بكلمة المرور الحالية للتأكيد',
      };
    }

    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'كلمة المرور الجديدة يجب أن تتكون من 3 أحرف أو أرقام على الأقل' };
    }

    const todayStr = getTodayDateString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: newPass.trim(),
              passwordUpdatedDate: todayStr,
            }
          : u
      )
    );

    // Sync to backend server
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          targetUserId: userId,
          username: target.username,
          currentPassword: currentPass.trim(),
          newPassword: newPass.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, message: errData.error || 'فشل تحديث كلمة المرور في السيرفر' };
      }
    } catch (e) {
      console.warn('Backend sync note:', e);
    }

    showToast(`تم تحديث وحفظ كلمة المرور بنجاح لحساب ${target.name}`, 'success');
    return { success: true, message: `تم تحديث وحفظ كلمة المرور بنجاح لحساب ${target.name}` };
  };

  const changePassword = (userId: string, newPass: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'كلمة المرور يجب ألا تقل عن 3 خانات' };
    }
    const todayStr = getTodayDateString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: newPass.trim(),
              passwordUpdatedDate: todayStr,
            }
          : u
      )
    );
    showToast(`تم تحديث كلمة المرور لحساب ${target.name}`, 'success');
    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  };

  // Update profile avatar (for any employee or manager)
  const updateUserAvatar = async (userId: string, newAvatar: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, avatar: newAvatar } : u))
    );

    try {
      await fetch(`/api/users/${userId}/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({ avatar: newAvatar }),
      });
    } catch (e) {
      console.warn('Avatar server sync note:', e);
    }
  };

  // Add User (Strictly for Manager)
  const addUser = async (userData: {
    name: string;
    username: string;
    password?: string;
    role: UserRole;
    phone: string;
    avatar?: string;
    ipnCode?: string;
  }) => {
    if (currentRole !== 'admin') {
      showToast('عفواً، فقط المدير العام يمكنه إضافة مستخدمين جدد', 'error');
      return;
    }

    const defaultAvatar =
      userData.role === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80';

    const generatedIpn = userData.ipnCode?.trim() || String(Math.floor(1000 + Math.random() * 9000));

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      username: userData.username.trim().toLowerCase(),
      password: userData.password?.trim() || '123',
      role: userData.role,
      avatar: userData.avatar || defaultAvatar,
      phone: userData.phone.trim(),
      lastLogin: 'لم يسجل دخول بعد',
      passwordUpdatedDate: getTodayDateString(),
      active: true,
      ipnCode: generatedIpn,
    };

    setUsers((prev) => [...prev, newUser]);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          phone: newUser.phone,
          avatar: newUser.avatar,
        }),
      });
    } catch (e) {
      console.warn('Server user creation note:', e);
    }

    showToast(`تمت إضافة المستخدم بنجاح: ${newUser.name}`, 'success');
  };

  // Delete User (Strictly for Manager)
  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (currentRole !== 'admin') {
      showToast('حذف المستخدمين متاح للمدير العام فقط', 'error');
      return { success: false, message: 'صلاحيات غير كافية' };
    }

    if (userId === 'user-admin') {
      showToast('لا يمكن حذف حساب المدير العام الأساسي للمنشأة', 'error');
      return { success: false, message: 'لا يمكن حذف الحساب الأساسي' };
    }

    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (currentUserId === userId) {
      setCurrentUserId('user-admin');
    }

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
      });
    } catch (e) {
      console.warn('Server delete error', e);
    }

    showToast(`تم حذف حساب ${targetUser?.name || ''} بنجاح`, 'info');
    return { success: true, message: 'تم حذف الحساب بنجاح' };
  };

  // Courts
  const updateCourt = (court: Court) => {
    setCourts((prev) => prev.map((c) => (c.id === court.id ? court : c)));
    showToast(`تم حفظ تعديلات ${court.name}`, 'success');
  };

  const toggleCourtActive = (courtId: string) => {
    setCourts((prev) =>
      prev.map((c) => {
        if (c.id === courtId) {
          const next = !c.isActive;
          showToast(`تم ${next ? 'تفعيل' : 'إيقاف مؤقت'} ${c.name}`, 'info');
          return { ...c, isActive: next };
        }
        return c;
      })
    );
  };

  // Discounts
  const addDiscount = (discountData: Omit<DiscountOffer, 'id' | 'usageCount'>) => {
    if (currentRole !== 'admin') {
      showToast('صلاحية إضافة العروض والخصومات مقتصرة على المدير العام فقط', 'error');
      return;
    }
    const newOffer: DiscountOffer = {
      ...discountData,
      id: `disc-${Date.now()}`,
      usageCount: 0,
      code: discountData.code.trim().toUpperCase(),
    };
    setDiscounts((prev) => [newOffer, ...prev]);
    showToast(`تم إنشاء العرض والكوبون "${newOffer.title}" بنجاح! وسيظهر في شاشة الحجوزات.`, 'success');
  };

  const updateDiscount = (discount: DiscountOffer) => {
    if (currentRole !== 'admin') {
      showToast('تعديل العروض متاح للمدير فقط', 'error');
      return;
    }
    setDiscounts((prev) => prev.map((d) => (d.id === discount.id ? discount : d)));
    showToast(`تم تحديث العرض "${discount.title}" بنجاح`, 'success');
  };

  const toggleDiscountActive = (id: string) => {
    if (currentRole !== 'admin') {
      showToast('تعديل حالة العروض متاح للمدير فقط', 'error');
      return;
    }
    setDiscounts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const next = !d.isActive;
          showToast(`تم ${next ? 'تفعيل' : 'تعطيل'} كود الخصم ${d.code}`, 'info');
          return { ...d, isActive: next };
        }
        return d;
      })
    );
  };

  const deleteDiscount = (id: string) => {
    if (currentRole !== 'admin') {
      showToast('حذف العروض متاح للمدير فقط', 'error');
      return;
    }
    const disc = discounts.find((d) => d.id === id);
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
    showToast(`تم حذف العرض "${disc?.title || ''}"`, 'info');
  };

  // Bookings
  const addBooking = (bookingData: Omit<Booking, 'id' | 'bookingCode' | 'createdAt'>) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PDL-${randomNum}`;
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBooking: Booking = {
      ...bookingData,
      id: `bkg-${Date.now()}`,
      bookingCode,
      createdAt,
      createdBy: `${currentUser.name} (${currentRole === 'admin' ? 'المدير' : 'عامل'})`,
    };

    // If a discount code was applied, increment usageCount
    if (newBooking.appliedDiscountCode) {
      setDiscounts((prev) =>
        prev.map((d) =>
          d.code.toUpperCase() === newBooking.appliedDiscountCode?.toUpperCase()
            ? { ...d, usageCount: d.usageCount + 1 }
            : d
        )
      );
    }

    setBookings((prev) => [newBooking, ...prev]);
    if (newBooking.date) {
      setSelectedDate(newBooking.date);
    }

    // Asynchronously synchronize with central server database & external system
    fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-id': currentUserId,
      },
      body: JSON.stringify(newBooking),
    })
      .then(async (res) => {
        if (res.ok) {
          const serverSaved: Booking = await res.json();
          setBookings((prev) => {
            const others = prev.filter((b) => b.id !== newBooking.id && b.id !== serverSaved.id);
            return [serverSaved, ...others];
          });
        } else {
          const errData = await res.json().catch(() => null);
          if (errData?.error) {
            showToast(errData.error, 'error');
          }
        }
      })
      .catch((err) => console.warn('Server booking sync note:', err));

    // Trigger instant Real-time Booking Notification for Administration
    const formattedBookingTime = formatTimeRange(newBooking.startTime, newBooking.endTime);
    const notif: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: '🎾 حجز جديد وارد الآن!',
      message: `قام اللاعب ${newBooking.customerName} بحجز ${newBooking.courtName} (${formattedBookingTime})`,
      bookingId: newBooking.id,
      bookingCode,
      customerName: newBooking.customerName,
      customerPhone: newBooking.customerPhone,
      courtName: newBooking.courtName,
      date: newBooking.date,
      time: formattedBookingTime,
      totalPrice: newBooking.totalPrice,
      timestamp: 'الآن',
      read: false,
      type: 'new_booking',
    };

    setNotifications((prev) => [notif, ...prev]);
    setLatestLiveNotification(notif);
    sendSystemNotification(notif);

    showToast(`🔔 تنبيه إداري فوري: تم تأكيد حجز ${newBooking.customerName} برقم (${bookingCode})!`, 'success');
    return newBooking;
  };

  const updateBooking = (bookingId: string, updatedData: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            ...updatedData,
          };
        }
        return b;
      })
    );

    fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-id': currentUserId,
      },
      body: JSON.stringify(updatedData),
    }).catch((err) => console.warn('Server update error:', err));

    showToast('تم تحديث بيانات الحجز بنجاح ✓', 'success');
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus, paymentStatus?: PaymentStatus) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = {
            ...b,
            status,
            ...(paymentStatus ? { paymentStatus } : {}),
          };
          return updated;
        }
        return b;
      })
    );

    if (status === 'cancelled') {
      fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
      }).catch((err) => console.warn('Server cancel error:', err));
    }

    showToast(`تم تحديث حالة الحجز بنجاح`, 'info');
  };

  const sendWhatsAppBookingConfirmation = (booking: Booking) => {
    const cleanPhone = booking.customerPhone.replace(/[^0-9]/g, '');
    const formattedBookingTime = formatTimeRange(booking.startTime, booking.endTime);
    const message = encodeURIComponent(
      `أهلاً كابتن ${booking.customerName} 🎾\nتم تأكيد حجزك بنجاح في ${clubSettings.clubName}!\n\n📋 تفاصيل الحجز:\n🏷️ رقم الحجز: ${booking.bookingCode}\n🏟️ الملعب: ${booking.courtName}\n📅 التاريخ: ${booking.date}\n⏰ الوقت: ${formattedBookingTime}\n💰 الإجمالي: ${booking.totalPrice} ريال\n📍 الموقع: ${clubSettings.location}\n\nنتمنى لك ولأصدقائك مباراة رائعة وممتعة!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    showToast('جاري فتح تطبيق واتساب لإرسال تذكرة التأكيد للعميل 📲', 'info');
  };

  const sendSmsBookingConfirmation = (booking: Booking) => {
    const cleanPhone = booking.customerPhone.replace(/[^0-9]/g, '');
    const formattedBookingTime = formatTimeRange(booking.startTime, booking.endTime);
    const text = `تم تأكيد حجزك في ${clubSettings.clubName} - ${booking.courtName} بتاريخ ${booking.date} وقت ${formattedBookingTime} - رقم الحجز: ${booking.bookingCode} - نتمنى لكم وقتاً ممتعاً!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(text)}`, '_blank');
    showToast('تم فتح تطبيق الرسائل النصية ونسخ نص الرسالة بنجاح ✉️', 'info');
  };

  const sendWhatsAppCancellationNotice = (booking: Booking, reason: string) => {
    const cleanPhone = booking.customerPhone.replace(/[^0-9]/g, '');
    const formattedBookingTime = formatTimeRange(booking.startTime, booking.endTime);
    const message = encodeURIComponent(
      `مرحباً كابتن ${booking.customerName} 🎾\nنحيطك علماً بأنه تم إلغاء حجزك في ${clubSettings.clubName}:\n🏷️ رقم الحجز: ${booking.bookingCode}\n🏟️ ${booking.courtName}\n📅 التاريخ: ${booking.date}\n⏰ الوقت: ${formattedBookingTime}\n\n📝 سبب الإلغاء: ${reason}\n\nنعتذر عن أي إزعاج ويسعدنا دائماً استقبالكم لحجز موعد جديد في أي وقت مناسب.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    showToast('جاري فتح واتساب لإرسال إشعار الإلغاء والاعتذار للعميل 📲', 'info');
  };

  const cancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
    showToast('تم إلغاء الحجز وإتاحة الملعب مجدداً في هذا التوقيت', 'info');
  };

  const cancelBookingWithReason = (
    bookingId: string,
    reason: string,
    customNote?: string,
    notifyCustomerWhatsApp?: boolean
  ) => {
    const target = bookings.find((b) => b.id === bookingId);
    const now = new Date();
    const cancelledAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'cancelled',
            cancellationReason: reason,
            cancellationNote: customNote?.trim() || undefined,
            cancelledAt,
          };
        }
        return b;
      })
    );

    // Sync with backend API
    fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-id': currentUserId,
      },
      body: JSON.stringify({
        status: 'cancelled',
        cancellationReason: reason,
        cancellationNote: customNote?.trim() || undefined,
        cancelledAt,
      }),
    }).catch((err) => console.warn('Server cancel update error:', err));

    fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-id': currentUserId,
      },
      body: JSON.stringify({ reason }),
    }).catch((err) => console.warn('Server cancel notification error:', err));

    if (target && notifyCustomerWhatsApp) {
      sendWhatsAppCancellationNotice(target, customNote ? `${reason} (${customNote})` : reason);
    }

    showToast('تم إلغاء الحجز وإتاحة الملعب مباشرة في الجدول ✓', 'success');
  };

  const deleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': currentRole,
        'x-user-id': currentUserId,
      },
    }).catch((err) => console.warn('Server delete error:', err));

    showToast('تم حذف سجل الحجز نهائياً وإتاحة الوقت لجميع المنصات', 'info');
  };

  const clearAllBookings = () => {
    setBookings([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    } catch (e) {
      console.error(e);
    }
    showToast('تم تصفير جميع الحجوزات بنجاح! جميع الملاعب والساعات الآن فارغة للتجربة.', 'info');
  };

  const updateClubSettings = (settings: Partial<ClubSettings>) => {
    if (currentRole !== 'admin') {
      showToast('تعديل إعدادات النادي متاح للمدير فقط', 'error');
      return;
    }
    setClubSettings((prev) => ({ ...prev, ...settings }));
    showToast('تم حفظ إعدادات النادي بنجاح', 'success');
  };

  return (
    <PadelContext.Provider
      value={{
        currentUser,
        currentRole,
        users,
        switchUser,
        switchRole,
        switchUserWithPassword,
        loginUser,
        logoutUser,
        isIpnUnlocked,
        verifyIpnCode,
        lockWithIpn,
        ipnLogs,
        clearIpnLogs,
        updateUserIpn,
        changePassword,
        changePasswordWithCurrent,
        updateUserAvatar,
        addUser,
        deleteUser,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileModalDefaultTab,
        openProfileModal,
        isLoginModalOpen,
        setIsLoginModalOpen,
        theme,
        toggleTheme,
        setThemeMode,
        courts,
        updateCourt,
        toggleCourtActive,
        discounts,
        addDiscount,
        updateDiscount,
        toggleDiscountActive,
        deleteDiscount,
        bookings,
        addBooking,
        updateBooking,
        updateBookingStatus,
        cancelBooking,
        cancelBookingWithReason,
        sendWhatsAppBookingConfirmation,
        sendSmsBookingConfirmation,
        sendWhatsAppCancellationNotice,
        deleteBooking,
        clearAllBookings,
        clubSettings,
        updateClubSettings,
        selectedDate,
        setSelectedDate,
        toasts,
        showToast,
        removeToast,
        canViewRevenue,
        notifications,
        unreadNotificationsCount,
        latestLiveNotification,
        soundEnabled,
        toggleSoundEnabled,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        clearPastNotifications,
        dismissLiveNotification,
        triggerTestBookingNotification,
        playNotificationSound,
        desktopPermission,
        requestDesktopPermission,
        isInIframe,
        openInIndependentTab,
        triggerDelayedBookingNotification,
        delayedCountdown,
        isDesktopModalOpen,
        setIsDesktopModalOpen,
        canInstallPwa,
        installPwaApp,
        directAppUrl,
      }}
    >
      {children}
    </PadelContext.Provider>
  );
};

export const usePadel = () => {
  const context = useContext(PadelContext);
  if (!context) {
    throw new Error('usePadel must be used within a PadelProvider');
  }
  return context;
};
