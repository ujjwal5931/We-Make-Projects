# We Make Projects 🎓

A full-stack digital products e-commerce platform for engineering students — built with Next.js 14, Prisma, NextAuth v5, and Tailwind CSS.

## Features

- 🛒 **Product Catalog** — Browse SolidWorks CAD files, ANSYS simulations, engineering notes, software packages
- 🔐 **Authentication** — Custom userId+password auth, separate admin login, NextAuth v5
- 🛍️ **Shopping Cart** — Zustand-powered cart with local persistence
- 💳 **UPI Payment** — Manual payment verification with QR code display per product
- 📧 **Email Delivery** — Secure download links via email after payment approval
- 👨‍💼 **Admin Dashboard** — Full order management, payment verification, product CRUD
- ⭐ **Reviews** — Verified buyers only, with star ratings
- 📊 **Analytics** — Revenue charts, order stats

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm

### 1. Clone & Install

```bash
cd "We Make Projects/we-make-projects"
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `ADMIN_USER_ID`, `ADMIN_PASSWORD` — Admin login credentials
- SMTP settings for email delivery (optional — dev mode logs emails)

### 3. Setup Database

```bash
# Option A: With Prisma v5 installed (classic ORM)
npx prisma@5 migrate dev --name init
npx prisma@5 db seed

# Option B: Database push (no migration history)
npx prisma@5 db push
npx prisma@5 db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Admin Panel

Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Login with your `ADMIN_USER_ID` and `ADMIN_PASSWORD` from `.env`.

---

## Demo Credentials (after seeding)

| Role | User ID | Password |
|------|---------|----------|
| Admin | `admin` | `Admin@123` |
| Customer | `student_arjun` | `customer123` |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (store)/         # Customer storefront
│   │   ├── page.tsx     # Home page
│   │   ├── products/    # Product listing + detail
│   │   ├── cart/        # Shopping cart
│   │   ├── checkout/    # Checkout flow
│   │   ├── payment/     # UPI payment + submission
│   │   ├── account/     # My Orders, Profile
│   │   └── ...          # FAQ, Contact, Terms, Privacy
│   ├── admin/           # Admin dashboard
│   │   ├── page.tsx     # Dashboard with charts
│   │   ├── products/    # Product CRUD
│   │   ├── orders/      # Order management + verification
│   │   ├── categories/  # Category management
│   │   ├── payment-methods/ # QR code management
│   │   ├── customers/   # Customer list
│   │   ├── reviews/     # Review moderation
│   │   ├── audit-logs/  # Admin activity log
│   │   └── settings/    # Store settings
│   └── api/             # All API routes
├── components/
│   ├── store/           # Storefront components
│   ├── admin/           # Admin components
│   ├── ui/              # shadcn/ui components
│   └── providers/       # Context providers
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client
│   ├── email.ts         # Nodemailer + templates
│   └── auth-helpers.ts  # Server-side auth utilities
└── store/
    └── cart-store.ts    # Zustand cart store
```

## Payment Flow

1. Customer adds products → checkout → order created
2. Customer sees UPI QR per product → pays → submits UTR + screenshot
3. Admin reviews in `/admin/orders/[id]` → verifies payment in bank app → approves or rejects
4. On approval: download tokens created, email sent with secure download links
5. Customer downloads from email link or My Orders page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v5 (beta) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand (cart) |
| Email | Nodemailer |
| Charts | Recharts |
| File Upload | Native FormData / fs |

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Notes

- Digital files are stored in `uploads/products/` (outside `public/`) — never publicly accessible
- Payment screenshots are served via authenticated API routes
- All admin actions are logged in `AdminAuditLog`
- SMTP not required for development — emails are logged to console

---

*Built for engineering students, by engineering students. — We Make Projects*
