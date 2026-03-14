import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("pos.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    contact TEXT,
    gst_number TEXT,
    logo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'super_admin', 'admin', 'staff'
    branch_id INTEGER,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    gst_number TEXT,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock REAL DEFAULT 0,
    min_level REAL DEFAULT 0,
    price REAL DEFAULT 0,
    vendor_id INTEGER,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS inventory_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    batch_number TEXT,
    purchase_price REAL NOT NULL,
    quantity REAL NOT NULL,
    remaining_quantity REAL NOT NULL,
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    number TEXT NOT NULL,
    capacity INTEGER,
    status TEXT DEFAULT 'available',
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    table_id INTEGER,
    order_type TEXT DEFAULT 'dine_in', -- 'dine_in', 'takeaway', 'swiggy', 'zomato'
    total_amount REAL NOT NULL,
    payment_method TEXT, -- 'cash', 'upi', 'card'
    status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'served', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );

  -- Add order_type column if it doesn't exist (for existing databases)
  PRAGMA table_info(orders);
`);

try {
  db.exec("ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine_in'");
} catch (e) {
  // Column might already exist
}

db.exec(`
  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'income', 'expense'
    amount REAL NOT NULL,
    description TEXT,
    category TEXT, -- 'billing', 'purchase', 'salary', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );
