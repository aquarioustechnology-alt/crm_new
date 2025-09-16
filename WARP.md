# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code with ESLint
npm run lint
```

### Database Operations
```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and apply migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### Testing and Single Operations
```bash
# Run a single test file (using Node.js test runner)
node --test tests/specific-test.js

# Test database connection
npx prisma db ping

# Reset database (development only)
npx prisma migrate reset

# View database schema
npx prisma db pull
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **State Management**: React hooks + server state via API routes
- **Deployment**: Vercel-ready with production optimizations

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication route group
│   ├── admin/             # Admin-only pages
│   ├── dashboard/         # Main dashboard
│   ├── leads/             # Lead management
│   ├── pipeline/          # Pipeline analysis
│   └── api/               # API route handlers
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   └── [feature-components] # Feature-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client setup
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

### Core Entities & Data Model

The application follows a clear domain model centered around CRM operations:

**Users (Authentication & Authorization)**
- Role-based access: `ADMIN` and `USER`
- Authentication via NextAuth with credentials provider
- Session management with JWT strategy

**Leads (Primary Entity)**
- Complete contact and company information
- Project details with multi-currency support (INR/USD)
- Pipeline status tracking: `NEW` → `CONTACTED` → `QUALIFIED` → `PROPOSAL` → `WON/LOST`
- Multiple sources: `WEBSITE`, `LINKEDIN`, `WHATSAPP`, `REFERRAL`, `ADS`, `IMPORT`, `OTHER`
- Rich metadata with tags, notes, and timestamps

**Comments & Activities**
- Append-only activity log per lead
- File attachment support via `CommentAttachment`
- User attribution for audit trail

**Targets & Performance**
- Hierarchical target system (company-wide and user-specific)
- Multi-period support (monthly, quarterly, yearly)
- Achievement tracking and notifications

### Authentication Flow
1. Middleware (`src/middleware.ts`) protects all routes except `/signin` and NextAuth APIs
2. Custom credentials provider validates against Prisma User model
3. JWT tokens contain user role and profile information
4. Session callbacks extend user data for authorization

### API Architecture
- RESTful API routes in `src/app/api/`
- Standard CRUD operations for leads
- Protected endpoints with role-based authorization
- Standardized error handling with JSON responses

## Key Development Patterns

### Database Operations
- Use Prisma client via `@/lib/prisma`
- Always include relevant indexes for performance queries
- Multi-currency calculations with USD → INR conversion (rate: 83)
- Soft deletes using `isActive` boolean field

### Component Architecture
- Compound components pattern (e.g., `EditableStatusBadge`)
- Server components by default, client components with `"use client"`
- shadcn/ui for consistent design system
- Custom hooks for reusable logic (e.g., `useDebounce`)

### State Management
- Server state via API routes and React Server Components
- Client state with React hooks for form handling
- No global state management library (Zustand mentioned but not implemented)

### Error Handling
- API routes return `{error: string}` with appropriate HTTP status
- Client-side error boundaries for component-level errors
- Console logging for development debugging

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: For production
NODE_ENV="production"
```

### Development Setup
1. Clone repository and install dependencies: `npm install`
2. Set up PostgreSQL database and configure `DATABASE_URL`
3. Run initial migration: `npm run db:push`
4. Generate Prisma client: `npm run db:generate`
5. Seed database: `npm run db:seed`
6. Start development server: `npm run dev`

## Production Considerations

### Build Process
- Uses `vercel-build` script for Vercel deployment
- Prisma client generation included in build process
- TypeScript and ESLint checks temporarily disabled for deployment

### Performance Optimizations
- Database indexes on frequently queried fields
- Pagination support (20 items per page)
- Optimized database queries with Prisma
- Next.js image optimization enabled

### Security
- Password hashing with bcrypt
- Role-based authorization at route handler level
- CSRF protection via NextAuth
- Input validation with Zod schemas (implied from dependencies)

## Business Logic Specifics

### Lead Pipeline Management
- Status transitions are unrestricted (can move to any status)
- Pipeline value calculations consider currency conversion
- Activity logs track all status changes automatically

### Currency Handling
- Primary currency: INR (Indian Rupees)
- USD conversion rate: 83 (hardcoded)
- Display formatting: `₹1,23,456` format with comma separators

### Target Achievement System
- Supports both company-wide and user-specific targets
- Multi-period tracking (monthly, quarterly, yearly)
- Real-time achievement notifications
- Forecast vs. target analysis in pipeline view

### Data Import/Export
- CSV import with column mapping UI
- Preview functionality before bulk operations
- Error reporting per row during import
- Full CSV export capabilities

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in `src/app/api/[endpoint]/route.ts`
2. Implement HTTP methods (GET, POST, PATCH, DELETE)
3. Add authentication checks using session
4. Return consistent JSON responses with error handling

### Adding a New Page
1. Create page component in appropriate `src/app/` directory
2. Wrap with `AppShell` component for consistent layout
3. Add navigation link in `AppShell` if needed
4. Implement role-based access if required

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:push` (development) or `npm run db:migrate` (production)
3. Regenerate Prisma client: `npm run db:generate`
4. Update TypeScript types accordingly

### Working with Multi-currency
- Always store values in their original currency
- Convert for display/calculation using USD_TO_INR_RATE constant
- Use `formatCurrency()` helper for consistent display formatting