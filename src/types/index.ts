export type UserRole = 'admin' | 'sub_account';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  parentAdminId?: string; // For sub-accounts
  parentAdminName?: string;
  createdAt: string;
  avatar?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  userId?: string;
  name: string;
  category: string;
  barcode: string;
  buyingPrice: number; // Hidden for sub-accounts
  sellingPrice: number;
  size: string;
  quantity: number;
  minStockThreshold: number;
  image?: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  barcode: string;
  size: string;
  buyingPrice: number; // for profit calculations
  unitPrice: number;
  quantity: number;
  total: number;
}

export type OrderStatus = 'Due' | 'Paid' | 'Delivered' | 'Pending';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Mobile Banking' | 'Store Credit';

export interface Order {
  id: string;
  userId?: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge?: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  barcode: string;
  size: string;
  unitPrice: number;
  quantity: number;
  refundAmount: number;
  restocked: boolean;
}

export type ReturnReason = 'Defective / Damaged' | 'Size Mismatch' | 'Wrong Item Sent' | 'Customer Changed Mind' | 'Quality Not as Expected' | 'Other' | string;

export type ProductReturn = ReturnRecord;

export interface ReturnRecord {
  id: string;
  userId?: string;
  returnNumber: string;
  orderId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  restockedToInventory: boolean;
  reason: string; // 'Defective / Damaged' | 'Wrong Item/Size' | 'Customer Mind Change' | 'Exchange' | 'Other'
  condition?: string; // 'Brand New / Resellable' | 'Damaged / Opened' | 'Defective'
  status: 'Completed' | 'Pending';
  notes?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  lifetimeSpend: number;
  totalOrdersCount: number;
  createdAt: string;
  notes?: string;
}

export interface StoreSettings {
  userId?: string;
  storeName: string;
  contactNumber: string;
  email: string;
  address: string;
  ownerName: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number; // percentage e.g. 5%
  receiptNote: string;
  shopLogo?: string;
  digitalSignature?: string;
  lowStockAlertThreshold: number;
  invoiceFormat: 'thermal' | 'a4';
  enableLoyaltyProgram: boolean;
  loyaltyRate: number; // points per $10 spent
}

export interface UserFile {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  name: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  category: 'document' | 'image' | 'invoice' | 'receipt' | 'backup' | 'other';
  downloadUrl: string; // Base64 data URL or remote storage URL
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  tags?: string[];
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | '6months' | '1year' | 'lifetime';

export type LanguageCode = 'en' | 'es' | 'bn' | 'hi' | 'ar';
