import React, { useState } from 'react';
import { usePadel } from '../context/PadelContext';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  Lock,
  KeyRound,
  UserCheck,
  Smartphone,
  Laptop,
  Trash2,
  Download,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface IpnLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IpnLogsModal: React.FC<IpnLogsModalProps> = ({ isOpen, onClose }) => {
  const {
    ipnLogs,
    clearIpnLogs,
    users,
    updateUserIpn,
    canViewRevenue,
    theme,
    showToast,
  } = usePadel();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'granted' | 'denied'>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newIpnInput, setNewIpnInput] = useState('');

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const filteredLogs = ipnLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipnCode.includes(searchQuery) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStartEditIpn = (userId: string, currentIpn: string) => {
    setEditingUserId(userId);
    setNewIpnInput(currentIpn);
  };

  const handleSaveIpn = (userId: string) => {
    const res = updateUserIpn(userId, newIpnInput);
    if (res.success) {
      setEditingUserId(null);
      setNewIpnInput('');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div
      id="ipn-logs-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl p-5 sm:p-6 my-auto transition-all animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-[#0E1726] border-[#2A3A50] text-[#F1F5F9]'
            : 'bg-white border-slate-200 text-[#0F172A]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-current/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                سجل الدخول الأمني بأرقام الـ IPN
              </h2>
              <p className="text-xs text-[#94A3B8]">
                متابعة حركة من دخل على الموقع وقسم الإدارة والتوقيت التفصيلي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-current/10 transition-colors text-[#94A3B8] hover:text-current"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Quick IPN Management for Users */}
        <div className="pt-4 pb-4 border-b border-current/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold flex items-center gap-1.5 text-sky-400">
              <KeyRound className="w-3.5 h-3.5" />
              <span>أرقام الـ IPN المعتمدة للموظفين والإدارة</span>
            </h3>
            <span className="text-[10px] text-[#94A3B8]">
              {canViewRevenue ? 'يمكن للمدير تعديل أرقام الدخول' : 'عرض فقط'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {users.map((u) => {
              const isEditing = editingUserId === u.id;
              return (
                <div
                  key={u.id}
                  className={`p-2.5 rounded-2xl border flex flex-col justify-between gap-2 text-xs transition-colors ${
                    isDark ? 'bg-[#152338] border-[#2A3A50]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-xl object-cover border border-current/10 shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-bold truncate text-[11px]">{u.name}</div>
                      <div className="text-[10px] text-[#94A3B8]">
                        {u.role === 'admin' ? 'المدير العام' : 'موظف تشغيل'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-current/10">
                    <span className="text-[10px] text-[#94A3B8]">رقم الـ IPN:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newIpnInput}
                          onChange={(e) => setNewIpnInput(e.target.value.replace(/\D/g, ''))}
                          maxLength={8}
                          className="w-16 px-1.5 py-0.5 rounded-lg border text-center font-mono font-bold text-xs bg-black/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveIpn(u.id)}
                          className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                          title="حفظ"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUserId(null)}
                          className="p-1 rounded-md bg-slate-500 text-white hover:bg-slate-600"
                          title="إلغاء"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/30">
                          {u.ipnCode}
                        </span>
                        {canViewRevenue && (
                          <button
                            type="button"
                            onClick={() => handleStartEditIpn(u.id, u.ipnCode)}
                            className="text-[10px] text-sky-400 hover:underline"
                          >
                            تعديل
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Audit Logs Filter & Search */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الـ IPN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs border transition-colors ${
                  isDark
                    ? 'bg-[#152338] border-[#2A3A50] text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-sky-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  الكل ({ipnLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('granted')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    statusFilter === 'granted'
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مصرح به</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('denied')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    statusFilter === 'denied'
                      ? 'bg-rose-500 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <AlertOctagon className="w-3 h-3" />
                  <span>مرفوض</span>
                </button>
              </div>

              {canViewRevenue && ipnLogs.length > 0 && (
                <button
                  type="button"
                  onClick={clearIpnLogs}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 flex items-center gap-1"
                  title="مسح السجل"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">مسح السجل</span>
                </button>
              )}
            </div>
          </div>

          {/* Table / List of Access Logs */}
          <div className="max-h-72 overflow-y-auto rounded-2xl border border-current/10 divide-y divide-current/10">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8] space-y-1">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-500/50" />
                <div>لا توجد سجلات دخول مطابقة للبحث المحدد</div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isGranted = log.status === 'granted';
                return (
                  <div
                    key={log.id}
                    className={`p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isGranted
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isGranted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertOctagon className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{log.userName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                              isGranted
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {isGranted ? 'دخول مصرح به' : 'محاولة مرفوضة'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] mt-0.5">
                          {log.notes}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center text-left" dir="ltr">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                        IPN: {log.ipnCode}
                      </span>
                      <div className="text-right text-[11px] text-[#94A3B8]">
                        <div>{log.date}</div>
                        <div className="text-[10px] opacity-75">{log.time}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-current/10 flex items-center justify-between">
          <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>الحماية مفعلة بشكل دائم على جميع مسارات النظام</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary text-xs px-4 py-2"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
