import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  ArrowLeft,
  Download,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { useData } from '../context/DataContext';
import { renderBarcodeSvg } from '../utils/barcode';
import { translations, SupportedLang } from '../utils/translations';
import { generateThermalReceiptPdf, generateA4InvoicePdf } from '../utils/pdfGenerator';

interface PrintInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang?: string;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  currentLang = 'en',
}) => {
  const { storeSettings, getCustomerById } = useData();
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>(storeSettings.invoiceFormat || 'thermal');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const a4BarcodeRef = useRef<SVGSVGElement | null>(null);

  const t = translations[currentLang as SupportedLang] || translations.en;
  const customer = order ? getCustomerById(order.customerId) : null;

  // Escape key listener to return back immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Render barcodes
  useEffect(() => {
    if (order && isOpen) {
      if (barcodeRef.current) {
        renderBarcodeSvg(barcodeRef.current, order.invoiceNumber, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          fontSize: 11,
          lineColor: '#000000',
        });
      }
      if (a4BarcodeRef.current) {
        renderBarcodeSvg(a4BarcodeRef.current, order.invoiceNumber, {
          format: 'CODE128',
          width: 1.4,
          height: 32,
          fontSize: 11,
          lineColor: '#000000',
        });
      }
    }
  }, [order, printFormat, isOpen]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (isExportingPdf || !order) return;
    setIsExportingPdf(true);
    setPdfDownloaded(false);

    try {
      if (printFormat === 'thermal') {
        await generateThermalReceiptPdf(order, storeSettings, customer);
      } else {
        await generateA4InvoicePdf(order, storeSettings, customer);
      }

      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3500);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // Fallback to native print where user can also choose "Save as PDF"
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      id="print-invoice-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-transparent print:static"
    >
      {/* Controls Bar (Hidden during actual print) */}
      <div
        id="print-invoice-dialog"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto print:hidden max-h-[96vh]"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            {/* Primary Back Button */}
            <button
              id="btn-print-preview-back-header"
              onClick={onClose}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              title="Back (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.back || 'Back'}</span>
            </button>

            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                {t.print_invoice || 'Invoice & Receipt'}
              </h3>
              <p className="text-xs text-slate-500">
                #{order.invoiceNumber} • {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Thermal vs A4 format toggle */}
            <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                id="btn-toggle-thermal"
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  printFormat === 'thermal'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> Thermal
              </button>
              <button
                id="btn-toggle-a4"
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  printFormat === 'a4'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> A4
              </button>
            </div>

            {/* Save as PDF Button */}
            <button
              id="btn-header-save-pdf"
              onClick={handleSavePdf}
              disabled={isExportingPdf}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                pdfDownloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-60`}
              title="Save as PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.downloading_pdf || 'Saving...'}</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.pdf_saved || 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.save_pdf || 'Save as PDF'}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              id="btn-header-print"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> {t.print_command || 'Print'}
            </button>

            {/* Close Cross */}
            <button
              id="btn-header-close-x"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Preview Viewport */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/60 overflow-y-auto max-h-[66vh] flex justify-center">
          {printFormat === 'thermal' ? (
            /* THERMAL POS RECEIPT LAYOUT (80mm) */
            <div
              id="printable-thermal-invoice"
              className="w-[360px] bg-white text-black p-5 rounded-lg shadow-lg border border-slate-200 font-mono text-xs leading-relaxed"
            >
              {/* Thermal Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
                {storeSettings.shopLogo && (
                  <img
                    src={storeSettings.shopLogo}
                    alt="Logo"
                    className="w-14 h-14 mx-auto rounded-full object-cover mb-1 grayscale contrast-125"
                  />
                )}
                <h2 className="font-bold text-sm uppercase tracking-wide">{storeSettings.storeName}</h2>
                <p className="text-[11px]">{storeSettings.address}</p>
                <p className="text-[11px]">Tel: {storeSettings.contactNumber}</p>
                <p className="text-[10px] text-slate-600">{storeSettings.email}</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="font-bold">{order.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SERVED BY:</span>
                  <span>{order.createdByName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{order.customerPhone}</span>
                </div>
                {customer && storeSettings.enableLoyaltyProgram && (
                  <div className="flex justify-between text-slate-700">
                    <span>LOYALTY POINTS:</span>
                    <span className="font-bold">{customer.loyaltyPoints} pts</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2.5 border-b border-dashed border-black">
                <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-black">
                  <span className="w-1/2">ITEM / SIZE</span>
                  <span className="w-1/4 text-center">QTY</span>
                  <span className="w-1/4 text-right">TOTAL</span>
                </div>
                <div className="space-y-1.5 pt-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <div className="w-1/2 pr-1">
                        <p className="font-semibold leading-tight">{item.productName}</p>
                        <p className="text-[10px] text-slate-600">[{item.size}] @ {storeSettings.currencySymbol}{item.unitPrice.toFixed(2)}</p>
                      </div>
                      <span className="w-1/4 text-center">{item.quantity}</span>
                      <span className="w-1/4 text-right font-medium">
                        {storeSettings.currencySymbol}{item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{storeSettings.currencySymbol}{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Discount:</span>
                    <span>-{storeSettings.currencySymbol}{order.discount.toFixed(2)}</span>
                  </div>
                )}
                {order.deliveryCharge && order.deliveryCharge > 0 && (
                  <div className="flex justify-between text-blue-700 font-medium">
                    <span>Delivery Charge:</span>
                    <span>+{storeSettings.currencySymbol}{order.deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax / VAT ({storeSettings.taxRate}%):</span>
                    <span>{storeSettings.currencySymbol}{order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                  <span>GRAND TOTAL:</span>
                  <span>{storeSettings.currencySymbol}{order.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Paid ({order.paymentMethod}):</span>
                  <span>{storeSettings.currencySymbol}{order.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Due Balance:</span>
                  <span>{storeSettings.currencySymbol}{order.dueAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>Status:</span>
                  <span className="uppercase font-bold tracking-wider px-1.5 py-0.5 bg-black text-white rounded text-[10px]">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Barcode & Signature */}
              <div className="pt-3 text-center space-y-2">
                <div className="flex justify-center">
                  <svg ref={barcodeRef} className="max-w-full" />
                </div>
                <p className="text-[10px] text-slate-700 italic px-2">
                  "{storeSettings.receiptNote}"
                </p>
                {storeSettings.digitalSignature && (
                  <div className="pt-2 border-t border-dotted border-slate-400 text-center">
                    <p className="text-[10px] font-serif italic">{storeSettings.digitalSignature}</p>
                    <p className="text-[9px] text-slate-500">Authorized Signature</p>
                  </div>
                )}
                <p className="text-[9px] text-slate-400">*** Thank you for shopping with us ***</p>
              </div>
            </div>
          ) : (
            /* STANDARD A4 CORPORATE INVOICE LAYOUT */
            <div
              id="printable-a4-invoice"
              className="w-[680px] bg-white text-slate-900 p-8 rounded-lg shadow-lg border border-slate-200 font-sans text-sm leading-relaxed"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  {storeSettings.shopLogo ? (
                    <img
                      src={storeSettings.shopLogo}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl">
                      {storeSettings.storeName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{storeSettings.storeName}</h1>
                    <p className="text-xs text-slate-500">{storeSettings.address}</p>
                    <p className="text-xs text-slate-500">Phone: {storeSettings.contactNumber} • {storeSettings.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full uppercase tracking-wider border border-blue-200">
                    TAX INVOICE
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2 font-mono">{order.invoiceNumber}</h3>
                  <p className="text-xs text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">Served by: {order.createdByName}</p>
                </div>
              </div>

              {/* Customer & Billing Info */}
              <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To:</h4>
                  <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                  <p className="text-slate-600 mt-0.5">{order.customerPhone}</p>
                  {customer?.address && <p className="text-slate-600">{customer.address}</p>}
                  {customer?.email && <p className="text-slate-600">{customer.email}</p>}
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        order.status === 'Paid' || order.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Due'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  {customer && storeSettings.enableLoyaltyProgram && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Customer Loyalty Points:</span>
                      <span className="font-bold text-indigo-600">{customer.loyaltyPoints} Points</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-6">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5">Barcode</th>
                      <th className="py-2.5">Size/Variant</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Unit Price</th>
                      <th className="py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">{item.productName}</td>
                        <td className="py-3 font-mono text-slate-500">{item.barcode}</td>
                        <td className="py-3 text-slate-600">{item.size}</td>
                        <td className="py-3 text-center font-medium">{item.quantity}</td>
                        <td className="py-3 text-right text-slate-600">
                          {storeSettings.currencySymbol}{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {storeSettings.currencySymbol}{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals & Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-slate-700 mb-1">Notes & Terms</h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {order.notes || storeSettings.receiptNote}
                    </p>
                  </div>
                  {/* Barcode representation */}
                  <div className="pt-2">
                    <svg ref={a4BarcodeRef} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{storeSettings.currencySymbol}{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Order Discount:</span>
                      <span className="font-semibold">-{storeSettings.currencySymbol}{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.deliveryCharge && order.deliveryCharge > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                      <span>Delivery Charge:</span>
                      <span className="font-semibold">+{storeSettings.currencySymbol}{order.deliveryCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Sales Tax ({storeSettings.taxRate}%):</span>
                      <span>{storeSettings.currencySymbol}{order.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>{storeSettings.currencySymbol}{order.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Amount Paid:</span>
                    <span>{storeSettings.currencySymbol}{order.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-rose-600">
                    <span>Balance Due:</span>
                    <span>{storeSettings.currencySymbol}{order.dueAmount.toFixed(2)}</span>
                  </div>

                  {storeSettings.digitalSignature && (
                    <div className="pt-8 text-right">
                      <p className="font-serif italic text-sm text-slate-800 border-b border-slate-300 pb-1 inline-block min-w-[140px] text-center">
                        {storeSettings.digitalSignature}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Authorized Official Signature</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            id="btn-print-preview-back-footer"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back_to_app || t.back || 'Back to App'}</span>
          </button>

          <div className="flex items-center flex-wrap gap-2">
            {/* Save as PDF Button */}
            <button
              id="btn-footer-save-pdf"
              onClick={handleSavePdf}
              disabled={isExportingPdf}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm active:scale-95 ${
                pdfDownloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-60`}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.downloading_pdf || 'Generating PDF...'}</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.pdf_saved || 'PDF Downloaded!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.save_pdf || 'Save as PDF'}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              id="btn-print-preview-print-footer"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{t.print_command || 'Print Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden container formatted purely for direct browser printing */}
      <div className="hidden print:block w-full">
        {printFormat === 'thermal' ? (
          <div className="w-[80mm] mx-auto text-black p-2 font-mono text-xs">
            <div className="text-center pb-2 border-b border-black">
              <h2 className="font-bold text-sm uppercase">{storeSettings.storeName}</h2>
              <p className="text-[10px]">{storeSettings.address}</p>
              <p className="text-[10px]">{storeSettings.contactNumber}</p>
            </div>
            <div className="py-2 border-b border-black text-[10px]">
              <p>INV: {order.invoiceNumber}</p>
              <p>DATE: {new Date(order.createdAt).toLocaleString()}</p>
              <p>CUST: {order.customerName}</p>
            </div>
            <div className="py-2 border-b border-black">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px] py-0.5">
                  <span>{item.productName} ({item.quantity}x)</span>
                  <span>{storeSettings.currencySymbol}{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="py-2 border-b border-black text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{storeSettings.currencySymbol}{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs">
                <span>TOTAL:</span>
                <span>{storeSettings.currencySymbol}{order.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>PAID:</span>
                <span>{storeSettings.currencySymbol}{order.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>DUE:</span>
                <span>{storeSettings.currencySymbol}{order.dueAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-2 text-center text-[9px]">
              <p>{storeSettings.receiptNote}</p>
              <p className="mt-1">Authorized: {storeSettings.digitalSignature}</p>
            </div>
          </div>
        ) : (
          <div className="w-full text-black p-6 font-sans text-xs">
            {/* Same A4 format with clean print styling */}
            <div className="flex justify-between border-b pb-4">
              <div>
                <h1 className="text-lg font-bold">{storeSettings.storeName}</h1>
                <p>{storeSettings.address}</p>
                <p>{storeSettings.contactNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold font-mono">{order.invoiceNumber}</h2>
                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="my-4">
              <p className="font-bold">Billed To: {order.customerName} ({order.customerPhone})</p>
            </div>
            <table className="w-full my-4 text-left border-collapse">
              <thead>
                <tr className="border-b font-bold">
                  <th className="py-1">Item</th>
                  <th className="py-1">Size</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1">{item.productName}</td>
                    <td className="py-1">{item.size}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">{storeSettings.currencySymbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="py-1 text-right font-bold">{storeSettings.currencySymbol}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1">
              <p>Grand Total: <b>{storeSettings.currencySymbol}{order.grandTotal.toFixed(2)}</b></p>
              <p>Paid: {storeSettings.currencySymbol}{order.paidAmount.toFixed(2)}</p>
              <p>Due: {storeSettings.currencySymbol}{order.dueAmount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
