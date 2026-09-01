import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import { translations } from '../utils/translations';
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Award,
  DollarSign,
  ShoppingBag,
  Eye,
  PlusCircle,
  Sparkles,
  MapPin,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenCustomerProfile: (customer: Customer) => void;
  onCreateOrderForCustomer: (customer: Customer) => void;
  currentLang: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenCustomerProfile,
  onCreateOrderForCustomer,
  currentLang,
}) => {
  const { customers, addCustomer, deleteCustomer, storeSettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Name and phone number are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        address: newAddress.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, mobile phone number, or email..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* Customer List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                    {cust.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                      {cust.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {cust.phone}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                  <Award className="w-3 h-3" /> {cust.loyaltyPoints} pts
                </span>
              </div>

              {cust.email && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-3">
                  <Mail className="w-3 h-3 text-slate-400" /> {cust.email}
                </p>
              )}

              {/* Stats pill */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Lifetime Spend</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {storeSettings.currencySymbol}{cust.lifetimeSpend.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Invoices</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {cust.totalOrdersCount} orders
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onOpenCustomerProfile(cust)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> 360° Profile
              </button>
              <button
                onClick={() => onCreateOrderForCustomer(cust)}
                title="Create POS Order for this customer"
                className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl transition"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCustomerToDelete(cust)}
                title="Delete customer permanently"
                className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Delete Customer?
                </h3>
                <p className="text-xs text-slate-500">
                  This action will permanently delete this customer from your store.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {customerToDelete.name}
              </div>
              <div className="text-slate-500">
                Phone: {customerToDelete.phone}
              </div>
              {customerToDelete.email && (
                <div className="text-slate-500">
                  Email: {customerToDelete.email}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Register New Customer
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jonathan Smith"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Delivery / Billing Address (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Street, City, Postal Code"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Preferences / Notes
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="Special preferences or notes..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
