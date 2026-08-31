import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateRandomBarcode, renderBarcodeSvg } from '../utils/barcode';
import { compressImageToBase64 } from '../utils/imageUtils';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Barcode,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Upload,
  Link as LinkIcon,
  Camera,
  Trash2,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null; // null for add, Product for edit
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { addProduct, updateProduct, checkBarcodeExists, storeSettings } = useData();
  const { canViewBuyingPrice } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [barcode, setBarcode] = useState('');
  const [buyingPrice, setBuyingPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [size, setSize] = useState('Standard');
  const [quantity, setQuantity] = useState<number>(10);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(5);
  const [image, setImage] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [details, setDetails] = useState('');
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsProcessingImage(true);
    try {
      // Compress to lightweight Base64 string for free Firestore storage (<60KB)
      const compressedBase64 = await compressImageToBase64(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.75,
        format: 'image/jpeg',
      });
      setImage(compressedBase64);
    } catch (err) {
      console.warn('Image compression fallback:', err);
      // Fallback: standard reader
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Categories list
  const CATEGORIES = ['Apparel', 'Footwear', 'Accessories', 'Electronics', 'Home & Living', 'Beauty & Health', 'Food & Grocery'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Standard', 'One Size', '38', '40', '42', 'US 9', 'US 10', 'US 11'];

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name);
        setCategory(product.category);
        setBarcode(product.barcode);
        setBuyingPrice(product.buyingPrice);
        setSellingPrice(product.sellingPrice);
        setSize(product.size);
        setQuantity(product.quantity);
        setMinStockThreshold(product.minStockThreshold || 5);
        setImage(product.image || '');
        setDetails(product.details || '');
        setBarcodeError(null);
      } else {
        // New Product defaults
        setName('');
        setCategory('Apparel');
        const autoCode = generateRandomBarcode('OMS');
        setBarcode(autoCode);
        setBuyingPrice(20);
        setSellingPrice(45);
        setSize('M');
        setQuantity(20);
        setMinStockThreshold(5);
        setImage('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&auto=format&fit=crop&q=80');
        setDetails('');
        setBarcodeError(null);
      }
    }
  }, [isOpen, product]);

  // Live barcode preview
  useEffect(() => {
    if (barcode && barcodeSvgRef.current) {
      renderBarcodeSvg(barcodeSvgRef.current, barcode, {
        format: 'CODE128',
        width: 1.5,
        height: 35,
        fontSize: 11,
      });
    }
  }, [barcode]);

  // Live validate duplicate barcode
  const handleBarcodeChange = (val: string) => {
    const clean = val.trim();
    setBarcode(clean);
    if (clean && checkBarcodeExists(clean, product?.id)) {
      setBarcodeError(`Duplicate warning: Barcode "${clean}" is already assigned to another stock item!`);
    } else {
      setBarcodeError(null);
    }
  };

  const handleGenerateBarcode = () => {
    let newCode = generateRandomBarcode('OMS');
    while (checkBarcodeExists(newCode, product?.id)) {
      newCode = generateRandomBarcode('OMS');
    }
    setBarcode(newCode);
    setBarcodeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name');
      return;
    }
    if (!barcode.trim()) {
      alert('Please provide or generate a barcode');
      return;
    }
    if (checkBarcodeExists(barcode, product?.id)) {
      setBarcodeError(`Duplicate validation failed: Barcode "${barcode}" already exists!`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (product) {
        await updateProduct(product.id, {
          name,
          category,
          barcode,
          buyingPrice: Number(buyingPrice),
          sellingPrice: Number(sellingPrice),
          size,
          quantity: Number(quantity),
          minStockThreshold: Number(minStockThreshold),
          image,
          details,
        });
      } else {
        await addProduct({
          name,
          category,
          barcode,
          buyingPrice: Number(buyingPrice),
          sellingPrice: Number(sellingPrice),
          size,
          quantity: Number(quantity),
          minStockThreshold: Number(minStockThreshold),
          image,
          details,
        });
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Profit calculations
  const profitMargin = sellingPrice - buyingPrice;
  const profitPercentage = buyingPrice > 0 ? ((profitMargin / buyingPrice) * 100).toFixed(1) : '100';

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {product ? 'Edit Stock Item' : 'Add New Stock / Product'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure inventory pricing, barcode verification and stock thresholds
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic Premium Linen Blazer"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Size / Variant
              </label>
              <div className="flex gap-2">
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Custom"
                  className="w-24 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Barcode Generation & Validation Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-blue-500" /> Barcode & SKU Management
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Generate Barcode
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                placeholder="Barcode (e.g. OMS78491023)..."
                className={`flex-1 px-3.5 py-2.5 font-mono text-xs bg-white dark:bg-slate-900 rounded-xl border focus:outline-none focus:ring-2 ${
                  barcodeError
                    ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500'
                }`}
              />
            </div>

            {barcodeError ? (
              <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{barcodeError}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Barcode is unique & valid
                </span>
                <div className="bg-white px-2 py-0.5 rounded shadow-sm">
                  <svg ref={barcodeSvgRef} />
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Profit Margin (Admin view) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Financial Pricing & Valuation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {canViewBuyingPrice() ? (
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Buying Price / Cost ({storeSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs text-slate-500">
                  Buying price is restricted for sub-accounts.
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Selling Price ({storeSettings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>

            {canViewBuyingPrice() && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Profit per Unit:</span>
                <span className={`font-bold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  +{storeSettings.currencySymbol}{profitMargin.toFixed(2)} ({profitPercentage}% markup)
                </span>
              </div>
            )}
          </div>

          {/* Stock Quantity & Low Stock Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Stock In-Hand (Quantity) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Product Image Storage (Free Firestore Base64 & Web URL Mode) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-500" /> Product Image & Thumbnail
              </label>
              <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2 py-1 rounded-md transition ${
                    imageTab === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Device Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2 py-1 rounded-md transition ${
                    imageTab === 'url'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Web URL
                </button>
              </div>
            </div>

            {imageTab === 'upload' ? (
              <div className="space-y-2">
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => imageFileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 dark:border-blue-900/60 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-900/60 rounded-xl p-3.5 text-center cursor-pointer transition flex items-center justify-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    {isProcessingImage ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isProcessingImage ? 'Optimizing image...' : 'Click to select or drop image'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Auto-compressed to Base64 (Saved inside free Firestore document)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Image Preview & Quick Removal */}
            {image && (
              <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <img
                  src={image}
                  alt="Product preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {image.startsWith('data:image') ? 'Compressed Base64 Image (Free Tier Ready)' : 'Direct Web URL Image'}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Ready for zero-cost Firestore sync
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImage('')}
                  title="Remove image"
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Product Details & Specification
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Material, warranty, care instructions, notes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(barcodeError)}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg disabled:opacity-50"
            >
              {product ? 'Update Stock Item' : 'Save New Product to Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
