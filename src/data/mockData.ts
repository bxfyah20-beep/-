import { Court, DiscountOffer, UserAccount, Booking, ClubSettings, IpnAccessLog } from '../types/padel';

export const initialClubSettings: ClubSettings = {
  clubName: 'بادل منيفة | Manifa Camp',
  phone: '+966 50 123 4567',
  location: 'الخفجي - منيفة',
  currency: 'ر.س',
  openingTime: '4:00 م',
  closingTime: '3:00 ص',
  racketRentalPrice: 25,
  ballCanPrice: 15, // exactly as in screenshot: 15 SAR for balls
};

export const initialCourts: Court[] = [
  {
    id: 'court-1',
    name: 'Court 1 - بادل 1',
    type: 'panoramic',
    surface: 'عشب أزرق معتمد دولياً (Mondo Supercourt)',
    hourlyRate: 140, // 60 min: 140 SAR, 90 min: 190 SAR, 120 min: 240 SAR
    peakHourlyRate: 190,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    features: ['مكيف وعزل صوتي', 'زجاج بانورامي', 'إضاءة مباريات', 'مواقف ومياه مجانية'],
  },
  {
    id: 'court-2',
    name: 'Court 2 - بادل 2',
    type: 'indoor',
    surface: 'عشب صناعي فندقي فاخر',
    hourlyRate: 140,
    peakHourlyRate: 190,
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    features: ['أرضية احترافية مانعة للانزلاق', 'إضاءة LED', 'دورات مياه قريبة'],
  },
];

export const initialDiscounts: DiscountOffer[] = [
  {
    id: 'disc-1',
    title: 'عرض ويكند منيفة (Manifa Weekend)',
    description: 'خصم 20% على جميع حجوزات نهاية الأسبوع لملاعب بادل منيفة',
    code: 'MANIFA20',
    type: 'percentage',
    value: 20,
    minBookingAmount: 140,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    isActive: true,
    usageCount: 88,
    maxUsageLimit: 500,
    applicableCourts: ['all'],
    highlightBanner: true,
    badgeText: 'عرض خاص 🔥',
  },
  {
    id: 'disc-2',
    title: 'خصم الفترة الأولى (قبل 7:00 م)',
    description: 'وفر 30 ر.س على فترات العصر الأولى يومياً',
    code: 'EARLY30',
    type: 'fixed',
    value: 30,
    minBookingAmount: 140,
    validFrom: '2026-01-01',
    validUntil: '2026-09-30',
    isActive: true,
    usageCount: 54,
    applicableCourts: ['all'],
    highlightBanner: true,
    badgeText: 'وفر 30 ر.س ⚡',
  },
  {
    id: 'disc-3',
    title: 'كوبون اللاعبين الجدد',
    description: 'خصم 15% على أول حجز داخل بادل منيفة',
    code: 'WELCOME15',
    type: 'percentage',
    value: 15,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    isActive: true,
    usageCount: 112,
    applicableCourts: ['all'],
    highlightBanner: false,
    badgeText: 'أعضاء جدد',
  },
];

export const initialUsers: UserAccount[] = [
  {
    id: 'user-admin',
    name: 'مدير بادل منيفة (الإدارة العامة)',
    username: 'admin',
    password: '123',
    ipnCode: '9988',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '+966 50 888 1122',
    lastLogin: 'منذ دقيقة',
    passwordUpdatedDate: '2026-09-17',
    active: true,
  },
  {
    id: 'user-staff-1',
    name: 'سالم المري (عامل الملاعب والاستقبال)',
    username: 'salem',
    password: '123',
    ipnCode: '1122',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    phone: '+966 55 444 8899',
    lastLogin: 'منذ 15 دقيقة',
    passwordUpdatedDate: '2026-09-17',
    active: true,
  },
  {
    id: 'user-staff-2',
    name: 'عمر الخالدي (عامل التشغيل والكرات)',
    username: 'omar',
    password: '123',
    ipnCode: '3344',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    phone: '+966 54 222 3344',
    lastLogin: 'أمس 11:00 م',
    passwordUpdatedDate: '2026-09-17',
    active: true,
  },
];

export const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const today = getTodayDateString();

export const initialBookings: Booking[] = [];

export const initialIpnLogs: IpnAccessLog[] = [
  {
    id: 'ipn-log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    date: '2026-09-21',
    time: '04:28:15 ص',
    ipnCode: '9988',
    status: 'granted',
    userId: 'user-admin',
    userName: 'مدير بادل منيفة (الإدارة العامة)',
    userRole: 'admin',
    notes: 'تسجيل دخول ناجح - صلاحية المدير الكاملة',
    device: 'لوحة التحكم المركزية - المتصفح المعتمد',
  },
  {
    id: 'ipn-log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    date: '2026-09-21',
    time: '03:11:02 ص',
    ipnCode: '1122',
    status: 'granted',
    userId: 'user-staff-1',
    userName: 'سالم المري (عامل الملاعب والاستقبال)',
    userRole: 'staff',
    notes: 'تسجيل دخول مناوبة الاستقبال والتشغيل',
    device: 'جهاز الاستقبال المكتبي',
  },
  {
    id: 'ipn-log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    date: '2026-09-21',
    time: '01:45:30 ص',
    ipnCode: '0000',
    status: 'denied',
    userName: 'مجهول (محاولة دخول غير مصرح بها)',
    notes: 'تم رفض الدخول: رقم IPN غير مسجل في النظام',
    device: 'محاولة وصول خارجية عبر الويب',
  },
];

