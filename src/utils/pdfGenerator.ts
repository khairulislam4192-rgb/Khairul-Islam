import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Order, StoreSettings, Customer } from '../types';

/**
 * Creates a barcode image data URL using an offscreen canvas
 */
function createBarcodeDataUrl(text: string, width = 2, height = 38): string {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width,
      height,
      displayValue: true,
      fontSize: 11,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to create barcode data URL for PDF:', err);
    return '';
  }
}

/**
 * Safely format price for PDF vector text rendering
 */
function formatPdfPrice(amount: number, symbol: string, code?: string): string {
  const numStr = amount.toFixed(2);
  // If symbol is non-ASCII (e.g. ৳, ₹, د.إ), prefer ISO code for standard PDF font compatibility
  const isAscii = /^[\x00-\x7F]*$/.test(symbol);
  const prefix = isAscii ? symbol : (code || symbol);
  return `${prefix}${numStr}`;
}

/**
 * Generates an 80mm POS Thermal Receipt PDF
 */
export async function generateThermalReceiptPdf(
  order: Order,
  storeSettings: StoreSettings,
  customer?: Customer | null
): Promise<void> {
  const margin = 5;
  const pageWidth = 80;
  
  // Calculate dynamic receipt height based on item count
  const estimatedHeight = Math.max(140, 100 + (order.items.length * 9) + (storeSettings.receiptNote ? 20 : 0));
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, estimatedHeight],
  });

  let y = 8;

  // Header - Store Name
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(storeSettings.storeName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  if (storeSettings.address) {
    doc.text(storeSettings.address, pageWidth / 2, y, { align: 'center', maxWidth: 70 });
    y += 3.5;
  }
  if (storeSettings.contactNumber) {
    doc.text(`Tel: ${storeSettings.contactNumber}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (storeSettings.email) {
    doc.text(storeSettings.email, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }

  // Divider Line
  y += 1;
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Order Details
  doc.setFontSize(7.5);
  doc.text(`INVOICE: ${order.invoiceNumber}`, margin, y);
  y += 3.5;
  doc.text(`DATE: ${new Date(order.createdAt).toLocaleString()}`, margin, y);
  y += 3.5;
  doc.text(`SERVED BY: ${order.createdByName || 'Staff'}`, margin, y);
  y += 3.5;
  doc.text(`CUSTOMER: ${order.customerName}`, margin, y);
  y += 3.5;
  doc.text(`PHONE: ${order.customerPhone || 'N/A'}`, margin, y);
  y += 3.5;

  if (customer && storeSettings.enableLoyaltyProgram) {
    doc.text(`LOYALTY PTS: ${customer.loyaltyPoints} pts`, margin, y);
    y += 3.5;
  }

  // Divider Line
  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // Items Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.text('ITEM / SIZE', margin, y);
  doc.text('QTY', 52, y, { align: 'center' });
  doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });
  y += 3;

  doc.setLineDashPattern([], 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // Items List
  doc.setFont('courier', 'normal');
  order.items.forEach((item) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(item.productName.slice(0, 24), margin, y);
    y += 3;

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    const priceText = formatPdfPrice(item.unitPrice, storeSettings.currencySymbol, storeSettings.currencyCode);
    doc.text(`[${item.size}] @ ${priceText}`, margin, y);
    doc.text(`${item.quantity}`, 52, y, { align: 'center' });
    
    const lineTotal = formatPdfPrice(item.total, storeSettings.currencySymbol, storeSettings.currencyCode);
    doc.text(lineTotal, pageWidth - margin, y, { align: 'right' });
    y += 3.5;
  });

  // Divider Line
  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Financial Totals
  doc.setFontSize(7.5);
  const curSym = storeSettings.currencySymbol;
  const curCode = storeSettings.currencyCode;

  // Subtotal
  doc.text('Subtotal:', margin, y);
  doc.text(formatPdfPrice(order.subtotal, curSym, curCode), pageWidth - margin, y, { align: 'right' });
  y += 3.5;

  if (order.discount > 0) {
    doc.text('Discount:', margin, y);
    doc.text(`-${formatPdfPrice(order.discount, curSym, curCode)}`, pageWidth - margin, y, { align: 'right' });
    y += 3.5;
  }

  if (order.deliveryCharge && order.deliveryCharge > 0) {
    doc.text('Delivery Charge:', margin, y);
    doc.text(`+${formatPdfPrice(order.deliveryCharge, curSym, curCode)}`, pageWidth - margin, y, { align: 'right' });
    y += 3.5;
  }

  if (order.tax > 0) {
    doc.text(`Tax (${storeSettings.taxRate}%):`, margin, y);
    doc.text(formatPdfPrice(order.tax, curSym, curCode), pageWidth - margin, y, { align: 'right' });
    y += 3.5;
  }

  // Grand Total (Bold)
  y += 1;
  doc.setLineDashPattern([], 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('GRAND TOTAL:', margin, y);
  doc.text(formatPdfPrice(order.grandTotal, curSym, curCode), pageWidth - margin, y, { align: 'right' });
  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Paid (${order.paymentMethod}):`, margin, y);
  doc.text(formatPdfPrice(order.paidAmount, curSym, curCode), pageWidth - margin, y, { align: 'right' });
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.text('Due Balance:', margin, y);
  doc.text(formatPdfPrice(order.dueAmount, curSym, curCode), pageWidth - margin, y, { align: 'right' });
  y += 3.5;

  doc.text(`Status: [${order.status.toUpperCase()}]`, margin, y);
  y += 5;

  // Barcode Image
  const barcodeUrl = createBarcodeDataUrl(order.invoiceNumber, 1.8, 30);
  if (barcodeUrl) {
    const barcodeWidth = 48;
    const barcodeHeight = 16;
    doc.addImage(barcodeUrl, 'PNG', (pageWidth - barcodeWidth) / 2, y, barcodeWidth, barcodeHeight);
    y += barcodeHeight + 3;
  }

  // Footer Note
  if (storeSettings.receiptNote) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.text(`"${storeSettings.receiptNote}"`, pageWidth / 2, y, { align: 'center', maxWidth: 68 });
    y += 4;
  }

  if (storeSettings.digitalSignature) {
    doc.setFont('courier', 'italic');
    doc.setFontSize(7);
    doc.text(storeSettings.digitalSignature, pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.text('Authorized Official Signature', pageWidth / 2, y, { align: 'center' });
    y += 3;
  }

  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.text('*** Thank you for your business ***', pageWidth / 2, y, { align: 'center' });

  // Save PDF
  doc.save(`Receipt-${order.invoiceNumber}.pdf`);
}

/**
 * Generates a Standard Corporate A4 Invoice PDF
 */
export async function generateA4InvoicePdf(
  order: Order,
  storeSettings: StoreSettings,
  customer?: Customer | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const curSym = storeSettings.currencySymbol;
  const curCode = storeSettings.currencyCode;

  // Header Banner Background Bar
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.rect(margin, y - 4, contentWidth, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y - 4, contentWidth, 28, 'S');

  // Store Brand Name & Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text(storeSettings.storeName, margin + 4, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(`${storeSettings.address || ''} • Tel: ${storeSettings.contactNumber || ''}`, margin + 4, y + 10);
  doc.text(`Email: ${storeSettings.email || ''}`, margin + 4, y + 15);

  // Top Right: TAX INVOICE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235); // #2563eb
  doc.text('TAX INVOICE', pageWidth - margin - 4, y + 3, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(order.invoiceNumber, pageWidth - margin - 4, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - margin - 4, y + 14, { align: 'right' });
  doc.text(`Served by: ${order.createdByName || 'Admin'}`, pageWidth - margin - 4, y + 18, { align: 'right' });

  y += 32;

  // Billed To & Payment Box Grid
  const colWidth = (contentWidth - 6) / 2;

  // Billed To Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, colWidth, 28, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('BILLED TO:', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(order.customerName, margin + 4, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${order.customerPhone || 'N/A'}`, margin + 4, y + 16);
  if (customer?.address) {
    doc.text(`Address: ${customer.address}`, margin + 4, y + 21, { maxWidth: colWidth - 8 });
  }

  // Payment Status Box
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.rect(col2X, y, colWidth, 28, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('PAYMENT DETAILS:', col2X + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Method: ${order.paymentMethod}`, col2X + 4, y + 12);
  doc.text(`Status: ${order.status.toUpperCase()}`, col2X + 4, y + 17);

  if (customer && storeSettings.enableLoyaltyProgram) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(`Loyalty Points: ${customer.loyaltyPoints} pts`, col2X + 4, y + 22);
  }

  y += 34;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 8, margin + contentWidth, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('DESCRIPTION', margin + 3, y + 5.5);
  doc.text('BARCODE', margin + 70, y + 5.5);
  doc.text('SIZE/VARIANT', margin + 105, y + 5.5);
  doc.text('QTY', margin + 135, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', margin + 155, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', margin + contentWidth - 3, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  order.items.forEach((item, index) => {
    const rowHeight = 8;
    
    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.productName.slice(0, 32), margin + 3, y + 5.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.barcode, margin + 70, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.text(item.size || '-', margin + 105, y + 5.5);
    doc.text(`${item.quantity}`, margin + 135, y + 5.5, { align: 'center' });

    doc.text(formatPdfPrice(item.unitPrice, curSym, curCode), margin + 155, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatPdfPrice(item.total, curSym, curCode), margin + contentWidth - 3, y + 5.5, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    y += rowHeight;
  });

  y += 4;

  // Bottom Summary Section
  const summaryY = y;
  const leftColWidth = contentWidth * 0.52;
  const rightColX = margin + leftColWidth + 5;
  const rightColWidth = contentWidth - leftColWidth - 5;

  // Left side: Barcode and Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('NOTES & TERMS', margin, summaryY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const noteText = order.notes || storeSettings.receiptNote || 'Goods once sold are exchangeable within 7 days with original receipt.';
  doc.text(noteText, margin, summaryY + 9, { maxWidth: leftColWidth - 4 });

  const barcodeUrl = createBarcodeDataUrl(order.invoiceNumber, 1.8, 32);
  if (barcodeUrl) {
    doc.addImage(barcodeUrl, 'PNG', margin, summaryY + 16, 52, 16);
  }

  // Right side: Financial Totals Box
  let finY = summaryY + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', rightColX, finY);
  doc.text(formatPdfPrice(order.subtotal, curSym, curCode), margin + contentWidth, finY, { align: 'right' });
  finY += 5;

  if (order.discount > 0) {
    doc.setTextColor(16, 185, 129); // emerald
    doc.text('Order Discount:', rightColX, finY);
    doc.text(`-${formatPdfPrice(order.discount, curSym, curCode)}`, margin + contentWidth, finY, { align: 'right' });
    finY += 5;
  }

  if (order.deliveryCharge && order.deliveryCharge > 0) {
    doc.setTextColor(37, 99, 235); // blue
    doc.text('Delivery Charge:', rightColX, finY);
    doc.text(`+${formatPdfPrice(order.deliveryCharge, curSym, curCode)}`, margin + contentWidth, finY, { align: 'right' });
    finY += 5;
  }

  if (order.tax > 0) {
    doc.setTextColor(71, 85, 105);
    doc.text(`Sales Tax (${storeSettings.taxRate}%):`, rightColX, finY);
    doc.text(formatPdfPrice(order.tax, curSym, curCode), margin + contentWidth, finY, { align: 'right' });
    finY += 5;
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(rightColX, finY, margin + contentWidth, finY);
  finY += 5;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', rightColX, finY);
  doc.text(formatPdfPrice(order.grandTotal, curSym, curCode), margin + contentWidth, finY, { align: 'right' });
  finY += 6;

  // Amount Paid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Amount Paid:', rightColX, finY);
  doc.text(formatPdfPrice(order.paidAmount, curSym, curCode), margin + contentWidth, finY, { align: 'right' });
  finY += 5;

  // Balance Due
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('Balance Due:', rightColX, finY);
  doc.text(formatPdfPrice(order.dueAmount, curSym, curCode), margin + contentWidth, finY, { align: 'right' });
  finY += 8;

  // Authorized Signature
  if (storeSettings.digitalSignature) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(storeSettings.digitalSignature, margin + contentWidth - 4, finY + 4, { align: 'right' });

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + contentWidth - 48, finY + 6, margin + contentWidth, finY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Authorized Official Signature', margin + contentWidth - 4, finY + 10, { align: 'right' });
  }

  // Save PDF
  doc.save(`Invoice-${order.invoiceNumber}.pdf`);
}
