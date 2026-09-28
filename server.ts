import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external website integrations
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Path to durable local database
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'manifa_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CourtRecord {
  id: string;
  name: string;
  type: string;
  surface: string;
  hourlyRate: number;
  peakHourlyRate: number;
  image: string;
  isActive: boolean;
  features: string[];
  maintenanceReason?: string;
}

// Initial seed data if file doesn't exist
const INITIAL_DATA: {
  clubSettings: any;
  courts: CourtRecord[];
  users: any[];
  discounts: any[];
  bookings: any[];
  auditLogs: any[];
} = {
  clubSettings: {
    clubName: 'بادل منيفة | Manifa Padel',
    phone: '+966 50 123 4567',
    location: 'الجبيل - مخيم منيفة (Manifa Camp)',
    currency: 'ر.س',
    openingTime: '17:00',
    closingTime: '03:00',
    racketRentalPrice: 25,
    ballCanPrice: 15,
  },
  courts: [
    {
      id: 'court-1',
      name: 'ملعب منيفة 1 (بانورامي أزرق)',
      type: 'panoramic',
      surface: 'عشب مونيدو أزرق احترافي 12 ملم مع زجاج سيكوريت 12 ملم',
      hourlyRate: 140,
      peakHourlyRate: 190,
      image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
      isActive: true,
      features: ['زجاج بانورامي كامل', 'إضاءة ليد معتمدة للمباريات', 'عشب أزرق معتمد FIP'],
    },
    {
      id: 'court-2',
      name: 'ملعب منيفة 2 (بانورامي أزرق)',
      type: 'panoramic',
      surface: 'عشب مونيدو أزرق احترافي 12 ملم مع زجاج سيكوريت 12 ملم',
      hourlyRate: 140,
      peakHourlyRate: 190,
      image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80',
      isActive: true,
      features: ['منطقة جلوس مظللة', 'إضاءة ليد احترافية', 'شبكة بادل دولية'],
    },
  ],
  users: [
    {
      id: 'user-admin',
      name: 'سالم الشمري',
      username: 'admin',
      password: '123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      phone: '+966 50 111 2233',
      lastLogin: 'اليوم',
      passwordUpdatedDate: '2026-03-01',
      active: true,
    },
    {
      id: 'user-staff',
      name: 'فهد الدوسري',
      username: 'staff',
      password: '123',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      phone: '+966 55 444 5566',
      lastLogin: 'أمس',
      passwordUpdatedDate: '2026-02-15',
      active: true,
    },
  ],
  discounts: [
    {
      id: 'disc-1',
      title: 'خصم افتتاح موسم بادل منيفة',
      description: 'خصم 15% على جميع حجوزات الملاعب طوال الأسبوع',
      code: 'MANIFA15',
      type: 'percentage',
      value: 15,
      minBookingAmount: 140,
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      isActive: true,
      isArchived: false,
      usageCount: 14,
      maxUsageLimit: 100,
      applicableCourts: ['all'],
      applicableDays: 'جميع الأيام',
      applicableHours: 'كامل ساعات العمل (17:00 - 03:00)',
      highlightBanner: true,
      badgeText: 'كود نشط 🔥',
    },
    {
      id: 'disc-2',
      title: 'عرض الصباح والمساء المبكر',
      description: 'خصم ثابت 30 ر.س للحجوزات المبكرة من 5 مساء حتى 7 مساء',
      code: 'EARLY30',
      type: 'fixed',
      value: 30,
      minBookingAmount: 140,
      validFrom: '2026-02-01',
      validUntil: '2026-10-31',
      isActive: true,
      isArchived: false,
      usageCount: 8,
      maxUsageLimit: 50,
      applicableCourts: ['all'],
      applicableDays: 'الأحد - الأربعاء',
      applicableHours: '17:00 - 19:00',
      highlightBanner: false,
      badgeText: 'فترة الروقان',
    },
  ],
  bookings: [
    {
      id: 'bkg-1',
      bookingCode: 'PDL-8821',
      courtId: 'court-1',
      courtName: 'ملعب منيفة 1 (بانورامي أزرق)',
      customerName: 'عبدالرحمن الشهري',
      customerPhone: '0501234567',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:30',
      durationMinutes: 90,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'mada',
      courtPrice: 190,
      racketRentalsCount: 0,
      racketPrice: 0,
      ballsCount: 1,
      ballsPrice: 15,
      appliedDiscountCode: 'MANIFA15',
      discountAmount: 28,
      totalPrice: 177,
      matchType: 'competitive',
      notes: 'مباراة دوري داخلي',
      createdBy: 'سالم الشمري (المدير)',
      createdAt: '2026-09-19 14:00',
    },
    {
      id: 'bkg-2',
      bookingCode: 'PDL-9043',
      courtId: 'court-2',
      courtName: 'ملعب منيفة 2 (بانورامي أزرق)',
      customerName: 'خالد الهاجري',
      customerPhone: '0559876543',
      date: new Date().toISOString().split('T')[0],
      startTime: '20:00',
      endTime: '21:30',
      durationMinutes: 90,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'apple_pay',
      courtPrice: 190,
      racketRentalsCount: 2,
      racketPrice: 50,
      ballsCount: 0,
      ballsPrice: 0,
      discountAmount: 0,
      totalPrice: 240,
      matchType: 'friendly',
      notes: 'تأجير مضربين مطلوب',
      createdBy: 'فهد الدوسري (عامل)',
      createdAt: '2026-09-19 15:30',
    },
  ],
  auditLogs: [
    {
      id: 'audit-1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'user-admin',
      userName: 'سالم الشمري',
      userRole: 'admin',
      action: 'system_initialized',
      target: 'النظام التشغيلي',
      details: 'تهيئة نظام إدارة بادل منيفة وتدقيق الملاعب',
    },
  ],
};