`);

// Seed Super Admin if not exists
const superAdmin = db.prepare("SELECT * FROM users WHERE role = 'super_admin'").get();
if (!superAdmin) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin", "super_admin");
}

// Seed Default Branch and Specific Users
const defaultBranch = db.prepare("SELECT * FROM branches WHERE name = 'Main Branch'").get();
let branchId: any;
if (!defaultBranch) {
  const result = db.prepare("INSERT INTO branches (name, address, contact, gst_number) VALUES (?, ?, ?, ?)").run("Main Branch", "123 Food Street, City Center", "9876543210", "22AAAAA0000A1Z5");
  branchId = result.lastInsertRowid;
} else {
  branchId = (defaultBranch as any).id;
}

// Seed Second Branch
const secondBranch = db.prepare("SELECT * FROM branches WHERE name = 'Downtown Cafe'").get();
let secondBranchId: any;
if (!secondBranch) {
  const result = db.prepare("INSERT INTO branches (name, address, contact, gst_number) VALUES (?, ?, ?, ?)").run("Downtown Cafe", "456 Park Avenue, Downtown", "9876543211", "22BBBBB0000B1Z5");
  secondBranchId = result.lastInsertRowid;
} else {
  secondBranchId = (secondBranch as any).id;
}

const seedUsers = [
  { u: 'staff', p: '12345', r: 'staff', b: branchId },
  { u: 'kot', p: '12345', r: 'staff', b: branchId },
  { u: 'branch', p: '12345', r: 'admin', b: branchId },
  { u: 'waiter', p: '12345', r: 'staff', b: branchId },
  { u: 'downtown_admin', p: '12345', r: 'admin', b: secondBranchId },
  { u: 'downtown_staff', p: '12345', r: 'staff', b: secondBranchId }
];

for (const s of seedUsers) {
  const exists = db.prepare("SELECT * FROM users WHERE username = ?").get(s.u);
  if (!exists) {
    db.prepare("INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)").run(s.u, s.p, s.r, s.b);
  }
}

const categories = [
  "🥗 Starters / Appetizers", "🍲 Soups", "🍛 Main Course (Vegetarian)", 
  "🍗 Main Course (Non-Vegetarian)", "🍚 Rice & Biryani", "🫓 Indian Breads", 
  "🥗 Salads & Raita", "🍔 Street Food / Snacks", "🍨 Desserts / Sweets", 
  "🥤 Beverages", "🥪 Sandwiches & Toasties", "🥐 Breakfast", "🍕 Pizza", 
  "🍔 Burgers", "🍟 Snacks & Sides", "🍝 Pasta", "🍜 Maggi & Quick Bites", 
  "🍰 Desserts", "☕ Hot Beverages", "🧊 Cold Beverages", 
  "🥤 Shakes & Smoothies", "🧃 Mocktails", "Mexican", "Japanese", "Fusion"
];

const allBranchIds = [branchId, secondBranchId];

for (const bId of allBranchIds) {
  for (const cat of categories) {
    const exists = db.prepare("SELECT * FROM menu_categories WHERE name = ? AND branch_id = ?").get(cat, bId);
    if (!exists) {
      db.prepare("INSERT INTO menu_categories (branch_id, name) VALUES (?, ?)").run(bId, cat);
    }
  }
}

const menuData = [
  { cat: "🥐 Breakfast", items: ["Masala Omelette with Toast", "Veg Sandwich", "Cheese Sandwich", "Aloo Paratha with Curd", "Pancakes with Honey", "French Toast", "Poha", "Upma", "Idli Sambhar", "Vada Sambhar", "Masala Dosa"] },
  { cat: "🥪 Sandwiches & Toasties", items: ["Veg Grilled Sandwich", "Cheese Corn Sandwich", "Paneer Tikka Sandwich", "Chicken Grilled Sandwich", "Club Sandwich", "Bombay Masala Toast", "Chilli Cheese Toast"] },
  { cat: "🍕 Pizza", items: ["Margherita Pizza", "Farmhouse Pizza", "Veggie Delight Pizza", "Paneer Tikka Pizza", "Chicken BBQ Pizza", "Tandoori Paneer Pizza", "Chicken Keema Pizza"] },
  { cat: "🍔 Burgers", items: ["Veg Burger", "Cheese Burger", "Paneer Burger", "Crispy Chicken Burger", "Double Patty Burger", "Aloo Tikki Burger", "Maharaja Veg Burger"] },
  { cat: "🍟 Snacks & Sides", items: ["French Fries", "Peri Peri Fries", "Cheese Balls", "Garlic Bread", "Nachos with Salsa", "Onion Rings", "Potato Wedges", "Masala Fries"] },
  { cat: "🍝 Pasta", items: ["White Sauce Pasta", "Red Sauce Pasta", "Pink Sauce Pasta", "Alfredo Pasta", "Chicken Pasta", "Pesto Pasta", "Arrabiata Pasta"] },
  { cat: "🍜 Maggi & Quick Bites", items: ["Plain Maggi", "Masala Maggi", "Cheese Maggi", "Butter Maggi", "Chicken Maggi", "Vegetable Maggi", "Egg Maggi"] },
  { cat: "🍰 Desserts", items: ["Chocolate Brownie", "Brownie with Ice Cream", "Cheesecake", "Chocolate Pastry", "Waffles", "Apple Pie", "Tiramisu"] },
  { cat: "☕ Hot Beverages", items: ["Espresso", "Cappuccino", "Latte", "Americano", "Mocha", "Hot Chocolate", "Masala Chai", "Ginger Tea", "Green Tea", "Filter Coffee"] },
  { cat: "🧊 Cold Beverages", items: ["Cold Coffee", "Iced Latte", "Iced Americano", "Iced Mocha", "Frappuccino", "Iced Tea", "Cold Brew"] },
  { cat: "🥤 Shakes & Smoothies", items: ["Chocolate Shake", "Oreo Shake", "KitKat Shake", "Strawberry Shake", "Mango Smoothie", "Banana Smoothie", "Vanilla Shake", "Butterscotch Shake"] },
  { cat: "🧃 Mocktails", items: ["Virgin Mojito", "Blue Lagoon", "Green Apple Mojito", "Watermelon Cooler", "Lemon Mint Cooler", "Shirley Temple", "Fruit Punch"] },
  { cat: "🥗 Starters / Appetizers", items: ["Paneer Tikka", "Veg Manchurian", "Hara Bhara Kebab", "Chicken Tikka", "Tandoori Chicken", "Fish Amritsari", "Samosa", "Aloo Tikki", "Gobi 65", "Chicken 65", "Seekh Kebab", "Malai Chaap"] },
  { cat: "🍲 Soups", items: ["Tomato Soup", "Sweet Corn Soup", "Hot & Sour Soup", "Manchow Soup", "Chicken Clear Soup", "Mulligatawny Soup", "Lemon Coriander Soup"] },
  { cat: "🍛 Main Course (Vegetarian)", items: ["Paneer Butter Masala", "Shahi Paneer", "Kadai Paneer", "Dal Tadka", "Dal Makhani", "Chana Masala", "Mix Veg Curry", "Aloo Gobi", "Malai Kofta", "Baingan Bharta", "Bhindi Masala", "Palak Paneer"] },
  { cat: "🍗 Main Course (Non-Vegetarian)", items: ["Butter Chicken", "Chicken Curry", "Chicken Kadai", "Mutton Rogan Josh", "Mutton Curry", "Fish Curry", "Egg Curry", "Chicken Lababdar", "Rara Mutton", "Handi Chicken"] },
  { cat: "🍚 Rice & Biryani", items: ["Steamed Rice", "Jeera Rice", "Veg Pulao", "Veg Biryani", "Chicken Biryani", "Mutton Biryani", "Egg Biryani", "Hyderabadi Biryani", "Lucknowi Biryani", "Kashmiri Pulao"] },
  { cat: "🫓 Indian Breads", items: ["Tandoori Roti", "Butter Roti", "Plain Naan", "Butter Naan", "Garlic Naan", "Lachha Paratha", "Aloo Paratha", "Missi Roti", "Rumali Roti", "Kulcha"] },
  { cat: "🥗 Salads & Raita", items: ["Green Salad", "Onion Salad", "Boondi Raita", "Plain Curd", "Pineapple Raita", "Cucumber Raita", "Mix Veg Raita", "Kachumber Salad"] },
  { cat: "🍔 Street Food / Snacks", items: ["Pav Bhaji", "Chole Bhature", "Vada Pav", "Pani Puri", "Bhel Puri", "Dahi Puri", "Sev Puri", "Papdi Chaat", "Raj Kachori"] },
  { cat: "🍨 Desserts / Sweets", items: ["Gulab Jamun", "Rasgulla", "Rasmalai", "Gajar Ka Halwa", "Kheer", "Kulfi", "Jalebi", "Rabri", "Moong Dal Halwa"] },
  { cat: "🥤 Beverages", items: ["Masala Chai", "Filter Coffee", "Lassi (Sweet / Salted)", "Mango Shake", "Fresh Lime Soda", "Buttermilk (Chaas)", "Jaljeera", "Thandai", "Nimbu Pani"] }
];

for (const bId of allBranchIds) {
  for (const group of menuData) {
    const category = db.prepare("SELECT id FROM menu_categories WHERE name = ? AND branch_id = ?").get(group.cat, bId);
    if (category) {
      for (const itemName of group.items) {
        const exists = db.prepare("SELECT * FROM menu_items WHERE name = ? AND branch_id = ?").get(itemName, bId);
        if (!exists) {
          const price = Math.floor(Math.random() * (500 - 50 + 1)) + 50; 
          const imageUrl = `https://picsum.photos/seed/${itemName.replace(/\s/g, '')}/400/400`;
          db.prepare("INSERT INTO menu_items (branch_id, category_id, name, price, image_url) VALUES (?, ?, ?, ?, ?)").run(bId, (category as any).id, itemName, price, imageUrl);
        }
      }
    }
  }
}

