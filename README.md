# Arvitta — Intelligent Payment Orchestration Suite

Arvitta is a premium, high-density financial operations dashboard and automated vendor ledger designed to orchestrate and streamline B2B payouts. Built on Next.js 16 (App Router), Mongoose, and TailwindCSS v4, Arvitta combines a water-clear glassmorphism visual layout with algorithmic payment allocation engines.

---

## Key Core Capabilities

*   **⚡ Smart Auto-Match Engine**: Automatically runs a greedy allocation algorithm when bank credits are received, calculating optimal payout recommendations sorted by supplier priority (`critical` > `high` > `medium` > `low`) and oldest outstanding ledger dates.
*   **💸 High-Fidelity Batch Payouts**: Facilitates multiple vendor payments (UPI, NEFT, RTGS, IMPS) in a single API batch, backed by secure transaction PIN validation and immediate ledger balances reconciliation.
*   **🔒 Security Auditing Feed**: A real-time, sandbox security logging monitor mapping gateway handshakes, JWT state encryption, database syncs, and auto-match triggers.
*   **🚀 One-Click Sandbox Seeder**: Includes a demo login interface (`🚀 Explore with Demo Data`) that automatically drops and populates the database with realistic agricultural suppliers, pre-logged transaction entries, bank credits history, and real-time socket events log.
*   **💎 Premium Glassmorphism UI**: Uses high-refraction glass panel layouts (`backdrop-filter: blur(30px) saturate(1.2)`) and background particles designed specifically for modern business operators.

---

## Technology Architecture Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Core server actions and React Server Components. |
| **Styling** | TailwindCSS v4 + Vanilla CSS | Modern CSS variables with custom animations. |
| **Database** | Mongoose (MongoDB Atlas) | Shared database cluster utilizing prefixed (`pf_`) models. |
| **Real-Time** | Socket.io / Event Triggers | Instant notifications and progress bars. |
| **Authentication** | JWT (JSON Web Tokens) | Secure session management. |

---

## Mongoose Schema Definitions

All documents are stored inside MongoDB with optimized indexes for quick lookups:

### Business Account Model (`PFBusiness`)
Tracks business profiles, PIN validation hashes, and Razorpay contacts.
```typescript
{
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string; // Hashed (bcryptjs)
  pin: string;      // Hashed transaction PIN
  gstin?: string;
  address: string;
}
```

### Supplier Model (`PFSupplier`)
Maintains vendor profiles, Category classifications, outstanding balances, and bank details.
```typescript
{
  businessId: mongoose.Schema.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  category: 'dairy' | 'grain' | 'packaging' | 'transport' | 'equipment' | 'services' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  totalDue: number;
  totalPaid: number;
  lastPaidAt: Date;
  bankDetails: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    holderName?: string;
    upiId?: string;
  }
}
```

---

## Getting Started

### 1. Prerequisites
Ensure you have **Node.js v18+** and a running **MongoDB** instance (or MongoDB Atlas connection string).

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the project:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Arvitta
JWT_SECRET=your_jwt_signing_key_here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev -- -p 3001
```
Navigate to `http://localhost:3001` in your browser.

---

## API Routes Index

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Register a new business profile. |
| `/api/auth/login` | `POST` | Authenticate and issue JWT. |
| `/api/auth/demo-login`| `POST` | Instant sandbox access & seeder engine. |
| `/api/account` | `GET` / `POST`| Retrieve balance / Simulate bank credits. |
| `/api/suppliers` | `GET` / `POST`| Query vendor list / Add new suppliers. |
| `/api/payments/suggest`| `GET` | Calculate smart auto-match recommendations. |
| `/api/payments/execute`| `POST` | Authorize and execute batch payout queue. |
| `/api/notifications` | `GET` | Fetch unread system notifications. |

---

## Contributions Graph Setup
To link your commits to your GitHub contribution chart, verify your terminal settings are configured with your GitHub profile:
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@users.noreply.github.com"
```
