# FinVault — FinTech Transaction Dashboard

> **Portfolio project by Praveen Kumar A** · Full Stack Developer  
> Built to demonstrate production-grade skills across the entire stack.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React.js Frontend                     │
│   TypeScript · Redux Toolkit · React Router · Axios      │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + GraphQL
┌──────────────────────▼──────────────────────────────────┐
│               Node.js / Express Backend                  │
│   JWT Auth · RBAC · REST API · GraphQL · Kafka Producer  │
├──────────────────────────────────────────────────────────┤
│   PostgreSQL (users, txns)  │  MongoDB (audit logs)      │
├──────────────────────────────────────────────────────────┤
│   Apache Kafka (transaction event streaming)             │
└──────────────────────────────────────────────────────────┘
        │ Docker Compose · Terraform · GitHub Actions CI/CD
```

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Redux Toolkit, React Router v6 |
| Auth | JWT (access + refresh tokens), RBAC (admin / user roles) |
| Backend | Node.js, Express.js, NestJS-style modular architecture |
| REST API | Express Router, Joi validation, rate limiting |
| GraphQL | Apollo Server — transactions & portfolio queries |
| Databases | PostgreSQL (structured data), MongoDB (audit/event logs) |
| Messaging | Apache Kafka — transaction event streaming |
| DevOps | Docker, docker-compose, GitHub Actions CI/CD |
| IaC | Terraform (AWS ECS + RDS + DocumentDB stubs) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, Docker Desktop, Git

### 1. Clone & install
```bash
git clone https://github.com/praveenka/finvault.git
cd finvault
npm install          # root (installs both workspaces)
```

### 2. Start all services (Docker)
```bash
docker-compose up -d
```
Starts: PostgreSQL · MongoDB · Kafka · Zookeeper

### 3. Run backend
```bash
cd backend
cp .env.example .env   # fill in secrets
npm run dev
# → http://localhost:4000
# → GraphQL Playground: http://localhost:4000/graphql
```

### 4. Run frontend
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@finvault.io | Admin@123 |
| User | user@finvault.io | User@123 |

## 🗂 Project Structure
```
finvault/
├── frontend/          # React + TypeScript SPA
│   └── src/
│       ├── components/auth/       # Login, Register
│       ├── components/dashboard/  # Portfolio, TransactionTable, Charts
│       ├── components/layout/     # Navbar, Sidebar, ProtectedRoute
│       ├── store/slices/          # Redux: auth, transactions, portfolio
│       ├── hooks/                 # useAuth, useTransactions
│       ├── pages/                 # Login, Dashboard, Admin, Profile
│       └── utils/                 # axiosInstance (JWT interceptors)
├── backend/           # Node.js + Express
│   └── src/
│       ├── auth/                  # JWT, refresh tokens, bcrypt
│       ├── users/                 # CRUD, RBAC middleware
│       ├── transactions/          # REST endpoints + Kafka producer
│       ├── graphql/               # Apollo Server schema + resolvers
│       ├── kafka/                 # Producer + Consumer
│       ├── middleware/            # auth guard, role guard, rate limiter
│       └── config/                # DB connections, env validation
├── infrastructure/
│   ├── docker/                    # Dockerfiles
│   ├── terraform/                 # AWS ECS, RDS, DocumentDB
│   └── github-actions/            # CI/CD pipeline
└── docker-compose.yml
```

## 🌐 API Reference

### Auth Endpoints
```
POST /api/auth/register     Create account
POST /api/auth/login        Get access + refresh token
POST /api/auth/refresh      Rotate refresh token
POST /api/auth/logout       Invalidate refresh token
```

### Transaction Endpoints (JWT required)
```
GET    /api/transactions          List (paginated + filtered)
POST   /api/transactions          Create (emits Kafka event)
GET    /api/transactions/:id      Detail
DELETE /api/transactions/:id      Soft delete (admin only)
```

### GraphQL (Apollo)
```graphql
query Portfolio($userId: ID!) {
  portfolio(userId: $userId) {
    totalBalance
    totalGain
    holdings { symbol quantity avgCost currentValue }
    recentTransactions { id amount type status createdAt }
  }
}
```

## 🔒 Auth Flow

```
1. POST /auth/login → { accessToken (15m), refreshToken (7d) }
2. All requests: Authorization: Bearer <accessToken>
3. On 401 → axios interceptor calls /auth/refresh automatically
4. Refresh token stored httpOnly cookie (XSS-safe)
5. RBAC: admin role unlocks DELETE /transactions, GET /admin/users
```

## 📡 Kafka Event Flow

```
Transaction Created
       │
       ▼
 Kafka Producer (backend)
       │  topic: "transaction-events"
       ▼
 Kafka Consumer (backend worker)
       │
       ├─► MongoDB: write audit log
       ├─► Fraud check logic (rule-based)
       └─► WebSocket push to frontend (real-time update)
```

## ☁️ AWS Deployment (Terraform)

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

Provisions: ECS Fargate (backend), S3+CloudFront (frontend), RDS PostgreSQL, DocumentDB, MSK (Managed Kafka), API Gateway.

## 🧪 Testing
```bash
# Backend unit + integration tests
cd backend && npm test

# Frontend component tests
cd frontend && npm test
```