// In-memory working database
let db = { ...INITIAL_DATA };

// Load from disk if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
} catch (e) {
  console.error('Failed reading DB file, using initial data:', e);
}

// Atomic save helper
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed saving database:', e);
  }
}

// Helper: Audit logger
function logAudit(userId: string, userName: string, userRole: string, action: string, target: string, details: string) {
  const entry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userId: userId || 'unknown',
    userName: userName || 'مستخدم النظام',
    userRole: userRole || 'staff',
    action,
    target,
    details,
  };
  db.auditLogs = [entry, ...(db.auditLogs || [])].slice(0, 500); // keep last 500
  saveDb();
}

// Helper: Operational time calculation (16:00 to 03:00 next morning)
function toOperationalMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  let str = String(timeStr).trim();
  str = str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const hasPM = /م|pm/i.test(str);
  const hasAM = /ص|am/i.test(str);
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (hasPM) {
    if (h < 12) h += 12;
  } else if (hasAM) {
    if (h === 12) h = 0;
  }
  // Operational schedule (16:00 to 03:30 AM):
  // Hours from 00:00 up to 05:59 are post-midnight hours of the operational date (1440+ minutes)
  const hours = h < 6 ? h + 24 : h;
  return hours * 60 + m;
}

function checkBookingCollision(
  courtId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  excludeBookingId?: string
) {
  const newStart = toOperationalMinutes(startTime);
  const newEnd = newStart + durationMinutes;

  const isCourt1Target = courtId.includes('1') || courtId === 'court-1';
  const isCourt2Target = courtId.includes('2') || courtId === 'court-2';

  for (const b of db.bookings) {
    const isCourt1B = (b.courtId || '').includes('1') || (b.courtName || '').includes('1');
    const isCourt2B = (b.courtId || '').includes('2') || (b.courtName || '').includes('2');
    const isSameCourt = (isCourt1Target && isCourt1B) || (isCourt2Target && isCourt2B) || b.courtId === courtId;

    if (!isSameCourt) continue;
    if (b.date !== date) continue;
    if (b.status === 'cancelled') continue;
    if (excludeBookingId && (b.id === excludeBookingId || (reqBodyBookingCode(b, excludeBookingId)))) continue;

    const existStart = toOperationalMinutes(b.startTime);
    const existEnd = existStart + (Number(b.durationMinutes) || 90);

    // Overlap condition: startA < endB && startB < endA
    if (newStart < existEnd && existStart < newEnd) {
      return b;
    }
  }
  return null;
}

function reqBodyBookingCode(b: any, idOrCode: string) {
  return b.id === idOrCode || b.bookingCode === idOrCode;
}

// Middleware: Extract user context
app.use((req, res, next) => {
  const role = (req.headers['x-user-role'] as string) || 'admin';
  const userId = (req.headers['x-user-id'] as string) || 'user-admin';
  const user = db.users.find((u) => u.id === userId) || db.users[0];
  (req as any).currentUser = user;
  (req as any).currentRole = user ? user.role : role;
  next();
});

