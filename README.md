<div align="center">

# MegaBazar — Full-Stack E-Commerce Platform

**A production-ready, feature-rich e-commerce platform built with Laravel 12 & React 19**

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup (Laravel)](#2-backend-setup-laravel)
  - [3. Frontend Setup (React)](#3-frontend-setup-react)
  - [4. Database Setup](#4-database-setup)
  - [5. Run the Project](#5-run-the-project)
- [Default Login Credentials](#default-login-credentials)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [WebSocket / Real-time Chat](#websocket--real-time-chat)
- [Payment Integration](#payment-integration)
- [Roles & Permissions](#roles--permissions)
- [Contributing](#contributing)

---

## Overview

**MegaBazar** is a complete, production-ready e-commerce web application. It features a **Laravel 12 REST API** backend with real-time capabilities and a **React 19 SPA** frontend with a full-featured admin dashboard. The platform supports product catalogs, cart & checkout, bKash payments, real-time chat support, review systems, ERP inventory management, coupon campaigns, and much more.

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| PHP | 8.2+ | Runtime |
| Laravel | 12 | REST API Framework |
| Laravel Sanctum | Latest | API Token Authentication |
| Laravel Reverb | Latest | WebSocket Server (Real-time) |
| Laravel Socialite | 5.26+ | Social Login (Google, Facebook) |
| Intervention Image | Latest | Image Upload & Optimization |
| MySQL | 8+ | Primary Database |
| PHPUnit | 11.5 | Testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI Framework |
| Vite | 8+ | Build Tool & Dev Server |
| React Router DOM | 6 | Client-side Routing |
| Zustand | 5 | State Management (Auth, Cart, Wishlist) |
| Axios | 1.15 | HTTP Client |
| Bootstrap | 5.3 | UI Components & Grid |
| Bootstrap Icons | 1.13 | Icon Library |
| Pusher-js | 8.5 | WebSocket Client |
| React Toastify | 11 | Toast Notifications |

### Infrastructure
| Tool | Purpose |
|---|---|
| XAMPP | Apache + MySQL + PHP local server |
| Composer | PHP package manager |
| npm | Node.js package manager |

---

## Features

### Customer-Facing
- **Product Catalog** — categories, subcategories, product variants (size/color), attributes
- **Advanced Search & Filter** — by category, price range, rating
- **Shopping Cart** — persistent cart with quantity management and free shipping threshold
- **Wishlist** — save products for later
- **Checkout** — multiple saved addresses, coupon codes, payment method selection
- **bKash Payment** — integrated payment gateway (sandbox ready)
- **Cash on Delivery** — COD option at checkout
- **Order Tracking** — visual progress bar with order status updates (MB-XXXXX numbering)
- **5-Star Reviews** — with photo/video uploads and verified buyer badge
- **Q&A System** — nested comment threads on product pages
- **Real-time Chat** — floating widget powered by Laravel Reverb WebSockets
- **Support Tickets** — offline ticket system (auto-numbered TKT-XXXXX)
- **Social Login** — Google & Facebook OAuth (credentials required)
- **OTP Verification** — phone number verification via OTP
- **Multi-language Ready** — i18n translation support

### Admin Dashboard
- **Overview Dashboard** — sales stats, charts, CSV export
- **Order Management** — status workflow, invoice generation, bulk actions
- **Product Management** — CRUD, image gallery, variant management
- **Customer Management** — LTV metrics, role assignment, account control
- **Review Moderation** — approve/reject reviews and Q&A
- **Coupon Campaigns** — percentage/fixed discounts with expiry and usage limits
- **Banner Management** — promotional banners
- **Chat Inbox** — respond to customer chats, canned responses
- **ERP Module** — suppliers, purchase orders, inventory logs
- **Fraud Detection** — fraud log review
- **Settings Panel** — shipping, tax, payment gateway configuration
- **Role-Based Access Control** — `super_admin`, `admin`, `order_manager`, `customer`

---

## Prerequisites

Make sure you have the following installed before starting:

- **XAMPP** (Apache + MySQL + PHP 8.2+) — [Download](https://www.apachefriends.org/)
- **Composer** 2+ — [Download](https://getcomposer.org/)
- **Node.js** 18+ & **npm** 9+ — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)

> **Note:** Start XAMPP's **Apache** and **MySQL** modules before running the project.

---

## Project Structure

```
MegaBazar/
├── backend/                    # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/        # Customer-facing API controllers
│   │   │   │   └── Admin/      # Admin panel API controllers
│   │   │   └── Middleware/
│   │   ├── Models/             # 22 Eloquent models
│   │   └── Events/             # Real-time event classes (chat)
│   ├── database/
│   │   ├── migrations/         # 26 migration files
│   │   └── seeders/            # Default data seeders
│   ├── routes/
│   │   └── api.php             # 75+ API endpoints
│   ├── .env.example            # Environment template
│   └── composer.json
│
├── frontend/                   # React 19 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   └── common/         # ProductCard, StarRating, ChatWidget, etc.
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, SocialCallback
│   │   │   ├── customer/       # Home, Products, Cart, Checkout, Orders, etc.
│   │   │   └── admin/          # Dashboard, Products, Orders, Customers, etc.
│   │   ├── store/              # Zustand: authStore, cartStore, wishlistStore
│   │   ├── services/           # api.js — Axios instance with interceptors
│   │   ├── i18n/               # translations.js
│   │   └── App.jsx             # Router and route definitions
│   ├── .env.example
│   └── package.json
│
├── allcommand.txt              # Full reference: commands, setup notes, tips
└── README.md
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/megabazar.git
cd megabazar
```

> Or download the ZIP and extract it to your XAMPP `htdocs` folder:
> `C:\xampp\htdocs\MegaBazar`

---

### 2. Backend Setup (Laravel)

```bash
cd backend
```

**Install PHP dependencies:**
```bash
composer install
```

**Copy the environment file:**
```bash
cp .env.example .env
```

**Generate the application key:**
```bash
php artisan key:generate
```

**Configure your `.env` file** (see [Environment Variables](#environment-variables) section below).

**Create the storage symlink** (for file serving):
```bash
php artisan storage:link
```

---

### 3. Frontend Setup (React)

```bash
cd ../frontend
```

**Install Node dependencies:**
```bash
npm install
```

**Copy the environment file:**
```bash
cp .env.example .env
```

**Edit `frontend/.env`:**
```env
VITE_API_URL=http://localhost/MegaBazar/backend/public/api
VITE_STORAGE_URL=http://localhost/MegaBazar/backend/public/storage
VITE_REVERB_APP_KEY=megabazar_key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

> Adjust `VITE_API_URL` to match your actual XAMPP server path.

---

### 4. Database Setup

1. Open **phpMyAdmin** at `http://localhost/phpmyadmin`
2. Create a new database named **`megabazar`**
3. Make sure your `backend/.env` has:
   ```env
   DB_DATABASE=megabazar
   DB_USERNAME=root
   DB_PASSWORD=
   ```
4. Run migrations and seed default data:
   ```bash
   cd backend
   php artisan migrate --seed
   ```

This creates all 26 tables and seeds default admin, manager, and customer accounts.

---

### 5. Run the Project

You need **3 terminal windows** running simultaneously:

**Terminal 1 — Frontend Dev Server:**
```bash
cd frontend
npm run dev
```
> Runs at: `http://localhost:5173`

**Terminal 2 — Laravel Queue Worker** (for background jobs & notifications):
```bash
cd backend
php artisan queue:work
```

**Terminal 3 — Laravel Reverb WebSocket Server** (for real-time chat):
```bash
cd backend
php artisan reverb:start
```
> Runs at: `ws://localhost:8080`

> **Backend API** is served by XAMPP Apache at:
> `http://localhost/MegaBazar/backend/public/api`

---

## Default Login Credentials

After running `php artisan migrate --seed`, use these accounts:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@megabazar.com | password |
| Order Manager | manager@megabazar.com | password |
| Customer | customer@megabazar.com | password |

> **Admin Dashboard:** `http://localhost:5173/admin/dashboard`
>
> **Customer Store:** `http://localhost:5173`

---

## Environment Variables

### `backend/.env` — Key Variables

```env
APP_NAME=MegaBazar
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=megabazar
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database

REVERB_APP_ID=megabazar001
REVERB_APP_KEY=megabazar_key
REVERB_APP_SECRET=megabazar_secret
REVERB_HOST=localhost
REVERB_PORT=8080

# Social Login (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost/MegaBazar/backend/public/api/auth/google/callback

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost/MegaBazar/backend/public/api/auth/facebook/callback

# bKash Payment (sandbox)
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
```

---

## API Overview

The backend exposes **75+ REST API endpoints** under `/api`.

### Public Endpoints (No Auth Required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Customer registration |
| POST | `/auth/login` | Login (returns Sanctum token) |
| GET | `/products` | List all products |
| GET | `/products/{slug}` | Single product details |
| GET | `/categories` | All categories |
| GET | `/banners` | Promotional banners |
| POST | `/otp/send` | Send phone OTP |
| POST | `/otp/verify` | Verify OTP |

### Protected Endpoints (Requires Bearer Token)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/profile` | Current user profile |
| GET/POST | `/cart` | Cart management |
| POST | `/orders` | Place new order |
| GET | `/orders` | Order history |
| POST | `/wishlist/toggle` | Toggle wishlist item |
| POST | `/reviews` | Submit product review |
| POST | `/bkash/initiate` | Initiate bKash payment |
| GET | `/chat/room` | Get/create chat room |
| POST | `/chat/messages` | Send chat message |

### Admin Endpoints (Requires Admin Role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Stats & analytics |
| GET/POST/PUT/DELETE | `/admin/products` | Product CRUD |
| GET/PUT | `/admin/orders` | Order management |
| GET | `/admin/customers` | Customer list & LTV |
| GET/POST | `/admin/coupons` | Coupon campaigns |
| GET | `/admin/chat/inbox` | Customer chat inbox |
| POST | `/admin/chat/reply` | Reply to customer |
| GET | `/admin/settings` | System settings |

---

## WebSocket / Real-time Chat

MegaBazar uses **Laravel Reverb** as the WebSocket server and **Pusher-js** on the frontend.

**How it works:**
1. Customer opens the floating chat widget on any page
2. A `chat_room` is created per user (one room per customer)
3. Messages are stored in the `chat_messages` table
4. Laravel broadcasts a `NewChatMessage` event via Reverb
5. Admin receives messages in real-time on the chat inbox page

**To enable:** Start the Reverb server with `php artisan reverb:start` and ensure the Reverb config in `backend/.env` matches the values in `frontend/.env`.

---

## Payment Integration

### bKash (Bangladesh Mobile Payment)
- Integrated using the tokenized payment API
- **Sandbox mode** by default — get credentials from your [bKash Developer Portal](https://developer.bka.sh/)
- Full transaction audit log stored in `bkash_transactions` table
- Supports payment initiation, OTP verification, and execution

### Cash on Delivery (COD)
- Available by default, no configuration needed

---

## Roles & Permissions

| Role | Access |
|---|---|
| `super_admin` | Full access to all admin features + settings |
| `admin` | Products, orders, customers, coupons, banners, chat |
| `order_manager` | Orders and customer inquiries only |
| `customer` | Storefront, cart, orders, reviews, chat |

Roles are managed via the `users.role` column and enforced in `AdminMiddleware.php` and route groups in `api.php`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add: your feature description"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

<div align="center">

Built with by the MK Store Team

</div>
