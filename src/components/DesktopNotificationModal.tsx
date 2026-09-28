import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Volume2,
  X,
  Monitor,
  Info,
  Smartphone,
  Copy,
  Check,
  QrCode,
  Download,
  Share2,
} from 'lucide-react';
import { usePadel } from '../context/PadelContext';

export const DesktopNotificationModal: React.FC = () => {
  const {
    theme,
    isDesktopModalOpen,
    setIsDesktopModalOpen,
    desktopPermission,
    requestDesktopPermission,
    isInIframe,
    openInIndependentTab,
    soundEnabled,
    toggleSoundEnabled,
    canInstallPwa,
    installPwaApp,
    directAppUrl,
    showToast,
  } = usePadel();

  const [activeTab, setActiveTab] = useState<'iphone' | 'samsung' | 'mac'>('iphone');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isDesktopModalOpen) return null;

  const isDark = theme === 'dark';
  const isGranted = desktopPermission === 'granted';
  const isDenied = desktopPermission === 'denied';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(directAppUrl || window.location.href);
      setCopied(true);
      showToast('تم نسخ رابط النظام! افتحه في متصفح جوالك 📱', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    directAppUrl || (typeof window !== 'undefined' ? window.location.href : '')
  )}`;

  return (
    <div
      id="modal-desktop-notifications-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="modal-desktop-notifications-content"
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-[#0a1826] border-sky-500/30 text-white'
            : 'bg-white border-sky-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-sky-600/20 via-[#0073a8]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2 flex-wrap">
                <span>إشعارات الجوال والماك بوك الخارجية</span>
                <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  مثل الواتساب
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                لتصلك التنبيهات على الآيفون، سامسونج، أو الماك بوك حتى والموقع مقفل
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDesktopModalOpen(false)}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              isGranted
                ? isDark
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDenied
                ? isDark
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
                : isDark
                ? 'bg-sky-950/40 border-sky-500/30 text-sky-300'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            <div className="mt-0.5">
              {isGranted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : isDenied ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <BellRing className="w-5 h-5 text-sky-400 animate-pulse" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="font-black text-sm flex items-center justify-between">
                <span>
                  {isGranted
                    ? 'إشعارات النظام: مفعّلة بنجاح ✓'
                    : isDenied
                    ? 'إشعارات المتصفح: تم حظرها سابقاً'
                    : 'إشعارات النظام: بانتظار السماح'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/20">
                  {desktopPermission}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {isGranted
                  ? 'تم ربط خدمة الإشعارات المستمرة عبر الـ Service Worker. الآن ستصلك الإشعارات في زاوية شاشة الماك أو شاشة القفل بالجوال دون توقف.'
                  : isDenied
                  ? 'تم حظر الإشعارات في هذا المتصفح. يمكنك فك الحظر بالنقر على أيقونة القفل أو إعدادات الموقع بجانب رابط الموقع في الأعلى واختيار "سماح بالإشعارات".'
                  : 'اضغط على زر التفعيل أدناه لمنح المتصفح إذن إرسال التنبيهات المباشرة إلى نظام التشغيل والجوال.'}
              </p>
            </div>
          </div>

          {/* Quick Connection Bar for Mobile (iPhone & Samsung) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-sky-950/20 border-sky-500/30' : 'bg-sky-50/70 border-sky-200'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>فتح النظام على جوالك (آيفون أو سامسونج):</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-bold transition-all border border-sky-500/30"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? 'إخفاء الباركود' : 'مسح الباركود بالكاميرا 📷'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرابط للجوال'}</span>
                </button>
              </div>
            </div>

            {showQr && (
              <div className="p-4 rounded-2xl bg-white text-slate-900 flex flex-col items-center justify-center space-y-2 text-center animate-in zoom-in-95">
                <p className="text-xs font-bold text-slate-700">
                  وجّه كاميرا الآيفون أو السامسونج نحو الباركود لفتح النظام فوراً:
                </p>
                <img
                  src={qrImageUrl}
                  alt="QR Code to open Manifa Padel"
                  className="w-44 h-44 rounded-xl border p-1 bg-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[11px] text-slate-500 font-mono break-all max-w-sm">
                  {directAppUrl || window.location.href}
                </span>
              </div>
            )}

            {canInstallPwa && (
              <div className="pt-1">
                <button
                  onClick={installPwaApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 hover:opacity-95"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت تطبيق "بادل منيفة" على هذا الجهاز كبرنامج مستقل 📲</span>
                </button>
              </div>
            )}
          </div>

          {/* Device Tabs for Step-by-Step Instructions */}
          <div className="space-y-3">
            <div className="flex border-b border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveTab('iphone')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'iphone'
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🍎 الآيفون (iPhone)</span>
              </button>

              <button
                onClick={() => setActiveTab('samsung')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'samsung'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🤖 سامسونج وأندرويد (Samsung)</span>
              </button>

              <button
                onClick={() => setActiveTab('mac')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'mac'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>💻 الماك بوك (MacBook)</span>
              </button>
            </div>

            {/* iPhone Tab Content */}
            {activeTab === 'iphone' && (
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-black/25 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-black text-xs text-sky-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>طريقة وصول الإشعارات على الآيفون مثل الواتساب (شاشة القفل والجزيرة التفاعلية):</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  شركة آبل (Apple) تفرض قاعدة واحدة للإشعارات في الآيفون: يجب إضافة الموقع إلى الشاشة الرئيسية ليعمل كتطبيق جوال رسمي (PWA) ويصلك الإشعار حتى والجوال في جيبك.
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 pr-1">
                  <li>
                    افتح رابط النظام في متصفح <strong>Safari (سفاري)</strong> على الآيفون.
                  </li>
                  <li>
                    اضغط على زر <strong>المشاركة (مربع وسهم لأعلى ⎋)</strong> في أسفل شاشة السفاري.
                  </li>
                  <li>
                    انزل بالقائمة واختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen ➕)</strong> ثم اضغط <strong>إضافة</strong>.
                  </li>
                  <li>
                    سيظهر لك تطبيق أيقونة <strong>«بادل منيفة»</strong> على شاشة جوالك.
                  </li>
                  <li>
                    افتح التطبيق من شاشة الجوال واضغط <strong>«سماح بالإشعارات»</strong>. مبروك! ستصلك تنبيهات الحجوزات بالصوت والاهتزاز مثل الواتساب بالضبط.
                  </li>
                </ol>
              </div>
            )}

            {/* Samsung Tab Content */}
            {activeTab === 'samsung' && (
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-black/25 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-black text-xs text-emerald-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>طريقة وصول الإشعارات على جوال سامسونج وأندرويد:</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  نظام أندرويد في سامسونج يدعم الإشعارات الفورية الكاملة عبر متصفح Google Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 pr-1">
                  <li>
                    افتح الرابط في متصفح <strong>Google Chrome</strong> على جوالك السامسونج.
                  </li>
                  <li>
                    ستظهر لك رسالة <strong>«هل تريد السماح بالإشعارات؟»</strong> اضغط <strong>سماح (Allow)</strong>.
                  </li>
                  <li>
                    اضغط على خيارات المتصفح (الثلاث نقاط ⋮) في الأعلى واختر <strong>«تثبيت التطبيق» (Install App)</strong> أو «إضافة للشاشة الرئيسية».
                  </li>
                  <li>
                    الآن ستصلك الإشعارات في شريط التنبيهات العلوي مع صوت رنين واهتزاز حتى والجوال مقفل في جيبك.
                  </li>
                </ol>
              </div>
            )}

            {/* MacBook Tab Content */}
            {activeTab === 'mac' && (
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-black/25 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-black text-xs text-amber-400 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" />
                  <span>لماذا توقفت الإشعارات على الماك بوك بعد 3 مرات وكيف تم حلها؟</span>
                </div>
                <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                  <p>
                    1. <strong>سبب التوقف سابقاً:</strong> متصفح كروم على الماك يقوم بتجميع أو حظر الإشعارات المتتالية إذا كانت تحمل نفس المعرف (Tag) وتعمل بدون Service Worker، فاعتبرها تكراراً وأوقفها بعد 3 مرات.
                  </p>
                  <p>
                    2. <strong>ما قمنا به الآن:</strong> قمنا بربط نظام الإشعارات بمحرك <strong>Service Worker الدائم</strong> مع معرّف رقمي فريد وميزة <strong>Renotify</strong>، بحيث يرن الجرس وتظهر النافذة كل مرة بدون أي توقف إطلاقاً.
                  </p>
                  <p>
                    3. <strong>ظهورها كشريط فوق بالزاوية (Banners):</strong>
                    <br />
                    افتح إعدادات الماك <strong>(System Settings) 🍏</strong> ➔ <strong>الإشعارات (Notifications)</strong> ➔ اضغط <strong>Google Chrome</strong> ➔ اختر نمط التنبيه <strong>Banners</strong> أو <strong>Alerts</strong> وتأكد من إيقاف وضع عدم الإزعاج (Do Not Disturb).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action to Request Permission if not granted */}
          {!isGranted && (
            <div className="text-center pt-1">
              <button
                onClick={requestDesktopPermission}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-[#0073a8] hover:from-sky-600 hover:to-[#005f8a] text-white font-black text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>السماح بإشعارات سطح المكتب والنظام 🔔</span>
              </button>
            </div>
          )}

          {/* Sound & Notifications Settings */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-sky-950/20 border-sky-500/20' : 'bg-sky-50/50 border-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Volume2 className={`w-4 h-4 ${soundEnabled ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className="font-bold text-xs">
                تنبيه الصوت عند وصول حجز جديد
              </span>
            </div>
            <button
              onClick={toggleSoundEnabled}
              className={`text-xs px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'border-sky-400/40 text-sky-400 bg-sky-500/10'
                  : 'border-slate-400/30 text-slate-400 bg-slate-500/10'
              }`}
            >
              <span>{soundEnabled ? 'صوت الرنين: مفعل 🔔' : 'مكتوم 🔕'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/10">
          <button
            onClick={openInIndependentTab}
            className={`flex items-center gap-1.5 text-xs font-bold ${
              isDark ? 'text-sky-400 hover:text-sky-300' : 'text-[#0073a8] hover:underline'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح في نافذة كاملة مستقلة</span>
          </button>

          <button
            onClick={() => setIsDesktopModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
