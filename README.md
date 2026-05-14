# 🛍️ NextLevel — Premium Streetwear E-Commerce Platform

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/TailwindCSS-CDN-38B2AC?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</div>

<br/>

> A full-stack, high-converting clothing e-commerce platform built with Express.js, SQLite, and vanilla JS. Features user auth, cart, order tracking, and a premium UI.

---

## ✨ Features

| Feature | Status |
|---|---|
| 🔐 User Registration & Login (bcrypt) | ✅ |
| 🛍️ Product Catalog with 10 items | ✅ |
| 🔍 Search & Category Filters | ✅ |
| 🛒 Persistent Cart (per user) | ✅ |
| 💰 Discounts + Savings Display | ✅ |
| 📦 Order Placement & Tracking | ✅ |
| ❌ Order Cancellation | ✅ |
| 📺 YouTube Embed (NextLevel__1) | ✅ |
| 📱 Fully Responsive (Mobile First) | ✅ |
| 🎨 Premium Black + Lime Aesthetic | ✅ |

---

## 📁 Project Structure

```
nextlevel/
├── server.js          # Express app entry point
├── database.js        # SQLite DB setup + seed data
├── package.json
├── routes/
│   ├── auth.js        # /api/auth — register, login, logout
│   ├── products.js    # /api/products — list, search, filter
│   ├── cart.js        # /api/cart — add, update, remove
│   └── orders.js      # /api/orders — place, track, cancel
└── public/
    └── index.html     # Complete frontend (HTML + Tailwind + JS)
```

---

## 🚀 Quick Start (VS Code / Terminal)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

Check versions:
```bash
node -v   # should be 18+
npm -v    # should be 9+
```

### 2. Clone / Download the Project

```bash
git clone https://github.com/YOUR_USERNAME/nextlevel-store.git
cd nextlevel-store
```

Or just download the ZIP and extract it.

### 3. Install Dependencies

```bash
npm install
```

This installs: Express, better-sqlite3, bcryptjs, express-session, connect-sqlite3, uuid.

### 4. Start the Server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

### 5. Open in Browser

```
http://localhost:3000
```

That's it! 🎉 The database is created and seeded automatically on first run.

---

## ⚙️ Configuration

### Change Port

The server runs on port `3000` by default. To change it:

```bash
# Linux/Mac
PORT=8080 npm start

# Windows (CMD)
set PORT=8080 && npm start

# Windows (PowerShell)
$env:PORT=8080; npm start
```

### Add Your YouTube Video

Open `public/index.html` and find this section (around line 270):

```html
<iframe
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  ...
```

Replace `dQw4w9WgXcQ` with your actual YouTube video ID.

**How to get the YouTube video ID:**
- YouTube URL: `https://www.youtube.com/watch?v=ABC123xyz`
- Your embed link: `https://www.youtube.com/embed/ABC123xyz`

### Add Your Logo

Open `public/index.html` and find:

```html
<img src="YOUR_LOGO_HERE.png" alt="NL Logo" ... />
```

Replace `YOUR_LOGO_HERE.png` with:
- A URL to your logo image, OR
- Put your logo file inside the `public/` folder and use just the filename (e.g. `logo.png`)

### Change Session Secret

In `server.js`, change:
```javascript
secret: 'nextlevel-secret-key-2024',
```
To any strong random string in production.

---

## 🗄️ Database Schema

SQLite database (`nextlevel.db`) is auto-created. Schema:

### `users`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto increment |
| name | TEXT | Full name |
| email | TEXT UNIQUE | Login email |
| password | TEXT | bcrypt hashed |
| created_at | TEXT | Timestamp |

### `products`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto increment |
| name | TEXT | Product name |
| category | TEXT | Category (T-Shirts, Hoodies...) |
| description | TEXT | Product details |
| original_price | REAL | MRP |
| discount_pct | INTEGER | Discount % |
| final_price | REAL | Selling price |
| image_url | TEXT | Unsplash image URL |
| sizes | TEXT | Comma-separated (S,M,L,XL) |
| stock | INTEGER | Available stock |

