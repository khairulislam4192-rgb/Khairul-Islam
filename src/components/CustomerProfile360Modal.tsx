import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../types';
import { useData } from '../context/DataContext';
import {
  X,
  Award,
  DollarSign,
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Printer,
  PlusCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

interface CustomerProfile360ModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintOrder: (order: Order) => void;
  onCreateOrderForCustomer: (customer: Customer) => void;
}

export const CustomerProfile360Modal: React.FC<CustomerProfile360ModalProps> = ({
  customer,
  isOpen,
  onClose,
  onPrintOrder,
  onCreateOrderForCustomer,
}) => {
  const { orders, storeSettings, updateCustomer, deleteCustomer } = useData();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(customer?.notes || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    if (window.confirm(`Are you sure you want to permanently delete customer "${customer.name}"?`)) {
      setIsDeleting(true);
      try {
        await deleteCustomer(customer.id);
        onClose();
      } catch (err: any) {
        alert(err.message || 'Failed to delete customer');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  // Filter all orders for this customer
  const customerOrders = orders.filter(
    (o) =>
      o.customerId === customer.id ||
      o.customerPhone === customer.phone ||
      o.customerName.toLowerCase() === customer.name.toLowerCase()
  );

  // Compute tier badge
  const getBadgeTier = (points: number, lifetimeSpend: number) => {
    if (points >= 150 || lifetimeSpend >= 1500) {
      return { tier: 'Platinum VIP', color: 'from-purple-600 to-indigo-600', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/60' };
    }
    if (points >= 80 || lifetimeSpend >= 800) {
      return { tier: 'Gold Elite', color: 'from-amber-500 to-yellow-600', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/60' };
    }
    if (points >= 30 || lifetimeSpend >= 300) {
      return { tier: 'Silver Member', color: 'from-slate-400 to-slate-600', text: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-200 dark:bg-slate-800' };
    }
    return { tier: 'Bronze Starter', color: 'from-amber-700 to-amber-900', text: 'text-amber-800 dark:text-amber-600', bg: 'bg-amber-100/60 dark:bg-amber-950/40' };
  };

  const badge = getBadgeTier(customer.loyaltyPoints, customer.lifetimeSpend);
  const avgOrderValue = customerOrders.length > 0 ? (customer.lifetimeSpend / customerOrders.length) : 0;

  const handleSaveNotes = async () => {
    await updateCustomer(customer.id, { notes });
    setIsEditingNotes(false);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header Hero */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg border border-white/20">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{customer.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border border-white/10 flex items-center gap-1`}>
                    <Award className="w-3.5 h-3.5" /> {badge.tier}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-400" /> {customer.phone}
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                title="Delete customer permanently"
                className="p-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => {
                  onCreateOrderForCustomer(customer);
                  onClose();
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> New Invoice / POS
              </button>
            </div>
          </div>
        </div>

        {/* 360 Metrics Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Lifetime Spend
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {storeSettings.currencySymbol}{customer.lifetimeSpend.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Paid Revenue</span>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Loyalty Points
            </span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
              {customer.loyaltyPoints} <span className="text-xs font-normal text-slate-500">pts</span>
            </div>
            <span className="text-[10px] text-slate-500">Credited on Paid orders</span>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> Total Invoices
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {customerOrders.length}
            </div>
            <span className="text-[10px] text-slate-500">Orders placed</span>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Avg Order Value
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {storeSettings.currencySymbol}{avgOrderValue.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Per transaction</span>
          </div>
        </div>

        {/* Scrollable Order History & CRM Notes */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Customer Address & Notes */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Shipping / Billing Address & CRM Notes
              </span>
              <button
                onClick={() => {
                  if (isEditingNotes) handleSaveNotes();
                  else setIsEditingNotes(true);
                }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                {isEditingNotes ? 'Save Note' : 'Edit Note'}
              </button>
            </div>
            {customer.address && (
              <p className="text-slate-600 dark:text-slate-400">
                <b>Address:</b> {customer.address}
              </p>
            )}
            {isEditingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={2}
                placeholder="Add customer preferences, sizing notes, or VIP requests..."
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-300 italic">
                {customer.notes ? `"${customer.notes}"` : 'No custom notes recorded yet.'}
              </p>
            )}
          </div>

          {/* Complete Invoices History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Complete Invoice & Order History ({customerOrders.length})
              </h3>
              <span className="text-xs text-slate-500">Sorted by most recent</span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-xs">No orders recorded for this customer yet.</p>
                <button
                  onClick={() => {
                    onCreateOrderForCustomer(customer);
                    onClose();
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Create First Order
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {ord.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.status === 'Paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : ord.status === 'Delivered'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                              : ord.status === 'Due'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {ord.items.length} item(s): {ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {storeSettings.currencySymbol}{ord.grandTotal.toFixed(2)}
                        </div>
                        {ord.dueAmount > 0 && (
                          <div className="text-[10px] text-rose-500 font-semibold">
                            Due: {storeSettings.currencySymbol}{ord.dueAmount.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onPrintOrder(ord)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
