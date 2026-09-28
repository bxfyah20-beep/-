export type UserRole = 'admin' | 'staff';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  ipnCode: string; // Private security IPN for employee/admin verification
  role: UserRole;
  avatar: string;
  phone: string;
  lastLogin: string;
  passwordUpdatedDate: string;
  active: boolean;
}

export interface IpnAccessLog {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  ipnCode: string;
  status: 'granted' | 'denied';
  userId?: string;
  userName: string;
  userRole?: UserRole;
  notes?: string;
  device?: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type PaymentMethod = 'cash' | 'mada' | 'apple_pay' | 'visa_master' | 'transfer';
export type MatchType = 'friendly' | 'competitive' | 'coaching' | 'tournament';

export interface Booking {
  id: string;
  bookingCode: string;
  courtId: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "18:00"
  endTime: string; // e.g. "19:30"
  durationMinutes: number; // 60 or 90
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  courtPrice: number;
  racketRentalsCount: number;
  racketPrice: number;
  ballsCount: number;
  ballsPrice: number;
  appliedDiscountCode?: string;
  discountAmount: number;
  totalPrice: number; // Final amount
  matchType: MatchType;
  notes?: string;
  cancellationReason?: string;
  cancellationNote?: string;
  cancelledAt?: string;
  createdBy: string; // Staff or Admin name
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'booking_created'
    | 'booking_updated'
    | 'booking_cancelled'
    | 'court_updated'
    | 'court_maintenance'
    | 'discount_created'
    | 'discount_updated'
    | 'discount_status'
    | 'discount_archived'
    | 'user_created'
    | 'user_deleted'
    | 'user_avatar_updated'
    | 'password_changed'
    | 'backup_restored';
  target: string;
  details: string;
}

export interface Court {
  id: string;
  name: string;
  type: 'panoramic' | 'indoor' | 'outdoor';
  surface: string;
  hourlyRate: number;
  peakHourlyRate: number;
  image: string;
  isActive: boolean;
  maintenanceReason?: string;
  maintenanceSchedule?: {
    startDate: string;
    endDate: string;
    reason: string;
  };
  features: string[];
}

export type DiscountType = 'percentage' | 'fixed';

export interface DiscountOffer {
  id: string;
  title: string;
  description: string;
  code: string;
  type: DiscountType;
  value: number; // e.g. 20 for 20% or 50 for 50 SAR
  minBookingAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  isArchived?: boolean;
  usageCount: number;
  maxUsageLimit?: number;
  applicableCourts: string[]; // 'all' or specific court IDs
  applicableDays?: string; // e.g. "جميع الأيام" or "الأحد - الأربعاء"
  applicableHours?: string; // e.g. "كامل اليوم" or "17:00 - 20:00"
  highlightBanner: boolean; // Show in prominent banner on booking page
  badgeText?: string; // e.g. "عرض محدود" or "الأكثر طلباً"
}

export interface ClubSettings {
  clubName: string;
  phone: string;
  location: string;
  currency: string;
  openingTime: string; // "08:00"
  closingTime: string; // "01:00"
  racketRentalPrice: number;
  ballCanPrice: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  bookingId?: string;
  bookingCode?: string;
  customerName: string;
  customerPhone: string;
  courtName: string;
  date: string;
  time: string;
  totalPrice: number;
  timestamp: string;
  read: boolean;
  type: 'new_booking' | 'cancellation' | 'system';
}
