export interface User {
  id: number;
  username: string;
  role: 'super_admin' | 'admin' | 'staff';
  branch_id: number | null;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  contact: string;
  phone?: string;
  email?: string;
  parent_company?: string;
  gst_number?: string;
  logo_url?: string;
}

export interface InventoryItem {
  id: number;
  branch_id: number;
  name: string;
  category: string;
  stock: number;
  min_level: number;
  price: number;
  vendor_id: number | null;
}

export interface Vendor {
  id: number;
  branch_id: number;
  name: string;
  contact: string;
  email: string;
  gst_number?: string;
}

export interface Table {
  id: number;
  branch_id: number;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

export interface MenuCategory {
  id: number;
  branch_id: number;
  name: string;
}

export interface MenuItem {
  id: number;
  branch_id: number;
  category_id: number;
  name: string;
  price: number;
  image_url: string;
}

export interface LedgerEntry {
  id: number;
  branch_id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

export interface Reservation {
  id: number;
  branch_id: number;
  table_id: number;
  customer_name: string;
  customer_contact: string;
  reservation_time: string;
  guests: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  table_number?: string;
}
