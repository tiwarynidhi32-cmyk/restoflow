/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  AlertTriangle, 
  CreditCard, 
  History, 
  TrendingUp, 
  ChefHat,
  Table as TableIcon,
  Store,
  ChevronRight,
  ShoppingCart,
  DollarSign,
  FileText,
  Camera,
  Upload,
  Edit,
  Trash2,
  Printer,
  Eye,
  Droplets,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Branch, InventoryItem, Vendor, Table, MenuCategory, MenuItem, LedgerEntry, Reservation } from './types';

// --- Helpers ---

const safeFetchJson = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP error! status: ${res.status}`);
      return data;
    } else {
      const text = await res.text();
      console.error('Expected JSON but got:', text.substring(0, 100));
      throw new Error(`Server returned non-JSON response (${res.status})`);
    }
  } catch (err: any) {
    console.error(`Fetch error for ${url}:`, err);
    throw err;
  }
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const variants: any = {
    primary: 'bg-black text-white hover:bg-zinc-800',
    secondary: 'bg-white text-black border border-zinc-200 hover:bg-zinc-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-zinc-600 hover:bg-zinc-100'
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</label>}
    <input 
      {...props} 
      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
    />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</label>}
    <select 
      {...props} 
      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const QuickLoginButton = ({ icon, label, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`${color} text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg group`}
  >
    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
      {icon}
    </div>
    <span className="font-bold text-[10px] tracking-wide uppercase">{label}</span>
  </button>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [view, setView] = useState('dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [todayStats, setTodayStats] = useState({ cash: 0, bank: 0, total: 0 });
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') setView('branches');
      else if (user.username === 'kot') setView('kitchen');
      else if (user.username === 'staff' || user.username === 'waiter') setView('pos');
      else setView('dashboard');
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [view]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'super_admin') {
        const [bData, uData] = await Promise.all([
          safeFetchJson('/api/branches'),
          safeFetchJson('/api/users-all')
        ]);
        setBranches(bData);
        setUsers(uData);
      } else if (user.branch_id) {
        const bId = user.branch_id;
        const [inv, vend, tabs, cats, items, led, stats, uData, orders, resData] = await Promise.all([
          safeFetchJson(`/api/inventory/${bId}`),
          safeFetchJson(`/api/vendors/${bId}`),
          safeFetchJson(`/api/tables/${bId}`),
          safeFetchJson(`/api/menu-categories/${bId}`),
          safeFetchJson(`/api/menu-items/${bId}`),
          safeFetchJson(`/api/ledger/${bId}`),
          safeFetchJson(`/api/reports/today/${bId}`),
          safeFetchJson(`/api/users/${bId}`),
          safeFetchJson(`/api/orders/${bId}`),
          safeFetchJson(`/api/reservations/${bId}`),
        ]);
        setInventory(inv);
        setVendors(vend);
        setTables(tabs);
        setMenuCategories(cats);
        setMenuItems(items);
        setLedger(led);
        setTodayStats(stats);
        setUsers(uData);
        setActiveOrders(orders);
        setReservations(resData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username: string, password: string) => {
    try {
      const userData = await safeFetchJson('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      setUser(userData);
    } catch (err: any) {
      alert(err.message || 'Login failed');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="p-8 md:p-12">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <Utensils className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">RestoFlow POS</h1>
              <p className="text-zinc-500 text-sm font-medium mt-1">Select your role or login directly</p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-10">
              <QuickLoginButton 
                icon={<Settings size={20} />} 
                label="Admin" 
                onClick={() => setLoginForm({ ...loginForm, username: 'DC' })}
                color="bg-zinc-900"
              />
              <QuickLoginButton 
                icon={<Store size={20} />} 
                label="Branch" 
                onClick={() => setLoginForm({ ...loginForm, username: 'branch' })}
                color="bg-indigo-600"
              />
              <QuickLoginButton 
                icon={<ChefHat size={20} />} 
                label="Kitchen" 
                onClick={() => setLoginForm({ ...loginForm, username: 'kot' })}
                color="bg-orange-600"
              />
              <QuickLoginButton 
                icon={<Droplets size={20} />} 
                label="Waiter" 
                onClick={() => setLoginForm({ ...loginForm, username: 'waiter' })}
                color="bg-blue-600"
              />
              <QuickLoginButton 
                icon={<Users size={20} />} 
                label="Staff" 
                onClick={() => setLoginForm({ ...loginForm, username: 'staff' })}
                color="bg-emerald-600"
              />
              <QuickLoginButton 
                icon={<Store size={20} />} 
                label="Cafe" 
                onClick={() => setLoginForm({ ...loginForm, username: 'downtown_admin' })}
                color="bg-purple-600"
              />
            </div>

            <div className="max-w-sm mx-auto">
              <form 
                onSubmit={(e: any) => {
                  e.preventDefault();
                  handleQuickLogin(loginForm.username, loginForm.password);
                }}
                className="space-y-4"
              >
                <Input 
                  label="User ID" 
                  value={loginForm.username}
                  onChange={(e: any) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter your ID" 
                  required 
                />
                <Input 
                  label="Password" 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e: any) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="•••••" 
                  required 
                />
                <Button type="submit" className="w-full py-3">
                  Login to Panel
                </Button>
              </form>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                Developed by <span className="bg-black text-white px-2 py-0.5 rounded ml-1">Digital Communique</span>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex print:bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col print:hidden">
        <div className="p-6 border-bottom border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Utensils className="text-white w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight">RestoFlow</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {user.role === 'super_admin' ? (
            <>
              <NavItem icon={<Store size={18} />} label="Manage Restaurants" active={view === 'branches'} onClick={() => setView('branches')} />
              <NavItem icon={<Users size={18} />} label="All Staff & Passwords" active={view === 'staff'} onClick={() => setView('staff')} />
            </>
          ) : user.username === 'kot' ? (
            <>
              <NavItem icon={<ChefHat size={18} />} label="Kitchen View" active={view === 'kitchen'} onClick={() => setView('kitchen')} />
            </>
          ) : (user.username === 'staff' || user.username === 'waiter') ? (
            <>
              <NavItem icon={<ShoppingCart size={18} />} label="Billing POS" active={view === 'pos'} onClick={() => setView('pos')} />
              <NavItem icon={<FileText size={18} />} label="Active Orders / Bill" active={view === 'active_orders'} onClick={() => setView('active_orders')} />
            </>
          ) : (
            <>
              <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
              <NavItem icon={<ShoppingCart size={18} />} label="Billing POS" active={view === 'pos'} onClick={() => setView('pos')} />
              <NavItem icon={<ChefHat size={18} />} label="Kitchen View" active={view === 'kitchen'} onClick={() => setView('kitchen')} />
              <NavItem icon={<FileText size={18} />} label="Active Orders / Bill" active={view === 'active_orders'} onClick={() => setView('active_orders')} />
              <NavItem icon={<Package size={18} />} label="Inventory" active={view === 'inventory'} onClick={() => setView('inventory')} />
              <NavItem icon={<ChefHat size={18} />} label="Menu" active={view === 'menu'} onClick={() => setView('menu')} />
              <NavItem icon={<TableIcon size={18} />} label="Tables" active={view === 'tables'} onClick={() => setView('tables')} />
              <NavItem icon={<Calendar size={18} />} label="Reservations" active={view === 'reservations'} onClick={() => setView('reservations')} />
              <NavItem icon={<Users size={18} />} label="Vendors" active={view === 'vendors'} onClick={() => setView('vendors')} />
              <NavItem icon={<Users size={18} />} label="Staff Management" active={view === 'staff'} onClick={() => setView('staff')} />
              <NavItem icon={<FileText size={18} />} label="Reports" active={view === 'reports'} onClick={() => setView('reports')} />
              <NavItem icon={<Settings size={18} />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-zinc-500 truncate capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={() => setUser(null)}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dashboard' && <DashboardView stats={todayStats} ledger={ledger} inventory={inventory} />}
            {view === 'branches' && <BranchesView branches={branches} onRefresh={fetchData} />}
            {view === 'staff' && <StaffView users={users} branches={branches} currentUser={user} onRefresh={fetchData} />}
            {view === 'kitchen' && <KitchenView orders={activeOrders} onRefresh={fetchData} />}
            {view === 'active_orders' && (
              <ActiveOrdersView 
                orders={activeOrders} 
                branch={branches.find(b => b.id === user.branch_id)} 
                onRefresh={fetchData} 
              />
            )}
            {view === 'inventory' && <InventoryView inventory={inventory} vendors={vendors} branchId={user.branch_id!} onRefresh={fetchData} />}
            {view === 'vendors' && <VendorsView vendors={vendors} branchId={user.branch_id!} onRefresh={fetchData} />}
            {view === 'menu' && <MenuView categories={menuCategories} items={menuItems} branchId={user.branch_id!} onRefresh={fetchData} />}
            {view === 'tables' && <TablesView tables={tables} branchId={user.branch_id!} onRefresh={fetchData} />}
            {view === 'reservations' && <ReservationsView reservations={reservations} tables={tables} branchId={user.branch_id!} onRefresh={fetchData} />}
            {view === 'pos' && <POSView tables={tables} menuItems={menuItems} categories={menuCategories} branchId={user.branch_id!} onRefresh={fetchData} />}
            {view === 'reports' && <ReportsView branchId={user.branch_id!} />}
            {view === 'settings' && <SettingsView branchId={user.branch_id!} onRefresh={fetchData} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'
    }`}
  >
    {icon}
    {label}
  </button>
);

