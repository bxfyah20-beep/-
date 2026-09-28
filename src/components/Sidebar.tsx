import React from 'react';
import { usePadel } from '../context/PadelContext';
import {
  LayoutDashboard,
  CalendarDays,
  ListOrdered,
  Tag,
  Dumbbell,
  KeyRound,
  ExternalLink,
  Eye,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'schedule'
  | 'bookings'
  | 'discounts'
  | 'courts'
  | 'users_security';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenCustomerBookingView: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCustomerBookingView,
}) => {
  const {
    canViewRevenue,
    discounts,
    theme,
    bookings,
  } = usePadel();

  const isDark = theme === 'dark';
  const activeDiscountsCount = discounts.filter((d) => d.isActive).length;

  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayBookingsCount = bookings.filter((b) => b.date === todayStr && b.status !== 'cancelled').length;
  const activeBookingsCount = bookings.filter((b) => b.status !== 'cancelled').length;

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'نظرة عامة',
      icon: LayoutDashboard,
      badge: todayBookingsCount > 0 ? `${todayBookingsCount} اليوم` : undefined,
    },
    {
      id: 'schedule' as NavTab,
      label: 'جدول الملاعب اليومي',
      icon: CalendarDays,
      badge: todayBookingsCount > 0 ? `${todayBookingsCount} حجز اليوم` : `${activeBookingsCount} حجز`,
    },
    {
      id: 'bookings' as NavTab,
      label: 'سجل وإدارة الحجوزات',
      icon: ListOrdered,
      badge: activeBookingsCount > 0 ? `${activeBookingsCount} مسجل` : undefined,
    },
    {
      id: 'discounts' as NavTab,
      label: 'العروض والخصومات',
      icon: Tag,
      badge: activeDiscountsCount > 0 ? `${activeDiscountsCount} نشط` : undefined,
    },
    {
      id: 'courts' as NavTab,
      label: 'الملعبين والأسعار وساعات العمل',
      icon: Dumbbell,
    },
    ...(canViewRevenue
      ? [
          {
            id: 'users_security' as NavTab,
            label: 'المستخدمين والأمان',
            icon: KeyRound,
            badge: 'المدير فقط',
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`w-full lg:w-64 border-b lg:border-b-0 lg:border-l p-4 shrink-0 flex flex-col justify-between transition-colors ${
        isDark ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]' : 'bg-white border-[#CBD5E1] text-[#0F172A]'
      }`}
    >
      <div className="space-y-4">
        {/* Section Navigation Switcher (قسم الإدارة / قسم الحجوزات) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#94A3B8] px-1">أقسام النظام:</div>
          <div
            className={`p-1 rounded-2xl border grid grid-cols-2 gap-1 ${
              isDark ? 'bg-[#0B1220] border-[#2A3A50]' : 'bg-[#F1F5F9] border-[#E2E8F0]'
            }`}
          >
            <button
              id="sidebar-btn-admin-section"
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black bg-[#0369A1] text-white shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>قسم الإدارة</span>
            </button>

            <button
              id="sidebar-btn-booking-section"
              onClick={onOpenCustomerBookingView}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                isDark
                  ? 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
              }`}
              title="الانتقال إلى صفحة حجز اللاعبين"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>الحجوزات</span>
              {activeBookingsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#0369A1] text-white">
                  {activeBookingsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Administration Main Navigation List */}
        <div className="space-y-1 pt-1">
          <div className="text-[11px] font-bold text-[#94A3B8] px-1 pb-1">لوحة الإدارة:</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0369A1] text-white shadow-xs'
                      : isDark
                      ? 'text-[#B6C2D2] hover:bg-white/5 hover:text-white'
                      : 'text-[#334155] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#0369A1] dark:text-[#38BDF8]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isDark
                          ? 'bg-white/10 text-[#B6C2D2]'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Customer Booking View Shortcut Button at Bottom */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#2A3A50]">
        <button
          onClick={onOpenCustomerBookingView}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#0369A1]/50 bg-[#0369A1]/10 hover:bg-[#0369A1]/20 text-[#0369A1] dark:text-[#38BDF8] text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>معاينة صفحة حجز العملاء</span>
        </button>
      </div>
    </aside>
  );
};