### `cart_items`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK → users | Owning user |
| product_id | FK → products | Product |
| size | TEXT | Selected size |
| quantity | INTEGER | How many |

### `orders`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK → users | Ordering user |
| total_amount | REAL | Final payable |
| total_savings | REAL | How much saved |
| status | TEXT | Ordered/Shipping/Done/Cancelled |
| address | TEXT | Delivery address |
| payment_method | TEXT | COD/UPI/Card/NetBanking |

### `order_items`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| order_id | FK → orders | Parent order |
| product_id | FK → products | Product |
| product_name | TEXT | Snapshot of name |
| size | TEXT | Size ordered |
| quantity | INTEGER | Qty ordered |
| price | REAL | Price at time of order |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | Register user |
| POST | `/api/auth/login` | `{email, password}` | Login |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | — | Current session |

### Products
| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/api/products` | `?category=&search=` | All products |
| GET | `/api/products/:id` | — | Single product |
| GET | `/api/products/meta/categories` | — | All categories |

### Cart
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/cart` | — | Get user's cart |
| POST | `/api/cart/add` | `{product_id, size, quantity}` | Add item |
| PUT | `/api/cart/update/:id` | `{quantity}` | Update qty |
| DELETE | `/api/cart/remove/:id` | — | Remove item |
| DELETE | `/api/cart/clear` | — | Empty cart |

### Orders
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/orders/place` | `{address, payment_method}` | Place order |
| GET | `/api/orders/my` | — | User's orders |
| PUT | `/api/orders/cancel/:id` | — | Cancel order |
| PUT | `/api/orders/advance/:id` | — | Advance status (demo) |

---

## 🎨 Customization

### Change Brand Colors

In `public/index.html`, find:

```javascript
colors: {
  accent: '#E8FF00',       // Change this — lime yellow
  'accent-dark': '#c8db00',
  dark: '#0A0A0A',         // Near black
  mid: '#1A1A1A',
}
```

### Add More Products

Edit `database.js` and add to the `products` array:

```javascript
[
  'Your Product Name',
  'Category',
  'Description here.',
  2999,    // original price
  25,      // discount %
  2249,    // final price (2999 * 0.75)
  'https://your-image-url.jpg',
  'S,M,L,XL'
],
```

Delete `nextlevel.db` and restart the server to re-seed.

### Change Fonts

In `public/index.html`, replace the Google Fonts link with your preferred fonts and update:

```css
font-family: { display: ['Your Display Font'], body: ['Your Body Font'] }
```

---

## 🌐 Deploy to GitHub

```bash
# Init git (if not already)
git init
git add .
git commit -m "🚀 Initial NextLevel store"

# Add remote & push
git remote add origin https://github.com/YOUR_USERNAME/nextlevel-store.git
git branch -M main
git push -u origin main
```

### Deploy to Railway (Free hosting)

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **New Project → Deploy from GitHub Repo**
4. Select your repo → Deploy!

Railway auto-detects Node.js and runs `npm start`.

### Deploy to Render (Free hosting)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. **New → Web Service → Connect GitHub**
4. Build Command: `npm install`
5. Start Command: `npm start`

---

## 🐛 Troubleshooting

**`better-sqlite3` install fails:**
```bash
# Try rebuilding native modules
npm install --build-from-source
# OR use pre-built
npm install better-sqlite3 --ignore-scripts
```

**Port already in use:**
```bash
# Kill whatever's on port 3000
npx kill-port 3000
# Then restart
npm start
```

**Database issues — reset from scratch:**
```bash
rm nextlevel.db sessions.db
npm start
```

---

## 📝 License

MIT © 2024 NextLevel Store

---

<div align="center">
  Built with ❤️ for the streets.<br/>
  <strong>NEXTLEVEL — Elevate Your Wardrobe.</strong>
</div>
