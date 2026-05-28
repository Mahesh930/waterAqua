# 📂 AquaHome Frontend Directory Structure Guide

Welcome! This folder structure has been completely redesigned to be **easy to understand for absolute beginners, neat and clean, and maintain top industry standards**. 

---

## 🌟 The Big Picture

Instead of dumping files together based on *what type of file* they are (like separating all components from all pages), we organize them by **what feature** they belong to. This is called a **Feature-Based Architecture**.

Here is how the project's frontend code is organized:

```
src/
├── App.jsx               # 🗺️ Central router and application entry point
├── main.jsx              # 🚀 Boots up the React application
├── index.css             # 🎨 Global styles & Tailwind configuration
├── App.css               # 💅 App-specific styles
│
├── features/             # 🔥 CORE FEATURES: Grouped by user domains
│   ├── auth/             # 🔑 Everything related to registration & login
│   ├── customer/         # 🚰 Everything a customer uses (cart, products, orders)
│   ├── supplier/         # 🚛 Everything a supplier uses (pincodes, products, orders)
│   └── admin/            # 📊 Everything an admin uses (commission, users, analytics)
│
├── shared/               # 🤝 SHARED CODE: Used across multiple features
│   ├── components/       # 🧱 DashboardLayout, ProtectedRoutes, NavLinks
│   ├── hooks/            # 🪝 use-mobile, use-pincode, use-toast
│   └── utils/            # 🧰 Calculations, formatters, and mock data
│
├── ui/                   # 🎨 DESIGN SYSTEM: 49 Shadcn primitives (Buttons, Dialogs, etc.)
│
├── contexts/             # 🌐 GLOBAL CONTEXTS: AuthContext state
│
├── store/                # ⚡ STATE MANAGEMENT: Redux Toolkit (api endpoints, slices)
│
└── pages/                # 🌍 PUBLIC PAGES: Landing page (Index.jsx) and 404
```

---

## 🔍 Deep Dive Into Folders

### 1. `features/`
Every feature has its own folder containing its specific pages, hooks, and components.
- **`auth/`**: Custom sign-in/up logic and design.
- **`customer/`**: Cart operations, order placing, real-time supplier browsing, and chatbot support.
- **`supplier/`**: Interactive service area configuration, driver details, and reports charts.
- **`admin/`**: High-impact admin overview card visualizers and commissions management.

### 2. `shared/`
Reusable logic that isn't specific to any one feature:
- **`shared/components/DashboardLayout.jsx`**: The glassmorphic dark-theme dashboard wrapper used by Customer, Supplier, and Admin alike.
- **`shared/hooks/use-toast.js`**: Hook for spawning alert popups.
- **`shared/utils/utils.js`**: Standard Tailwind styling helpers.

### 3. `ui/`
These are your building blocks (Shadcn/Radix components). Think of them like Lego bricks (Buttons, Checkboxes, Inputs, Tables). If you want to modify how a button looks globally, this is where you go.

---

## 🚀 Why is this better for beginners?
1. **Easy to find what you need**: If there is an issue with the "Cart", you immediately know to open `src/features/customer/pages/Cart.jsx` and `src/features/customer/hooks/use-cart.js`.
2. **Clear Boundaries**: You immediately know which files are private to a feature and which are reusable across the whole app (in `shared/`).
3. **No deep folder nesting**: Shadcn primitives are now located directly under `src/ui/` instead of deep inside nested `components/ui/` subdirectories.

Happy coding! 🌊💧
