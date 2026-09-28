import React, { useState, useMemo } from 'react';
import { usePadel } from '../context/PadelContext';
import { Court, Booking } from '../types/padel';
import {
  Dumbbell,
  CheckCircle,
  Wrench,
  Edit,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  Info,
  X,
  Zap,
  Sliders,
} from 'lucide-react';
import {
  getOperationalTimeBounds,
  POPULAR_OPERATING_HOURS_PRESETS,
  formatSingleTime,
} from '../utils/timeFormat';
import { TIME_CHOICES } from './OperatingHoursModal';

export const CourtsManager: React.FC = () => {
  const {
    courts,
    bookings,
    updateCourt,
    toggleCourtActive,
    canViewRevenue,
    clubSettings,
    updateClubSettings,
    showToast,
    theme,
  } = usePadel();

  const isDark = theme === 'dark';

  // Operating Hours State for Management
  const [hoursOpenTime, setHoursOpenTime] = useState<string>(
    () => formatSingleTime(clubSettings.openingTime) || '4:00 م'
  );
  const [hoursCloseTime, setHoursCloseTime] = useState<string>(
    () => formatSingleTime(clubSettings.closingTime) || '3:00 ص'
  );
  const [hasUnsavedHours, setHasUnsavedHours] = useState(false);

  // Sync if clubSettings change externally
  React.useEffect(() => {
    setHoursOpenTime(formatSingleTime(clubSettings.openingTime) || '4:00 م');
    setHoursCloseTime(formatSingleTime(clubSettings.closingTime) || '3:00 ص');
    setHasUnsavedHours(false);
  }, [clubSettings.openingTime, clubSettings.closingTime]);

  // Live operational calculation
  const hoursBounds = useMemo(() => {
    return getOperationalTimeBounds(hoursOpenTime, hoursCloseTime);
  }, [hoursOpenTime, hoursCloseTime]);

  const handleApplyHoursPreset = (preset: typeof POPULAR_OPERATING_HOURS_PRESETS[0]) => {
    setHoursOpenTime(preset.open);
    setHoursCloseTime(preset.close);
    setHasUnsavedHours(true);
  };

  const handleSaveOperatingHours = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedOpen = formatSingleTime(hoursOpenTime);
    const formattedClose = formatSingleTime(hoursCloseTime);

    updateClubSettings({
      openingTime: formattedOpen,
      closingTime: formattedClose,
    });
    setHasUnsavedHours(false);
    showToast(
      `تم تطبيق مواعيد التشغيل الجديدة بنجاح: من ${formattedOpen} إلى ${formattedClose} في كافة أقسام النظام وجدول الملاعب وصفحة الحجز!`,
      'success'
    );
  };

  // Modal states for editing court & pricing
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSurface, setFormSurface] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState(140);
  const [formPeakHourlyRate, setFormPeakHourlyRate] = useState(190);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);

  // Modal states for maintenance simulation & confirmation
  const [maintenanceCourt, setMaintenanceCourt] = useState<Court | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('صيانة دورية للأرضية والزجاج');

  // Strictly take only the 2 official courts
  const officialCourts = courts.slice(0, 2);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Find future active bookings on a court
  const getAffectedBookings = (courtId: string): Booking[] => {
    return bookings.filter(
      (b) => b.courtId === courtId && b.date >= todayStr && b.status !== 'cancelled'
    );
  };

  const handleOpenEdit = (court: Court) => {
    if (!canViewRevenue) {
      showToast('تعديل تسعير الملاعب متاح للمدير العام فقط', 'error');
      return;
    }
    setEditingCourt(court);
    setFormName(court.name);
    setFormSurface(court.surface);
    setFormHourlyRate(court.hourlyRate);
    setFormPeakHourlyRate(court.peakHourlyRate);
    setFormFeatures(court.features);
    setIsEditModalOpen(true);
  };

  const handleSaveCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;

    updateCourt({
      ...editingCourt,
      name: formName.trim(),
      surface: formSurface.trim(),
      hourlyRate: Number(formHourlyRate),
      peakHourlyRate: Number(formPeakHourlyRate),
      features: formFeatures,
    });
    setIsEditModalOpen(false);
    showToast(`تم حفظ تعديل أسعار ومواصفات ${editingCourt.name} بنجاح. تسري فقط على الحجوزات الجديدة.`, 'success');
  };

  const handleOpenMaintenance = (court: Court) => {
    setMaintenanceCourt(court);
    setMaintenanceReason(court.maintenanceReason || 'صيانة دورية للأرضية والزجاج');
    setIsMaintenanceModalOpen(true);
  };

  const handleConfirmMaintenanceToggle = () => {
    if (!maintenanceCourt) return;

    toggleCourtActive(maintenanceCourt.id);
    setIsMaintenanceModalOpen(false);
    showToast(
      maintenanceCourt.isActive
        ? `تم تحويل ${maintenanceCourt.name} إلى وضع الصيانة وإيقاف الحجوزات الجديدة`
        : `تمت إعادة فتح ${maintenanceCourt.name} للتشغيل وجاهز للعب`,
      'info'
    );
  };

  return (
    <div id="courts-manager-view" className="space-y-5 pb-12">
      {/* Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
            : 'bg-white border-[#CBD5E1] text-[#0F172A] shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8]">
                <Dumbbell className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                إدارة ملعبي بادل منيفة (1 و 2) والتسعير
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              جاهزية الملاعب، تسعير الفترات (60 و 90 و 120 دقيقة)، وجدولة الصيانة مع بيان الحجوزات المتأثرة.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#18263B] dark:bg-[#18263B] text-[#38BDF8] border border-[#2A3A50]">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{officialCourts.length} ملاعب معتمدة (منيفة 1 ومنيفة 2)</span>
          </div>
        </div>
      </div>

      {/* Operating Hours Management Section (متى يفتح الملعب ومتى يسكر) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
          isDark
            ? 'bg-gradient-to-b from-[#111C2E] to-[#14233A] border-[#2A3A50] text-[#F1F5F9]'
            : 'bg-gradient-to-b from-white to-sky-50/40 border-sky-200 text-[#0F172A]'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0369A1] text-white shadow-xs">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>مواعيد تشغيل وساعات عمل الملاعب (وقت الفتح ووقت الإغلاق)</span>
                  {hasUnsavedHours && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                      تعديل غير محفوظ
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  حدد متى يفتح الملعب ومتى يسكر، وسيقوم النظام بتحديث الفترات الزمنية فوراً في صفحة الحجز، جدول الملاعب، واللوحة الإدارية.
                </p>
              </div>
            </div>
          </div>

          {/* Current Live Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              الحالي: من {clubSettings.openingTime} إلى {clubSettings.closingTime}
            </span>
          </div>
        </div>

        {/* Operating Hours Form */}
        <form onSubmit={handleSaveOperatingHours} className="pt-4 space-y-4">
          {/* Presets Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>قوالب أوقات عمل سريعة (ضغطة واحدة لتطبيق النمط):</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {POPULAR_OPERATING_HOURS_PRESETS.map((preset) => {
                const isSelected = hoursOpenTime === preset.open && hoursCloseTime === preset.close;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyHoursPreset(preset)}
                    className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0369A1] bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8] ring-2 ring-[#0369A1]/20 font-bold shadow-xs'
                        : isDark
                        ? 'border-[#2A3A50] bg-[#18263B]/60 hover:bg-[#18263B] text-slate-300'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <span className="text-[11px] font-black">{preset.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {preset.open} - {preset.close} ({preset.hours})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selectors & Save Button */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
            {/* Opening Time Dropdown */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>متى يفتح الملعب (بداية التشغيل):</span>
              </label>
              <div className="relative">
                <select
                  value={hoursOpenTime}
                  onChange={(e) => {
                    setHoursOpenTime(e.target.value);
                    setHasUnsavedHours(true);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold appearance-none transition-all outline-hidden cursor-pointer ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-[#38BDF8]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#0369A1]'
                  }`}
                >
                  {TIME_CHOICES.map((choice) => (
                    <option key={`hours-open-${choice}`} value={choice} className={isDark ? 'bg-[#18263B]' : 'bg-white'}>
                      {choice}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Closing Time Dropdown */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>متى يسكر الملعب (نهاية التشغيل):</span>
              </label>
              <div className="relative">
                <select
                  value={hoursCloseTime}
                  onChange={(e) => {
                    setHoursCloseTime(e.target.value);
                    setHasUnsavedHours(true);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold appearance-none transition-all outline-hidden cursor-pointer ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-[#38BDF8]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#0369A1]'
                  }`}
                >
                  {TIME_CHOICES.map((choice) => (
                    <option key={`hours-close-${choice}`} value={choice} className={isDark ? 'bg-[#18263B]' : 'bg-white'}>
                      {choice}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="sm:col-span-4">
              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 ${
                  hasUnsavedHours
                    ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-[#0369A1] hover:bg-[#025684] text-white'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>حفظ وتطبيق المواعيد فوراً</span>
              </button>
            </div>
          </div>

          {/* Operating Scope & Realtime Sync Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-inherit">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                إجمالي ساعات التشغيل اليومية: <strong className="text-slate-800 dark:text-slate-200">{hoursBounds.totalOperatingHours} ساعة</strong> (من {hoursBounds.openLabel} إلى {hoursBounds.closeLabel})
              </span>
            </div>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold">
              <span>✓ صفحة حجز اللاعبين</span>
              <span>•</span>
              <span>✓ جدول الملاعب اليومي</span>
              <span>•</span>
              <span>✓ اللوحة الإدارية</span>
            </div>
          </div>
        </form>
      </div>

      {/* Notice on Price Protection */}
      <div
        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
          isDark
            ? 'bg-[#18263B] border-[#2A3A50] text-[#B6C2D2]'
            : 'bg-sky-50 border-sky-200 text-slate-700'
        }`}
      >
        <Info className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-primary">حماية تسعيرة الحجوزات السابقة:</span>
          <p className="text-[11px] leading-relaxed">
            عند تعديل أسعار الملاعب، تطبق الأسعار الجديدة حصراً على الحجوزات المستقبلية المنشأة لاحقاً، وتبقى بيانات الحجوزات المؤكدة السابقة كما هي دون أي تغيير في فواتير العملاء.
          </p>
        </div>
      </div>

      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {officialCourts.map((court) => {
          const affectedBookings = getAffectedBookings(court.id);

          return (
            <div
              key={court.id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-colors ${
                isDark
                  ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] shadow-xs'
              }`}
            >
              <div>
                {/* Compact Court Banner (Reduced Image Space) */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={court.image}
                    alt={court.name}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-black/40 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm ${
                        court.isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {court.isActive ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>جاهز للعب ✓</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          <span>تحت الصيانة ⚠️</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Court Title Overlay */}
                  <div className="absolute bottom-2.5 right-3 left-3 text-white">
                    <h3 className="font-bold text-base sm:text-lg">{court.name}</h3>
                    <span className="text-[11px] text-slate-300 block truncate">
                      {court.surface}
                    </span>
                  </div>
                </div>

                {/* Pricing Breakdown: 60m, 90m, 120m (Uniform, neutral design) */}
                <div className="p-4 space-y-4 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-[#94A3B8] mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0369A1] dark:text-[#38BDF8]" />
                      <span>جدول التسعيرة المعتمدة للمدد الزمنية:</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isDark
                            ? 'bg-[#18263B] border-[#2A3A50]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] text-[#94A3B8] block">60 دقيقة</span>
                        <span className="font-bold text-sm text-primary">
                          {court.hourlyRate} ر.س
                        </span>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${
                          isDark
                            ? 'bg-[#18263B] border-[#2A3A50]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] text-[#94A3B8] block">90 دقيقة</span>
                        <span className="font-bold text-sm text-primary">
                          {court.peakHourlyRate} ر.س
                        </span>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${
                          isDark
                            ? 'bg-[#18263B] border-[#2A3A50]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] text-[#94A3B8] block">120 دقيقة</span>
                        <span className="font-bold text-sm text-primary">
                          {court.hourlyRate * 2 - 40} ر.س
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Surface & Court Features */}
                  <div>
                    <div className="text-[11px] font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#0369A1] dark:text-[#38BDF8]" />
                      <span>مواصفات وتجهيزات الملعب:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {court.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                            isDark
                              ? 'bg-[#18263B] text-[#B6C2D2] border border-[#2A3A50]'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Maintenance notice if currently active */}
                  {!court.isActive && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                      <Wrench className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="font-bold">الملعب في وضع الصيانة: </span>
                        <span>{court.maintenanceReason || 'صيانة دورية للملعب'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div
                className={`p-3.5 border-t flex items-center justify-between gap-2.5 ${
                  isDark
                    ? 'bg-[#18263B]/60 border-[#2A3A50]'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <button
                  onClick={() => handleOpenMaintenance(court)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    court.isActive
                      ? isDark
                        ? 'bg-[#18263B] hover:bg-rose-950/40 text-[#B6C2D2] hover:text-rose-400 border border-[#2A3A50]'
                        : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 shadow-2xs'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{court.isActive ? 'جدولة صيانة' : 'إعادة إتاحة الملعب للعب'}</span>
                </button>

                {canViewRevenue && (
                  <button
                    onClick={() => handleOpenEdit(court)}
                    className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل الأسعار والمواصفات</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Court & Pricing Modal */}
      {isEditModalOpen && editingCourt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 border ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
                <span>تعديل بيانات وتسعير {editingCourt.name}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#94A3B8] hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourt} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-primary">اسم الملعب</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-primary">مواصفات الأرضية</label>
                <input
                  type="text"
                  required
                  value={formSurface}
                  onChange={(e) => setFormSurface(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-primary">
                    سعر 60 دقيقة (ر.س) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={1000}
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 border font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-primary">
                    سعر 90 دقيقة (ر.س) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={1500}
                    value={formPeakHourlyRate}
                    onChange={(e) => setFormPeakHourlyRate(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 border font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0369A1]/10 border border-[#0369A1]/20 text-[11px] text-[#94A3B8]">
                💡 سيتم حساب سعر الـ 120 دقيقة تلقائياً وفق معادلة الحجز المعتمدة. لن تتأثر الحجوزات السابقة إطلاقاً.
              </div>

              <div className="pt-3 border-t border-current/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  حفظ الأسعار الجديدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Confirmation Modal with Affected Bookings Breakdown */}
      {isMaintenanceModalOpen && maintenanceCourt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>
                  {maintenanceCourt.isActive
                    ? `جدولة صيانة وقفل ${maintenanceCourt.name}`
                    : `إعادة إتاحة ${maintenanceCourt.name}`}
                </span>
              </h3>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-[#94A3B8] hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {maintenanceCourt.isActive ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-primary">سبب الصيانة:</label>
                  <input
                    type="text"
                    value={maintenanceReason}
                    onChange={(e) => setMaintenanceReason(e.target.value)}
                    placeholder="مثال: تنظيف العشب، صيانة الإضاءة، فحص الزجاج..."
                    className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>

                {/* Affected Bookings Audit */}
                <div className="space-y-2">
                  <div className="font-semibold text-primary flex items-center justify-between">
                    <span>بيان الحجوزات المتأثرة بالصيانة:</span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400">
                      {getAffectedBookings(maintenanceCourt.id).length} حجوزات قادمة
                    </span>
                  </div>

                  {getAffectedBookings(maintenanceCourt.id).length === 0 ? (
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-center font-medium">
                      ✓ لا توجد أي حجوزات مجدولة على هذا الملعب حالياً. يمكن تنفيذ الصيانة بأمان تام.
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto divide-y divide-current/10 border rounded-lg p-2 bg-black/10 dark:bg-black/20">
                      {getAffectedBookings(maintenanceCourt.id).map((b) => (
                        <div key={b.id} className="py-2 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-primary block">{b.customerName}</span>
                            <span className="text-[#94A3B8]">
                              {b.date} ({b.startTime} - {b.endTime})
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-[#38BDF8]">
                            {b.bookingCode}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-current/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmMaintenanceToggle}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                  >
                    تأكيد إدخال الملعب في الصيانة
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-secondary leading-relaxed">
                  هل انتهت أعمال الصيانة لـ <strong className="text-primary">{maintenanceCourt.name}</strong>؟
                  سيتم فتح الملعب فوراً وإتاحته للعملاء في صفحة الحجز وجدول المباريات.
                </p>

                <div className="pt-3 border-t border-current/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmMaintenanceToggle}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    تأكيد إعادة الإتاحة للعب
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
