import React, { useState, useEffect } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  Delete,
  Info,
  Clock,
  Sparkles,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export const IpnSecurityGate: React.FC = () => {
  const {
    isIpnUnlocked,
    verifyIpnCode,
    theme,
    users,
  } = usePadel();

  const [ipnInput, setIpnInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successUser, setSuccessUser] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQuickHint, setShowQuickHint] = useState(false);
  const [isMasked, setIsMasked] = useState(false);

  const isDark = theme === 'dark';

  // Handle keyboard events directly for instant typing
  useEffect(() => {
    if (isIpnUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing a number
      if (/^[0-9]$/.test(e.key)) {
        if (ipnInput.length < 8) {
          setIpnInput((prev) => prev + e.key);
          setErrorMessage('');
        }
      } else if (e.key === 'Backspace') {
        setIpnInput((prev) => prev.slice(0, -1));
        setErrorMessage('');
      } else if (e.key === 'Enter') {
        handleTriggerVerify();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isIpnUnlocked, ipnInput]);

  if (isIpnUnlocked) return null;

  const handleTriggerVerify = (codeToVerify?: string) => {
    const code = (codeToVerify !== undefined ? codeToVerify : ipnInput).trim();
    if (!code) {
      setErrorMessage('يرجى إدخال رقم الـ IPN المخصص لك');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = verifyIpnCode(code);
      if (result.success && result.user) {
        setSuccessUser(result.user.name);
        setTimeout(() => {
          setIsVerifying(false);
          setIpnInput('');
          setSuccessUser(null);
        }, 700);
      } else {
        setIsVerifying(false);
        setErrorMessage(result.message || 'رقم الـ IPN غير صحيح. تم تسجيل محاولة الدخول.');
        setIpnInput('');
      }
    }, 400);
  };

  const handleKeypadPress = (digit: string) => {
    if (ipnInput.length < 8) {
      setIpnInput((prev) => prev + digit);
      setErrorMessage('');
    }
  };

  const handleClear = () => {
    setIpnInput('');
    setErrorMessage('');
  };

  const handleBackspace = () => {
    setIpnInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  return (
    <div
      id="ipn-security-gate-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[#070D18]/95 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      {/* Background Decorative Lighting Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-sky-600/15 via-blue-600/10 to-teal-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`rounded-3xl border p-5 sm:p-7 shadow-2xl transition-all ${
            isDark
              ? 'bg-[#0E1726]/90 border-sky-500/30 text-white shadow-sky-950/50'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30'
          }`}
        >
          {/* Header Brand & Security Badge */}
          <div className="text-center space-y-2 pb-4 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
              <span>بوابة الدخول الأمني المعتمدة (IPN)</span>
            </div>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-sky-500/30 text-white">
              <KeyRound className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-black tracking-tight">
              نظام حماية بادل منيفة
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              الدخول مقصور فقط على الإدارة والموظفين المعتمدين عبر إدخال رقم الـ IPN الخاص بهم للتحقق والتسجيل الأمني.
            </p>
          </div>

          {/* Success State Animation */}
          {successUser ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-9 h-9 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-emerald-400">
                  تم التحقق من رقم الـ IPN بنجاح!
                </h3>
                <p className="text-xs text-slate-300">
                  أهلاً بك <strong className="text-white">{successUser}</strong>، جاري فتح لوحة التحكم...
                </p>
              </div>
            </div>
          ) : (
            /* Input & Keypad Form */
            <div className="space-y-4 pt-4">
              {/* Display Box */}
              <div className="space-y-1.5 text-center">
                <label className="block text-xs font-bold text-slate-300">
                  أدخل رقم الـ IPN المخصص لك:
                </label>

                <div className="relative">
                  <div
                    className={`w-full py-3.5 px-10 rounded-2xl border text-center font-mono text-2xl font-black tracking-widest transition-all ${
                      errorMessage
                        ? 'border-rose-500/50 bg-rose-950/20 text-rose-300'
                        : ipnInput
                        ? 'border-sky-500/50 bg-sky-950/20 text-sky-400 shadow-inner'
                        : isDark
                        ? 'border-white/10 bg-black/40 text-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {ipnInput ? (
                      isMasked ? (
                        <span className="tracking-widest">
                          {ipnInput.split('').map((_, i) => (
                            <span key={i} className="inline-block mx-1">
                              •
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="tracking-widest">{ipnInput}</span>
                      )
                    ) : (
                      <span className="text-sm font-sans tracking-normal opacity-50">
                        اكتب رقم الـ IPN هنا...
                      </span>
                    )}
                  </div>

                  {/* Mask / Unmask Toggle Button */}
                  {ipnInput && (
                    <button
                      type="button"
                      onClick={() => setIsMasked(!isMasked)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={isMasked ? 'إظهار الأرقام' : 'إخفاء الأرقام'}
                    >
                      {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {/* On-Screen Numerical Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1" dir="ltr">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    disabled={isVerifying}
                    className={`py-3 rounded-xl font-mono text-lg font-black transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/5 active:bg-sky-500'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                    }`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isVerifying || !ipnInput}
                  className={`py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer border ${
                    isDark
                      ? 'bg-rose-950/40 text-rose-300 border-rose-900/40 hover:bg-rose-900/50'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  مسح (C)
                </button>

                {/* Zero */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  disabled={isVerifying}
                  className={`py-3 rounded-xl font-mono text-lg font-black transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/5 active:bg-sky-500'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                  }`}
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isVerifying || !ipnInput}
                  className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-white/5'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="تراجع"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Verify & Enter Button */}
              <button
                type="button"
                id="btn-verify-ipn-submit"
                onClick={() => handleTriggerVerify()}
                disabled={isVerifying || !ipnInput}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-sky-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق الأمني من رقم الـ IPN...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد الدخول برقم الـ IPN</span>
                  </>
                )}
              </button>

              {/* Quick Preset Hint for Fast Access */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickHint(!showQuickHint)}
                  className="w-full text-center text-[11px] text-sky-400 hover:underline flex items-center justify-center gap-1.5 cursor-pointer py-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{showQuickHint ? 'إخفاء أرقام الـ IPN التجريبية المعتمدة' : 'عرض أرقام الـ IPN المعتمدة في النظام للتجربة'}</span>
                </button>

                {showQuickHint && (
                  <div className="mt-2 p-3 rounded-2xl border border-sky-500/20 bg-sky-950/30 text-xs space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-sky-300">
                      أرقام الـ IPN المسجلة في النظام (انقر للتعبئة السريعة):
                    </div>
                    <div className="space-y-1.5">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setIpnInput(u.ipnCode);
                            handleTriggerVerify(u.ipnCode);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 text-right text-[11px] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.role === 'admin' ? 'bg-sky-400' : 'bg-amber-400'
                              }`}
                            />
                            <span className="font-bold text-white">{u.name}</span>
                            <span className="text-[10px] text-slate-400">({u.role === 'admin' ? 'المدير' : 'موظف'})</span>
                          </div>
                          <div className="font-mono font-black text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-500/30">
                            {u.ipnCode}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Security Notice */}
          <div className="pt-4 mt-4 border-t border-white/10 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>نظام التدقيق الأمني مشفر • يتم تسجيل هوية ورقم IPN كل من دخل</span>
          </div>
        </div>
      </div>
    </div>
  );
};
