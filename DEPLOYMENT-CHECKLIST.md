# 🚀 Deployment Checklist: Vercel + Supabase

## Phase 1: Supabase Backend Setup ✅

### 1.1 Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Save database password and project reference
- [ ] Note down connection string

### 1.2 Configure Database
- [ ] Copy connection string to `.env.local`
- [ ] Run `npm run db:push` to create tables
- [ ] Run `npm run db:generate` to generate Prisma client
- [ ] Test database connection locally

### 1.3 Migrate Existing Data
- [ ] Import `crm_production_dump.sql` to Supabase
- [ ] Verify all tables and data are present
- [ ] Test basic CRUD operations

### 1.4 Set Up Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create policies for user access
- [ ] Test security policies

## Phase 2: Frontend Optimization ✅

### 2.1 Local Testing
- [ ] Test with Supabase database locally
- [ ] Verify all API endpoints work
- [ ] Test authentication flow
- [ ] Fix any build errors

### 2.2 Build Optimization
- [ ] Run `npm run build` locally
- [ ] Check for any build warnings/errors
- [ ] Optimize bundle size if needed

## Phase 3: Vercel Deployment ✅

### 3.1 Prepare for Vercel
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Test deployment locally: `vercel --dev`

### 3.2 Deploy to Vercel
- [ ] Run `vercel` to deploy
- [ ] Set production environment variables
- [ ] Configure custom domain (if needed)
- [ ] Test production deployment

### 3.3 Environment Variables on Vercel
- [ ] Set `DATABASE_URL` (Supabase connection)
- [ ] Set `NEXTAUTH_URL` (your Vercel domain)
- [ ] Set `NEXTAUTH_SECRET` (strong secret key)
- [ ] Set `NODE_ENV=production`

## Phase 4: Production Testing ✅

### 4.1 End-to-End Testing
- [ ] Test user registration/login
- [ ] Test lead creation/management
- [ ] Test admin functions
- [ ] Test file uploads
- [ ] Test all CRUD operations

### 4.2 Performance & Security
- [ ] Test API response times
- [ ] Verify CORS is working
- [ ] Test authentication middleware
- [ ] Check for security vulnerabilities

### 4.3 Monitoring Setup
- [ ] Set up Vercel analytics
- [ ] Configure error tracking
- [ ] Set up database monitoring

## 🎯 Success Criteria

- [ ] CRM loads on Vercel domain
- [ ] All features work with Supabase backend
- [ ] Authentication works properly
- [ ] No console errors
- [ ] Fast loading times (<3s)
- [ ] Mobile responsive

## 🚨 Rollback Plan

If issues occur:
1. Revert to previous Vercel deployment
2. Check Supabase logs for errors
3. Verify environment variables
4. Test locally with production database

## 📞 Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
