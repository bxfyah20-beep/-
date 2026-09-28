import React, { useState } from 'react';
import { usePadel } from '../context/PadelContext';
import { DiscountOffer } from '../types/padel';
import {
  Tag,
  Plus,
  Edit2,
  Copy,
  Check,
  Eye,
  Pause,
  Play,
  Archive,
  RotateCcw,
  Calendar,
  Clock,
  Dumbbell,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';

interface DiscountsManagerProps {
  onOpenCustomerBookingView: () => void;
}

export const DiscountsManager: React.FC<DiscountsManagerProps> = ({
  onOpenCustomerBookingView,
}) => {
  const {
    discounts,
    addDiscount,
    updateDiscount,
    toggleDiscountActive,
    archiveDiscount,
    canViewRevenue,
    showToast,
    theme,
    clubSettings,
  } = usePadel();

  const isDark = theme === 'dark';

  // Active vs Archived tab
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Modal states for adding or editing discount
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);

  const defaultHoursDesc = `كامل ساعات العمل (${clubSettings.openingTime || '4:00 م'} - ${clubSettings.closingTime || '3:00 ص'})`;

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number>(15);
  const [formMinAmount, setFormMinAmount] = useState<number>(140);
  const [formValidUntil, setFormValidUntil] = useState('2026-12-31');
  const [formApplicableCourts, setFormApplicableCourts] = useState<string[]>(['all']);
  const [formApplicableDays, setFormApplicableDays] = useState('جميع الأيام');
  const [formApplicableHours, setFormApplicableHours] = useState(defaultHoursDesc);
  const [formMaxUsageLimit, setFormMaxUsageLimit] = useState<number>(100);
  const [formHighlightBanner, setFormHighlightBanner] = useState(true);
  const [formBadgeText, setFormBadgeText] = useState('عرض خاص 🔥');

  // Track copied code state for visual feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredDiscounts = discounts.filter((d) =>
    activeTab === 'active' ? !d.isArchived : d.isArchived
  );

  const handleOpenAddModal = () => {
    setEditingDiscountId(null);
    setFormTitle('');
    setFormDescription('خصم خاص على حجوزات ملاعب بادل منيفة');
    setFormCode('');
    setFormType('percentage');
    setFormValue(15);
    setFormMinAmount(140);
    setFormValidUntil('2026-12-31');
    setFormApplicableCourts(['all']);
    setFormApplicableDays('جميع الأيام');
    setFormApplicableHours(defaultHoursDesc);
    setFormMaxUsageLimit(100);
    setFormHighlightBanner(true);
    setFormBadgeText('عرض خاص 🔥');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d: DiscountOffer) => {
    setEditingDiscountId(d.id);
    setFormTitle(d.title);
    setFormDescription(d.description);
    setFormCode(d.code);
    setFormType(d.type);
    setFormValue(d.value);
    setFormMinAmount(d.minBookingAmount || 140);
    setFormValidUntil(d.validUntil);
    setFormApplicableCourts(d.applicableCourts || ['all']);
    setFormApplicableDays(d.applicableDays || 'جميع الأيام');
    setFormApplicableHours(d.applicableHours || 'كامل ساعات العمل');
    setFormMaxUsageLimit(d.maxUsageLimit || 100);
    setFormHighlightBanner(d.highlightBanner);
    setFormBadgeText(d.badgeText || 'عرض خاص');
    setIsModalOpen(true);
  };

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim()) {
      showToast('يرجى كتابة عنوان العرض وكود الخصم', 'error');
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();

    if (editingDiscountId) {
      // Update existing
      updateDiscount({
        id: editingDiscountId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        code: cleanCode,
        type: formType,
        value: Number(formValue),
        minBookingAmount: Number(formMinAmount),
        validFrom: '2026-01-01',
        validUntil: formValidUntil,
        isActive: true,
        usageCount: discounts.find((d) => d.id === editingDiscountId)?.usageCount || 0,
        maxUsageLimit: Number(formMaxUsageLimit),
        applicableCourts: formApplicableCourts,
        applicableDays: formApplicableDays,
        applicableHours: formApplicableHours,
        highlightBanner: formHighlightBanner,
        badgeText: formBadgeText.trim(),
      });
      showToast(`تم حفظ تعديل العرض (${cleanCode}) بنجاح`, 'success');
    } else {
      // Add new
      addDiscount({
        title: formTitle.trim(),
        description: formDescription.trim(),
        code: cleanCode,
        type: formType,
        value: Number(formValue),
        minBookingAmount: Number(formMinAmount),
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: formValidUntil,
        isActive: true,
        usageCount: 0,
        maxUsageLimit: Number(formMaxUsageLimit),
        applicableCourts: formApplicableCourts,
        applicableDays: formApplicableDays,
        applicableHours: formApplicableHours,
        highlightBanner: formHighlightBanner,
        badgeText: formBadgeText.trim(),
      });
      showToast(`تم نشر العرض والكوبون الجديد (${cleanCode}) بنجاح`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`تم نسخ كود الخصم (${code}) بنجاح ✓`, 'info');
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  return (
    <div id="discounts-manager" className="space-y-4 pb-12">
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
                <Tag className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                إدارة عروض وكوبونات بادل منيفة
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              تحديد الشروط والمدد، فصل التفعيل عن الظهور، وإدارة حدود مرات الاستخدام.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCustomerBookingView}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isDark
                  ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
              <span>معاينة صفحة الحجز</span>
            </button>

            {canViewRevenue && (
              <button
                id="btn-add-new-discount"
                onClick={handleOpenAddModal}
                className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عرض جديد</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rules Notice Banner */}
      <div
        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
          isDark
            ? 'bg-[#18263B] border-[#2A3A50] text-[#B6C2D2]'
            : 'bg-sky-50 border-sky-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>قواعد النظام المطبقة:</strong> يسمح بكوبون خصم واحد فقط لكل حجز (منع جمع العروض)، ولا يتجاوز الخصم قيمة الحجز الإجمالية.
          </span>
        </div>

        {/* Tab switcher: Active vs Archived */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'active'
                ? 'bg-[#0369A1] text-white shadow-2xs'
                : 'text-[#94A3B8] hover:text-primary'
            }`}
          >
            العروض النشطة ({discounts.filter((d) => !d.isArchived).length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'archived'
                ? 'bg-[#0369A1] text-white shadow-2xs'
                : 'text-[#94A3B8] hover:text-primary'
            }`}
          >
            الأرشيف ({discounts.filter((d) => d.isArchived).length})
          </button>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDiscounts.length === 0 ? (
          <div
            className={`col-span-full p-8 rounded-2xl border text-center text-xs text-[#94A3B8] ${
              isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200'
            }`}
          >
            {activeTab === 'active'
              ? 'لا توجد عروض نشطة حالياً. انقر على "إضافة عرض جديد" للبدء.'
              : 'الأرشيف فارغ حالياً.'}
          </div>
        ) : (
          filteredDiscounts.map((disc) => (
            <div
              key={disc.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3.5 transition-colors ${
                isDark
                  ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] shadow-xs'
              }`}
            >
              <div>
                {/* Status Badges & Controls */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        disc.isActive
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                      }`}
                    >
                      {disc.isActive ? 'مفعّل وصالح ✓' : 'معلّق مؤقتاً ⏸'}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        disc.highlightBanner
                          ? 'bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8] border border-[#0369A1]/25'
                          : 'bg-slate-200/50 dark:bg-white/5 text-[#94A3B8]'
                      }`}
                      title={
                        disc.highlightBanner
                          ? 'يظهر في الشريط الترويجي للعملاء'
                          : 'لا يظهر بالشريط، يستخدم بالكود فقط'
                      }
                    >
                      {disc.highlightBanner ? 'ظاهر للعملاء' : 'كود خاص'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {canViewRevenue && (
                      <button
                        onClick={() => handleOpenEditModal(disc)}
                        className="p-1 rounded text-[#94A3B8] hover:text-primary transition-colors"
                        title="تعديل تفاصيل وشروط العرض"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => archiveDiscount(disc.id)}
                      className="p-1 rounded text-[#94A3B8] hover:text-rose-400 transition-colors"
                      title={disc.isArchived ? 'استعادة من الأرشيف' : 'أرشفة العرض'}
                    >
                      {disc.isArchived ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Offer Title & Description */}
                <h3 className="font-bold text-sm text-primary mb-1">{disc.title}</h3>
                <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed mb-3">
                  {disc.description}
                </p>

                {/* Promo Code Box (Strict LTR direction and Instant Copy Feedback) */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#18263B] border-[#2A3A50]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-right">
                    <span className="text-[10px] text-[#94A3B8] block">كود الخصم:</span>
                    <span
                      dir="ltr"
                      className="font-mono font-black text-sm tracking-wider text-[#0369A1] dark:text-[#38BDF8]"
                    >
                      {disc.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                      {disc.type === 'percentage'
                        ? `خصم %${disc.value}`
                        : `خصم ${disc.value} ر.س`}
                    </span>

                    <button
                      onClick={() => handleCopyCode(disc.code)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        copiedCode === disc.code
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                      title="نسخ كود الخصم"
                    >
                      {copiedCode === disc.code ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Conditions & Scope Details */}
                <div className="mt-3 space-y-1.5 text-[11px] text-[#94A3B8]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#0369A1] dark:text-[#38BDF8]" />
                      <span>صالح حتى:</span>
                    </span>
                    <span className="font-mono font-medium text-primary">{disc.validUntil}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0369A1] dark:text-[#38BDF8]" />
                      <span>الأيام والساعات:</span>
                    </span>
                    <span className="text-primary truncate max-w-[140px]">
                      {disc.applicableDays || 'جميع الأيام'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-[#0369A1] dark:text-[#38BDF8]" />
                      <span>الملاعب:</span>
                    </span>
                    <span className="text-primary">
                      {disc.applicableCourts.includes('all')
                        ? 'ملعب 1 وملعب 2'
                        : disc.applicableCourts.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Usage Stats & Suspension Action */}
              <div
                className={`pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-[#2A3A50]' : 'border-slate-100'
                }`}
              >
                {/* Requirement 7: Explicitly named "مرات الاستخدام" */}
                <div className="text-[11px] text-[#94A3B8]">
                  <span>مرات الاستخدام: </span>
                  <strong className="text-primary font-bold">{disc.usageCount} مرة</strong>
                  {disc.maxUsageLimit && (
                    <span className="opacity-75"> / {disc.maxUsageLimit}</span>
                  )}
                </div>

                <button
                  onClick={() => toggleDiscountActive(disc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    disc.isActive
                      ? isDark
                        ? 'bg-[#18263B] text-[#B6C2D2] hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {disc.isActive ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>تعليق</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>تفعيل</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 border my-6 max-h-[92vh] overflow-y-auto ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
                <span>
                  {editingDiscountId ? 'تعديل بيانات وشروط العرض' : 'إضافة عرض وكوبون جديد'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-primary">عنوان العرض *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خصم افتتاح صيف بادل منيفة"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-primary">وصف العرض والشروط</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                    كود الخصم (Promo Code) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="MANIFA15"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-bold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-primary">شارة العرض (Badge)</label>
                  <input
                    type="text"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-primary">نوع الخصم</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className={`w-full rounded-lg px-3 py-2 border font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ر.س)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-primary">
                    قيمة الخصم ({formType === 'percentage' ? '%' : 'ر.س'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 border font-bold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-primary">صالح حتى تاريخ</label>
                  <input
                    type="date"
                    required
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-primary">
                    حد أقصى لمرات الاستخدام
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formMaxUsageLimit}
                    onChange={(e) => setFormMaxUsageLimit(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 border font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-primary">الأيام المشمولة</label>
                  <input
                    type="text"
                    value={formApplicableDays}
                    onChange={(e) => setFormApplicableDays(e.target.value)}
                    placeholder="مثال: جميع الأيام أو الأحد - الأربعاء"
                    className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-primary">الساعات المشمولة</label>
                  <input
                    type="text"
                    value={formApplicableHours}
                    onChange={(e) => setFormApplicableHours(e.target.value)}
                    placeholder="مثال: كامل اليوم أو 17:00 - 19:00"
                    className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>
              </div>

              {/* Separation of Activation from Customer Visibility */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isDark ? 'bg-[#18263B] border-[#2A3A50]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="font-semibold block text-primary">
                    إظهار العرض في شريط صفحة الحجز للعملاء
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    عند التعطيل، يبقى الكوبون فعالاً ولكن لا يظهر للعامة إلا لمن يملك الكود.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formHighlightBanner}
                  onChange={(e) => setFormHighlightBanner(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0369A1] focus:ring-[#0369A1]"
                />
              </div>

              <div className="pt-3 border-t border-current/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  {editingDiscountId ? 'حفظ التعديلات' : 'نشر العرض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
