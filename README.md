# ⚙️ FinPilot AI — Backend API

> **Node.js + Express 5 + Sequelize 6 + MySQL — RESTful API for Personal Finance Management**

The backend of FinPilot AI is a production-ready REST API following the MVC architecture. It powers authentication, CRUD operations, data aggregation for analytics/reports, and AI-powered financial advisory via OpenRouter.

---

## ✨ Features

- **Authentication** — Register, Login, Forgot/Reset Password, Profile management, Account deletion
- **Income** — Full CRUD with pagination, search, sorting, monthly filtering
- **Expenses** — Full CRUD with category association, pagination, search, filtering by month/category
- **Categories** — Full CRUD with custom icons/colors; protects default categories from deletion
- **Budgets** — Monthly budgets per category with usage tracking; copy budgets across months
- **Dashboard** — Aggregated data: current balance, trends, top categories, recent transactions
- **Analytics** — Income vs expense, savings trends, budget utilization, category breakdown, insights
- **Reports** — Date-range filtering, top categories, budget performance, income sources
- **AI Advisor** — Sends financial data to OpenRouter API, stores structured reports
- **Global Search** — Search across income, expenses, and categories
- **Security** — JWT auth, bcrypt hashing, Helmet, CORS, rate limiting, input validation

---

## 🧰 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | — | JavaScript Runtime |
| [Express](https://expressjs.com/) | 5.2.1 | Web Framework (MVC) |
| [Sequelize](https://sequelize.org/) | 6.37.8 | ORM for MySQL |
| [mysql2](https://github.com/sidorares/node-mysql2) | 3.22.5 | MySQL Database Driver |
| [JSON Web Token](https://github.com/auth0/node-jsonwebtoken) | 9.0.3 | JWT Authentication |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.0.3 | Password Hashing (12 rounds) |
| [Helmet](https://helmetjs.github.io/) | 8.2.0 | Security Headers |
| [CORS](https://github.com/expressjs/cors) | 2.8.6 | Cross-Origin Resource Sharing |
| [express-rate-limit](https://express-rate-limit.github.io/) | 8.5.2 | Rate Limiting (200 req/15min) |
| [express-validator](https://express-validator.github.io/) | 7.3.2 | Request Validation |
| [Multer](https://github.com/expressjs/multer) | 2.2.0 | File Upload Handling (future-ready) |
| [dotenv](https://github.com/motdotla/dotenv) | 17.4.2 | Environment Variables |
| [dayjs](https://day.js.org/) | 1.11.21 | Date Formatting |
| [uuid](https://github.com/uuidjs/uuid) | 14.0.1 | UUID Generation |
| [OpenRouter API](https://openrouter.ai/) | — | AI Financial Advisor |

---

## 📁 Project Structure

```
backend/
├── server.js                          # Entry point — Express app setup & middleware
├── .env                               # Environment configuration (DB, JWT, API keys)
├── package.json
│
├── config/
│   └── database.js                    # Sequelize connection config (pool, credentials)
│
├── models/
│   ├── User.js                        # User model with bcrypt hooks
│   ├── Category.js                    # Category model (name, color, icon)
│   ├── Income.js                      # Income model (source, amount, date, month)
│   ├── Expense.js                     # Expense model (amount, date, month, payment method)
│   ├── Budget.js                      # Budget model (monthly, per-category)
│   └── AiReport.js                    # AI report model (stores JSON report data)
│
├── controllers/
│   ├── authController.js              # register, login, forgot/reset password, profile, delete account
│   ├── incomeController.js            # CRUD + pagination + search + filters
│   ├── expenseController.js           # CRUD + pagination + search + category/month filters
│   ├── categoryController.js          # CRUD + default category protection
│   ├── budgetController.js            # CRUD + copy across months + usage tracking
│   ├── dashboardController.js         # Aggregated dashboard data
│   ├── analyticsController.js         # In-depth analytics and insights
│   ├── reportController.js            # Date-range reports
│   ├── aiController.js                # OpenRouter integration + report storage
│   └── searchController.js            # Global search across entities
│
├── routes/
│   ├── authRoutes.js                  # Auth endpoints
│   ├── incomeRoutes.js                # Income endpoints
│   ├── expenseRoutes.js               # Expense endpoints
│   ├── categoryRoutes.js              # Category endpoints
│   ├── budgetRoutes.js                # Budget endpoints
│   ├── dashboardRoutes.js             # Dashboard endpoint
│   ├── analyticsRoutes.js             # Analytics endpoint
│   ├── reportRoutes.js                # Report endpoint
│   ├── aiRoutes.js                    # AI advisor endpoints
│   └── searchRoutes.js                # Search endpoint
│
├── middleware/
│   ├── auth.js                        # JWT verification middleware
│   └── validate.js                    # express-validator result checker
│
├── database/
│   ├── init.js                        # DB sync, associations, auto-migration, seed trigger
│   └── seed.js                        # Demo data: user, categories, 6 months of transactions
│
└── utils/
    └── helpers.js                     # getCurrentMonth, formatCurrency, etc.
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MySQL v8+ running locally or remotely

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create a `.env` file in the `backend/` root:

```env
PORT=5000
DB_NAME=finpilot
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
OPENROUTER_API_KEY=your_openrouter_api_key_optional
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `DB_NAME` | MySQL database name | `finpilot` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | — |
| `DB_HOST` | MySQL host | `localhost` |
| `JWT_SECRET` | Secret for signing JWT tokens | — |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features (optional — AI works without it using computed fallback) | — |

### Seed Demo Data

```bash
node database/seed.js
```

This creates:
- A demo user: `demo@finpilot.ai` / `Demo@123`
- 11 default categories (Food, Travel, Shopping, Medical, Education, Entertainment, Fuel, Bills, Rent, Investment, Others)
- 6 months of sample income and expense records
- Sample budgets per category

> **⚠️ Note:** Running the seed script will drop existing tables and recreate them. Only run once on a fresh database.

### Start the Server

```bash
npm start
```

The API will be available at **http://localhost:5000/api**.

Health check: `GET /api/health`

### Development

```bash
npm run dev
```
*(Requires installing nodemon or similar — add to scripts as needed)*

---

## 🗄️ Database Schema

### Tables (auto-created by Sequelize)

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | User accounts | `id`, `name`, `email` (unique), `password` (bcrypt), `phone`, `currency`, `monthlyIncomeGoal`, `savingsGoal`, `theme`, `resetToken`, `resetTokenExpiry` |
| `categories` | Expense/income categories | `id`, `userId`, `name`, `color`, `icon`, `description`, `isDefault` |
| `income` | Income records | `id`, `userId`, `source`, `amount`, `date`, `month`, `description` |
| `expenses` | Expense records | `id`, `userId`, `categoryId`, `name`, `amount`, `date`, `month`, `paymentMethod`, `notes` |
| `budgets` | Monthly budgets per category | `id`, `userId`, `categoryId`, `month`, `amount`, `notes` |
| `ai_reports` | AI-generated financial reports | `id`, `userId`, `reportData` (JSON), `summary` |

### Associations

```
User ──1:N──> Category     (CASCADE delete)
User ──1:N──> Income       (CASCADE delete)
User ──1:N──> Expense      (CASCADE delete)
User ──1:N──> Budget       (CASCADE delete)
User ──1:N──> AiReport     (CASCADE delete)

Category ──1:N──> Expense   (CASCADE delete)
Category ──1:N──> Budget    (CASCADE delete)
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT token |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset (email) |
| POST | `/api/auth/reset-password` | ❌ | Reset password with token |
| GET | `/api/auth/profile` | ✅ | Get authenticated user's profile |
| PUT | `/api/auth/update-profile` | ✅ | Update profile |
| DELETE | `/api/auth/delete-account` | ✅ | Delete user account |

### Income
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/income` | ✅ | List income (paginated, filterable by month) |
| POST | `/api/income` | ✅ | Create income record |
| PUT | `/api/income/:id` | ✅ | Update income record |
| DELETE | `/api/income/:id` | ✅ | Delete income record |

### Expenses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/expenses` | ✅ | List expenses (paginated, filterable by month/category) |
| POST | `/api/expenses` | ✅ | Create expense record |
| PUT | `/api/expenses/:id` | ✅ | Update expense record |
| DELETE | `/api/expenses/:id` | ✅ | Delete expense record |

### Categories
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | ✅ | List all categories |
| POST | `/api/categories` | ✅ | Create category |
| PUT | `/api/categories/:id` | ✅ | Update category |
| DELETE | `/api/categories/:id` | ✅ | Delete category (defaults protected) |

### Budget
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/budget` | ✅ | List budgets (filterable by month) |
| POST | `/api/budget` | ✅ | Create budget |
| POST | `/api/budget/copy` | ✅ | Copy budgets from one month to another |
| PUT | `/api/budget/:id` | ✅ | Update budget |
| DELETE | `/api/budget/:id` | ✅ | Delete budget |

### Dashboard & Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | ✅ | Aggregated dashboard data |
| GET | `/api/analytics` | ✅ | In-depth analytics |
| GET | `/api/reports` | ✅ | Generate reports (query params: startDate, endDate, type) |

### AI Advisor
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/advice` | ✅ | Generate AI financial advice |
| GET | `/api/ai/reports` | ✅ | List past AI reports |
| DELETE | `/api/ai/reports/:id` | ✅ | Delete an AI report |

### Search
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/search` | ✅ | Global search (query: `q`) |

### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | ❌ | Health check |

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Authentication** | JWT Bearer tokens (7-day expiry) verified in middleware |
| **Password Storage** | bcrypt hashing with 12 salt rounds |
| **HTTP Headers** | Helmet middleware (CSP disabled for frontend) |
| **CORS** | Only FRONTEND_URL origin allowed |
| **Rate Limiting** | 200 requests per 15-minute window on all `/api/` routes |
| **Input Validation** | express-validator on all POST/PUT routes |
| **SQL Injection** | Prevented via Sequelize ORM (parameterized queries) |
| **Error Handling** | Centralized error middleware; no stack traces in production |

---

## 🤖 AI Integration (OpenRouter)

The AI Advisor endpoint (`POST /api/ai/advice`) collects the user's financial data and sends it to **OpenRouter** using the `openai/gpt-4o-mini` model.

### What the AI Prompt Covers

1. Spending Summary
2. Biggest Spending Categories
3. Savings Opportunities
4. Budget Suggestions
5. Financial Health Score (0-100)
6. Expense Reduction Tips
7. Income Improvement Ideas
8. Monthly Action Plan
9. Investment Suggestions
10. Personalized Advice

### Fallback

If no `OPENROUTER_API_KEY` is configured or the API call fails, the backend returns a computed financial health score and basic advice based on actual data — AI features degrade gracefully.

---

## 🛠️ Controller Logic Highlights

| Controller | Key Logic |
|---|---|
| **authController** | Register hashes password via Sequelize hook; login compares bcrypt; forgot/reset generates/validates UUID tokens |
| **expenseController** | JOINs with categories for display; aggregate queries for totals/averages by month |
| **dashboardController** | Multiple queries: current month stats, 6-month trends, top 5 categories, recent transactions |
| **analyticsController** | Weekly/Monthly/Yearly breakdowns, income vs expense, savings trend, budget utilization percentage |
| **reportController** | Date-range filtering with category aggregation, income source aggregation, budget performance |
| **aiController** | Gathers all user financial data → constructs prompt → calls OpenRouter → parses JSON response → stores report |

---

## 📄 License

For demonstration and portfolio purposes.
