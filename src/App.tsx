import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { UserStorageProvider } from './context/UserStorageContext';
import { Product, Order, Customer } from './types';
import { translations, SupportedLang } from './utils/translations';
import { SUPPORTED_CURRENCIES } from './utils/currencies';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { OrdersView } from './views/OrdersView';
import { CustomersView } from './views/CustomersView';
import { StoreSettingsView } from './views/StoreSettingsView';
import { AccountSettingsView } from './views/AccountSettingsView';
import { UserStorageView } from './views/UserStorageView';
import { ReturnsView } from './views/ReturnsView';
import { CreateOrderModal } from './components/CreateOrderModal';
import { ProductModal } from './components/ProductModal';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CustomerProfile360Modal } from './components/CustomerProfile360Modal';
import { ProcessReturnModal } from './components/ProcessReturnModal';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  RotateCcw,
  Users,
  Store,
  UserCheck,
  FolderLock,
  Plus,
  Camera,
  Sun,
  Moon,
  Globe,
  Bell,
  LogOut,
  Layers,
  ChevronRight,
  Shield,
  Search,
  Menu,
  X
} from 'lucide-react';

const MainApplication: React.FC = () => {
  const { currentUser, logout, canEditStock } = useAuth();
  const { products, storeSettings, updateStoreSettings } = useData();

  const handleCurrencyChange = (code: string) => {
    const selected = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (selected) {
      updateStoreSettings({
        currencyCode: selected.code,
        currencySymbol: selected.symbol,
      });
    }
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'returns' | 'customers' | 'files' | 'settings' | 'account'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme & Localization State
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('omnistock_theme') === 'dark' || true; // default dark/modern
  });
  const [currentLang, setCurrentLang] = useState<SupportedLang>('en');

  // Modal States
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<Customer | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const [isProcessReturnOpen, setIsProcessReturnOpen] = useState(false);
  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);

  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<Customer | null>(null);

  // Sync Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('omnistock_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('omnistock_theme', 'light');
    }
  }, [isDark]);

  const t = translations[currentLang] || translations.en;

  if (!currentUser) {
    return <LoginScreen currentLang={currentLang} />;
  }

  // Low stock counter
  const lowStockCount = products.filter(
    (p) => p.quantity <= (p.minStockThreshold || storeSettings.lowStockAlertThreshold)
  ).length;

  const handleOpenNewOrder = (cust?: Customer) => {
    setEditingOrder(null);
    setPreselectedCustomer(cust || null);
    setIsCreateOrderOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setPreselectedCustomer(null);
    setIsCreateOrderOpen(true);
  };

  const handleProcessReturn = (order?: Order) => {
    setReturnTargetOrder(order || null);
    setIsProcessReturnOpen(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handlePrintOrder = (order: Order) => {
    setPrintingOrder(order);
    setIsPrintModalOpen(true);
  };

  const handleBarcodeScanned = (code: string) => {
    // Check if item exists
    const match = products.find((p) => p.barcode.toLowerCase() === code.toLowerCase());
    if (match) {
      alert(`Scanned: ${match.name} (${match.size}) - Stock: ${match.quantity} units - Price: ${storeSettings.currencySymbol}${match.sellingPrice}`);
    } else {
      alert(`Barcode ${code} not found in inventory. You can add it as a new product.`);
    }
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.inventory, icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'orders', label: t.orders, icon: ShoppingBag },
    { id: 'returns', label: t.returns_management || 'Returns', icon: RotateCcw },
    { id: 'customers', label: t.customers, icon: Users },
    { id: 'files', label: t.user_files || 'Files & Vault', icon: FolderLock },
    { id: 'settings', label: t.settings, icon: Store },
    { id: 'account', label: t.account_settings, icon: UserCheck },
  ];

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200`}>
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shrink-0 select-none z-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
              {storeSettings.storeName}
            </h1>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              v2.5 • Enterprise POS
            </span>
          </div>
        </div>

        {/* User Identity Chip */}
        <div className="p-4 mx-3 my-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-xl object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block truncate">
                {currentUser.role === 'admin' ? 'Store Admin' : 'Sub-Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Launch POS Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => handleOpenNewOrder()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t.pos_terminal}
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {storeSettings.storeName}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          {/* Controls: Quick POS, Scanner, Language, Theme, Logout */}
          <div className="flex items-center gap-2">
            {/* Quick POS Trigger */}
            <button
              onClick={() => handleOpenNewOrder()}
              className="hidden sm:flex px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> POS Terminal
            </button>

            {/* Quick Barcode Scanner Button */}
            <button
              onClick={() => setIsBarcodeScannerOpen(true)}
              title="Open Barcode Scanner (Camera & Hardware)"
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
            >
              <Camera className="w-4 h-4 text-blue-500" />
            </button>

            {/* Multi-language Selector */}
            <div className="relative flex items-center">
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as SupportedLang)}
                className="pl-2 pr-6 py-1.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="en">🇺🇸 EN</option>
                <option value="es">🇪🇸 ES</option>
                <option value="bn">🇧🇩 BN</option>
                <option value="hi">🇮🇳 HI</option>
                <option value="ar">🇦🇪 AR</option>
              </select>
            </div>

            {/* Quick Currency Selector */}
            <div className="relative flex items-center">
              <select
                value={storeSettings.currencyCode || 'BDT'}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                title="Change Currency"
                className="pl-2 pr-6 py-1.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.flag} {curr.symbol} {curr.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title="Toggle Theme"
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer (when open) */}
        {isMobileMenuOpen && (
          <div className="md:hidden p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-1 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewOrder={() => handleOpenNewOrder()}
              onOpenRestockModal={() => setActiveTab('inventory')}
              onPrintOrder={handlePrintOrder}
              onOpenCustomerProfile={(cust) => setSelectedCustomerProfile(cust)}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
              onQuickRestock={handleEditProduct}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              onOpenNewOrder={() => handleOpenNewOrder()}
              onPrintOrder={handlePrintOrder}
              onViewOrderDetails={handlePrintOrder}
              onEditOrder={handleEditOrder}
              onProcessReturn={handleProcessReturn}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'returns' && (
            <ReturnsView
              onOpenProcessReturn={() => handleProcessReturn()}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              onOpenCustomerProfile={(cust) => setSelectedCustomerProfile(cust)}
              onCreateOrderForCustomer={(cust) => handleOpenNewOrder(cust)}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'files' && <UserStorageView currentLang={currentLang} />}

          {activeTab === 'settings' && <StoreSettingsView currentLang={currentLang} />}

          {activeTab === 'account' && <AccountSettingsView currentLang={currentLang} />}
        </main>
      </div>

      {/* Global Modals */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        editOrder={editingOrder}
        onClose={() => {
          setIsCreateOrderOpen(false);
          setEditingOrder(null);
          setPreselectedCustomer(null);
        }}
        preselectedCustomer={preselectedCustomer}
        onOrderCreated={(order) => {
          setIsCreateOrderOpen(false);
          setEditingOrder(null);
          handlePrintOrder(order);
        }}
      />

      <ProcessReturnModal
        isOpen={isProcessReturnOpen}
        onClose={() => {
          setIsProcessReturnOpen(false);
          setReturnTargetOrder(null);
        }}
        initialOrder={returnTargetOrder}
        currentLang={currentLang}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        order={printingOrder}
        currentLang={currentLang}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintingOrder(null);
        }}
      />

      <CustomerProfile360Modal
        isOpen={Boolean(selectedCustomerProfile)}
        customer={selectedCustomerProfile}
        onClose={() => setSelectedCustomerProfile(null)}
        onCreateOrder={(cust) => {
          setSelectedCustomerProfile(null);
          handleOpenNewOrder(cust);
        }}
        onPrintOrder={handlePrintOrder}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <UserStorageProvider>
          <MainApplication />
        </UserStorageProvider>
      </DataProvider>
    </AuthProvider>
  );
}
