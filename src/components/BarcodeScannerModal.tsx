import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Search, Sparkles, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onQuickRestock?: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onQuickRestock,
}) => {
  const { products, storeSettings } = useData();
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hardwareBuffer, setHardwareBuffer] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when closing modal
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setManualCode('');
      setCameraError(null);
    }
  }, [isOpen]);

  // Hardware USB/Bluetooth Barcode Scanner listener
  useEffect(() => {
    let lastKeyTime = Date.now();
    let buffer = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = ''; // Reset if slow typing
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleLookupBarcode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        setHardwareBuffer(buffer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or camera device unavailable. You can type or use a USB scanner.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookupBarcode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    const found = products.find(
      (p) =>
        p.barcode.toUpperCase() === clean ||
        p.name.toUpperCase().includes(clean) ||
        p.id.toUpperCase() === clean
    );
    if (found) {
      setScannedResult(found);
    } else {
      setScannedResult(null);
      setCameraError(`No product found with barcode or SKU: "${code}"`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookupBarcode(manualCode);
  };

  const simulateCameraScan = () => {
    // Pick a random product from inventory to simulate scanning in preview environment
    if (products.length > 0) {
      const randomProd = products[Math.floor(Math.random() * products.length)];
      setScannedResult(randomProd);
      setCameraError(null);
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

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Barcode & SKU Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Camera, USB Scanner, or Manual lookup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Camera Viewport */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800 flex flex-col items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Laser scan line overlay */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
                <div className="absolute inset-8 border-2 border-dashed border-blue-400/60 rounded-lg pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-slate-300">
                  <span>Aim barcode inside red target line</span>
                  <button
                    onClick={simulateCameraScan}
                    className="text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Simulate Scan
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Camera is currently standby</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Use built-in camera, or connect any Bluetooth/USB 1D/2D handheld barcode scanner.
                  </p>
                </div>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition"
                  >
                    Turn On Camera
                  </button>
                  <button
                    onClick={simulateCameraScan}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                  >
                    Quick Test Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Hardware Scanner Realtime Tip */}
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Hardware Barcode Gun Listener: <b className="text-slate-800 dark:text-slate-200">Listening...</b>
            </span>
            {hardwareBuffer && <span className="font-mono text-blue-500">[{hardwareBuffer}]</span>}
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type Barcode / SKU (e.g. OMS78491023)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow"
            >
              Lookup
            </button>
          </form>

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Match Found
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {scannedResult.barcode}
                </span>
              </div>

              <div className="flex gap-3.5 items-center">
                {scannedResult.image ? (
                  <img
                    src={scannedResult.image}
                    alt={scannedResult.name}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-lg">
                    {scannedResult.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {scannedResult.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {scannedResult.category}
                    </span>
                    <span>Size: <b>{scannedResult.size}</b></span>
                    <span>Stock: <b className={scannedResult.quantity < 5 ? 'text-rose-500 font-bold' : ''}>{scannedResult.quantity}</b></span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {storeSettings.currencySymbol}{scannedResult.sellingPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                {onSelectProduct && (
                  <button
                    onClick={() => {
                      onSelectProduct(scannedResult);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Order / Invoice
                  </button>
                )}
                {onQuickRestock && (
                  <button
                    onClick={() => {
                      onQuickRestock(scannedResult);
                      onClose();
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    Quick Restock
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
