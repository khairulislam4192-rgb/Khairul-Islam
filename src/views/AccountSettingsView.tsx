import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';
import {
  User,
  Shield,
  Users,
  Key,
  Plus,
  CheckCircle,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface AccountSettingsViewProps {
  currentLang: string;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ currentLang }) => {
  const {
    currentUser,
    subAccounts,
    createSubAccount,
    updateSubAccountStatus,
    updateSubAccountPassword,
    updateUserPassword,
    logout,
    loginAsDemo,
  } = useAuth();

  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubPass, setNewSubPass] = useState('pass1234');
  const [isCreatingSub, setIsCreatingSub] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passUpdated, setPassUpdated] = useState(false);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const handleCreateSubAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      alert('Please provide a staff name');
      return;
    }

    setIsCreatingSub(true);
    try {
      await createSubAccount({
        name: newSubName.trim(),
        email: newSubEmail.trim() || undefined,
        phone: newSubPhone.trim() || undefined,
        password: newSubPass,
      });
      setCreateSuccess(true);
      setNewSubName('');
      setNewSubEmail('');
      setNewSubPhone('');
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create sub-account');
    } finally {
      setIsCreatingSub(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert('New passwords do not match');
      return;
    }
    await updateUserPassword(newPass);
    setPassUpdated(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassUpdated(false), 3000);
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Account Profile Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {currentUser.name}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200'
                  }`}
                >
                  {isAdmin ? 'Store Admin ID: ' + currentUser.id : 'Sub-Account ID: ' + currentUser.id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                {currentUser.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {currentUser.email}
                  </span>
                )}
                {currentUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" /> {t.logout}
          </button>
        </div>

        {/* Sub-Account Parent Linkage Card (if sub-account) */}
        {!isAdmin && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs space-y-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" /> Parent Admin Linkage
            </h4>
            <p className="text-slate-600 dark:text-slate-300">
              Linked Parent Admin ID: <b>{currentUser.parentAdminId || 'ADM-8821'}</b> ({currentUser.parentAdminName || 'Khairul Islam'})
            </p>
            <p className="text-slate-500 mt-1">
              • Permissions: Process orders, change order statuses, register customers, view stock levels. (Cost price & store settings restricted).
            </p>
          </div>
        )}
      </div>

      {/* 2. Admin Sub-Account Management Section (Admin Only) */}
      {isAdmin && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Staff & Sub-Accounts Management
              </h3>
              <p className="text-xs text-slate-500">
                Create and manage restricted staff accounts (Sales, Dispatch, Cashiers)
              </p>
            </div>
          </div>

          {/* Create Sub-Account Form */}
          <form onSubmit={handleCreateSubAccount} className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {t.create_sub_account}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-500 block mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Sarah Chen"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Staff Email (Login ID)</label>
                <input
                  type="email"
                  value={newSubEmail}
                  onChange={(e) => setNewSubEmail(e.target.value)}
                  placeholder="staff@omnistock.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Staff Phone Number</label>
                <input
                  type="text"
                  value={newSubPhone}
                  onChange={(e) => setNewSubPhone(e.target.value)}
                  placeholder="+1 (800) 000-0000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Assigned Password</label>
                <input
                  type="text"
                  value={newSubPass}
                  onChange={(e) => setNewSubPass(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">
                Sub-accounts automatically link to your Admin ID: <b>{currentUser.id}</b>
              </span>
              <button
                type="submit"
                disabled={isCreatingSub}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Sub-Account
              </button>
            </div>

            {createSuccess && (
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Sub-account successfully provisioned!
              </div>
            )}
          </form>

          {/* Sub-Accounts List Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Existing Sub-Accounts & Staff Access ({subAccounts.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2.5">Staff Name & ID</th>
                    <th className="pb-2.5">Contact Credential</th>
                    <th className="pb-2.5">Parent Admin Link</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subAccounts.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                            {sub.name.charAt(0)}
                          </span>
                          <div>
                            <div>{sub.name}</div>
                            <span className="font-mono text-[10px] text-slate-400">{sub.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {sub.email || sub.phone || 'No direct contact'}
                      </td>

                      <td className="py-3 font-mono text-[11px] text-slate-500">
                        {sub.parentAdminId || currentUser.id}
                      </td>

                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {sub.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => updateSubAccountStatus(sub.id, !sub.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            sub.isActive
                              ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {sub.isActive ? 'Revoke Access' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Password Change Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Security & Password
            </h3>
            <p className="text-xs text-slate-500">
              Update your account password with secure hashing
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3 flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow transition"
            >
              Update Password
            </button>
            {passUpdated && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Password updated successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 4. Instant Role Switcher / Demo Sandbox */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" /> Fast Role Simulation Switcher
          </h4>
          <p className="text-xs text-blue-200/80 mt-1">
            Test the UI from both Admin and Sub-Account perspectives in 1-click
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loginAsDemo('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
              isAdmin
                ? 'bg-white text-blue-900'
                : 'bg-blue-800/80 hover:bg-blue-700 text-white'
            }`}
          >
            Switch to Admin (Full)
          </button>
          <button
            onClick={() => loginAsDemo('sub_account')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
              !isAdmin
                ? 'bg-white text-blue-900'
                : 'bg-blue-800/80 hover:bg-blue-700 text-white'
            }`}
          >
            Switch to Sub-Account (Sales)
          </button>
        </div>
      </div>
    </div>
  );
};