// --- Sub-Views ---

const DashboardView = ({ stats, ledger, inventory }: any) => {
  const lowStock = inventory.filter((item: any) => item.stock <= item.min_level);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-zinc-500 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Today's Total</p>
              <p className="text-2xl font-bold">₹{stats.total.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Bank/Card</p>
              <p className="text-2xl font-bold">₹{stats.bank.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <History size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Cash</p>
              <p className="text-2xl font-bold">₹{stats.cash.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={18} />
              Low Stock Alerts
            </h3>
            <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">{lowStock.length} Items</span>
          </div>
          <div className="space-y-3">
            {lowStock.length > 0 ? lowStock.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{item.stock} left</p>
                  <p className="text-xs text-zinc-400">Min: {item.min_level}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-zinc-400 text-center py-8">All stock levels are healthy.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={18} />
            Recent Transactions
          </h3>
          <div className="space-y-4">
            {ledger.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${entry.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-zinc-400">{new Date(entry.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${entry.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StaffView = ({ users, branches, currentUser, onRefresh }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'staff', branch_id: '' });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          branch_id: currentUser.role === 'super_admin' ? form.branch_id : currentUser.branch_id
        })
      });
      setShowAdd(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
        <Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add Staff</Button>
      </div>

      <Card>
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Username</th>
              {currentUser.role === 'super_admin' && (
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Password</th>
              )}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Branch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-medium">{u.username}</td>
                {currentUser.role === 'super_admin' && (
                  <td className="px-6 py-4 text-sm font-mono text-zinc-600">{u.password}</td>
                )}
                <td className="px-6 py-4 text-sm capitalize">{u.role.replace('_', ' ')}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {u.branch_id ? branches.find((b: any) => b.id === u.branch_id)?.name || `ID: ${u.branch_id}` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">Add New Staff Member</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Username" value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })} required />
                <Input label="Password" type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} required />
                <Select 
                  label="Role" 
                  value={form.role} 
                  onChange={(e: any) => setForm({ ...form, role: e.target.value })}
                  options={[
                    { label: 'Admin', value: 'admin' },
                    { label: 'Staff / Kitchen', value: 'staff' }
                  ]}
                />
                {currentUser.role === 'super_admin' && (
                  <Select 
                    label="Assign to Branch" 
                    value={form.branch_id} 
                    onChange={(e: any) => setForm({ ...form, branch_id: e.target.value })}
                    options={[{ label: 'Select Branch', value: '' }, ...branches.map((b: any) => ({ label: b.name, value: b.id }))]}
                    required
                  />
                )}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Create Account</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const BranchesView = ({ branches, onRefresh }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    contact: '',
    phone: '',
    email: '',
    parent_company: '',
    gst_number: ''
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setShowAdd(false);
      setForm({ name: '', address: '', contact: '', phone: '', email: '', parent_company: '', gst_number: '' });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Branches</h2>
        <Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add Branch</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b: any) => (
          <Card key={b.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                <Store className="text-zinc-600" />
              </div>
              <span className="text-xs font-bold text-zinc-400">ID: #{b.id}</span>
            </div>
            <h3 className="text-lg font-bold mb-1">{b.name}</h3>
            <p className="text-sm text-zinc-500 mb-4">{b.address}</p>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Users size={14} />
              {b.contact}
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">Add New Branch</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Branch Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required />
                <Input label="A Unit Of" value={form.parent_company} onChange={(e: any) => setForm({ ...form, parent_company: e.target.value })} placeholder="Parent Company Name" />
                <Input label="Address" value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Contact Person" value={form.contact} onChange={(e: any) => setForm({ ...form, contact: e.target.value })} required />
                  <Input label="Phone Number" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Email" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} required />
                  <Input label="GST Number" value={form.gst_number} onChange={(e: any) => setForm({ ...form, gst_number: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Create Branch</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StockEvaluationView = ({ branchId }: any) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [evaluation, setEvaluation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvaluation = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/inventory-evaluation/${branchId}?date=${date}`);
      setEvaluation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [date]);

  const categorySummary = evaluation.reduce((acc: any, item: any) => {
    const cat = item.category;
    if (!acc[cat]) {
      acc[cat] = { qty: 0, value: 0 };
    }
    acc[cat].qty += item.total_qty;
    acc[cat].value += item.total_value;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Stock Evaluation Report</h3>
        <Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} className="w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Category Summary</h4>
          <div className="space-y-3">
            {Object.entries(categorySummary).map(([cat, data]: [string, any]) => (
              <div key={cat} className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <span className="capitalize font-medium">{cat}</span>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{(data.value as number).toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-400">{data.qty} units</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold text-lg">
              <span>Total Value</span>
              <span>₹{(Object.values(categorySummary).reduce((sum: number, d: any) => sum + (d.value || 0), 0) as number).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Evaluation Details</h4>
          <p className="text-xs text-zinc-400 mb-4 italic">Evaluation based on purchase price and batch-wise tracking.</p>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {evaluation.map((item: any) => (
              <div key={item.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-emerald-600 font-bold">₹{(item.total_value as number).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
                  <p>Total Qty: {item.total_qty}</p>
                  <p>Avg Price: ₹{(item.avg_price as number).toFixed(2)}</p>
                </div>
                {item.batches.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-200">
                    <p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Batches</p>
                    {item.batches.map((b: any) => (
                      <div key={b.id} className="flex justify-between text-[9px]">
                        <span>Batch: {b.batch_number || 'N/A'} ({b.remaining_quantity} units)</span>
                        <span>@ ₹{b.purchase_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const InventoryView = ({ inventory, vendors, branchId, onRefresh }: any) => {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'evaluation'
  const [showAdd, setShowAdd] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: '', category: 'grocery', stock: 0, min_level: 0, price: 0, vendor_id: '' 
  });
  const [batchForm, setBatchForm] = useState({
    inventory_id: '', batch_number: '', purchase_price: 0, quantity: 0, expiry_date: ''
  });

  const categories = ['grocery', 'vegetables', 'drinks', 'water', 'spices&Herbs', 'stationery', 'others'];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch_id: branchId })
      });
      setShowAdd(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddBatch = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/inventory-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batchForm, inventory_id: selectedItem.id })
      });
      setShowAddBatch(false);
      setSelectedItem(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <div className="flex gap-2">
          <div className="bg-zinc-100 p-1 rounded-lg flex gap-1">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'stock' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Current Stock
            </button>
            <button 
              onClick={() => setActiveTab('evaluation')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'evaluation' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Stock Evaluation
            </button>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add Item</Button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <Card>
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Item Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Stock</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Min Level</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {inventory.map((item: any) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {item.name}
                    {item.stock <= item.min_level && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                        <AlertTriangle size={10} /> Low
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 capitalize">{item.category}</td>
                  <td className="px-6 py-4 text-sm font-bold">{item.stock}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{item.min_level}</td>
                  <td className="px-6 py-4 text-sm">₹{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" className="h-8 text-[10px] font-bold" onClick={() => { setSelectedItem(item); setShowAddBatch(true); }}>
                      <Plus size={14} /> Purchase
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <StockEvaluationView branchId={branchId} />
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">Add Inventory Item</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Item Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required />
                <Select 
                  label="Category" 
                  value={form.category} 
                  onChange={(e: any) => setForm({ ...form, category: e.target.value })}
                  options={categories.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Initial Stock" type="number" value={form.stock} onChange={(e: any) => setForm({ ...form, stock: parseFloat(e.target.value) })} />
                  <Input label="Min Level" type="number" value={form.min_level} onChange={(e: any) => setForm({ ...form, min_level: parseFloat(e.target.value) })} />
                </div>
                <Input label="Purchase Price" type="number" step="0.01" value={form.price} onChange={(e: any) => setForm({ ...form, price: parseFloat(e.target.value) })} />
                <Select 
                  label="Vendor" 
                  value={form.vendor_id} 
                  onChange={(e: any) => setForm({ ...form, vendor_id: e.target.value })}
                  options={[{ label: 'Select Vendor', value: '' }, ...vendors.map((v: any) => ({ label: v.name, value: v.id }))]}
                />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Add Item</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}

      {showAddBatch && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">Purchase Entry - {selectedItem.name}</h3>
              <form onSubmit={handleAddBatch} className="space-y-4">
                <Input label="Batch Number" value={batchForm.batch_number} onChange={(e: any) => setBatchForm({ ...batchForm, batch_number: e.target.value })} placeholder="e.g. BATCH-001" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Quantity" type="number" value={batchForm.quantity} onChange={(e: any) => setBatchForm({ ...batchForm, quantity: parseFloat(e.target.value) })} required />
                  <Input label="Purchase Price" type="number" step="0.01" value={batchForm.purchase_price} onChange={(e: any) => setBatchForm({ ...batchForm, purchase_price: parseFloat(e.target.value) })} required />
                </div>
                <Input label="Expiry Date" type="date" value={batchForm.expiry_date} onChange={(e: any) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowAddBatch(false); setSelectedItem(null); }}>Cancel</Button>
                  <Button type="submit" className="flex-1">Record Purchase</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const VendorsView = ({ vendors, branchId, onRefresh }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', email: '', gst_number: '' });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch_id: branchId })
      });
      setShowAdd(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
        <Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add Vendor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((v: any) => (
          <Card key={v.id} className="p-6">
            <h3 className="text-lg font-bold mb-2">{v.name}</h3>
            <div className="space-y-2 text-sm text-zinc-600">
              <p className="flex items-center gap-2"><Users size={14} /> {v.contact}</p>
              <p className="flex items-center gap-2"><FileText size={14} /> {v.email}</p>
              {v.gst_number && <p className="flex items-center gap-2 font-mono text-[10px] bg-zinc-100 px-2 py-1 rounded w-fit">GST: {v.gst_number}</p>}
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">Add Vendor</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Vendor Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required />
                <Input label="Contact Number" value={form.contact} onChange={(e: any) => setForm({ ...form, contact: e.target.value })} required />
                <Input label="Email Address" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} required />
                <Input label="GST Number" value={form.gst_number} onChange={(e: any) => setForm({ ...form, gst_number: e.target.value })} placeholder="e.g. 22AAAAA0000A1Z5" />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Add Vendor</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MenuView = ({ categories, items, branchId, onRefresh }: any) => {
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '' });
  const [itemForm, setItemForm] = useState({ name: '', category_id: '', price: 0, image_url: '' });

  const handleAddCat = async (e: any) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await safeFetchJson(`/api/menu-categories/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catForm)
        });
      } else {
        await safeFetchJson('/api/menu-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...catForm, branch_id: branchId })
        });
      }
      setShowAddCat(false);
      setEditingCat(null);
      setCatForm({ name: '' });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All items in it will remain but won\'t have a category.')) return;
    try {
      await safeFetchJson(`/api/menu-categories/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddItem = async (e: any) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await safeFetchJson(`/api/menu-items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemForm)
        });
      } else {
        await safeFetchJson('/api/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemForm, branch_id: branchId })
        });
      }
      setShowAddItem(false);
      setEditingItem(null);
      setItemForm({ name: '', category_id: '', price: 0, image_url: '' });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await safeFetchJson(`/api/menu-items/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category_id: item.category_id.toString(),
      price: item.price,
      image_url: item.image_url || ''
    });
    setShowAddItem(true);
  };

  const openEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name });
    setShowAddCat(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowAddCat(true)}><Plus size={18} /> New Category</Button>
          <Button onClick={() => setShowAddItem(true)}><Plus size={18} /> New Dish</Button>
        </div>
      </div>

      {categories.map((cat: any) => (
        <div key={cat.id} className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-xl font-bold">{cat.name}</h3>
            <div className="flex gap-2">
              <button onClick={() => openEditCat(cat)} className="p-1 text-zinc-400 hover:text-black transition-colors"><Edit size={16} /></button>
              <button onClick={() => handleDeleteCat(cat.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.filter((i: any) => i.category_id === cat.id).map((item: any) => (
              <Card key={item.id} className="group relative">
                <div className="aspect-video bg-zinc-100 relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <ChefHat size={32} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    ₹{item.price.toFixed(2)}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => openEditItem(item)} className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold">{item.name}</h4>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {showAddCat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">{editingCat ? 'Edit Category' : 'Add Menu Category'}</h3>
              <form onSubmit={handleAddCat} className="space-y-4">
                <Input label="Category Name" value={catForm.name} onChange={(e: any) => setCatForm({ name: e.target.value })} required />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowAddCat(false); setEditingCat(null); setCatForm({ name: '' }); }}>Cancel</Button>
                  <Button type="submit" className="flex-1">{editingCat ? 'Save Changes' : 'Add Category'}</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}

      {showAddItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">{editingItem ? 'Edit Dish' : 'Add New Dish'}</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <Input label="Dish Name" value={itemForm.name} onChange={(e: any) => setItemForm({ ...itemForm, name: e.target.value })} required />
                <Select 
                  label="Category" 
                  value={itemForm.category_id} 
                  onChange={(e: any) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  options={[{ label: 'Select Category', value: '' }, ...categories.map((c: any) => ({ label: c.name, value: c.id }))]}
                  required
                />
                <Input label="Price" type="number" step="0.01" value={itemForm.price} onChange={(e: any) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) })} required />
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Photo</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-200">
                      {itemForm.image_url ? (
                        <img src={itemForm.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Camera className="text-zinc-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="photo-upload" 
                        onChange={(e: any) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setItemForm({ ...itemForm, image_url: url });
                          }
                        }}
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-bold transition-colors">
                        <Upload size={16} /> Upload Photo
                      </label>
                      <p className="text-[10px] text-zinc-400 mt-1">Or enter URL below</p>
                    </div>
                  </div>
                </div>

                <Input label="Image URL" value={itemForm.image_url} onChange={(e: any) => setItemForm({ ...itemForm, image_url: e.target.value })} placeholder="https://..." />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowAddItem(false); setEditingItem(null); setItemForm({ name: '', category_id: '', price: 0, image_url: '' }); }}>Cancel</Button>
                  <Button type="submit" className="flex-1">{editingItem ? 'Save Changes' : 'Add Dish'}</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const TablesView = ({ tables, branchId, onRefresh }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ number: '', capacity: 2 });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch_id: branchId })
      });
      setShowAdd(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleStatus = async (tableId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'reserved' : 'available';
    if (currentStatus === 'occupied') return;
    
    try {
      await safeFetchJson(`/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tables</h2>
        <Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add Table</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables.map((t: any) => (
          <Card key={t.id} className={`p-6 flex flex-col items-center justify-center gap-2 border-2 transition-all relative group ${
            t.status === 'occupied' ? 'border-orange-200 bg-orange-50' : 
            t.status === 'reserved' ? 'border-blue-200 bg-blue-50' :
            'border-emerald-100 bg-emerald-50/30'
          }`}>
            <TableIcon size={32} className={
              t.status === 'occupied' ? 'text-orange-500' : 
              t.status === 'reserved' ? 'text-blue-500' :
              'text-emerald-500'
            } />
            <span className="font-bold text-lg">Table {t.number}</span>
            <span className="text-xs font-medium text-zinc-500">{t.capacity} Seats</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              t.status === 'occupied' ? 'bg-orange-200 text-orange-700' : 
              t.status === 'reserved' ? 'bg-blue-200 text-blue-700' :
              'bg-emerald-200 text-emerald-700'
            }`}>
              {t.status}
            </span>
            
            {t.status !== 'occupied' && (
              <button 
                onClick={() => toggleStatus(t.id, t.status)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded-md border border-zinc-200 shadow-sm"
                title={t.status === 'available' ? 'Reserve Table' : 'Make Available'}
              >
                <History size={14} className={t.status === 'available' ? 'text-blue-500' : 'text-emerald-500'} />
              </button>
            )}
          </Card>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">Add Table</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Table Number/Name" value={form.number} onChange={(e: any) => setForm({ ...form, number: e.target.value })} required />
                <Input label="Capacity" type="number" value={form.capacity} onChange={(e: any) => setForm({ ...form, capacity: parseInt(e.target.value) })} required />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Add Table</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ReservationsView = ({ reservations, tables, branchId, onRefresh }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    table_id: '', 
    customer_name: '', 
    customer_contact: '', 
    reservation_time: '', 
    guests: 2 
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await safeFetchJson('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch_id: branchId })
      });
      setShowAdd(false);
      setForm({ table_id: '', customer_name: '', customer_contact: '', reservation_time: '', guests: 2 });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await safeFetchJson(`/api/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const availableTables = tables.filter((t: any) => t.status === 'available');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
        <Button onClick={() => setShowAdd(true)}><Plus size={18} /> New Reservation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reservations.map((r: any) => (
          <Card key={r.id} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{r.customer_name}</h3>
                <p className="text-sm text-zinc-500 font-medium">{r.customer_contact}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                r.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                r.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                'bg-emerald-100 text-emerald-600'
              }`}>
                {r.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-100">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Table</p>
                <p className="font-bold">Table {r.table_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Guests</p>
                <p className="font-bold">{r.guests} People</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Time</p>
                <p className="font-bold">{new Date(r.reservation_time).toLocaleString()}</p>
              </div>
            </div>

            {r.status === 'confirmed' && (
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => updateStatus(r.id, 'cancelled')}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(r.id, 'completed')}>Arrived</Button>
              </div>
            )}
          </Card>
        ))}
        {reservations.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>No reservations found</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">New Reservation</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Customer Name" value={form.customer_name} onChange={(e: any) => setForm({ ...form, customer_name: e.target.value })} required />
                <Input label="Contact Number" value={form.customer_contact} onChange={(e: any) => setForm({ ...form, customer_contact: e.target.value })} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Guests" type="number" value={form.guests} onChange={(e: any) => setForm({ ...form, guests: parseInt(e.target.value) })} required />
                  <Select 
                    label="Select Table" 
                    value={form.table_id} 
                    onChange={(e: any) => setForm({ ...form, table_id: e.target.value })} 
                    options={[
                      { value: '', label: 'Choose Table' },
                      ...availableTables.map((t: any) => ({ value: t.id, label: `Table ${t.number} (${t.capacity} seats)` }))
                    ]}
                    required 
                  />
                </div>
                <Input label="Date & Time" type="datetime-local" value={form.reservation_time} onChange={(e: any) => setForm({ ...form, reservation_time: e.target.value })} required />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Confirm Reservation</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const POSView = ({ tables, menuItems, categories, branchId, onRefresh }: any) => {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in', 'takeaway', 'swiggy', 'zomato'
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (orderType === 'dine_in' && !selectedTable) {
      alert('Please select a table for Dine-in order');
      return;
    }
    try {
      await safeFetchJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: branchId,
          table_id: orderType === 'dine_in' ? selectedTable : null,
          order_type: orderType,
          total_amount: total,
          items: cart.map(c => ({ menu_item_id: c.id, quantity: c.quantity, price: c.price }))
        })
      });
      setCart([]);
      setSelectedTable(null);
      onRefresh();
      alert('KOT generated and sent to kitchen!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredItems = selectedCategory 
    ? menuItems.filter((item: any) => item.category_id === selectedCategory)
    : menuItems;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-8">
      {/* Menu Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Billing POS</h2>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Type:</span>
              <div className="flex gap-1">
                {['dine_in', 'takeaway', 'swiggy', 'zomato'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => {
                      setOrderType(type);
                      if (type !== 'dine_in') setSelectedTable(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-wider ${orderType === type ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {orderType === 'dine_in' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Table:</span>
                <div className="flex gap-1 overflow-x-auto max-w-[400px] pb-1">
                  {tables.map((t: any) => (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedTable(t.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${
                        selectedTable === t.id ? 'bg-black text-white border-black' : 
                        t.status === 'occupied' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        t.status === 'reserved' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      T{t.number}
                      {t.status !== 'available' && <div className={`w-1 h-1 rounded-full ${t.status === 'occupied' ? 'bg-orange-500' : 'bg-blue-500'}`} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${!selectedCategory ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
          >
            All Items
          </button>
          {categories.map((cat: any) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item: any) => (
              <button 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="text-left group"
              >
                <Card className="h-full hover:border-black transition-all">
                  <div className="aspect-square bg-zinc-100 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300"><ChefHat size={32} /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-zinc-500 font-bold text-xs">₹{item.price.toFixed(2)}</p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-96 flex flex-col gap-6">
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={18} /> Current Order</h3>
            <span className="text-xs font-bold text-zinc-400">{cart.length} Items</span>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {cart.length > 0 ? cart.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                <ShoppingCart size={48} />
                <p className="text-sm font-medium">Cart is empty</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-4">
            <div className="flex items-center justify-between text-zinc-500 text-sm">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            
            <div className="pt-2 space-y-3">
              <Button className="w-full py-4 text-lg" disabled={cart.length === 0} onClick={handleCheckout}>
                Generate KOT
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const KitchenView = ({ orders, onRefresh }: any) => {
  const updateStatus = async (orderId: number, status: string) => {
    try {
      await safeFetchJson(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const kitchenOrders = orders.filter((o: any) => o.status !== 'served');

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Kitchen Display</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kitchenOrders.map((order: any) => (
          <Card key={order.id} className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">Order #{order.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    order.order_type === 'dine_in' ? 'bg-zinc-100 text-zinc-600' :
                    order.order_type === 'swiggy' ? 'bg-orange-100 text-orange-600' :
                    order.order_type === 'zomato' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {order.order_type?.replace('_', ' ')}
                  </span>
                  {order.table_number && <p className="text-xs text-zinc-500 font-bold">Table {order.table_number}</p>}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                order.status === 'pending' ? 'bg-zinc-100 text-zinc-600' :
                order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                'bg-emerald-100 text-emerald-600'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-bold">x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4 border-t border-zinc-100">
              {order.status === 'pending' && (
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(order.id, 'preparing')}>Start Preparing</Button>
              )}
              {order.status === 'preparing' && (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(order.id, 'ready')}>Mark Ready</Button>
              )}
              {order.status === 'ready' && (
                <Button className="flex-1" onClick={() => updateStatus(order.id, 'served')}>Mark Served</Button>
              )}
            </div>
          </Card>
        ))}
        {kitchenOrders.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-400">
            <ChefHat size={48} className="mx-auto mb-4 opacity-20" />
            <p>No active kitchen orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BillModal = ({ order, branch, onClose, isDuplicate = false }: any) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] print:p-0 print:bg-white print:static">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full relative"
      >
        {isDuplicate && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] rotate-[-45deg] select-none">
            <span className="text-8xl font-black border-8 border-black p-4">DUPLICATE</span>
          </div>
        )}
        <div className="p-8 space-y-6 print:p-4 relative z-10">
          {/* Header */}
          <div className="text-center space-y-1">
            {branch?.logo_url && (
              <img src={branch.logo_url} alt="Logo" className="w-20 h-20 mx-auto object-contain mb-2" referrerPolicy="no-referrer" />
            )}
            <h2 className="text-2xl font-bold uppercase tracking-tight">{branch?.name || 'Restaurant Name'}</h2>
            {branch?.parent_company && (
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider italic">A Unit of {branch.parent_company}</p>
            )}
            <div className="pt-1">
              <p className="text-xs text-zinc-500 leading-tight">{branch?.address}</p>
              <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 mt-1">
                {branch?.phone && <span>Ph: {branch.phone}</span>}
                {branch?.email && <span>Email: {branch.email}</span>}
              </div>
              {branch?.gst_number && <p className="text-xs font-bold mt-1">GSTIN: {branch.gst_number}</p>}
            </div>
          </div>

          <div className="border-y border-dashed border-zinc-200 py-4 flex justify-between text-xs font-medium">
            <div>
              <p>Bill ID: #{order.id}</p>
              <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p>Time: {new Date(order.created_at).toLocaleTimeString()}</p>
              <p>{order.table_number ? `Table: ${order.table_number}` : 'Takeaway'}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="py-2 text-right">₹{(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-zinc-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Grand Total</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-zinc-400 text-center italic pt-4">Thank you for visiting! Please visit again.</p>
          </div>

          <div className="flex gap-3 pt-6 print:hidden">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
            <Button className="flex-1" onClick={handlePrint}>Print Bill</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ActiveOrdersView = ({ orders, branch, onRefresh }: any) => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showBill, setShowBill] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [orderToPrintDuplicate, setOrderToPrintDuplicate] = useState<any>(null);

  const handleComplete = async () => {
    if (!selectedOrder) return;
    try {
      await safeFetchJson(`/api/orders/${selectedOrder.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          total_amount: selectedOrder.total_amount,
          branch_id: branch.id,
          table_id: selectedOrder.table_id
        })
      });
      setSelectedOrder(null);
      onRefresh();
      alert('Payment collected and order completed!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openBill = (order: any, duplicate: boolean = false) => {
    setSelectedOrder(order);
    setIsDuplicate(duplicate);
    setShowBill(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Active Orders & Billing</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className={`p-4 cursor-pointer transition-all border-2 ${selectedOrder?.id === order.id ? 'border-black' : 'border-transparent'}`} onClick={() => setSelectedOrder(order)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Order #{order.id} - {order.table_number ? `Table ${order.table_number}` : order.order_type?.replace('_', ' ')}</p>
                    <p className="text-xs text-zinc-500">{order.items.length} items • {new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{order.status}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="h-8 w-8 p-0" title="View Bill" onClick={(e: any) => { e.stopPropagation(); openBill(order, false); }}>
                      <Eye size={16} />
                    </Button>
                    <Button variant="ghost" className="h-8 w-8 p-0" title="Print Duplicate" onClick={(e: any) => { e.stopPropagation(); setOrderToPrintDuplicate(order); setShowDuplicateConfirm(true); }}>
                      <Printer size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {orders.length === 0 && <p className="text-center py-20 text-zinc-400">No active orders found.</p>}
        </div>

        <div className="lg:col-span-1">
          {selectedOrder ? (
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-6">Settle Bill - #{selectedOrder.id}</h3>
              <div className="space-y-4 mb-8">
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-zinc-100 flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Select Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentMethod('cash')} className={`py-3 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200'}`}>CASH</button>
                  <button onClick={() => setPaymentMethod('upi')} className={`py-3 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'upi' ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200'}`}>UPI</button>
                  <button onClick={() => setPaymentMethod('card')} className={`py-3 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'card' ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200'}`}>CARD</button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => openBill(selectedOrder, false)}>
                    <Printer size={18} /> Print Bill
                  </Button>
                  <Button className="flex-1" onClick={handleComplete}>Collect & Close</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400">
              <p className="text-sm">Select an order to generate bill</p>
            </div>
          )}
        </div>
      </div>
      {showBill && selectedOrder && (
        <BillModal order={selectedOrder} branch={branch} isDuplicate={isDuplicate} onClose={() => setShowBill(false)} />
      )}

      {showDuplicateConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <Card className="w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold">Print Duplicate Bill?</h3>
              <p className="text-zinc-500 text-sm">Are you sure you want to print a duplicate bill for Order #{orderToPrintDuplicate?.id}?</p>
              <div className="flex gap-3 w-full pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowDuplicateConfirm(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => {
                  setShowDuplicateConfirm(false);
                  openBill(orderToPrintDuplicate, true);
                }}>Yes, Print</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const ReportsView = ({ branchId }: any) => {
  const [searchType, setSearchType] = useState('today');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    fetchBranch();
  }, [searchType, date, month, year]);

  const fetchBranch = async () => {
    try {
      const branches = await safeFetchJson('/api/branches');
      const current = branches.find((b: any) => b.id === branchId);
      setBranch(current);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders-search/${branchId}?`;
      if (searchType === 'today') {
        url += `date=${new Date().toISOString().split('T')[0]}`;
      } else if (searchType === 'date') {
        url += `date=${date}`;
      } else if (searchType === 'month') {
        url += `month=${month}&year=${year}`;
      } else if (searchType === 'year') {
        url += `year=${year}`;
      }
      const data = await safeFetchJson(url);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        <div className="flex gap-2">
          <Select 
            value={searchType} 
            onChange={(e: any) => setSearchType(e.target.value)}
            options={[
              { label: 'Today', value: 'today' },
              { label: 'Specific Date', value: 'date' },
              { label: 'Monthly', value: 'month' },
              { label: 'Yearly', value: 'year' },
            ]}
          />
          {searchType === 'date' && <Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} />}
          {searchType === 'month' && (
            <div className="flex gap-2">
              <Select 
                value={month} 
                onChange={(e: any) => setMonth(e.target.value)}
                options={Array.from({ length: 12 }, (_, i) => ({ label: new Date(0, i).toLocaleString('en', { month: 'long' }), value: (i + 1).toString() }))}
              />
              <Input type="number" value={year} onChange={(e: any) => setYear(e.target.value)} className="w-24" />
            </div>
          )}
          {searchType === 'year' && <Input type="number" value={year} onChange={(e: any) => setYear(e.target.value)} className="w-24" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-50 border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-emerald-900">₹{totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-6 bg-blue-50 border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Orders Count</p>
          <p className="text-3xl font-bold text-blue-900">{orders.length}</p>
        </Card>
        <Card className="p-6 bg-orange-50 border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Avg Ticket Size</p>
          <p className="text-3xl font-bold text-orange-900">₹{(orders.length ? totalRevenue / orders.length : 0).toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-zinc-100">
          <h3 className="font-bold">Order History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Bill ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Table</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Payment</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-zinc-400">Loading...</td></tr>
              ) : orders.length > 0 ? orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">#{order.id}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                      {order.payment_method || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-right">₹{order.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedOrder(order)}>
                      <Printer size={16} />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-zinc-400">No orders found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedOrder && (
        <BillModal order={selectedOrder} branch={branch} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};


const SettingsView = ({ branchId, onRefresh }: any) => {
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranch();
  }, []);

  const fetchBranch = async () => {
    try {
      const branches = await safeFetchJson('/api/branches');
      const current = branches.find((b: any) => b.id === branchId);
      setBranch(current);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await safeFetchJson(`/api/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch)
      });
      alert('Settings updated successfully');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranch({ ...branch, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Branch Settings</h2>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Restaurant Name" 
              value={branch.name} 
              onChange={(e: any) => setBranch({ ...branch, name: e.target.value })} 
              required 
            />
            <Input 
              label="A Unit Of (Parent Company)" 
              value={branch.parent_company || ''} 
              onChange={(e: any) => setBranch({ ...branch, parent_company: e.target.value })} 
              placeholder="e.g. ABC Hospitality Group"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Contact Person" 
              value={branch.contact} 
              onChange={(e: any) => setBranch({ ...branch, contact: e.target.value })} 
              required 
            />
            <Input 
              label="Phone Number" 
              value={branch.phone || ''} 
              onChange={(e: any) => setBranch({ ...branch, phone: e.target.value })} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Email Address" 
              type="email"
              value={branch.email || ''} 
              onChange={(e: any) => setBranch({ ...branch, email: e.target.value })} 
              required 
            />
            <Input 
              label="GST Number" 
              value={branch.gst_number || ''} 
              onChange={(e: any) => setBranch({ ...branch, gst_number: e.target.value })} 
              placeholder="e.g. 22AAAAA0000A1Z5"
            />
          </div>

          <Input 
            label="Address" 
            value={branch.address} 
            onChange={(e: any) => setBranch({ ...branch, address: e.target.value })} 
            required 
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Restaurant Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center overflow-hidden">
                {branch.logo_url ? (
                  <img src={branch.logo_url} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Camera className="text-zinc-300" size={24} />
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  id="logo-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
                <label 
                  htmlFor="logo-upload" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium cursor-pointer hover:bg-zinc-50 transition-all"
                >
                  <Upload size={16} />
                  {branch.logo_url ? 'Change Logo' : 'Upload Logo'}
                </label>
                <p className="text-[10px] text-zinc-400 mt-2">Recommended: Square image, max 2MB</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button type="submit" className="w-full py-4" disabled={saving}>
              {saving ? 'Saving...' : 'Save Branch Details'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
