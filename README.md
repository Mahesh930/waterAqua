# AquaHome - Smart Water Delivery Platform

AquaHome is a modern, production-grade water delivery platform built on the MERN (MongoDB, Express, React, Node.js) stack. It streamlines the water supply chain by connecting customers with water suppliers, managing inventories, handling online/cash payments, and providing real-time delivery tracking.

---

## Key Features & Business Logic

### Security & Architecture
- **Secured Session Management**: JWTs stored in `HttpOnly` secure cookies to prevent XSS-based token theft.
- **Strict Role-Based Access Control (RBAC)**: Roles enforced at routes: `customer`, `supplier`, `admin`. Admin self-registration is blocked.
- **Request Sanitization & Rate Limiting**: Safeguards against NoSQL injection using `express-mongo-sanitize` and brute-force protection using `express-rate-limit` on authentication and OTP endpoints.
- **Environment Safety**: Validator script asserting critical configurations on startup to prevent server runs with partial/unconfigured environments.

### Transactional Integrity & Real-Time Performance
- **Mongoose Session Transactions**: Checkout and cancellation operations are wrapped in transaction sessions to ensure database updates succeed or roll back entirely.
- **Atomic Stock Increments**: Inventory counts are verified and decremented/restored atomically using database-level locks (`$inc` and `{ stock: { $gte: quantity } }`) to prevent race conditions.
- **Scoped Real-Time Alerts**: WebSockets (Socket.io) uses supplier-specific rooms (`supplier:${supplierId}`) for incoming orders and status updates, avoiding global broadcast data leaks.
- **Structured Request Logging**: Structured JSON logger using `pino` with unique Correlation IDs injected into request contexts for seamless cross-service debugging.
- **Audit Logging**: Structured audit logs capturing all critical administrative, financial, and order-state actions in the database.

### Core Workflows
- **Secure Delivery OTP Verification**: Delivery is completed via 6-digit random codes with a 1-hour expiration and a 5-attempt brute-force limit. Suppliers cannot view the OTP before verification.
- **Order Cancellation**: Customers can cancel orders in `placed` or `confirmed` status, automatically restoring stock back to the inventory.
- **Referrals**: Seamless referral system that generates unique invitation codes and credits reward points to both parties upon the referred customer's first completed delivery.
- **Supplier Reviews & Ratings**: Post-delivery feedback submissions that dynamically recalculate the supplier's average rating.

### Frontend Experience
- **Performance & Splitting**: Route code-splitting using `React.lazy()` and `Suspense` with graceful loading skeletons.
- **Resilient UI**: Root-level React `ErrorBoundary` fallback to capture render crashes.
- **Global Theme Engine**: Smooth dark/light mode switching using `next-themes`.
- **Localization (i18n)**: Multi-language support configuration via `react-i18next` (locales for English and Hindi).
- **PWA Capabilities**: Service worker registration and custom Web App Manifest configuration for offline capability and mobile installs.

---

## Tech Stack
- **Frontend:** React, Redux Toolkit, RTK Query, TailwindCSS, Shadcn UI
- **Backend:** Node.js, Express, Socket.io, Mongoose (MongoDB)
- **Log Engine:** Pino & Pino-Pretty
- **Validation:** Zod Schema Validation (Request Validation Middleware)
- **Testing:** Jest, Supertest, Vitest, React Testing Library, Playwright

---

## Project Structure
```text
/aquahome
├── /api                 # Express API Backend
│   ├── /src
│   │   ├── /config      # DB connections, validation scripts
│   │   ├── /controllers # Business logic handlers
│   │   ├── /middleware  # Auth, validation, rate limiting
│   │   ├── /models      # Mongoose schemas
│   │   ├── /routes      # REST endpoints definitions
│   │   ├── /utils       # Logger, pagination utilities
│   │   └── server.js    # Entry point
│   ├── /tests           # Jest & Supertest suite
│   └── package.json
│
├── /src                 # React Frontend
│   ├── /contexts        # Context hooks (Auth)
│   ├── /features        # Feature modules (auth, customer, supplier, admin)
│   ├── /shared          # Global layouts, utils, hooks, components
│   ├── /store           # RTK query slices
│   ├── /test            # Vitest unit test files
│   ├── App.jsx          # App routing
│   └── main.jsx
├── playwright.config.js # Playwright E2E configuration
├── vite.config.js       # Vite configuration
└── package.json
```

---

## Installation & Setup

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Mahesh930/waterAqua.git
cd waterAqua

# Install Frontend dependencies (root folder)
npm install

# Install Backend dependencies (api folder)
cd api
npm install
```

### 2. Configure Environment Variables
Create an `.env` file in the `/api` directory. Reference `/api/.env.example` for the structure:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/aquahome
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
CORS_ORIGIN=http://localhost:8080
```

### 3. Run Locally (Development)
Open two terminal windows:
```bash
# Terminal 1: Run the Backend server (from /api directory)
cd api
npm run dev

# Terminal 2: Run the Frontend client (from root directory)
npm run dev
```

---

## Running the Test Suites

### 1. Backend Integration Tests (Jest & Supertest)
Runs controller tests including atomic checks, authorization, and checkout transactions without database requirements.
```bash
cd api
npm run test
```

### 2. Frontend Unit & Component Tests (Vitest & RTL)
Runs frontend component assertions.
```bash
npm run test
```

### 3. End-to-End Tests (Playwright)
Executes cross-browser flows utilizing mocked backend APIs.
```bash
# Run tests
npx playwright test
```

---

## CI/CD Pipeline
An automated GitHub Actions workflow is configured in `.github/workflows/ci.yml`. It triggers on push and pull requests to `main`/`master` to compile, lint, run Vitest and Jest tests, and check the application build.