// ==================== AUTH & SECURITY API ====================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find((u) => u.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  // Update last login
  user.lastLogin = 'الآن';
  saveDb();

  logAudit(user.id, user.name, user.role, 'login', user.username, 'تسجيل دخول ناجح إلى النظام');

  // Return user without password
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Get users list (Staff only sees safe profile, Admin sees management list)
app.get('/api/users', (req, res) => {
  const role = (req as any).currentRole;
  // Return users with passwords stripped for safety
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Change Password (SERVER ENFORCED RBAC)
app.post('/api/auth/change-password', (req, res) => {
  const { targetUserId, username, currentPassword, newPassword } = req.body;
  const currentUser = (req as any).currentUser;

  if (!currentUser) {
    return res.status(401).json({ error: 'غير مصرح' });
  }

  // Find target user by targetUserId or username
  let targetUser = null;
  if (targetUserId) {
    targetUser = db.users.find((u) => u.id === targetUserId);
  } else if (username) {
    targetUser = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  } else {
    targetUser = currentUser;
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  // Security Rule: The requester MUST provide the current password of the account
  // (unless the manager is resetting another user's password with their own admin credentials)
  if (currentUser.id === targetUser.id || currentUser.role !== 'admin') {
    if (!currentPassword || targetUser.password !== currentPassword.trim()) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة، يرجى كتابة كلمة المرور الحالية للتأكيد' });
    }
  } else if (currentUser.role === 'admin') {
    // If admin is changing someone else's password, verify current admin's password or existing password
    if (currentPassword && targetUser.password !== currentPassword.trim() && currentUser.password !== currentPassword.trim()) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
  }

  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 3 خانات' });
  }

  targetUser.password = newPassword.trim();
  targetUser.passwordUpdatedDate = new Date().toISOString().split('T')[0];
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'password_changed',
    targetUser.name,
    `تغيير كلمة مرور المستخدم (${targetUser.username})`
  );

  res.json({ success: true, message: `تم تحديث كلمة المرور لحساب ${targetUser.name} بنجاح` });
});

// Update Profile Avatar (for current user or admin)
app.put('/api/users/:id/avatar', (req, res) => {
  const userId = req.params.id;
  const currentUser = (req as any).currentUser;
  const { avatar } = req.body;

  if (!avatar) {
    return res.status(400).json({ error: 'لم يتم توفير الصورة' });
  }

  // Only the user themselves or an admin can update avatar
  if (currentUser.id !== userId && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح لك بتعديل صورة هذا المستخدم' });
  }

  const targetUser = db.users.find((u) => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  targetUser.avatar = avatar;
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'user_avatar_updated',
    targetUser.name,
    `تحديث الصورة الشخصية لحساب ${targetUser.name}`
  );

  const { password: _, ...safeUser } = targetUser;
  res.json({ success: true, user: safeUser });
});

// Add user (Admin only)
app.post('/api/users', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'إضافة المستخدمين متاحة للمدير العام فقط' });
  }

  const { name, username, password, role, phone, avatar } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'بيانات المستخدم غير مكتملة' });
  }

  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً' });
  }

  const defaultAvatar =
    role === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80';

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    password: password.trim(),
    role: role || 'staff',
    avatar: avatar || defaultAvatar,
    phone: phone || '+966 50 000 0000',
    lastLogin: 'لم يسجل دخول بعد',
    passwordUpdatedDate: new Date().toISOString().split('T')[0],
    active: true,
  };

  db.users.push(newUser);
  saveDb();

  logAudit(currentUser.id, currentUser.name, currentUser.role, 'user_created', newUser.name, `إنشاء مستخدم جديد برتبة (${newUser.role})`);

  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

// Delete user (Admin only)
app.delete('/api/users/:id', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'حذف المستخدمين متاح للمدير العام فقط' });
  }

  const userId = req.params.id;
  if (userId === 'user-admin') {
    return res.status(400).json({ error: 'لا يمكن حذف حساب المدير العام الأساسي للمنشأة' });
  }

  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const deletedUser = db.users[userIndex];
  db.users.splice(userIndex, 1);
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'user_deleted',
    deletedUser.name,
    `حذف حساب المستخدم (${deletedUser.username}) نهائياً`
  );

  res.json({ success: true, message: `تم حذف حساب ${deletedUser.name} بنجاح` });
});

// ==================== FINANCIAL STATS (STRICT ADMIN RBAC) ====================

app.get('/api/stats/financial', (req, res) => {
  const role = (req as any).currentRole;
  if (role !== 'admin') {
    return res.status(403).json({
      error: 'ممنوع: البيانات المالية وإجمالي الإيرادات متاحة حصرياً للمدير العام',
      accessDenied: true,
    });
  }

  const confirmedBookings = db.bookings.filter((b) => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalRacketRevenue = confirmedBookings.reduce((sum, b) => sum + (b.racketPrice || 0), 0);
  const totalBallsRevenue = confirmedBookings.reduce((sum, b) => sum + (b.ballsPrice || 0), 0);
  const totalDiscountsGiven = confirmedBookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);

  res.json({
    totalRevenue,
    totalRacketRevenue,
    totalBallsRevenue,
    totalDiscountsGiven,
    confirmedBookingsCount: confirmedBookings.length,
  });
});

// Operational summary (Allowed for both staff and admin)
app.get('/api/stats/operational', (req, res) => {
  const activeBookings = db.bookings.filter((b) => b.status !== 'cancelled');
  const totalHours = activeBookings.reduce((sum, b) => sum + b.durationMinutes / 60, 0);

  res.json({
    totalBookingsCount: db.bookings.length,
    activeBookingsCount: activeBookings.length,
    totalHours,
    activeCourtsCount: db.courts.filter((c) => c.isActive).length,
  });
});

