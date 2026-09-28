import React, { useState, useEffect } from 'react';
import { usePadel } from '../context/PadelContext';
import { UserAccount, AuditLog } from '../types/padel';
import {
  KeyRound,
  ShieldCheck,
  Check,
  Lock,
  UserPlus,
  RefreshCw,
  Phone,
  Eye,
  EyeOff,
  Trash2,
  LogIn,
  ShieldAlert,
  ClipboardList,
  Download,
  Upload,
  AlertTriangle,
  History,
  CheckCircle2,
  X,
  Camera,
} from 'lucide-react';

export const UsersSecurityManager: React.FC = () => {
  const {
    users,
    currentUser,
    canViewRevenue,
    showToast,
    setIsLoginModalOpen,
    addUser,
    deleteUser,
    openProfileModal,
    switchUserWithPassword,
    theme,
    ipnLogs,
    clearIpnLogs,
    updateUserIpn,
    lockWithIpn,
  } = usePadel();

  const isDark = theme === 'dark';

  // IPN states
  const [editingIpnUserId, setEditingIpnUserId] = useState<string | null>(null);
  const [editingIpnVal, setEditingIpnVal] = useState('');
  const [ipnStatusFilter, setIpnStatusFilter] = useState<'all' | 'granted' | 'denied'>('all');

  // Password change form states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Add new user modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [newPhone, setNewPhone] = useState('');
  const [initialPass, setInitialPass] = useState('');

  // Switch account login modal
  const [switchTargetUser, setSwitchTargetUser] = useState<UserAccount | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Delete user modal confirmation state
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Fetch audit logs from server
  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentUser]);

  // Handle password change requiring current password verification
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPasswordInput) {
      showToast('يرجى كتابة كلمة المرور الحالية', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showToast('يرجى إدخال كلمة المرور الجديدة', 'error');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      showToast('كلمتا المرور الجديدة وتأكيدها غير متطابقتين', 'error');
      return;
    }
    if (newPassword.trim().length < 4) {
      showToast('يجب أن تتكون كلمة المرور من 4 خانات على الأقل', 'error');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          username: currentUser.username,
          currentPassword: currentPasswordInput,
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'فشل تحديث كلمة المرور', 'error');
      } else {
        showToast('تم تغيير كلمة المرور بنجاح وتسجيل العملية في سجل التدقيق', 'success');
        setCurrentPasswordInput('');
        setNewPassword('');
        setConfirmPassword('');
        fetchAuditLogs();
      }
    } catch {
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'error');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Open switch user authentication modal
  const handleOpenSwitchModal = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      showToast('أنت مسجل الدخول بهذا الحساب حالياً', 'info');
      return;
    }
    setSwitchTargetUser(user);
    setSwitchPassword('');
    setIsSwitchModalOpen(true);
  };

  // Execute authenticated account switch (Strict password requirement)
  const handleConfirmSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTargetUser) return;

    setIsAuthenticating(true);
    try {
      const result = switchUserWithPassword(switchTargetUser.id, switchPassword);
      if (result.success) {
        setIsSwitchModalOpen(false);
        setSwitchPassword('');
        fetchAuditLogs();
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('تعذر التحقق من بيانات الدخول', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Create User (Admin Only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canViewRevenue) {
      showToast('إضافة الحسابات متاحة للمدير العام فقط', 'error');
      return;
    }
    if (!newName.trim() || !newUsername.trim()) {
      showToast('يرجى إدخال الاسم واسم المستخدم', 'error');
      return;
    }

    try {
      addUser({
        name: newName.trim(),
        username: newUsername.trim().toLowerCase(),
        password: initialPass.trim() || '123',
        role: newRole,
        phone: newPhone.trim() || '+966 50 000 0000',
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewUsername('');
      setNewPhone('');
      setInitialPass('');
      setTimeout(fetchAuditLogs, 400);
    } catch {
      showToast('تعذر إضافة المستخدم', 'error');
    }
  };

  // Handle Delete User (Admin Only, Protected Admin Root)
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (!canViewRevenue) {
      showToast('حذف المستخدمين متاح للمدير العام فقط', 'error');
      return;
    }
    if (userToDelete.id === 'user-admin') {
      showToast('لا يمكن حذف حساب المدير العام الأساسي للمنشأة', 'error');
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      setTimeout(fetchAuditLogs, 400);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Export database backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup/export', {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
      });
      if (!res.ok) {
        showToast('غير مصرح لك بتصدير النسخة الاحتياطية', 'error');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manifa_padel_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('تم تصدير النسخة الاحتياطية المعتمدة بنجاح', 'success');
    } catch {
      showToast('فشل تصدير النسخة الاحتياطية', 'error');
    }
  };

  return (
    <div id="users-security-manager" className="space-y-5 pb-12">
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
                <KeyRound className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                إدارة المستخدمين، الأمان، وسجل التدقيق
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              صلاحيات الخادم الصارمة (RBAC)، نموذج تغيير كلمة المرور بالتحقق، وسجل التدقيق للعمليات الحساسة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isDark
                  ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Download className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
              <span>نسخ احتياطي للبيانات</span>
            </button>

            {canViewRevenue && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Definitions & Isolation Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-primary">دور المدير العام (Admin)</h4>
            <p className="text-[#94A3B8] leading-relaxed">
              صلاحيات كاملة تشمل تعديل أسعار الملاعب، حذف وإلغاء الحجوزات، معاينة كشف الدخل المالي، وتصدير قواعد البيانات.
            </p>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-primary">دور عامل الملاعب (Staff)</h4>
            <p className="text-[#94A3B8] leading-relaxed">
              تسجيل الحجوزات ومتابعة جدول الملاعب وتعديل المواعيد. معزول تماماً في الخادم عن الإحصائيات المالية وأسعار الملاعب وحذف السجلات.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Password Change & Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Change Password Form (Requires Current Password) */}
        <div
          className={`lg:col-span-5 border rounded-2xl p-4 sm:p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="border-b border-current/10 pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
              <span>تغيير كلمة المرور لحسابك</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              الحساب النشط: <strong className="text-primary">{currentUser.name}</strong> (@{currentUser.username})
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-primary">
                كلمة المرور الحالية *
              </label>
              <input
                type="password"
                required
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية للتأكيد"
                className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                  isDark
                    ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                    : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-primary">
                كلمة المرور الجديدة *
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة مرور جديدة قوية"
                  className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute left-2.5 top-2 text-[#94A3B8] hover:text-primary"
                >
                  {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-primary">
                تأكيد كلمة المرور الجديدة *
              </label>
              <input
                type={showFormPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور الجديدة"
                className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                  isDark
                    ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                    : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmittingPassword ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور بالخادم'}</span>
            </button>
          </form>
        </div>

        {/* Right: Registered Accounts List with Authentication Switch */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-primary">
              الحسابات المصرحة بالنظام ({users.length}):
            </span>
            <span className="text-[#94A3B8]">
              التبديل يتطلب إدخال كلمة مرور الحساب للأمان
            </span>
          </div>

          <div className="space-y-2.5">
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const isStaff = user.role === 'staff';
              const isRootAdmin = user.id === 'user-admin';

              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-[#0369A1] dark:border-[#38BDF8] bg-[#0369A1]/5'
                      : isDark
                      ? 'bg-[#111C2E] border-[#2A3A50]'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover border border-current/10 shrink-0"
                      />
                      {/* Quick Avatar Change Button on Avatar */}
                      <button
                        type="button"
                        onClick={() => openProfileModal('avatar')}
                        title="تغيير الصورة الشخصية"
                        className="absolute -bottom-1 -left-1 p-1 bg-[#0369A1] text-white rounded-md shadow-xs opacity-90 hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-primary">{user.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                            !isStaff
                              ? 'bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8] border border-[#0369A1]/25'
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                          }`}
                        >
                          {!isStaff ? 'المدير العام' : 'عامل الملاعب'}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.2 rounded-md font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                            نشط حالياً
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] mt-1 font-mono">
                        <span>@{user.username}</span>
                        <span>•</span>
                        <span>{user.phone}</span>
                      </div>

                      {/* IPN Security Code display & inline editor */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="text-[10px] text-[#94A3B8] font-bold">رمز الـ IPN:</span>
                        {editingIpnUserId === user.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingIpnVal}
                              onChange={(e) => setEditingIpnVal(e.target.value.replace(/\D/g, ''))}
                              maxLength={8}
                              className="w-16 px-1.5 py-0.5 rounded-lg border text-center font-mono font-bold text-xs bg-black/20"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const res = updateUserIpn(user.id, editingIpnVal);
                                if (res.success) {
                                  setEditingIpnUserId(null);
                                  showToast('تم تحديث رمز الـ IPN بنجاح', 'success');
                                } else {
                                  showToast(res.message, 'error');
                                }
                              }}
                              className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingIpnUserId(null)}
                              className="px-1.5 py-0.5 rounded-md bg-slate-500 text-white text-[10px] hover:bg-slate-600"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              {user.ipnCode}
                            </span>
                            {canViewRevenue && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIpnUserId(user.id);
                                  setEditingIpnVal(user.ipnCode);
                                }}
                                className="text-[10px] text-sky-400 hover:underline"
                              >
                                تعديل الرمز
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Delete, Change Avatar, Switch Login) */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {/* Change Avatar Button */}
                    <button
                      type="button"
                      onClick={() => openProfileModal('avatar')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                        isDark
                          ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] hover:bg-white/10'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="تغيير الصورة الشخصية"
                    >
                      <Camera className="w-3.5 h-3.5 text-sky-500" />
                      <span className="hidden sm:inline">الصورة</span>
                    </button>

                    {/* Delete User Button (Manager only, protected for user-admin) */}
                    {canViewRevenue && (
                      isRootAdmin ? (
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-300 dark:border-slate-700 text-[#94A3B8] flex items-center gap-1"
                          title="الحساب الأساسي محمي ولا يمكن حذفه"
                        >
                          <Lock className="w-3 h-3" />
                          <span>الأساسي</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                          title="حذف هذا الحساب نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )
                    )}

                    {/* Switch button (triggers password verification modal) */}
                    {!isCurrent && (
                      <button
                        onClick={() => handleOpenSwitchModal(user)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                          isDark
                            ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] hover:bg-white/10'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>تبديل الحساب</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* IPN Access Control & Activity Log Section */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 space-y-4 transition-colors ${
          isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-current/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <span>سجل دخول الـ IPN (من دخل على الموقع وقسم الإدارة)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  حماية نشطة
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                متابعة دقيقة لكل عملية إدخال لرمز الـ IPN لمعرفة الشخص والموعد والحالة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => lockWithIpn()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1.5 transition-all"
              title="قفل الموقع برمز الـ IPN فوراً"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>قفل الموقع الآن</span>
            </button>

            {canViewRevenue && ipnLogs.length > 0 && (
              <button
                type="button"
                onClick={clearIpnLogs}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 border border-current/10 hover:bg-current/10 flex items-center gap-1"
                title="مسح سجل الدخول"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8]">تصفية السجل:</span>
          <button
            type="button"
            onClick={() => setIpnStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              ipnStatusFilter === 'all'
                ? 'bg-sky-500 text-white'
                : isDark
                ? 'bg-[#18263B] text-[#94A3B8]'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            الكل ({ipnLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setIpnStatusFilter('granted')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              ipnStatusFilter === 'granted'
                ? 'bg-emerald-500 text-white'
                : isDark
                ? 'bg-[#18263B] text-[#94A3B8]'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>المصرح لهم</span>
          </button>
          <button
            type="button"
            onClick={() => setIpnStatusFilter('denied')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              ipnStatusFilter === 'denied'
                ? 'bg-rose-500 text-white'
                : isDark
                ? 'bg-[#18263B] text-[#94A3B8]'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>المرفوضة</span>
          </button>
        </div>

        {/* IPN Access Table */}
        {ipnLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#94A3B8]">
            لا توجد سجلات دخول مسجلة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-current/10">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-current/10 text-[#94A3B8] bg-black/5 dark:bg-white/5">
                  <th className="py-2.5 px-3 font-semibold">من دخل؟ (المستخدم)</th>
                  <th className="py-2.5 px-3 font-semibold">رمز الـ IPN المستخدم</th>
                  <th className="py-2.5 px-3 font-semibold">الحالة</th>
                  <th className="py-2.5 px-3 font-semibold">التاريخ والتوقيت</th>
                  <th className="py-2.5 px-3 font-semibold">ملاحظات النظام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                {ipnLogs
                  .filter((l) =>
                    ipnStatusFilter === 'all' ? true : l.status === ipnStatusFilter
                  )
                  .map((log) => {
                    const isGranted = log.status === 'granted';
                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                          !isGranted ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-primary">
                          {log.userName}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                          {log.ipnCode}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isGranted
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            }`}
                          >
                            {isGranted ? 'تم السماح بالدخول' : 'تم الرفض ومنع الدخول'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#94A3B8]">
                          {log.date} - {log.time}
                        </td>
                        <td className="py-2.5 px-3 text-[#94A3B8] text-[11px]">
                          {log.notes}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log Section */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 space-y-3 transition-colors ${
          isDark ? 'bg-[#111C2E] border-[#2A3A50]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between border-b border-current/10 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
            <h3 className="font-bold text-sm text-primary">
              سجل التدقيق للعمليات الحساسة (Audit Logs)
            </h3>
          </div>
          <button
            onClick={fetchAuditLogs}
            className="text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>تحديث السجل</span>
          </button>
        </div>

        {loadingAuditLogs ? (
          <div className="text-center py-6 text-xs text-[#94A3B8]">
            جارٍ تحميل سجل العمليات...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#94A3B8]">
            لا توجد عمليات مسجلة في الأرشيف بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-current/10 text-[#94A3B8]">
                  <th className="py-2 px-3 font-semibold">التوقيت والتاريخ</th>
                  <th className="py-2 px-3 font-semibold">المنفّذ</th>
                  <th className="py-2 px-3 font-semibold">نوع العملية</th>
                  <th className="py-2 px-3 font-semibold">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#94A3B8]">
                      {new Date(log.timestamp).toLocaleString('ar-SA')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-primary">
                      {log.performedByName} ({log.role})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0369A1]/15 text-[#0369A1] dark:text-[#38BDF8]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#94A3B8]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Switch Account Authentication Modal */}
      {isSwitchModalOpen && switchTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 border ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
                <span>التحقق من كلمة المرور</span>
              </h3>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="text-[#94A3B8] hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSwitch} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-[#0369A1]/10 border border-[#0369A1]/20 flex items-center gap-3">
                <img
                  src={switchTargetUser.avatar}
                  alt={switchTargetUser.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-bold text-primary">{switchTargetUser.name}</h4>
                  <span className="text-[11px] text-[#94A3B8]">
                    @{switchTargetUser.username} ({switchTargetUser.role === 'admin' ? 'مدير' : 'عامل'})
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-primary">
                  أدخل كلمة المرور لتأكيد الدخول *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  placeholder="كلمة مرور الحساب"
                  className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  {isAuthenticating ? 'جارٍ التحقق...' : 'تأكيد تسجيل الدخول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0369A1] dark:text-[#38BDF8]" />
                <span>إضافة مستخدم جديد للنادي</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#94A3B8] hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-primary">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فهد الدوسري"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-primary">
                  اسم المستخدم (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="fahad_padel"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-primary">الدور والصلاحية</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className={`w-full rounded-lg px-3 py-2 border font-semibold transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  >
                    <option value="staff">عامل ملاعب (معزول عن المداخيل)</option>
                    <option value="admin">مدير عام (صلاحيات كاملة)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-primary">كلمة السر الأولية</label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={initialPass}
                    onChange={(e) => setInitialPass(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                      isDark
                        ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                        : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-primary">رقم الجوال</label>
                <input
                  type="tel"
                  placeholder="+966 50 000 0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-mono font-medium transition-colors ${
                    isDark
                      ? 'bg-[#18263B] border-[#2A3A50] text-[#F1F5F9] focus:border-[#38BDF8]'
                      : 'bg-white border-slate-200 text-[#0F172A] focus:border-[#0369A1]'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 border ${
              isDark
                ? 'bg-[#111C2E] border-[#2A3A50] text-[#F1F5F9]'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-rose-500">
                <Trash2 className="w-4 h-4" />
                <span>تأكيد حذف المستخدم</span>
              </h3>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-[#94A3B8] hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-primary leading-relaxed">
                هل أنت متأكد من رغبتك في حذف حساب <strong className="text-rose-500">{userToDelete.name}</strong> (@{userToDelete.username})؟
              </p>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                سيتم إلغاء صلاحية هذا الحساب نهائياً، وتوثيق عملية الحذف باسم المدير العام في سجل العمليات.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-lg text-[#94A3B8] hover:text-primary font-semibold"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={handleConfirmDeleteUser}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                >
                  {isDeletingUser ? 'جارٍ الحذف...' : 'نعم، احذف الحساب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
