import React, { useState } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  LogOut,
  X,
  CheckCircle2,
  ShieldAlert,
  Clock,
  User,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    logoutUser,
    theme,
  } = usePadel();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logoutUser();
      setIsSuccess(true);
      setTimeout(() => {
        setIsLoggingOut(false);
        setIsSuccess(false);
        onClose();
      }, 600);
    }, 400);
  };

  return (
    <div
      id="login-auth-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 border transition-colors animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-[#0d1d2c] border-rose-900/40 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header - Dedicated to Logout */}
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
            <h3 className="text-base font-black flex items-center gap-2 justify-center text-rose-500">
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              تأكيد إنهاء الجلسة وقفل لوحة التحكم
            </p>
          </div>

          <div className="w-8" />
        </div>

        {/* Current User Card */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark
              ? 'bg-slate-900/70 border-slate-800 text-slate-200'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
            />
            <div>
              <div className="text-sm font-black">{currentUser.name}</div>
              <div className="text-xs text-slate-400 font-mono">@{currentUser.username}</div>
            </div>
          </div>

          <div className="text-left">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg inline-block ${
                currentUser.role === 'admin'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {currentUser.role === 'admin' ? '🛡️ المدير العام' : '🎾 حساب العامل'}
            </span>
            <div className="text-[10px] text-emerald-500 font-semibold mt-1">الحساب النشط حالياً</div>
          </div>
        </div>

        {/* Logout Warning Notice */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
            isDark
              ? 'bg-rose-950/25 border-rose-500/30 text-rose-300'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <div className="font-bold">هل أنت متأكد من رغبتك في تسجيل الخروج؟</div>
            <p className="text-[11px] opacity-90">
              سيتم إنهاء الجلسة وقفل الموقع بالكامل فوراً برمز الـ IPN. لن يستطيع أي شخص تصفح الموقع أو الدخول لقسم الإدارة إلا بإدخال رقم الـ IPN المصرح به لمعرفة هوية من دخل.
            </p>
          </div>
        </div>

        {/* Success State if triggered */}
        {isSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم تسجيل الخروج بنجاح ✓</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            id="btn-confirm-logout"
            onClick={handleConfirmLogout}
            disabled={isLoggingOut || isSuccess}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'جاري تسجيل الخروج...' : 'تأكيد تسجيل الخروج'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition active:scale-98 flex items-center justify-center ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>تراجع / البقاء في الحساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
