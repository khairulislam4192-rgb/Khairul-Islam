import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StoreSettings } from '../types';
import { translations } from '../utils/translations';
import { SUPPORTED_CURRENCIES, formatMoney } from '../utils/currencies';
import {
  Store,
  Printer,
  Save,
  CheckCircle,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  DollarSign,
  Receipt,
  FileText,
  ShieldAlert,
  Coins,
  Check
} from 'lucide-react';

interface StoreSettingsViewProps {
  currentLang: string;
}

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({ currentLang }) => {
  const { storeSettings, updateStoreSettings, exportDatabaseJSON, importDatabaseJSON, resetToSampleData } = useData();
  const { canManageSettings } = useAuth();

  const [formState, setFormState] = useState<StoreSettings>(storeSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Sync form state when storeSettings updates externally
  useEffect(() => {
    setFormState(storeSettings);
  }, [storeSettings]);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const handleChange = (field: keyof StoreSettings, val: any) => {
    setFormState((prev) => ({ ...prev, [field]: val }));
  };

  const handleSelectPresetCurrency = (curr: typeof SUPPORTED_CURRENCIES[0]) => {
    setFormState((prev) => ({
      ...prev,
      currencySymbol: curr.symbol,
      currencyCode: curr.code,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings()) {
      alert('Only store administrators can update store configuration.');
      return;
    }
    updateStoreSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const dataStr = exportDatabaseJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omnistock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        alert('Database restored successfully!');
      } else {
        setImportError('Invalid JSON backup file structure.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {!canManageSettings() && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>You are logged in as a <b>Sub-Account</b>. Store configurations and invoice settings are managed by the parent Admin.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Store Profile Section */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Store Profile & Identity
              </h3>
              <p className="text-xs text-slate-500">
                Official business info displayed on customer receipts and warehouse invoices
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Store / Company Name *
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Business Owner / Founder Name *
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.ownerName}
                onChange={(e) => handleChange('ownerName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Store Contact Phone *
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Official Support Email *
              </label>
              <input
                type="email"
                disabled={!canManageSettings()}
                value={formState.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Physical Store & Warehouse Address
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* 2. Multiple Currency & Financial Configuration */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t.currency || 'Currency'} & Financial Setup
              </h3>
              <p className="text-xs text-slate-500">
                Choose popular currency presets or enter custom currency symbols for invoices and POS
              </p>
            </div>
          </div>

          {/* Currency Presets Grid */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 text-xs block">
              {t.currency_presets || 'Popular Currency Presets'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = formState.currencyCode === curr.code || formState.currencySymbol === curr.symbol;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    disabled={!canManageSettings()}
                    onClick={() => handleSelectPresetCurrency(curr)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    } disabled:opacity-60`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{curr.flag}</span>
                        <span className="font-bold text-xs">{curr.symbol} {curr.code}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{curr.name.split('(')[0]}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Currency Details & Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Active Currency Symbol
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                placeholder="e.g. ৳, $, €, £"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Currency Code (ISO)
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.currencyCode || ''}
                onChange={(e) => handleChange('currencyCode', e.target.value.toUpperCase())}
                placeholder="e.g. BDT, USD, EUR"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 uppercase"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Default Tax / VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                disabled={!canManageSettings()}
                value={formState.taxRate}
                onChange={(e) => handleChange('taxRate', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Live Price Preview Box */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Live Price Preview Format:</span>
            <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
              {formatMoney(1250.50, formState.currencySymbol)}
            </span>
          </div>
        </div>

        {/* 3. Invoice Customization Section */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Invoice & Receipt Printing Customizer
              </h3>
              <p className="text-xs text-slate-500">
                Configure logos, digital signatures, thermal print templates and footer policies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Shop Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  disabled={!canManageSettings()}
                  value={formState.shopLogo || ''}
                  onChange={(e) => handleChange('shopLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
                />
                {formState.shopLogo && (
                  <img
                    src={formState.shopLogo}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Authorized Digital Signature (Name / Title)
              </label>
              <input
                type="text"
                disabled={!canManageSettings()}
                value={formState.digitalSignature || ''}
                onChange={(e) => handleChange('digitalSignature', e.target.value)}
                placeholder="e.g. Khairul Islam (Authorized Manager)"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Default Invoice Print Format
              </label>
              <select
                disabled={!canManageSettings()}
                value={formState.invoiceFormat}
                onChange={(e) => handleChange('invoiceFormat', e.target.value as 'thermal' | 'a4')}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              >
                <option value="thermal">Thermal POS Receipt (80mm Roll)</option>
                <option value="a4">Standard A4 Corporate Invoice</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Low Stock Threshold (Alert Warning)
              </label>
              <input
                type="number"
                min="1"
                disabled={!canManageSettings()}
                value={formState.lowStockAlertThreshold}
                onChange={(e) => handleChange('lowStockAlertThreshold', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Receipt Footer Policy & Exchange Note
              </label>
              <textarea
                rows={2}
                disabled={!canManageSettings()}
                value={formState.receiptNote}
                onChange={(e) => handleChange('receiptNote', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* 4. Customer Loyalty Program Configuration */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Customer Loyalty & Reward Points
              </h3>
              <p className="text-xs text-slate-500">
                Reward returning customers with automatic points on every purchase
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs items-center">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                disabled={!canManageSettings()}
                checked={formState.enableLoyaltyProgram}
                onChange={(e) => handleChange('enableLoyaltyProgram', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Enable Customer Loyalty System
              </span>
            </label>

            {formState.enableLoyaltyProgram && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Points awarded per {formState.currencySymbol}10 spent
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  disabled={!canManageSettings()}
                  value={formState.loyaltyRate}
                  onChange={(e) => handleChange('loyaltyRate', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        {canManageSettings() && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition active:scale-95"
            >
              <Save className="w-4 h-4" /> {t.save_changes || 'Save Changes'}
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Settings updated successfully!
              </span>
            )}
          </div>
        )}
      </form>

      {/* 5. Database Backup & JSON Export Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Backup, Restore & Reset Database
            </h3>
            <p className="text-xs text-slate-500">
              Download your entire store catalog, invoices, orders and customer CRM as JSON
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Export Backup (JSON)
          </button>

          <label className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition">
            <Upload className="w-4 h-4" /> Import Backup (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Reset all inventory, orders, and customer data to initial factory sample dataset?')) {
                resetToSampleData();
                alert('Database reset to demo sample records.');
              }
            }}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold rounded-xl flex items-center gap-2 transition ml-auto"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Demo Data
          </button>
        </div>

        {importError && (
          <p className="text-xs text-rose-600 font-bold">{importError}</p>
        )}
      </div>
    </div>
  );
};
