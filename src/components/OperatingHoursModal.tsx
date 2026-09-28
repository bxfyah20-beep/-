import React, { useState, useMemo } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  getOperationalTimeBounds,
  POPULAR_OPERATING_HOURS_PRESETS,
  formatSingleTime,
} from '../utils/timeFormat';
import {
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';

interface OperatingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TIME_CHOICES = [
  '06:00 ص', '06:30 ص', '07:00 ص', '07:30 ص', '08:00 ص', '08:30 ص', '09:00 ص', '09:30 ص',
  '10:00 ص', '10:30 ص', '11:00 ص', '11:30 ص', '12:00 م', '12:30 م', '01:00 م', '01:30 م',
  '02:00 م', '02:30 م', '03:00 م', '03:30 م', '04:00 م', '04:30 م', '05:00 م', '05:30 م',
  '06:00 م', '06:30 م', '07:00 م', '07:30 م', '08:00 م', '08:30 م', '09:00 م', '09:30 م',
  '10:00 م', '10:30 م', '11:00 م', '11:30 م', '12:00 ص', '12:30 ص', '01:00 ص', '01:30 ص',
  '02:00 ص', '02:30 ص', '03:00 ص', '03:30 ص', '04:00 ص', '04:30 ص', '05:00 ص', '05:30 ص',
];

export const OperatingHoursModal: React.FC<OperatingHoursModalProps> = ({ isOpen, onClose }) => {
  const { clubSettings, updateClubSettings, showToast, theme } = usePadel();
  const isDark = theme === 'dark';

  const [openTime, setOpenTime] = useState<string>(() => formatSingleTime(clubSettings.openingTime) || '4:00 م');
  const [closeTime, setCloseTime] = useState<string>(() => formatSingleTime(clubSettings.closingTime) || '3:00 ص');

  // Synchronize when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setOpenTime(formatSingleTime(clubSettings.openingTime) || '4:00 م');
      setCloseTime(formatSingleTime(clubSettings.closingTime) || '3:00 ص');
    }
  }, [isOpen, clubSettings.openingTime, clubSettings.closingTime]);

  // Live calculation of operational hours
  const bounds = useMemo(() => {
    return getOperationalTimeBounds(openTime, closeTime);
  }, [openTime, closeTime]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof POPULAR_OPERATING_HOURS_PRESETS[0]) => {
    setOpenTime(preset.open);
    setCloseTime(preset.close);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedOpen = formatSingleTime(openTime);
    const formattedClose = formatSingleTime(closeTime);

    updateClubSettings({
      openingTime: formattedOpen,
      closingTime: formattedClose,
    });

    showToast(`تم تحديث مواعيد تشغيل الملاعب بنجاح: من ${formattedOpen} إلى ${formattedClose}، وتطبيقها فوراً في كل مكان!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDark ? 'bg-[#111C2E] border-[#2A3A50] text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-inherit bg-gradient-to-r from-[#0369A1]/15 to-transparent">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#0369A1] text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                تعديل مواعيد تشغيل وساعات عمل الملاعب
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                حدد وقت فتح الملعب ووقت الإغلاق ليتم تطبيق الفترات تلقائياً في كل مكان
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto no-scrollbar">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>قوالب أوقات عمل جاهزة سريعة (ضغطة واحدة):</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_OPERATING_HOURS_PRESETS.map((preset) => {
                const isSelected = openTime === preset.open && closeTime === preset.close;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0369A1] bg-[#0369A1]/10 text-[#0369A1] dark:text-[#38BDF8] ring-2 ring-[#0369A1]/20 font-bold'
                        : isDark
                        ? 'border-[#2A3A50] bg-[#18263B]/60 hover:bg-[#18263B] text-slate-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{preset.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8]">
                        {preset.hours}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Selectors: Open & Close Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Opening Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>متى يفتح الملعب (بداية التشغيل):</span>
              </label>
              <div className="relative">
                <select
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className={`w-full py-2.5 px-3 rounded-2xl border text-sm font-bold appearance-none transition-all outline-hidden cursor-pointer ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-[#38BDF8]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#0369A1]'
                  }`}
                >
                  {TIME_CHOICES.map((choice) => (
                    <option key={`open-${choice}`} value={choice} className={isDark ? 'bg-[#18263B]' : 'bg-white'}>
                      {choice}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                أول وقت حجز متاح للاعبين والجدول
              </p>
            </div>

            {/* Closing Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>متى يسكر الملعب (نهاية التشغيل):</span>
              </label>
              <div className="relative">
                <select
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className={`w-full py-2.5 px-3 rounded-2xl border text-sm font-bold appearance-none transition-all outline-hidden cursor-pointer ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-[#38BDF8]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#0369A1]'
                  }`}
                >
                  {TIME_CHOICES.map((choice) => (
                    <option key={`close-${choice}`} value={choice} className={isDark ? 'bg-[#18263B]' : 'bg-white'}>
                      {choice}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                وقت إغلاق الملاعب ونهاية آخر مباراة
              </p>
            </div>
          </div>

          {/* Live Result & Scope Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
              isDark
                ? 'bg-[#18263B]/70 border-[#2A3A50] text-slate-200'
                : 'bg-sky-50/80 border-sky-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                معاينة نطاق التشغيل اليومي:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                إجمالي {bounds.totalOperatingHours} ساعة تشغيل
              </span>
            </div>

            <div className="text-sm font-black text-[#0369A1] dark:text-[#38BDF8] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>من {bounds.openLabel} إلى {bounds.closeLabel}</span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 pt-1 border-t border-inherit">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>التطبيق الفوري:</strong> سيتحدث جدول الملاعب اليومي، شبكة الفترات بصفحة حجز اللاعبين، وشريط ساعات العمل بالشريط العلوي تلقائياً دون الحاجة لتحديث الصفحة.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all text-slate-600 dark:text-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0369A1] hover:bg-[#025684] text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>حفظ وتطبيق فوري في كل مكان</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