// ==================== COURTS & MAINTENANCE ====================

app.get('/api/courts', (req, res) => {
  res.json(db.courts);
});

// Check affected bookings if maintenance is scheduled
app.post('/api/courts/:id/check-maintenance', (req, res) => {
  const courtId = req.params.id;
  const { date } = req.body;

  const affectedBookings = db.bookings.filter(
    (b) => b.courtId === courtId && b.date === date && b.status !== 'cancelled'
  );

  res.json({
    courtId,
    date,
    affectedCount: affectedBookings.length,
    bookings: affectedBookings,
  });
});

// Update court (Admin only)
app.put('/api/courts/:id', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'تعديل بيانات وتسعير الملاعب متاح للمدير العام فقط' });
  }

  const courtId = req.params.id;
  const index = db.courts.findIndex((c) => c.id === courtId);
  if (index === -1) {
    return res.status(404).json({ error: 'الملعب غير موجود' });
  }

  const oldCourt = db.courts[index];
  db.courts[index] = { ...oldCourt, ...req.body };
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'court_updated',
    db.courts[index].name,
    `تعديل أسعار الملعب: ${oldCourt.hourlyRate} -> ${db.courts[index].hourlyRate} ر.س`
  );

  res.json(db.courts[index]);
});

// Toggle court maintenance mode
app.post('/api/courts/:id/toggle-status', (req, res) => {
  const currentUser = (req as any).currentUser;
  const courtId = req.params.id;
  const court = db.courts.find((c) => c.id === courtId);
  if (!court) {
    return res.status(404).json({ error: 'الملعب غير موجود' });
  }

  court.isActive = !court.isActive;
  if (!court.isActive && req.body.reason) {
    court.maintenanceReason = req.body.reason;
  } else if (court.isActive) {
    court.maintenanceReason = undefined;
  }
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'court_maintenance',
    court.name,
    court.isActive ? 'تم إتاحة الملعب للتشغيل بعد الصيانة' : `تم إدخال الملعب في وضع الصيانة: ${court.maintenanceReason || 'صيانة دورية'}`
  );

  res.json(court);
});

// ==================== DISCOUNTS & COUPONS ====================

app.get('/api/discounts', (req, res) => {
  res.json(db.discounts);
});

// Add discount (Admin only)
app.post('/api/discounts', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'إدارة العروض والخصومات متاحة للمدير العام فقط' });
  }

  const { title, description, code, type, value, minBookingAmount, validUntil, applicableCourts, applicableDays, applicableHours, highlightBanner, badgeText, maxUsageLimit } = req.body;

  if (!title || !code) {
    return res.status(400).json({ error: 'عنوان العرض وكود الخصم مطلوبان' });
  }

  const cleanCode = code.trim().toUpperCase();
  if (db.discounts.some((d) => d.code === cleanCode && !d.isArchived)) {
    return res.status(400).json({ error: 'كود الخصم مستخدم بالفعل في عرض نشط' });
  }

  const newDiscount = {
    id: `disc-${Date.now()}`,
    title: title.trim(),
    description: description || 'خصم خاص على حجوزات بادل منيفة',
    code: cleanCode,
    type: type || 'percentage',
    value: Number(value) || 15,
    minBookingAmount: Number(minBookingAmount) || 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: validUntil || '2026-12-31',
    isActive: true,
    isArchived: false,
    usageCount: 0,
    maxUsageLimit: maxUsageLimit ? Number(maxUsageLimit) : 100,
    applicableCourts: applicableCourts || ['all'],
    applicableDays: applicableDays || 'جميع الأيام',
    applicableHours: applicableHours || 'كامل ساعات العمل',
    highlightBanner: !!highlightBanner,
    badgeText: badgeText || 'عرض خاص',
  };

  db.discounts.push(newDiscount);
  saveDb();

  logAudit(currentUser.id, currentUser.name, currentUser.role, 'discount_created', newDiscount.code, `إضافة عرض جديد: ${newDiscount.title}`);
  res.json(newDiscount);
});

// Update discount (Admin only)
app.put('/api/discounts/:id', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'تعديل العروض متاح للمدير فقط' });
  }

  const discId = req.params.id;
  const index = db.discounts.findIndex((d) => d.id === discId);
  if (index === -1) {
    return res.status(404).json({ error: 'العرض غير موجود' });
  }

  db.discounts[index] = { ...db.discounts[index], ...req.body };
  saveDb();

  logAudit(currentUser.id, currentUser.name, currentUser.role, 'discount_updated', db.discounts[index].code, `تحديث بيانات العرض`);
  res.json(db.discounts[index]);
});

