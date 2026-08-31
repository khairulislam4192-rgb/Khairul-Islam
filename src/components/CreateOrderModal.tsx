import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Customer, Order, OrderItem, Product, PaymentMethod, OrderStatus } from '../types';
import {
  X,
  Plus,
  Trash2,
  Barcode,
  Search,
  CheckCircle,
  Printer,
  Sparkles,
  ShoppingBag,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order, shouldPrint: boolean) => void;
  initialCustomer?: Customer | null;
  initialProduct?: Product | null;
  editOrder?: Order | null;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialCustomer,
  initialProduct,
  editOrder,
}) => {
  const { products, customers, storeSettings, createOrder, updateOrder, addCustomer } = useData();
  const { currentUser } = useAuth();

  // Customer selection/input
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Cart items
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Product quick search inside POS
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with passed customer / product / editOrder
  useEffect(() => {
    if (isOpen) {
      if (editOrder) {
        setSelectedCustomerId(editOrder.customerId);
        setCustomerName(editOrder.customerName);
        setCustomerPhone(editOrder.customerPhone);
        setCartItems(editOrder.items || []);
        setDiscount(editOrder.discount || 0);
        setDeliveryCharge(editOrder.deliveryCharge || 0);
        setPaymentMethod(editOrder.paymentMethod);
        setPaidAmount(editOrder.paidAmount);
        setOrderNotes(editOrder.notes || '');
      } else if (initialCustomer) {
        setSelectedCustomerId(initialCustomer.id);
        setCustomerName(initialCustomer.name);
        setCustomerPhone(initialCustomer.phone);
        setCustomerAddress(initialCustomer.address || '');
      } else if (customers.length > 0) {
        // default to first customer
        setSelectedCustomerId(customers[0].id);
        setCustomerName(customers[0].name);
        setCustomerPhone(customers[0].phone);
        setCustomerAddress(customers[0].address || '');
      }

      if (!editOrder && initialProduct) {
        addItemToCart(initialProduct);
      }
    }
  }, [isOpen, initialCustomer, initialProduct, editOrder]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === 'new') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    } else {
      const cust = customers.find((c) => c.id === id);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        setCustomerAddress(cust.address || '');
      }
    }
  };

  const addItemToCart = (prod: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === prod.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      const newItem: OrderItem = {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        size: prod.size,
        buyingPrice: prod.buyingPrice,
        unitPrice: prod.sellingPrice,
        quantity: 1,
        total: prod.sellingPrice,
      };
      return [...prev, newItem];
    });
  };

  const updateItemQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty, total: newQty * item.unitPrice };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, i) => sum + i.total, 0);
  const discountAmount = Number(discount) || 0;
  const deliveryAmount = Number(deliveryCharge) || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount - redeemPoints);
  const tax = Math.round(((taxableAmount * storeSettings.taxRate) / 100) * 100) / 100;
  const grandTotal = Math.max(0, Math.round((taxableAmount + tax + deliveryAmount) * 100) / 100);

  // Auto set paid amount if user hasn't typed custom and not in edit mode
  useEffect(() => {
    if (!editOrder) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal, editOrder]);

  const dueAmount = Math.max(0, Math.round((grandTotal - paidAmount) * 100) / 100);

  const calculateStatus = (): OrderStatus => {
    if (paidAmount >= grandTotal && grandTotal > 0) return 'Paid';
    if (paidAmount > 0 && paidAmount < grandTotal) return 'Due';
    if (paidAmount === 0 && grandTotal > 0) return 'Pending';
    return 'Paid';
  };

  const handleSaveOrder = async (shouldPrint: boolean) => {
    if (cartItems.length === 0) {
      alert('Please add at least one product to the order.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide customer name and contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustId = selectedCustomerId;

      // If new customer, create in DB
      if (selectedCustomerId === 'new' || !selectedCustomerId) {
        const created = await addCustomer({
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          notes: 'Added from POS Order',
        });
        finalCustId = created.id;
      }

      const status = calculateStatus();

      if (editOrder) {
        const updatedOrderData: Order = {
          ...editOrder,
          customerId: finalCustId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          items: cartItems,
          subtotal,
          discount: discountAmount + redeemPoints,
          deliveryCharge: deliveryAmount,
          tax,
          grandTotal,
          paidAmount,
          dueAmount,
          status,
          paymentMethod,
          notes: orderNotes,
        };

        const result = await updateOrder(updatedOrderData);
        onOrderCreated(result, shouldPrint);
        onClose();
      } else {
        const newOrder = await createOrder({
          customerId: finalCustId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          items: cartItems,
          subtotal,
          discount: discountAmount + redeemPoints,
          deliveryCharge: deliveryAmount,
          tax,
          grandTotal,
          paidAmount,
          dueAmount,
          status,
          paymentMethod,
          notes: orderNotes,
          createdBy: currentUser?.id || 'ADM-8821',
          createdByName: currentUser?.name || 'Khairul Islam',
        });

        // Reset
        setCartItems([]);
        setDiscount(0);
        setDeliveryCharge(0);
        setOrderNotes('');
        onOrderCreated(newOrder, shouldPrint);
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

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

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                {editOrder ? `Edit Invoice #${editOrder.invoiceNumber}` : 'POS & Create New Invoice'}
              </h2>
              <p className="text-xs text-slate-500">
                {editOrder ? 'Update line items, quantities, discounts, delivery charge or customer details' : 'Fast barcode scanning, stock deduction & receipt generator'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column POS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Product Selection Catalog (5 cols) */}
          <div className="lg:col-span-5 p-5 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search name, barcode or category..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addItemToCart(prod)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-sm transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
                        {prod.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-mono">{prod.barcode}</span>
                        <span>Size: {prod.size}</span>
                        <span className={prod.quantity < 5 ? 'text-rose-500 font-bold' : ''}>
                          Qty: {prod.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {storeSettings.currencySymbol}{prod.sellingPrice.toFixed(2)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium">
                      + Add
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Customer Details, Cart & Billing Summary (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
            {/* Customer Selector */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Customer Information
                </label>
                {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {selectedCustomer.loyaltyPoints} Loyalty Pts Available
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Existing Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                    <option value="new">+ Add New Customer</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Customer Name *"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile Number *"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Cart Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Order Items ({cartItems.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Subtotal: {storeSettings.currencySymbol}{subtotal.toFixed(2)}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">
                    No items added to invoice yet. Click items on the left catalog or scan barcode.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </h4>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.barcode} • Size: {item.size} • @ {storeSettings.currencySymbol}{item.unitPrice.toFixed(2)}
                        </div>
                      </div>

                      {/* Qty controller */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => updateItemQty(item.productId, -1)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:text-rose-500"
                        >
                          -
                        </button>
                        <span className="font-bold w-6 text-center text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQty(item.productId, 1)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:text-emerald-500"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-bold text-slate-900 dark:text-white w-16 text-right">
                        {storeSettings.currencySymbol}{item.total.toFixed(2)}
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Billing & Payment Controls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Discount ({storeSettings.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Delivery Charge ({storeSettings.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={deliveryCharge || ''}
                    onChange={(e) => setDeliveryCharge(Math.max(0, Number(e.target.value)))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card / POS</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Store Credit">Store Credit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Paid Amount ({storeSettings.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Due Amount</label>
                  <div className={`px-3 py-2 rounded-xl font-bold ${dueAmount > 0 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'}`}>
                    {storeSettings.currencySymbol}{dueAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Grand Total Summary line */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Subtotal: <strong className="text-slate-800 dark:text-slate-200">{storeSettings.currencySymbol}{subtotal.toFixed(2)}</strong></span>
                  {deliveryAmount > 0 && (
                    <span>Delivery: <strong className="text-blue-600 dark:text-blue-400">+{storeSettings.currencySymbol}{deliveryAmount.toFixed(2)}</strong></span>
                  )}
                  <span>Tax ({storeSettings.taxRate}%): <strong className="text-slate-800 dark:text-slate-200">+{storeSettings.currencySymbol}{tax.toFixed(2)}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {storeSettings.currencySymbol}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || cartItems.length === 0}
                onClick={() => handleSaveOrder(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                {editOrder ? 'Update Invoice' : 'Save Order Only'}
              </button>
              <button
                type="button"
                disabled={isSubmitting || cartItems.length === 0}
                onClick={() => handleSaveOrder(true)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {editOrder ? 'Update & Print' : 'Save & Print Command'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