// Seed Vendors
const vendorData = [
  { name: "Sharma Provisions", contact: "9876543210", email: "sharma@provisions.com", gst: "09AAAAA0000A1Z5" },
  { name: "Gupta Dairy & Sweets", contact: "9876543211", email: "gupta@dairy.com", gst: "09BBBBB0000B1Z5" },
  { name: "Verma Poultry Farm", contact: "9876543212", email: "verma@poultry.com", gst: "09CCCCC0000C1Z5" },
  { name: "Mehta Vegetable Mart", contact: "9876543213", email: "mehta@vegmart.com", gst: "09DDDDD0000D1Z5" },
  { name: "Khanna Spices & Grains", contact: "9876543214", email: "khanna@spices.com", gst: "09EEEEE0000E1Z5" }
];

for (const bId of allBranchIds) {
  for (const v of vendorData) {
    const exists = db.prepare("SELECT * FROM vendors WHERE name = ? AND branch_id = ?").get(v.name, bId);
    if (!exists) {
      db.prepare("INSERT INTO vendors (branch_id, name, contact, email, gst_number) VALUES (?, ?, ?, ?, ?)").run(bId, v.name, v.contact, v.email, v.gst);
    }
  }
}

// Seed Inventory
const inventoryData = [
  { name: "Basmati Rice", cat: "Grains", stock: 100, min: 20, price: 90 },
  { name: "Paneer", cat: "Dairy", stock: 50, min: 10, price: 350 },
  { name: "Chicken Breast", cat: "Meat", stock: 40, min: 15, price: 280 },
  { name: "Refined Oil", cat: "Oils", stock: 60, min: 10, price: 140 },
  { name: "Amul Butter", cat: "Dairy", stock: 30, min: 5, price: 500 },
  { name: "Garam Masala", cat: "Spices", stock: 20, min: 5, price: 400 },
  { name: "Turmeric Powder", cat: "Spices", stock: 15, min: 5, price: 200 },
  { name: "Wheat Flour (Atta)", cat: "Grains", stock: 200, min: 50, price: 45 },
  { name: "Milk", cat: "Dairy", stock: 80, min: 20, price: 60 },
  { name: "Tomato", cat: "Vegetables", stock: 40, min: 10, price: 30 },
  { name: "Onion", cat: "Vegetables", stock: 60, min: 15, price: 40 }
];