// Validate discount application
app.post('/api/discounts/validate', (req, res) => {
  const { code, courtPrice, courtId } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'يرجى إدخال كود الخصم' });
  }

  const cleanCode = code.trim().toUpperCase();
  const offer = db.discounts.find((d) => d.code === cleanCode && d.isActive && !d.isArchived);

  if (!offer) {
    return res.status(404).json({ valid: false, error: 'كود الخصم غير صحيح أو غير مفعل' });
  }

  // Check validity dates
  const today = new Date().toISOString().split('T')[0];
  if (offer.validUntil && offer.validUntil < today) {
    return res.status(400).json({ valid: false, error: 'انتهت صلاحية هذا الكوبون' });
  }

  // Check max usage
  if (offer.maxUsageLimit && offer.usageCount >= offer.maxUsageLimit) {
    return res.status(400).json({ valid: false, error: 'وصل هذا الكود للحد الأقصى من الاستخدام' });
  }

  // Check applicable courts
  if (courtId && !offer.applicableCourts.includes('all') && !offer.applicableCourts.includes(courtId)) {
    return res.status(400).json({ valid: false, error: 'هذا الكود غير مخصص للملعب المختار' });
  }

  // Calculate discount amount (cannot exceed court price)
  let discountAmount = 0;
  if (offer.type === 'percentage') {
    discountAmount = Math.round((courtPrice * offer.value) / 100);
  } else {
    discountAmount = Math.min(courtPrice, offer.value);
  }

  // Enforce discount does not exceed price
  discountAmount = Math.min(courtPrice, discountAmount);

  res.json({
    valid: true,
    code: offer.code,
    title: offer.title,
    discountAmount,
    discountType: offer.type,
    discountValue: offer.value,
  });
});

// ==================== BOOKINGS & COLLISION PREVENTION ====================

app.get('/api/bookings', (req, res) => {
  const { date, courtId } = req.query;
  let result = db.bookings;

  if (date) {
    result = result.filter((b) => b.date === date);
  }
  if (courtId) {
    result = result.filter((b) => b.courtId === courtId);
  }

  res.json(result);
});

// Add booking with STRICT double-booking collision prevention
app.post('/api/bookings', (req, res) => {
  const currentUser = (req as any).currentUser;
  const {
    courtId,
    courtName,
    customerName,
    customerPhone,
    date,
    startTime,
    durationMinutes,
    matchType,
    paymentMethod,
    paymentStatus,
    ballsCount,
    racketRentalsCount,
    appliedDiscountCode,
    notes,
  } = req.body;

  if (!courtId || !date || !startTime || !durationMinutes || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'بيانات الحجز غير مكتملة' });
  }

  // ATOMIC COLLISION CHECK: Prevent double-booking on server
  const collision = checkBookingCollision(courtId, date, startTime, Number(durationMinutes), req.body.id);
  if (collision) {
    return res.status(409).json({
      error: `تعذر إتمام الحجز: الملعب محجوز بالفعل في هذه الفترة للاعب (${collision.customerName}) من ${collision.startTime} إلى ${collision.endTime}. يرجى اختيار وقت آخر.`,
      conflictBooking: {
        customerName: collision.customerName,
        startTime: collision.startTime,
        endTime: collision.endTime,
      },
    });
  }

  // Calculate end time
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + Number(durationMinutes);
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Find court pricing
  const court = db.courts.find((c) => c.id === courtId) || db.courts[0];
  let courtPrice = 190;
  if (Number(durationMinutes) === 60) courtPrice = court.hourlyRate || 140;
  else if (Number(durationMinutes) === 90) courtPrice = court.peakHourlyRate || 190;
  else if (Number(durationMinutes) === 120) courtPrice = 240;

  const ballsPrice = (Number(ballsCount) || 0) * (db.clubSettings.ballCanPrice || 15);
  const racketPrice = (Number(racketRentalsCount) || 0) * (db.clubSettings.racketRentalPrice || 25);
  const subtotal = courtPrice + ballsPrice + racketPrice;

  // Apply discount if provided
  let discountAmount = 0;
  if (appliedDiscountCode) {
    const offer = db.discounts.find((d) => d.code === appliedDiscountCode.trim().toUpperCase() && d.isActive);
    if (offer) {
      if (offer.type === 'percentage') {
        discountAmount = Math.round((courtPrice * offer.value) / 100);
      } else {
        discountAmount = Math.min(courtPrice, offer.value);
      }
      discountAmount = Math.min(subtotal, discountAmount);
      offer.usageCount = (offer.usageCount || 0) + 1;
    }
  }

  const totalPrice = Math.max(0, subtotal - discountAmount);
  const bookingCode = req.body.bookingCode || `PDL-${Math.floor(1000 + Math.random() * 9000)}`;
  const bookingId = req.body.id || `bkg-${Date.now()}`;

  const now = new Date();
  const createdAt = req.body.createdAt || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newBooking = {
    id: bookingId,
    bookingCode,
    courtId,
    courtName: court.name,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    date,
    startTime,
    endTime,
    durationMinutes: Number(durationMinutes),
    status: req.body.status || (paymentStatus === 'paid' ? 'confirmed' : 'pending'),
    paymentStatus: paymentStatus || 'paid',
    paymentMethod: paymentMethod || 'mada',
    courtPrice,
    racketRentalsCount: Number(racketRentalsCount) || 0,
    racketPrice,
    ballsCount: Number(ballsCount) || 0,
    ballsPrice,
    appliedDiscountCode,
    discountAmount,
    totalPrice,
    matchType: matchType || 'friendly',
    notes,
    createdBy: req.body.createdBy || `${currentUser.name} (${currentUser.role === 'admin' ? 'المدير' : 'موظف'})`,
    createdAt,
  };

  db.bookings.unshift(newBooking);
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'booking_created',
    newBooking.bookingCode,
    `حجز جديد: ${newBooking.customerName} - ${newBooking.courtName} (${newBooking.date} ${newBooking.startTime}-${newBooking.endTime})`
  );

  res.status(201).json(newBooking);
});

