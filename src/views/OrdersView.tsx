import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { translations } from '../utils/translations';
import {
  Search,
  Plus,
  Printer,
  Trash2,
  Eye,
  Filter,
  CreditCard,
  Phone,
  User,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Edit,
  RotateCcw,
  Truck
} from 'lucide-react';

interface OrdersViewProps {
  onOpenNewOrder: () => void;
  onPrintOrder: (order: Order) => void;
  onViewOrderDetails: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  onProcessReturn?: (order: Order) => void;
  currentLang: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenNewOrder,
  onPrintOrder,
  onViewOrderDetails,
  onEditOrder,
  onProcessReturn,
  currentLang,
}) => {
  const { orders, updateOrderStatus, deleteOrder, storeSettings } = useData();
  const { canManageSettings } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const STATUS_TABS: (OrderStatus | 'All')[] = ['All', 'Paid', 'Due', 'Pending', 'Delivered'];

  // Search & Filter
  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      ord.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerPhone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'All' || ord.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDeleteConfirmed = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      if (selectedOrderDetails?.id === orderToDelete.id) {
        setSelectedOrderDetails(null);
      }
    } catch (e) {
      console.error('Delete order error:', e);
    } finally {
      setOrderToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID (INV-...), Customer Name, or Mobile Phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action button */}
          <button
            onClick={onOpenNewOrder}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> {t.pos_terminal}
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((status) => {
            const count = status === 'All' ? orders.length : orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  statusFilter === status
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === status
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Order List Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Orders & Tax Invoices ({filteredOrders.length})
          </h3>
          <span className="text-xs text-slate-500">
            Realtime database sync active
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm font-semibold text-slate-500">No orders match the selected filters.</p>
            <button
              onClick={onOpenNewOrder}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              Create New Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Customer Details</th>
                  <th className="pb-3">Items Summary</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Payment / Due</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {ord.invoiceNumber}
                      <div className="text-[10px] font-normal text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {ord.customerName}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {ord.customerPhone}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {ord.items.length} item(s) ({ord.items.reduce((s, i) => s + i.quantity, 0)} units)
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {ord.items.map((i) => i.productName).join(', ')}
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        {storeSettings.currencySymbol}{ord.grandTotal.toFixed(2)}
                      </div>
                      {ord.discount > 0 && (
                        <div className="text-[10px] text-emerald-600">
                          Discount: -{storeSettings.currencySymbol}{ord.discount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-4">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {storeSettings.currencySymbol}{ord.paidAmount.toFixed(2)} ({ord.paymentMethod})
                      </div>
                      {ord.dueAmount > 0 ? (
                        <span className="text-[10px] font-bold text-rose-500">
                          Due: {storeSettings.currencySymbol}{ord.dueAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">Fully Paid</span>
                      )}
                    </td>

                    <td className="py-4">
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                          ord.status === 'Paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : ord.status === 'Delivered'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : ord.status === 'Due'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <option value="Due">Due</option>
                        <option value="Paid">Paid</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>

                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Details Modal Action */}
                        <button
                          onClick={() => setSelectedOrderDetails(ord)}
                          title="View Order Details"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>

                        {/* Edit Order/Invoice Action */}
                        {onEditOrder && (
                          <button
                            onClick={() => onEditOrder(ord)}
                            title="Edit Invoice / Items / Billing"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Process Return Action */}
                        {onProcessReturn && (
                          <button
                            onClick={() => onProcessReturn(ord)}
                            title="Return Product & Restock"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Print Invoice Command */}
                        <button
                          onClick={() => onPrintOrder(ord)}
                          title="Print Command"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Delete Order Action */}
                        <button
                          onClick={() => setOrderToDelete(ord)}
                          title="Delete Order / Invoice"
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Invoice #{orderToDelete.invoiceNumber}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this invoice for <strong>{orderToDelete.customerName}</strong> ({storeSettings.currencySymbol}{orderToDelete.grandTotal.toFixed(2)})? This will remove the record from your store history.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
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

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Order Details Overview
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {selectedOrderDetails.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedOrderDetails.customerName}
                  </span>
                  <span className="text-slate-500 block">{selectedOrderDetails.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Processed By</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedOrderDetails.createdByName}
                  </span>
                  <span className="text-slate-500 block">
                    {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Itemized Products
                </h4>
                <div className="space-y-2">
                  {selectedOrderDetails.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.barcode} • Size: {item.size} • Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {storeSettings.currencySymbol}{item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{storeSettings.currencySymbol}{selectedOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{storeSettings.currencySymbol}{selectedOrderDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrderDetails.deliveryCharge && selectedOrderDetails.deliveryCharge > 0 && (
                  <div className="flex justify-between text-blue-600 font-medium">
                    <span>Delivery Charge:</span>
                    <span>+{storeSettings.currencySymbol}{selectedOrderDetails.deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({storeSettings.taxRate}%):</span>
                  <span>{storeSettings.currencySymbol}{selectedOrderDetails.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span>{storeSettings.currencySymbol}{selectedOrderDetails.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Paid ({selectedOrderDetails.paymentMethod}):</span>
                  <span>{storeSettings.currencySymbol}{selectedOrderDetails.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-500">
                  <span>Due Balance:</span>
                  <span>{storeSettings.currencySymbol}{selectedOrderDetails.dueAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 bg-slate-50 dark:bg-slate-900">
              {/* Delete button in modal */}
              <button
                type="button"
                onClick={() => {
                  setOrderToDelete(selectedOrderDetails);
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" /> Delete Invoice
              </button>

              <div className="flex items-center gap-2">
                {onEditOrder && (
                  <button
                    onClick={() => {
                      const ord = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      onEditOrder(ord);
                    }}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Edit className="w-4 h-4" /> Edit Invoice
                  </button>
                )}
                {onProcessReturn && (
                  <button
                    onClick={() => {
                      const ord = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      onProcessReturn(ord);
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <RotateCcw className="w-4 h-4" /> Process Return
                  </button>
                )}
                <button
                  onClick={() => {
                    onPrintOrder(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Print Command
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
