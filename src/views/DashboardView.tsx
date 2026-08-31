import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Order, Customer, TimeFilter, OrderStatus } from '../types';
import { translations } from '../utils/translations';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Clock,
  Printer,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  ChevronDown,
  Layers,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardViewProps {
  onOpenNewOrder: () => void;
  onOpenRestockModal: (prodId?: string) => void;
  onPrintOrder: (order: Order) => void;
  onOpenCustomerProfile: (customer: Customer) => void;
  onNavigateToTab: (tab: string) => void;
  currentLang: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewOrder,
  onOpenRestockModal,
  onPrintOrder,
  onOpenCustomerProfile,
  onNavigateToTab,
  currentLang,
}) => {
  const {
    products,
    customers,
    orders,
    kpis,
    storeSettings,
    inventoryValuation,
    getFilteredSalesData,
    updateOrderStatus,
  } = useData();

  const { canViewFinancialAnalytics, canViewBuyingPrice } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const t = translations[currentLang as keyof typeof translations] || translations.en;
  const salesChartData = getFilteredSalesData(timeFilter);

  // Low stock products
  const lowStockProducts = products.filter(
    (p) => p.quantity <= (p.minStockThreshold || storeSettings.lowStockAlertThreshold)
  );

  const recentOrders = orders.slice(0, 6);
  const recentCustomers = customers.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                {t.low_stock_warning}: <span className="text-rose-600 dark:text-rose-400">{lowStockProducts.length}</span> {t.products_low_stock}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Critical items: {lowStockProducts.map((p) => `${p.name} (${p.quantity} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('inventory')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
          >
            {t.restock_now}
          </button>
        </div>
      )}

      {/* 2. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.total_revenue}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {storeSettings.currencySymbol}{kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.8% <span className="text-slate-400 font-normal">vs last cycle</span>
            </div>
          </div>
        </div>

        {/* Total Sales Count */}
        <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.total_sales}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {kpis.totalSalesCount} <span className="text-xs font-normal text-slate-500">Invoices</span>
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100% Processed
            </div>
          </div>
        </div>

        {/* Net Profit / Margin (Admin Only, or Total Stock value for sub-account) */}
        <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {canViewFinancialAnalytics() ? t.net_profit : 'Active Inventory Items'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {canViewFinancialAnalytics() ? (
              <>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {storeSettings.currencySymbol}{kpis.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> High Margin Ratio (48%)
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {inventoryValuation.totalUnits} <span className="text-xs font-normal text-slate-500">Units in Stock</span>
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  {products.length} distinct product categories
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total Due Amount */}
        <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.total_due}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {storeSettings.currencySymbol}{kpis.totalDueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              Recoverable outstanding balance
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Analytics Graph with Time Filters */}
      <div className="p-6 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t.sales_analytics}
            </h3>
            <p className="text-xs text-slate-500">
              Track revenue velocity, profit performance, and daily transaction turnover
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart type toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Area Trend
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Volume Bar
              </button>
            </div>

            {/* Time filter dropdown */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="pl-3 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="daily">Daily (Last 7 Days)</option>
                <option value="weekly">Weekly (Last 4 Weeks)</option>
                <option value="monthly">Monthly (Recent Months)</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last 1 Year</option>
                <option value="lifetime">Lifetime History</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Recharts Render */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [`${storeSettings.currencySymbol}${Number(value).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Profit']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                  name="Revenue"
                />
                {canViewFinancialAnalytics() && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                    name="Net Profit"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Revenue ($)" />
                {canViewFinancialAnalytics() && (
                  <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} name="Net Profit ($)" />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Activity: Orders & Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (8 cols) */}
        <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t.recent_orders}
              </h3>
              <p className="text-xs text-slate-500">
                Quick invoice status changer, instant print command & customer 360 lookup
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {t.view_all} <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">{t.order_id}</th>
                  <th className="pb-3">{t.customer}</th>
                  <th className="pb-3">{t.amount}</th>
                  <th className="pb-3">{t.status}</th>
                  <th className="pb-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((ord) => {
                  const cust = customers.find((c) => c.id === ord.customerId);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ord.invoiceNumber}
                        <div className="text-[10px] font-normal text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5">
                        <button
                          onClick={() => cust && onOpenCustomerProfile(cust)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {ord.customerName}
                        </button>
                        <div className="text-[10px] text-slate-500">{ord.customerPhone}</div>
                      </td>

                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {storeSettings.currencySymbol}{ord.grandTotal.toFixed(2)}
                        </div>
                        {ord.dueAmount > 0 ? (
                          <span className="text-[10px] text-rose-500 font-semibold">
                            Due: {storeSettings.currencySymbol}{ord.dueAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">Full Paid</span>
                        )}
                      </td>

                      <td className="py-3.5">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
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

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintOrder(ord)}
                            title="Print Invoice / Thermal Receipt"
                            className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customers CRM Widget (4 cols) */}
        <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t.recent_customers}
              </h3>
              <button
                onClick={() => onNavigateToTab('customers')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.view_all}
              </button>
            </div>

            <div className="space-y-3">
              {recentCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => onOpenCustomerProfile(cust)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      {cust.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {cust.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">{cust.phone}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {storeSettings.currencySymbol}{cust.lifetimeSpend.toFixed(0)}
                    </div>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5 justify-end">
                      <Award className="w-3 h-3" /> {cust.loyaltyPoints} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 mt-4"
          >
            <Plus className="w-4 h-4" /> {t.pos_terminal}
          </button>
        </div>
      </div>
    </div>
  );
};
