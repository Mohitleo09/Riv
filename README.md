# Rival - Modern Blog Platform

Rival is a production-grade, full-stack blog platform designed for minimalist, long-form creative writing. Built with a focus on architecture, type safety, and real-time feel.

## 🚀 Key Features

- **Consolidated Architecture**: Unified Next.js 15 and NestJS codebase.
- **Advanced Authentication**: Dual-token strategy (Access + Refresh tokens) with rotation and server-side revocation.
- **RBAC (Role-Based Access Control)**: Granular permission management with roles (USER, ADMIN).
- **Search & Discovery**: Fast-filtering search bar with debounced full-text search across titles and content.
- **Auto-Saving Editor**: Intelligent background persistence with smooth Framer Motion status indicators.
- **Activity Pulse**: Real-time contribution heatmap visualization for tracking creative momentum over 30 days.
- **Performance Image Loading**: Custom `BlurImage` component for optimized, shimmer-loaded background images.
- **Social Interaction**: Real-time liked-by-me states and nested comment threads with optimistic UI.
- **Async Processing**: BullMQ/Redis for background summarization and potential email tasks.
- **Type Safety**: Shared domain models between backend and frontend.

---

## 🏁 Setup Instructions

### 1. Requirements
Ensure you have **Node.js (v20+)** and **Docker Desktop** installed.

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rival_db?schema=public"

# Redis (for BullMQ)
REDIS_HOST="localhost"
REDIS_PORT=6379

# JWT
JWT_SECRET="your-super-secret-key"

# Next.js Public
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Install & Run
Run the following commands to get everything up and running:
```bash
# 1. Install dependencies
npm install

# 2. Start Infrastructure (Postgres & Redis)
docker-compose up -d

# 3. Synchronize Database Schema
npm run prisma:generate
npm run prisma:push

# 4. Start concurrent dev environment (Next + Nest)
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

---

## 🏗️ Architecture Explanation

The project uses a **Unified Full-Stack Architecture** to minimize context switching and maximize shared logic.

- **Backend (NestJS)**: 
  - Follows a modular structure (`src/auth`, `src/blogs`, `src/users`).
  - Utilizes **Prisma** for type-safe database queries.
  - Implements **BullMQ** for background job processing, ensuring the API stays responsive.
  - Uses **Pino** for structured logging suitable for production environments.
- **Frontend (Next.js 15)**: 
  - Located in `src/app`, utilizing the **App Router**.
  - **TanStack Query (React Query)** manages all server state, caching, and optimistic UI updates.
  - **Framer Motion** provides the smooth, premium transitions requested.
- **Domain Layer**: Centralized types in `src/lib/types.ts` ensure the frontend and backend strictly adhere to the same data contracts.

---

## ⚖️ Tradeoffs Made

1. **Unified Root vs. Monorepo (Nx/Turborepo)**: I chose a unified project structure to keep the setup trivial for the user. While separate packages are cleaner for huge teams, a unified root allows for instant shared types without complex workspace configurations.
2. **Prisma vs. Raw SQL/Kysely**: Prisma was chosen for developer velocity. It abstracts complex relations (like likes/comments) elegantly, though it adds a small overhead compared to raw SQL.
3. **Internal Base64 vs. Object Storage**: For this version, images are handled as Base64 strings to avoid requiring an S3/Cloudinary account for setup. In a production scenario, we would switch to a dedicated CDN.

---

## 🛠️ What I Would Improve

1. **Rich Text Editor**: Replace the standard `textarea` with a proper block-based editor like **Tiptap** or **Editor.js** for a premium writing experience.
2. **Server-Side Rendering (SSR)**: Currently, most data fetching is client-side. Using SSR for the Public Feed would improve SEO and Initial Page Load speed.
3. **Security**: Move JWT from LocalStorage to **HttpOnly Cookies** to prevent XSS-based token theft.
4. **Testing Suite**: Implement full E2E testing using **Playwright** and unit tests for the NestJS services.

---

## � Scaling to 1M Users

To handle 1,000,000 concurrent or frequent users, the architecture would evolve as follows:

1. **Database Scaling**:
   - Implement **Read Replicas** for Postgres to handle the heavy read load of a public feed.
   - Use **Database Indexing** optimized for text search (e.g., GIN index for content).
2. **Caching Strategy**:
   - Add a heavy **Redis caching layer** for "hot" blog posts to avoid hitting the DB for every pageload.
   - Move to **Edge Caching (Vercel/Cloudflare)** for the public blog URLs.
3. **Media Management**:
   - Move all images to **Amazon S3** and serve them via **CloudFront CDN** to offload the main API server.
4. **Horizontal Scaling**:
   - Containerize the NestJS backend and deploy it on a **Kubernetes Cluster** with an auto-scaler.
   - Separate the **BullMQ Workers** into their own microservices so they can scale independently from the API.
5. **Load Balancing**:
   - Use an **Nginx** or **AWS ALB** for efficient traffic distribution.