// Update booking (time, duration, notes, payment status) with collision check
app.put('/api/bookings/:id', (req, res) => {
  const currentUser = (req as any).currentUser;
  const bookingId = req.params.id;
  const index = db.bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return res.status(404).json({ error: 'الحجز غير موجود' });
  }

  const currentBooking = db.bookings[index];
  const targetCourtId = req.body.courtId || currentBooking.courtId;
  const targetDate = req.body.date || currentBooking.date;
  const targetStartTime = req.body.startTime || currentBooking.startTime;
  const targetDuration = Number(req.body.durationMinutes || currentBooking.durationMinutes);

  // If time, date, or court changed, run collision check!
  if (
    targetCourtId !== currentBooking.courtId ||
    targetDate !== currentBooking.date ||
    targetStartTime !== currentBooking.startTime ||
    targetDuration !== currentBooking.durationMinutes
  ) {
    const collision = checkBookingCollision(targetCourtId, targetDate, targetStartTime, targetDuration, bookingId);
    if (collision) {
      return res.status(409).json({
        error: `تعذر تعديل الوقت: الملعب محجوز بالفعل في هذا التوقيت للاعب (${collision.customerName}) من ${collision.startTime} إلى ${collision.endTime}`,
      });
    }
  }

  // Recalculate end time
  const [h, m] = targetStartTime.split(':').map(Number);
  const totalMin = h * 60 + m + targetDuration;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  db.bookings[index] = {
    ...currentBooking,
    ...req.body,
    startTime: targetStartTime,
    endTime,
    durationMinutes: targetDuration,
  };
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'booking_updated',
    currentBooking.bookingCode,
    `تعديل تفاصيل حجز اللاعب ${currentBooking.customerName}`
  );

  res.json(db.bookings[index]);
});

// Cancel booking with reason and audit trail
app.post('/api/bookings/:id/cancel', (req, res) => {
  const currentUser = (req as any).currentUser;
  const bookingId = req.params.id;
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'الحجز غير موجود' });
  }

  const { reason, note } = req.body;
  booking.status = 'cancelled';
  if (reason) (booking as any).cancellationReason = reason;
  if (note) (booking as any).cancellationNote = note;
  (booking as any).cancelledAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'booking_cancelled',
    booking.bookingCode,
    `إلغاء حجز ${booking.customerName}${reason ? ` - السبب: ${reason}` : ''}`
  );

  res.json({ success: true, booking });
});

// Permanent delete booking
app.delete('/api/bookings/:id', (req, res) => {
  const currentUser = (req as any).currentUser || { id: 'admin', name: 'المدير', role: 'admin' };
  const bookingId = req.params.id;
  const index = db.bookings.findIndex((b) => b.id === bookingId || b.bookingCode === bookingId);
  if (index === -1) {
    return res.status(404).json({ error: 'الحجز غير موجود' });
  }

  const deleted = db.bookings.splice(index, 1)[0];
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'booking_deleted',
    deleted.bookingCode,
    `حذف حجز العميل ${deleted.customerName} نهائياً وإعادة إتاحة الوقت`
  );

  res.json({ success: true, deletedBooking: deleted });
});

// ==================== EXTERNAL WEBSITE INTEGRATION API (موقع الحجوزات الثاني) ====================

