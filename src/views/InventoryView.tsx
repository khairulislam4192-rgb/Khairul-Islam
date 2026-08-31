import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { translations } from '../utils/translations';
import {
  Search,
  Plus,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  DollarSign,
  TrendingUp,
  Filter,
  Camera,
  CheckCircle,
  Sparkles,
  Printer
} from 'lucide-react';

interface InventoryViewProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onOpenBarcodeScanner: () => void;
  onQuickRestock: (product: Product) => void;
  currentLang: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onAddProduct,
  onEditProduct,
  onOpenBarcodeScanner,
  onQuickRestock,
  currentLang,
}) => {
  const { products, deleteProduct, storeSettings, inventoryValuation, restockProduct } = useData();
  const { canEditStock, canViewBuyingPrice } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [quickRestockItem, setQuickRestockItem] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [isRestocking, setIsRestocking] = useState(false);

  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const handleDeleteConfirmed = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
    } catch (e) {
      console.error('Failed to delete product:', e);
    } finally {
      setProductToDelete(null);
    }
  };

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering
  const filteredProducts = products.filter((prod) => {
    const matchSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.size.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchLowStock = !showLowStockOnly || prod.quantity <= (prod.minStockThreshold || storeSettings.lowStockAlertThreshold);

    return matchSearch && matchCategory && matchLowStock;
  });

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockItem) return;
    setIsRestocking(true);
    try {
      await restockProduct(quickRestockItem.id, Number(restockQty));
      setQuickRestockItem(null);
      setRestockQty(10);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Inventory Valuation Header Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Capital (Admin Only) */}
        {canViewBuyingPrice() ? (
          <div className="p-5 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border border-blue-800/40">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-400" /> {t.inventory_valuation}
            </span>
            <h3 className="text-2xl font-black mt-2">
              {storeSettings.currencySymbol}{inventoryValuation.totalCostCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-blue-200/80 mt-1">Total capital locked in current inventory</p>
          </div>
        ) : (
          <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" /> Active Stock Lines
            </span>
            <h3 className="text-2xl font-black mt-2">{products.length} Products</h3>
            <p className="text-xs text-slate-400 mt-1">Available for sale</p>
          </div>
        )}

        {/* Potential Total Revenue */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> {t.potential_revenue}
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {storeSettings.currencySymbol}{inventoryValuation.potentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Upon full stock liquidation</p>
        </div>

        {/* Total Units In Hand */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" /> Total Stock In-Hand
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {inventoryValuation.totalUnits} <span className="text-sm font-normal text-slate-500">Units</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Across all categories & sizes</p>
        </div>

        {/* Low Stock Items Count */}
        <div className={`p-5 rounded-3xl border shadow-sm ${inventoryValuation.lowStockCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
          </span>
          <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-2">
            {inventoryValuation.lowStockCount} <span className="text-sm font-normal text-amber-700 dark:text-amber-400">Items</span>
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Below minimum threshold</p>
        </div>
      </div>

      {/* 2. Search, Filter Pills & Add Actions Toolbar */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name, barcode (e.g. OMS7849...), size or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Camera Barcode Scanner trigger */}
            <button
              onClick={onOpenBarcodeScanner}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-blue-500" /> {t.scan_barcode}
            </button>

            {/* Low stock filter toggle */}
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                showLowStockOnly
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only ({inventoryValuation.lowStockCount})
            </button>

            {/* Add Product button (Admin Only) */}
            {canEditStock() ? (
              <button
                onClick={onAddProduct}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> {t.add_product}
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic px-2">Sub-Account View (Edit Restricted)</span>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product Inventory Table & Quick Re-stock Grid */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Stock Inventory Catalog ({filteredProducts.length})
          </h3>
          <span className="text-xs text-slate-500">
            {canViewBuyingPrice() ? 'Admin full financial access' : 'Sub-account role: buying price protected'}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm font-semibold text-slate-500">No stock products match your search or filter.</p>
            {canEditStock() && (
              <button
                onClick={onAddProduct}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                + Add Product Now
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Barcode & SKU</th>
                  <th className="pb-3">Variant / Size</th>
                  {canViewBuyingPrice() && <th className="pb-3">Cost Price</th>}
                  <th className="pb-3">Selling Price</th>
                  {canViewBuyingPrice() && <th className="pb-3">Margin</th>}
                  <th className="pb-3">Stock Quantity</th>
                  <th className="pb-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((prod) => {
                  const isLow = prod.quantity <= (prod.minStockThreshold || storeSettings.lowStockAlertThreshold);
                  const margin = prod.sellingPrice - prod.buyingPrice;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-base shrink-0">
                              {prod.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                              {prod.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {prod.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {prod.barcode}
                      </td>

                      <td className="py-3.5">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                          {prod.size}
                        </span>
                      </td>

                      {canViewBuyingPrice() && (
                        <td className="py-3.5 text-slate-500 font-medium">
                          {storeSettings.currencySymbol}{prod.buyingPrice.toFixed(2)}
                        </td>
                      )}

                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        {storeSettings.currencySymbol}{prod.sellingPrice.toFixed(2)}
                      </td>

                      {canViewBuyingPrice() && (
                        <td className="py-3.5">
                          <span className={`font-semibold ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            +{storeSettings.currencySymbol}{margin.toFixed(2)}
                          </span>
                        </td>
                      )}

                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-xl ${
                              isLow
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            }`}
                          >
                            {prod.quantity}
                          </span>
                          {isLow && (
                            <span className="text-[10px] font-bold text-rose-500 uppercase">
                              Low Stock!
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Restock (+) Button right on the row */}
                          <button
                            onClick={() => setQuickRestockItem(prod)}
                            title="Quick Re-stock inventory"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                          >
                            <Plus className="w-3.5 h-3.5" /> Restock
                          </button>

                          {/* Edit product */}
                          <button
                            onClick={() => onEditProduct(prod)}
                            title="Edit product details / price / barcode"
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete product */}
                          <button
                            onClick={() => setProductToDelete(prod)}
                            title="Delete product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete {productToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this product ({productToDelete.size} • Barcode: {productToDelete.barcode})? Current stock is {productToDelete.quantity} units. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
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

      {/* Quick Restock Dialog */}
      {quickRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Quick Re-stock Item
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {quickRestockItem.name} ({quickRestockItem.size})
                </p>
              </div>
              <button
                onClick={() => setQuickRestockItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center text-xs">
              <span className="text-slate-500">Current Stock in Hand:</span>
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {quickRestockItem.quantity} units
              </span>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Add Incoming Quantity (+)
                </label>
                <div className="flex gap-2">
                  {[5, 10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setRestockQty(qty)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                        restockQty === qty
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                  className="w-full mt-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span>New Total Quantity will be:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {quickRestockItem.quantity + Number(restockQty)} units
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickRestockItem(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRestocking}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Confirm Restock (+)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
