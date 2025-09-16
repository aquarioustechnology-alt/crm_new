# Local Development Setup

This guide will help you set up the CRM project locally on your Windows machine.

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from [https://nodejs.org/](https://nodejs.org/)
   - Choose the LTS version
   - Install with default settings

2. **PostgreSQL** (v12 or higher)
   - Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Install with default settings
   - Remember the password you set for the `postgres` user

## Quick Setup

1. **Install Node.js** (if not already installed)
   - Download and install from the official website
   - Verify installation: `node --version` and `npm --version`

2. **Set up PostgreSQL**
   - Install PostgreSQL
   - Create a database named `crm_new`
   - Update the `DATABASE_URL` in `.env.local` if needed

3. **Run the setup script**
   ```powershell
   .\setup-local.ps1
   ```

## Manual Setup

If you prefer to set up manually:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Create admin user**
   - The setup script will create an admin user
   - Email: `admin@crm.com`
   - Password: `admin123`

4. **Start development server**
   ```bash
   npm run dev
   ```

## Access the Application

- **URL**: http://localhost:3000
- **Admin Login**: admin@crm.com / admin123

## Environment Variables

The `.env.local` file contains:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: JWT secret key

## Troubleshooting

1. **Node.js not found**: Make sure Node.js is installed and added to PATH
2. **Database connection error**: Check PostgreSQL is running and credentials are correct
3. **Port 3000 in use**: Change the port in package.json or kill the process using port 3000

## Project Structure

- `src/app/`: Next.js app router pages
- `src/components/`: React components
- `src/lib/`: Utility functions and configurations
- `prisma/`: Database schema and migrations
- `public/`: Static assets

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes
- `npm run db:studio`: Open Prisma Studio