// Helper to normalize date (supports "21 Sep" or "2026-09-21")
function normalizeDateString(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // Format: "21 Sep"
  const parts = dateStr.trim().split(' ');
  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = monthNames.findIndex((m) => m.toLowerCase() === parts[1].toLowerCase());
    if (mIdx !== -1) {
      const year = new Date().getFullYear();
      const month = String(mIdx + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return dateStr;
}

// Helper to normalize time string (supports "04:00 م", "01:30 ص", "16:00")
function normalizeTimeString(timeStr: string): string {
  if (!timeStr) return '16:00';
  const clean = timeStr.trim();
  if (clean.includes('م') || clean.includes('ص')) {
    const isPM = clean.includes('م');
    const timeOnly = clean.replace(/[^\d:]/g, '');
    const [h, m] = timeOnly.split(':').map(Number);
    let h24 = h;
    if (isPM && h !== 12) h24 = h + 12;
    if (!isPM && h === 12) h24 = 0;
    return `${String(h24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  }
  return clean;
}

// 1. Health check & status
app.get('/api/external/status', (req, res) => {
  res.json({
    status: 'online',
    systemName: 'بادل منيفة - نظام إدارة الحجوزات الموحد',
    courts: db.courts.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive })),
    activeBookingsCount: db.bookings.filter((b) => b.status !== 'cancelled').length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Fetch available & booked slots for an external site
app.get('/api/external/slots', (req, res) => {
  const rawDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const isoDate = normalizeDateString(rawDate);
  const duration = Number(req.query.duration || 90);

  const dayBookings = db.bookings.filter((b) => b.date === isoDate && b.status !== 'cancelled');

  const getSlotsForCourt = (courtId: string) => {
    const booked = dayBookings.filter((b) => b.courtId === courtId);
    const slots: any[] = [];
    const openMin = 960; // 16:00 (4:00 PM)
    const closeMin = 1620; // 03:00 AM next day
    const step = 30;

    for (let start = openMin; start <= closeMin - duration; start += step) {
      const end = start + duration;
      const collision = booked.some((b) => {
        const bStart = toOperationalMinutes(b.startTime);
        const bEnd = bStart + (b.durationMinutes || duration);
        return Math.max(start, bStart) < Math.min(end, bEnd);
      });

      const sNorm = start % 1440;
      const sH24 = Math.floor(sNorm / 60);
      const sH12 = sH24 % 12 || 12;
      const sMin = String(sNorm % 60).padStart(2, '0');
      const period = sH24 >= 12 ? 'م' : 'ص';
      const timeLabel = `${String(sH12).padStart(2, '0')}:${sMin} ${period}`;

      slots.push({
        startMin: start,
        startTime24: `${String(sH24).padStart(2, '0')}:${sMin}`,
        timeLabel,
        isAvailable: !collision,
      });
    }
    return slots;
  };

  res.json({
    date: isoDate,
    durationMinutes: duration,
    court1: {
      id: 'court-1',
      name: 'Court 1 - بادل 1',
      slots: getSlotsForCourt('court-1'),
    },
    court2: {
      id: 'court-2',
      name: 'Court 2 - بادل 2',
      slots: getSlotsForCourt('court-2'),
    },
  });
});

// 3. Create booking from External Site (Webhooks / REST)
app.post('/api/external/bookings', (req, res) => {
  const {
    courtId,
    courtKey,
    courtName,
    date,
    startTime,
    durationMinutes,
    customerName,
    customerPhone,
    paymentMethod,
    balls,
    ballsCount,
    source,
    notes,
  } = req.body;

  if (!date || !startTime || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'بيانات الحجز غير مكتملة (التاريخ، الوقت، اسم العميل، رقم الجوال مطلوبة)' });
  }

  // Normalize court ID
  let targetCourtId = 'court-1';
  let targetCourtName = 'Court 1 - بادل 1';
  const cIdentifier = (courtId || courtKey || courtName || '').toString().toLowerCase();
  if (cIdentifier.includes('2') || cIdentifier.includes('court-2') || cIdentifier.includes('court2')) {
    targetCourtId = 'court-2';
    targetCourtName = 'Court 2 - بادل 2';
  }

  const isoDate = normalizeDateString(date);
  const time24 = normalizeTimeString(startTime);
  const duration = Number(durationMinutes) || 90;

  // Collision check
  const collision = checkBookingCollision(targetCourtId, isoDate, time24, duration);
  if (collision) {
    return res.status(409).json({
      success: false,
      error: `هذا الوقت محجوز بالفعل مسبقاً للاعب (${collision.customerName}) من ${collision.startTime} إلى ${collision.endTime}. يرجى اختيار وقت آخر.`,
      conflict: {
        startTime: collision.startTime,
        endTime: collision.endTime,
      },
    });
  }

  // Calculate end time
  const [h, m] = time24.split(':').map(Number);
  const totalMin = h * 60 + m + duration;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const numBalls = Number(ballsCount || balls) || 0;
  const courtPrice = duration === 60 ? 140 : duration === 90 ? 190 : 240;
  const ballsPrice = numBalls * (db.clubSettings.ballCanPrice || 15);
  const totalPrice = courtPrice + ballsPrice;

  const bookingCode = `PDL-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const externalBooking = {
    id: `bkg-ext-${Date.now()}`,
    bookingCode,
    courtId: targetCourtId,
    courtName: targetCourtName,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    date: isoDate,
    startTime: time24,
    endTime,
    durationMinutes: duration,
    status: 'confirmed',
    paymentStatus: paymentMethod === 'cash' ? 'unpaid' : 'paid',
    paymentMethod: paymentMethod || 'apple_pay',
    courtPrice,
    racketRentalsCount: 0,
    racketPrice: 0,
    ballsCount: numBalls,
    ballsPrice,
    discountAmount: 0,
    totalPrice,
    matchType: 'friendly',
    notes: notes || `وارد من ${source || 'الموقع الخارجي (موقع الحجوزات)'}`,
    createdBy: `${source || 'الموقع الخارجي (موقع الحجوزات 2)'}`,
    createdAt,
  };

  db.bookings.unshift(externalBooking);
  saveDb();

  logAudit(
    'system-external',
    source || 'الموقع الخارجي',
    'external_api',
    'external_booking_received',
    externalBooking.bookingCode,
    `حجز وارد من الموقع الخارجي للعميل ${externalBooking.customerName} في ${externalBooking.courtName} (${externalBooking.date} ${externalBooking.startTime})`
  );

  res.status(201).json({
    success: true,
    message: 'تم تسجيل الحجز بنجاح ومزامنته في لوحة الإدارة وحجب الوقت من كافة الأنظمة',
    booking: externalBooking,
    bookingCode,
  });
});

// 4. Cancel booking from External Site
app.post('/api/external/bookings/cancel', (req, res) => {
  const { bookingId, bookingCode, phone } = req.body;
  const booking = db.bookings.find(
    (b) =>
      (bookingId && b.id === bookingId) ||
      (bookingCode && b.bookingCode === bookingCode)
  );

  if (!booking) {
    return res.status(404).json({ error: 'الحجز غير موجود' });
  }

  if (phone && booking.customerPhone.trim() !== phone.trim()) {
    return res.status(403).json({ error: 'رقم الجوال غير متطابق مع بيانات الحجز' });
  }

  booking.status = 'cancelled';
  saveDb();

  logAudit(
    'system-external',
    'الموقع الخارجي',
    'external_api',
    'external_booking_cancelled',
    booking.bookingCode,
    `إلغاء حجز العميل ${booking.customerName} عبر الموقع الخارجي وإعادة إتاحة الوقت`
  );

  res.json({ success: true, message: 'تم إلغاء الحجز وإعادة الوقت للجدول بنجاح' });
});

// ==================== AUDIT LOGS & DISASTER RECOVERY BACKUP ====================

app.get('/api/audit-logs', (req, res) => {
  const role = (req as any).currentRole;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'سجل التدقيق متاح للمدير العام فقط' });
  }
  res.json(db.auditLogs || []);
});

