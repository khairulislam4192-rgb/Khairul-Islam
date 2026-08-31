import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ProductReturn, ReturnReason } from '../types';
import { translations } from '../utils/translations';
import {
  RotateCcw,
  Search,
  Plus,
  Trash2,
  Filter,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  User,
  Hash,
  ArrowRight
} from 'lucide-react';

interface ReturnsViewProps {
  onOpenProcessReturn: () => void;
  currentLang: string;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  onOpenProcessReturn,
  currentLang,
}) => {
  const { returns, deleteReturn, storeSettings } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('All');
  const [restockFilter, setRestockFilter] = useState<string>('All');
  const [returnToDelete, setReturnToDelete] = useState<ProductReturn | null>(null);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  // Filtered Returns
  const filteredReturns = returns.filter((ret) => {
    const invoiceNum = ret.invoiceNumber || '';
    const custName = ret.customerName || '';
    const noteText = ret.notes || '';
    const itemNames = (ret.items || []).map((i) => `${i.productName} ${i.barcode}`).join(' ');

    const matchSearch =
      invoiceNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      noteText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchReason = reasonFilter === 'All' || ret.reason === reasonFilter;
    const matchRestock =
      restockFilter === 'All' ||
      (restockFilter === 'restocked' && ret.restockedToInventory) ||
      (restockFilter === 'not_restocked' && !ret.restockedToInventory);

    return matchSearch && matchReason && matchRestock;
  });

  // Calculate Metrics
  const totalRefundAmount = returns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
  const totalUnitsReturned = returns.reduce(
    (sum, r) => sum + (r.items || []).reduce((isum, item) => isum + item.quantity, 0),
    0
  );
  const totalRestockedUnits = returns
    .filter((r) => r.restockedToInventory)
    .reduce((sum, r) => sum + (r.items || []).reduce((isum, item) => isum + item.quantity, 0), 0);
  const defectiveCount = returns.filter((r) => r.reason === 'Defective / Damaged').length;

  const handleDeleteConfirmed = async () => {
    if (!returnToDelete) return;
    try {
      await deleteReturn(returnToDelete.id);
    } catch (e) {
      console.error('Delete return error:', e);
    } finally {
      setReturnToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t.returns_management || 'Returns & Restock Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.returns_subtitle || 'Track returned products, issue refunds, and manage inventory restock levels'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProcessReturn}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t.process_return || 'Process New Return'}
        </button>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.total_returns || 'Total Returns'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {returns.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalUnitsReturned} total units returned
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.total_refunded || 'Total Refunded'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {storeSettings.currencySymbol}{totalRefundAmount.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customer refund payout
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.restocked_units || 'Restocked Units'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {totalRestockedUnits}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Restored back to live stock
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.defective_returns || 'Defective / Damaged'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {defectiveCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Flagged quality issues
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, customer name, product, or barcode..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Reasons</option>
              <option value="Size Mismatch">Size Mismatch</option>
              <option value="Defective / Damaged">Defective / Damaged</option>
              <option value="Wrong Item Sent">Wrong Item Sent</option>
              <option value="Customer Changed Mind">Customer Changed Mind</option>
              <option value="Quality Not as Expected">Quality Issue</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={restockFilter}
              onChange={(e) => setRestockFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="restocked">Restocked to Inventory</option>
              <option value="not_restocked">Not Restocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Returns Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {filteredReturns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Return Records Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No product returns match your current filters. You can process returns whenever customers request exchanges or refunds.
            </p>
            <button
              onClick={onOpenProcessReturn}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              + Process First Return
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Return ID / Date</th>
                  <th className="py-3.5 px-4">Invoice & Customer</th>
                  <th className="py-3.5 px-4">Product & Variant</th>
                  <th className="py-3.5 px-4 text-center">Qty</th>
                  <th className="py-3.5 px-4">Refund</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Restock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredReturns.map((ret) => {
                  const firstItem = ret.items && ret.items.length > 0 ? ret.items[0] : null;
                  const totalQty = (ret.items || []).reduce((s, i) => s + i.quantity, 0);
                  const refund = ret.totalRefundAmount || (firstItem ? firstItem.refundAmount : 0);

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4 font-mono">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                          {ret.returnNumber || ret.id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ret.createdAt).toLocaleDateString()} • {new Date(ret.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-slate-400" />
                          <span>#{ret.invoiceNumber || 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {ret.customerName}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {firstItem ? (
                          <>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {firstItem.productName}
                              {ret.items.length > 1 && ` (+${ret.items.length - 1} more)`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Size: {firstItem.size} • Barcode: {firstItem.barcode}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No item data</span>
                        )}
                        {ret.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                            "{ret.notes}"
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl">
                          {totalQty}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                          {storeSettings.currencySymbol}{refund.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                          ret.reason === 'Defective / Damaged'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : ret.reason === 'Size Mismatch'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {ret.reason}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {ret.restockedToInventory ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Restocked (+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium rounded-xl text-[11px]">
                            Not Restocked
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setReturnToDelete(ret)}
                          title="Delete Return Record"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Return Confirmation Modal */}
      {returnToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Return Record {returnToDelete.id}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this return record for <strong>{returnToDelete.productName}</strong> (Invoice #{returnToDelete.invoiceNumber})?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReturnToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