for (const bId of allBranchIds) {
  const firstVendor = db.prepare("SELECT id FROM vendors WHERE branch_id = ? LIMIT 1").get(bId);
  for (const i of inventoryData) {
    const exists = db.prepare("SELECT * FROM inventory WHERE name = ? AND branch_id = ?").get(i.name, bId);
    if (!exists) {
      db.prepare("INSERT INTO inventory (branch_id, name, category, stock, min_level, price, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(bId, i.name, i.cat, i.stock, i.min, i.price, (firstVendor as any)?.id || null);
    }
  }
}

// Seed Tables
const tableData = [
  { number: "1", capacity: 2 },
  { number: "2", capacity: 2 },
  { number: "3", capacity: 4 },
  { number: "4", capacity: 4 },
  { number: "5", capacity: 6 },
  { number: "6", capacity: 8 },
  { number: "7", capacity: 4 },
  { number: "8", capacity: 2 },
  { number: "9", capacity: 4 },
  { number: "10", capacity: 6 }
];

for (const bId of allBranchIds) {
  for (const t of tableData) {
    const exists = db.prepare("SELECT * FROM tables WHERE number = ? AND branch_id = ?").get(t.number, bId);
    if (!exists) {
      db.prepare("INSERT INTO tables (branch_id, number, capacity) VALUES (?, ?, ?)").run(bId, t.number, t.capacity);
    }
  }
}

// Seed Orders and Ledger for Demo
for (const bId of allBranchIds) {
  const existingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE branch_id = ?").get(bId);
  if ((existingOrders as any).count === 0) {
    const tables = db.prepare("SELECT id FROM tables WHERE branch_id = ?").all(bId);
    const items = db.prepare("SELECT id, price, name FROM menu_items WHERE branch_id = ? LIMIT 20").all(bId);
    
    const orderTypes = ['dine_in', 'takeaway', 'swiggy', 'zomato'];

    // Create some completed orders for reports (yesterday and today)
    for (let i = 0; i < 20; i++) {
      const table = tables[Math.floor(Math.random() * tables.length)];
      const type = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const isToday = Math.random() > 0.3;
      const date = isToday ? "datetime('now')" : "datetime('now', '-1 day')";
      
      const orderItems = [];
      let total = 0;
      for (let j = 0; j < 3; j++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        orderItems.push({ ...item, quantity: qty });
        total += (item as any).price * qty;
      }

      const result = db.prepare(`INSERT INTO orders (branch_id, table_id, order_type, total_amount, status, payment_method, created_at) VALUES (?, ?, ?, ?, 'completed', 'cash', ${date})`)
        .run(bId, type === 'dine_in' ? (table as any).id : null, type, total);
      
      const orderId = result.lastInsertRowid;
      for (const oi of orderItems) {
        db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)").run(orderId, oi.id, oi.quantity, oi.price);
      }

      // Add to ledger
      db.prepare(`INSERT INTO ledger (branch_id, type, amount, description, category, created_at) VALUES (?, 'income', ?, ?, 'billing', ${date})`)
        .run(bId, total, `Order #${orderId} (cash)`);
    }

    // Add some expenses
    const expenses = [
      { desc: "Electricity Bill", cat: "utility", amount: 5000 },
      { desc: "Staff Salary", cat: "salary", amount: 15000 },
      { desc: "Vegetable Purchase", cat: "purchase", amount: 2000 },
      { desc: "Rent", cat: "rent", amount: 25000 }
    ];

    for (const exp of expenses) {
      db.prepare("INSERT INTO ledger (branch_id, type, amount, description, category, created_at) VALUES (?, 'expense', ?, ?, ?, datetime('now', '-2 days'))")
        .run(bId, exp.amount, exp.desc, exp.cat);
    }

    // Create some active orders
    const activeStatuses = ['pending', 'preparing', 'ready'];
    for (let i = 0; i < 6; i++) {
      const table = tables[Math.floor(Math.random() * tables.length)];
      const type = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const status = activeStatuses[Math.floor(Math.random() * activeStatuses.length)];
      
      const orderItems = [];
      let total = 0;
      for (let j = 0; j < 2; j++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        orderItems.push({ ...item, quantity: qty });
        total += (item as any).price * qty;
      }

      const result = db.prepare("INSERT INTO orders (branch_id, table_id, order_type, total_amount, status) VALUES (?, ?, ?, ?, ?)")
        .run(bId, type === 'dine_in' ? (table as any).id : null, type, total, status);
      
      const orderId = result.lastInsertRowid;
      for (const oi of orderItems) {
        db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)").run(orderId, oi.id, oi.quantity, oi.price);
      }

      if (type === 'dine_in' && status !== 'completed') {
        db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run((table as any).id);
      }
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    try {
      const { username, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Branches
  app.get("/api/branches", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM branches").all());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/branches/:id", (req, res) => {
    try {
      const { name, address, contact, gst_number, logo_url } = req.body;
      db.prepare("UPDATE branches SET name = ?, address = ?, contact = ?, gst_number = ?, logo_url = ? WHERE id = ?")
        .run(name, address, contact, gst_number, logo_url, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/branches", (req, res) => {
    try {
      const { name, address, contact } = req.body;
      const result = db.prepare("INSERT INTO branches (name, address, contact) VALUES (?, ?, ?)").run(name, address, contact);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inventory
  app.get("/api/inventory/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM inventory WHERE branch_id = ?").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inventory Batches
  app.get("/api/inventory-batches/:inventoryId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM inventory_batches WHERE inventory_id = ? ORDER BY created_at DESC").all(req.params.inventoryId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory-batches", (req, res) => {
    try {
      const { inventory_id, batch_number, purchase_price, quantity, expiry_date } = req.body;
      const result = db.prepare("INSERT INTO inventory_batches (inventory_id, batch_number, purchase_price, quantity, remaining_quantity, expiry_date) VALUES (?, ?, ?, ?, ?, ?)")
        .run(inventory_id, batch_number, purchase_price, quantity, quantity, expiry_date);
      
      // Update main inventory stock
      db.prepare("UPDATE inventory SET stock = stock + ? WHERE id = ?").run(quantity, inventory_id);
      
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stock Evaluation Report
  app.get("/api/inventory-evaluation/:branchId", (req, res) => {
    try {
      const { date } = req.query;
      const items = db.prepare("SELECT * FROM inventory WHERE branch_id = ?").all(req.params.branchId);
      const evaluation = items.map((item: any) => {
        const batches = db.prepare("SELECT * FROM inventory_batches WHERE inventory_id = ? AND date(created_at) <= ?").all(item.id, date || new Date().toISOString().split('T')[0]);
        
        let totalValue = 0;
        let totalQty = 0;
        batches.forEach((b: any) => {
          totalValue += b.remaining_quantity * b.purchase_price;
          totalQty += b.remaining_quantity;
        });

        return {
          ...item,
          batches,
          total_qty: totalQty,
          total_value: totalValue,
          avg_price: totalQty > 0 ? totalValue / totalQty : 0
        };
      });

      res.json(evaluation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory", (req, res) => {
    try {
      const { branch_id, name, category, stock, min_level, price, vendor_id } = req.body;
      const result = db.prepare("INSERT INTO inventory (branch_id, name, category, stock, min_level, price, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(branch_id, name, category, stock, min_level, price, vendor_id);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vendors
  app.get("/api/vendors/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM vendors WHERE branch_id = ?").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/vendors", (req, res) => {
    try {
      const { branch_id, name, contact, email, gst_number } = req.body;
      const result = db.prepare("INSERT INTO vendors (branch_id, name, contact, email, gst_number) VALUES (?, ?, ?, ?, ?)").run(branch_id, name, contact, email, gst_number);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Menu
  app.get("/api/menu-categories/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM menu_categories WHERE branch_id = ?").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/menu-categories", (req, res) => {
    try {
      const { branch_id, name } = req.body;
      const result = db.prepare("INSERT INTO menu_categories (branch_id, name) VALUES (?, ?)").run(branch_id, name);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/menu-categories/:id", (req, res) => {
    try {
      const { name } = req.body;
      db.prepare("UPDATE menu_categories SET name = ? WHERE id = ?").run(name, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/menu-categories/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM menu_categories WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/menu-items/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM menu_items WHERE branch_id = ?").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/menu-items", (req, res) => {
    try {
      const { branch_id, category_id, name, price, image_url } = req.body;
      const result = db.prepare("INSERT INTO menu_items (branch_id, category_id, name, price, image_url) VALUES (?, ?, ?, ?, ?)").run(branch_id, category_id, name, price, image_url);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/menu-items/:id", (req, res) => {
    try {
      const { category_id, name, price, image_url } = req.body;
      db.prepare("UPDATE menu_items SET category_id = ?, name = ?, price = ?, image_url = ? WHERE id = ?").run(category_id, name, price, image_url, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/menu-items/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM menu_items WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tables
  app.get("/api/tables/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM tables WHERE branch_id = ?").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/tables", (req, res) => {
    try {
      const { branch_id, number, capacity } = req.body;
      const result = db.prepare("INSERT INTO tables (branch_id, number, capacity) VALUES (?, ?, ?)").run(branch_id, number, capacity);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.patch("/api/tables/:id/status", (req, res) => {
    try {
      const { status } = req.body;
      db.prepare("UPDATE tables SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Billing & Orders
  app.post("/api/orders", (req, res) => {
    try {
      const { branch_id, table_id, order_type, total_amount, items } = req.body;
      const transaction = db.transaction(() => {
        const orderResult = db.prepare("INSERT INTO orders (branch_id, table_id, order_type, total_amount, status) VALUES (?, ?, ?, ?, 'pending')").run(branch_id, table_id, order_type || 'dine_in', total_amount);
        const orderId = orderResult.lastInsertRowid;

        for (const item of items) {
          db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)").run(orderId, item.menu_item_id, item.quantity, item.price);
        }

        // Update table status if assigned
        if (table_id) {
          db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run(table_id);
        }

        return orderId;
      });

      const orderId = transaction();
      res.json({ id: orderId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/orders/:branchId", (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT o.*, t.number as table_number 
        FROM orders o 
        LEFT JOIN tables t ON o.table_id = t.id 
        WHERE o.branch_id = ? AND o.status != 'completed'
        ORDER BY o.created_at DESC
      `).all(req.params.branchId);
      
      const ordersWithItems = orders.map((o: any) => {
        const items = db.prepare(`
          SELECT oi.*, mi.name 
          FROM order_items oi 
          JOIN menu_items mi ON oi.menu_item_id = mi.id 
          WHERE oi.order_id = ?
        `).all(o.id);
        return { ...o, items };
      });
      
      res.json(ordersWithItems);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/orders-search/:branchId", (req, res) => {
    try {
      const { date, month, year } = req.query;
      let query = "SELECT o.*, t.number as table_number FROM orders o LEFT JOIN tables t ON o.table_id = t.id WHERE o.branch_id = ?";
      const params: any[] = [req.params.branchId];

      if (date) {
        query += " AND date(o.created_at) = ?";
        params.push(date);
      } else if (month && year) {
        query += " AND strftime('%m', o.created_at) = ? AND strftime('%Y', o.created_at) = ?";
        params.push(month.toString().padStart(2, '0'));
        params.push(year.toString());
      } else if (year) {
        query += " AND strftime('%Y', o.created_at) = ?";
        params.push(year.toString());
      }

      query += " ORDER BY o.created_at DESC";
      const orders = db.prepare(query).all(...params);
      
      const ordersWithItems = orders.map((o: any) => {
        const items = db.prepare(`
          SELECT oi.*, mi.name 
          FROM order_items oi 
          JOIN menu_items mi ON oi.menu_item_id = mi.id 
          WHERE oi.order_id = ?
        `).all(o.id);
        return { ...o, items };
      });
      
      res.json(ordersWithItems);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/orders/:orderId/status", (req, res) => {
    try {
      const { status } = req.body;
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.orderId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/orders/:orderId/complete", (req, res) => {
    try {
      const { payment_method, total_amount, branch_id, table_id } = req.body;
      const transaction = db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'completed', payment_method = ? WHERE id = ?").run(payment_method, req.params.orderId);
        
        if (table_id) {
          db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(table_id);
        }

        // Add to ledger
        db.prepare("INSERT INTO ledger (branch_id, type, amount, description, category) VALUES (?, 'income', ?, ?, 'billing')").run(branch_id, total_amount, `Order #${req.params.orderId} (${payment_method})`);
      });
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reports
  app.get("/api/reports/today/:branchId", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cash = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE branch_id = ? AND payment_method = 'cash' AND date(created_at) = ?").get(req.params.branchId, today);
      const bank = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE branch_id = ? AND payment_method = 'bank' AND date(created_at) = ?").get(req.params.branchId, today);
      const total = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE branch_id = ? AND date(created_at) = ?").get(req.params.branchId, today);
      res.json({ cash: (cash as any).total || 0, bank: (bank as any).total || 0, total: (total as any).total || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/ledger/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM ledger WHERE branch_id = ? ORDER BY created_at DESC").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users / Staff
  app.get("/api/users/:branchId", (req, res) => {
    try {
      res.json(db.prepare("SELECT id, username, password, role, branch_id FROM users WHERE branch_id = ?").all(req.params.branchId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/users-all", (req, res) => {
    try {
      res.json(db.prepare("SELECT id, username, password, role, branch_id FROM users").all());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/users", (req, res) => {
    try {
      const { username, password, role, branch_id } = req.body;
      const result = db.prepare("INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)").run(username, password, role, branch_id || null);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