// Export JSON backup (Admin only)
app.get('/api/backup/export', (req, res) => {
  const role = (req as any).currentRole;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'تصدير النسخة الاحتياطية متاح للمدير العام فقط' });
  }

  // Exclude raw passwords for safety
  const safeUsers = db.users.map(({ password, ...u }) => u);
  const backupPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    clubSettings: db.clubSettings,
    courts: db.courts,
    discounts: db.discounts,
    bookings: db.bookings,
    users: safeUsers,
    auditLogs: db.auditLogs,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=manifa-padel-backup-${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(backupPayload, null, 2));
});

// Restore backup (Admin only)
app.post('/api/backup/restore', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'استعادة النسخة الاحتياطية متاحة للمدير العام فقط' });
  }

  const payload = req.body;
  if (!payload || !payload.bookings || !payload.courts) {
    return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
  }

  db.bookings = payload.bookings || db.bookings;
  db.courts = payload.courts || db.courts;
  db.discounts = payload.discounts || db.discounts;
  db.clubSettings = payload.clubSettings || db.clubSettings;
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'backup_restored',
    'استعادة النظام',
    `تمت استعادة نسخة احتياطية بتاريخ ${payload.exportDate || 'غير محدد'}`
  );

  res.json({ success: true, message: 'تمت استعادة البيانات بنجاح' });
});

// Reset schedule helper for specific date (Admin only with explicit permission)
app.post('/api/bookings/reset-date', (req, res) => {
  const currentUser = (req as any).currentUser;
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'تفريغ حجوزات اليوم متاح للمدير العام فقط' });
  }

  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: 'التاريخ مطلوب' });
  }

  const countBefore = db.bookings.filter((b) => b.date === date).length;
  db.bookings = db.bookings.filter((b) => b.date !== date);
  saveDb();

  logAudit(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'schedule_reset',
    date,
    `تفريغ حجوزات تاريخ ${date} (تم حذف ${countBefore} حجز)`
  );

  res.json({ success: true, removedCount: countBefore });
});

// ==================== VITE SPA / STATIC SERVING ====================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎾 Manifa Padel Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
