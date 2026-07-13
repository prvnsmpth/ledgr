# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run check        # Type-check with svelte-check
npm run check:watch  # Type-check in watch mode
npm run lint         # Run Prettier and ESLint
npm run format       # Auto-format code with Prettier
```

## Architecture Overview

ledgr is a privacy-first personal finance manager built with SvelteKit. The key architectural principle is that **all financial data stays on the user's device** - transactions are stored in IndexedDB on the client and never sent to servers.

### Key Components

1. **Database Layer** (`/src/lib/db/`)
   - Custom `LedgrDB` wrapper around IndexedDB
   - Web Worker (`db.worker.ts`) handles all database operations in background
   - Store pattern for reactive UI updates

2. **Parser System** (`/src/lib/parser/`)
   - Bank-specific parsers (HDFC, ICICI, SBI) for statement imports
   - Excel/CSV parsing via XLSX library
   - Automatic transaction tagging/categorization

3. **Component Structure** (`/src/lib/components/`)
   - UI components follow shadcn/ui patterns (adapted for Svelte)
   - Transaction components handle display and editing
   - Category management with predefined expense categories

4. **Routes Structure**
   - `/(app)/` - Protected application routes (transactions, analytics, categories)
   - `/(public)/` - Public auth routes (login, signup)
   - `/api/` - Server endpoints for sync, backups, and user management

### Development Setup

1. **Environment Variables** - Copy `.env.template` to `.env` and configure:
   - `PUBLIC_APP_HOST` - Application host
   - `PUBLIC_GOOGLE_CLIENT_ID` - For Google Drive backup
   - `PUBLIC_GOOGLE_REDIRECT_URI` - OAuth redirect
   - `GOOGLE_CLIENT_SECRET` - Google OAuth secret

2. **Database Operations** - All database operations go through the Web Worker:
   ```typescript
   import { db } from '$lib/db';
   await db.addTransaction(transaction);
   ```

3. **Adding Bank Parsers** - Implement the parser interface in `/src/lib/parser/`:
   - Parse bank-specific formats
   - Map to standard transaction format
   - Add to parser registry

4. **Component Development** - UI components use:
   - Tailwind CSS for styling
   - Tailwind Variants for component variants
   - Zod for form validation
   - SvelteKit form actions for server interactions

### Important Patterns

- **Privacy-First**: Never send transaction data to servers
- **Client-Side Storage**: All financial data in IndexedDB
- **Background Processing**: Use Web Workers for heavy operations
- **Reactive Stores**: Svelte stores for state management
- **Type Safety**: Strict TypeScript throughout