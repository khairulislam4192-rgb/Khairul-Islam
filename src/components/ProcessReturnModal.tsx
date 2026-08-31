import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Order, OrderItem, ProductReturn, ReturnReason } from '../types';
import { translations } from '../utils/translations';
import {
  RotateCcw,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: Order | null;
  currentLang: string;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  onClose,
  initialOrder,
  currentLang,
}) => {
  const { orders, products, addReturn, storeSettings } = useData();
  const { currentUser } = useAuth();

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<ReturnReason>('Size Mismatch');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [restockToInventory, setRestockToInventory] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  // Selected Order
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || initialOrder || null;
  const selectedItem: OrderItem | undefined = selectedOrder?.items[selectedItemIdx];

  // Set initial order when opened
  useEffect(() => {
    if (initialOrder) {
      setSelectedOrderId(initialOrder.id);
      setSelectedItemIdx(0);
      if (initialOrder.items.length > 0) {
        const item = initialOrder.items[0];
        setQuantity(1);
        setRefundAmount(item.unitPrice);
      }
    } else if (orders.length > 0) {
      setSelectedOrderId(orders[0].id);
      setSelectedItemIdx(0);
      if (orders[0].items.length > 0) {
        const item = orders[0].items[0];
        setQuantity(1);
        setRefundAmount(item.unitPrice);
      }
    }
  }, [initialOrder, isOpen]);

  // Update refund calculation when item or quantity changes
  useEffect(() => {
    if (selectedItem) {
      const calculatedRefund = selectedItem.unitPrice * quantity;
      setRefundAmount(calculatedRefund);
    }
  }, [selectedItemIdx, quantity, selectedOrderId]);

  if (!isOpen) return null;

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedItemIdx(0);
    const ord = orders.find((o) => o.id === orderId);
    if (ord && ord.items.length > 0) {
      setQuantity(1);
      setRefundAmount(ord.items[0].unitPrice);
    }
  };

  const handleItemSelect = (idx: number) => {
    setSelectedItemIdx(idx);
    if (selectedOrder && selectedOrder.items[idx]) {
      setQuantity(1);
      setRefundAmount(selectedOrder.items[idx].unitPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedItem) return;

    if (quantity <= 0 || quantity > selectedItem.quantity) {
      alert(`Invalid quantity! Must be between 1 and ${selectedItem.quantity}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addReturn({
        orderId: selectedOrder.id,
        invoiceNumber: selectedOrder.invoiceNumber,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        customerPhone: selectedOrder.customerPhone || '',
        items: [
          {
            productId: selectedItem.productId,
            productName: selectedItem.productName,
            barcode: selectedItem.barcode,
            size: selectedItem.size,
            unitPrice: selectedItem.unitPrice,
            quantity: Number(quantity),
            refundAmount: Number(refundAmount),
            restocked: restockToInventory,
          },
        ],
        totalRefundAmount: Number(refundAmount),
        restockedToInventory: restockToInventory,
        reason,
        status: 'Completed',
        createdBy: currentUser?.id || 'admin',
        createdByName: currentUser?.name || 'Staff',
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err) {
      console.error('Failed to process return:', err);
      alert('Error processing product return. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter orders for quick lookup
  const filteredOrders = orders.filter((o) =>
    o.invoiceNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    o.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase())
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {t.process_return || 'Process Product Return & Restock'}
              </h2>
              <p className="text-xs text-slate-500">
                {t.return_desc || 'Return items from customer invoices and restock inventory'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Step 1: Select Invoice */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              1. Select Customer Invoice / Order
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Filter invoice # or customer name..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {filteredOrders.length === 0 ? (
                  <option value="">No invoices found</option>
                ) : (
                  filteredOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.invoiceNumber} — {ord.customerName} ({storeSettings.currencySymbol}{ord.grandTotal.toFixed(2)}) • {new Date(ord.createdAt).toLocaleDateString()}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Step 2: Select Returned Item */}
          {selectedOrder && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                2. Select Item to Return from Invoice #{selectedOrder.invoiceNumber}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedOrder.items.map((item, idx) => {
                  const isSelected = selectedItemIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleItemSelect(idx)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-start justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Size: {item.size} • Invoiced: {item.quantity} units
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                          {storeSettings.currencySymbol}{item.unitPrice.toFixed(2)} / unit
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Return Details & Quantity */}
          {selectedItem && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Quantity */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Return Quantity (Max {selectedItem.quantity})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(selectedItem.quantity, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center text-sm"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Return Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReturnReason)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Size Mismatch">Size Mismatch</option>
                    <option value="Defective / Damaged">Defective / Damaged</option>
                    <option value="Wrong Item Sent">Wrong Item Sent</option>
                    <option value="Customer Changed Mind">Customer Changed Mind</option>
                    <option value="Quality Not as Expected">Quality Not as Expected</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Refund Amount */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Refund Amount ({storeSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Automatic Restock Toggle */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {t.restock_to_inventory || 'Restock back into Inventory'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Automatically add +{quantity} unit(s) back into active store stock
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restockToInventory}
                    onChange={(e) => setRestockToInventory(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Exchanged for larger size, or minor packaging tear..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedOrder || !selectedItem}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {isSubmitting ? 'Processing Return...' : `Confirm Return & ${restockToInventory ? 'Restock (+)' : 'Record'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
