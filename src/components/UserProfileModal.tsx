import React, { useState, useRef } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  X,
  Camera,
  Upload,
  Link,
  Lock,
  KeyRound,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'avatar' | 'password';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'avatar',
}) => {
  const {
    currentUser,
    updateUserAvatar,
    changePasswordWithCurrent,
    theme,
    showToast,
  } = usePadel();

  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'avatar' | 'password'>(defaultTab);

  // Avatar state
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser.avatar);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!isOpen) return null;

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً، الحد الأقصى المسموح هو 5 ميجابايت', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
        setCustomUrl('');
        showToast('تم تحميل الصورة بنجاح، اضغط "حفظ الصورة" للاعتماد ✓', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    showToast('تم تطبيق رابط الصورة المعاينة', 'info');
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;
    setIsSavingAvatar(true);
    try {
      await updateUserAvatar(currentUser.id, selectedAvatar);
      showToast('تم تحديث وحفظ صورتك الشخصية بنجاح 📸', 'success');
      onClose();
    } catch {
      showToast('حدث خطأ أثناء حفظ الصورة', 'error');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword.trim()) {
      setPasswordError('يرجى كتابة كلمة المرور الحالية لتأكيد هويتك');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.trim().length < 3) {
      setPasswordError('كلمة المرور الجديدة يجب أن لا تقل عن 3 خانات');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError('كلمتا المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await changePasswordWithCurrent(currentUser.id, currentPassword.trim(), newPassword.trim());
      if (res.success) {
        showToast('تم تغيير كلمة المرور بنجاح وتسجيل الدخول المحدث ✓', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setPasswordError(res.message);
      }
    } catch {
      setPasswordError('تعذر تحديث كلمة المرور، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div
      id="modal-user-profile-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="modal-user-profile-content"
        className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border transition-colors animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-[#0d1d2c] border-sky-900/60 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center">
            <h3 className="text-base font-black flex items-center gap-1.5 justify-center">
              <span>إعدادات حسابي الشخصي</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentUser.name} (@{currentUser.username})
            </p>
          </div>

          <div className="w-8" />
        </div>

        {/* Current User Snapshot */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-sky-400 shadow-md shrink-0"
            />
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0369A1] text-white">
              <Camera className="w-3 h-3" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm truncate">{currentUser.name}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  currentUser.role === 'admin'
                    ? 'bg-[#0369A1]/20 text-[#0369A1] dark:text-[#38BDF8] border border-[#0369A1]/30'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>المدير العام</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3" />
                    <span>عامل / موظف الملاعب</span>
                  </>
                )}
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              @{currentUser.username} • {currentUser.phone}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'avatar'
                ? 'bg-[#0369A1] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>تغيير صورتي الشخصية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-[#0369A1] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>تغيير كلمة المرور</span>
          </button>
        </div>

        {/* TAB 1: Change Avatar */}
        {activeTab === 'avatar' && (
          <div className="space-y-4 pt-1">
            {/* Upload from device button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-sky-500/40 hover:border-sky-400 bg-sky-500/5 hover:bg-sky-500/10 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span>اختر صورة من جهازك أو جوالك (JPG, PNG)</span>
              </button>
            </div>

            {/* Or enter custom URL */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                أو أدخل رابط صورة مباشرة من الإنترنت:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs border font-mono transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0369A1]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-bold transition-all border border-sky-500/30"
                >
                  معاينة
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                أو اختر من الشخصيات الرياضية المعتمدة:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AVATARS.map((presetUrl, idx) => {
                  const isCur = selectedAvatar === presetUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(presetUrl)}
                      className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all group ${
                        isCur
                          ? 'border-sky-400 ring-2 ring-sky-400/40 scale-105 shadow-md'
                          : 'border-transparent hover:border-slate-400 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={presetUrl}
                        alt={`شخصية ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isCur && (
                        <span className="absolute inset-0 bg-sky-500/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow-md" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar}
                className="w-full py-3 rounded-2xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-black text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingAvatar ? 'جارٍ الحفظ...' : 'حفظ واعتماد الصورة الشخصية'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Change Password (Requires Current Password) */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 pt-1 text-xs">
            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold leading-relaxed">{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold mb-1">
                كلمة المرور الحالية للتأكيد *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية لحسابك"
                className={`w-full rounded-xl px-3 py-2.5 border font-mono font-medium transition-colors ${
                  isDark
                    ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-sky-400'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-[#0369A1]'
                }`}
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">
                لا يمكن تغيير كلمة المرور لأي شخص إلا بعد كتابة كلمة المرور الحالية للتأكيد.
              </p>
            </div>

            <div>
              <label className="block font-bold mb-1">
                كلمة المرور الجديدة *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="3 خانات على الأقل"
                  className={`w-full rounded-xl px-3 py-2.5 border font-mono font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-sky-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-[#0369A1]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-[#94A3B8] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">
                تأكيد كلمة المرور الجديدة *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور الجديدة"
                className={`w-full rounded-xl px-3 py-2.5 border font-mono font-medium transition-colors ${
                  isDark
                    ? 'bg-[#18263B] border-[#2A3A50] text-white focus:border-sky-400'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-[#0369A1]'
                }`}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="w-full py-3 rounded-2xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-black text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingPassword ? 'جارٍ التحقق والحفظ...' : 'تأكيد وحفظ كلمة المرور الجديدة'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
