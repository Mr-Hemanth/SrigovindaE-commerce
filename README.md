# Sri Govinda Collections

A production e-commerce storefront and admin platform for a jewellery business (German Silver, One Gram Gold, Panchaloha, and Gift Articles), built with Next.js and Firebase.

Live at **[srigovindacollections.com](https://www.srigovindacollections.com)**.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS v4 |
| Database & Auth | Firebase (Firestore, Firebase Auth — email/password + Google OAuth) |
| Payments | Razorpay (online) + Cash on Delivery |
| Shipping | Shiprocket (real shipment creation + tracking) |
| Email | Resend (transactional) |
| Images | Cloudinary (admin uploads) + `next/image` |
| PDF generation | jsPDF (client-side invoice download) |
| Testing | Jest |

## Features

### Customer-facing

- Email/password and Google sign-in
- Product catalog: categories, subcategories, search, filters (material, occasion, color, gifting tier, price range), sort, grid/list view
- Product variants (size/option) with independent pricing and stock per variant
- Wishlist, cart, coupon codes
- Checkout: Razorpay online payment or COD (with a security-code confirmation step), server-side price/stock re-validation on every order
- Real shipment creation and tracking via Shiprocket, with an honest order-tracking page (no fake courier data)
- Product reviews and star ratings
- Newsletter signup
- Abandoned-cart recovery emails (daily cron)
- "Spin to Win" coupon wheel (once per customer per 30 days)
- One-click downloadable PDF invoices
- Profile management with up to 4 saved addresses

### Admin panel (`/admin`)

- Dashboard: revenue trend, sales by category, best sellers, low-stock alerts, promo banner control
- Product management: full CRUD, variants, Cloudinary photo upload, one-click visibility toggle, auto-derived gifting tier (from price) and material (from category)
- Order management: status updates, manual tracking-number entry
- Coupon management
- Review moderation
- Newsletter subscriber list
- **Customer CRM**: directory of every customer with lifetime stats (orders, spend, avg order value), auto-segmentation (VIP / Repeat / Active / New / At Risk / No Orders), full order history per customer, admin notes, CSV export

### Security

- Firestore security rules enforce ownership and admin checks on every collection — orders can only ever be created server-side after payment verification
- Prices and stock are always recomputed server-side at checkout; the client is never trusted
- CSP, HSTS, and standard security headers on every response
- User-supplied text is escaped before going into transactional emails or JSON-LD (no HTML/script injection)

### SEO

- Per-page and per-product metadata (dynamic, pulled from real product data)
- JSON-LD structured data: `Organization` sitewide, `Product` (with price/availability/`AggregateRating`) on every product page
- Dynamic `sitemap.xml` (auto-includes every active product) and `robots.txt`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for the full list with setup notes for each. You'll need accounts with: Firebase, Razorpay, Resend, Cloudinary, and Shiprocket. None of these are optional for a full production setup, but the app degrades gracefully in local dev if some are missing (e.g. emails just get skipped with a console warning instead of the app crashing).

### Creating an admin account

1. Sign up normally through the app
2. In Firebase Console → Firestore → `users` → find your user document → add a field `isAdmin: true` (boolean)
3. Log out and back in — you'll now see the Admin Panel link in the account menu

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm start        # run a production build locally
npm run lint     # ESLint
npm test         # Jest unit tests
```

## Deployment

Deployed on Vercel. Firestore security rules are deployed separately (not via `vercel deploy`) — see `firestore.rules` and deploy via the Firebase CLI or console. A Vercel Cron job (`vercel.json`) triggers the abandoned-cart email job daily; it authenticates via the `CRON_SECRET` env var.

## Project structure

```
app/                    Next.js App Router pages + API routes
  admin/                 Admin panel pages
  api/                    Server routes (checkout, admin actions, cron, contact)
  product/[id]/           Product detail page
  ...                     Static/customer pages
components/              React components (admin/, navbar/, orders/, ...)
contexts/                React context providers (Auth, Cart, Wishlist, Notification)
lib/                     Pure business logic + integrations, most with matching *.test.js
  notify/                  Email templates (Resend)
  firebase/                Client + Admin SDK setup
  data/                    Static category list
firestore.rules          Firestore security rules (source of truth, deploy separately)
```
