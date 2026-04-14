# SpendWise — Expense Tracker

A mobile-first, full-stack expense tracking and money management application with a clean, modern fintech-style UI.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **Docker** (for PostgreSQL)

### 1. Start the Database
```bash
docker run -d --name postgres-expense-tracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=expense_tracker \
  -p 5432:5432 postgres
```

### 2. Setup the Backend
```bash
cd server
cp .env.example .env   # Edit if needed
npm install
npx prisma db push     # Push schema to DB
npx prisma generate    # Generate client
npm run db:seed         # Seed demo data
npm run dev             # Start server at :3001
```

### 3. Setup the Frontend
```bash
cd client
npm install
npm run dev             # Start client at :5173
```

### 4. Open the App
Visit [http://localhost:5173](http://localhost:5173)

**Demo Login:**
- Phone: `+1234567890`
- Password: `demo1234`

---

## 🧩 Features

### 💰 Income Management
- Add/edit/delete income entries
- Source-based filtering (Salary, Freelance, Gift, etc.)
- Custom numeric keypad for amount entry
- Swipe to edit/delete

### 💸 Expense Tracking
- Category-based expense tracking with icon grid
- Search with debounce
- Filter by category
- Swipe to edit/delete
- Recurring expense flag

### 🏷️ Category Management
- 15 default categories (10 expense + 5 income)
- Custom category creation with icon & color picker
- Inline editing via bottom sheet

### 🤝 Money Owed (Send / Receive)
- "To Pay" and "To Receive" tabs
- Checklist-style status toggle
- Due date tracking
- Summary cards for pending amounts
- Add via bottom sheet

### 📊 Statistics & Insights
- Weekly spending bar chart
- Monthly income vs expense line chart
- Category breakdown donut chart with progress bars
- Summary cards (Income, Expenses, Balance)

### ✨ Additional Features
- 🔍 Debounced search
- 🌙 Dark/Light mode toggle
- 📤 CSV data export
- 🔔 Toast notifications
- 🔐 Phone + password JWT authentication
- 📱 Mobile-first responsive design

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS v4 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Fastify |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (bcryptjs) |

---

## 📁 Project Structure

```
expense-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/ui/  # Reusable UI components
│   │   ├── features/       # Feature-specific components
│   │   ├── pages/          # Route pages
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout wrappers
│   │   └── index.css       # Design system
│   └── index.html
│
├── server/                 # Fastify backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/
│   │   │   ├── income/
│   │   │   ├── expense/
│   │   │   ├── category/
│   │   │   ├── transactions/
│   │   │   └── stats/
│   │   ├── plugins/        # Fastify plugins
│   │   ├── db/             # Prisma client & seed
│   │   └── server.js       # Entry point
│   └── prisma/
│       └── schema.prisma
│
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with phone + password |
| POST | `/api/auth/login` | Login with phone + password |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update profile |

### Income
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incomes` | List incomes (paginated, filterable) |
| POST | `/api/incomes` | Create income |
| GET | `/api/incomes/:id` | Get income by ID |
| PATCH | `/api/incomes/:id` | Update income |
| DELETE | `/api/incomes/:id` | Delete income |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (paginated, filterable) |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/:id` | Get expense by ID |
| PATCH | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Transactions (Money Owed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/:id` | Update transaction |
| PATCH | `/api/transactions/:id/toggle` | Toggle status |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/dashboard` | Dashboard summary |
| GET | `/api/stats/weekly` | Weekly spending data |
| GET | `/api/stats/monthly` | Monthly summary |
| GET | `/api/stats/categories` | Category breakdown |
| GET | `/api/stats/recent` | Recent activity |
| GET | `/api/stats/export` | Export CSV |

---

## 🔐 Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_tracker?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
HOST="0.0.0.0"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

---

## 📜 Scripts

### Server
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Production start |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

### Client
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
