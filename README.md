# Indian Budget Management System

A comprehensive web-based platform for coordinating and developing India's budget, built using the **BMAD (Breakthrough Method for Agile AI-Driven Development)** methodology.

## Overview

The Indian Budget Management System (IBMS) digitizes the entire budget formulation, approval, allocation, and monitoring process for the Government of India. It provides a unified platform for ministries, departments, and the Finance Ministry to collaborate on budget creation and track expenditures in real-time.

## Key Features

### Budget Management
- **Multi-tier Budgeting**: Ministry → Department → Scheme → Line Item hierarchy
- **Proposal Types**: Budget Estimates, Revised Estimates, Supplementary Grants
- **Budget Classification**: Revenue/Capital expenditure categorization
- **Financial Year Based**: Organized by Indian financial year (April-March)

### Approval Workflows
- **Multi-stage Approvals**: Configurable workflows (Section → Department → Ministry → Finance Ministry)
- **Status Tracking**: Draft, Submitted, Under Review, Approved, Rejected, Revision Requested
- **Notifications**: Email alerts for approval requests and actions
- **Comments System**: Reviewers can provide feedback at each stage

### Expenditure Tracking
- **Real-time Recording**: Record expenditures against sanctioned budgets
- **Monthly Tracking**: Month-wise expenditure monitoring
- **Variance Analysis**: Automatic calculation of budget vs actual
- **Approval Process**: Department-level expenditure approvals

### Analytics & Reporting
- **Interactive Dashboard**: Real-time KPIs and budget utilization metrics
- **Expenditure Trends**: Visual charts and forecasting
- **Ministry Comparison**: Cross-ministry budget analysis
- **Custom Reports**: Budget statements, variance analysis, audit trails
- **Export Options**: PDF, Excel, CSV formats

### Security & Compliance
- **Role-Based Access Control (RBAC)**: 6 distinct user roles
- **Row-Level Security**: Database-level access control
- **Complete Audit Trail**: Immutable transaction logs
- **Google OAuth**: Secure authentication
- **Data Encryption**: HTTPS, encrypted storage

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Finance Ministry Admin** | System administrator | Full access, final approvals, system configuration |
| **Budget Division Officer** | Budget compilation & analysis | Cross-ministry read access, analytical tools |
| **Ministry Secretary** | Ministry-level management | Manage ministry budgets, approve department requests |
| **Department Head** | Department management | Submit proposals, manage schemes, track expenditure |
| **Section Officer** | Data entry & operations | Create proposals, record expenditures (default role) |
| **Auditor** | Compliance & audit | Read-only access across all data |

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Charts**: Recharts
- **UI Components**: Radix UI
- **Utilities**: date-fns, Zustand
- **Deployment**: Vercel
- **Development Methodology**: BMAD (Breakthrough Method for Agile AI-Driven Development)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Google Cloud Platform account (for OAuth)
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd abc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:

   Follow the comprehensive guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):
   - Create Supabase project
   - Run database migrations
   - Configure Google OAuth
   - Get API credentials

4. **Configure environment variables**:

   Create `.env.local` in the project root:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open the application**:

   Navigate to [http://localhost:3000](http://localhost:3000)

7. **First login**:

   - Sign in with Google
   - In Supabase Dashboard, go to user_profiles table
   - Change your role to "Finance Ministry Admin"
   - Refresh the app to get full access

## Project Structure

```
├── app/                     # Next.js App Router
│   ├── dashboard/           # Main dashboard
│   ├── budgets/            # Budget management pages
│   ├── schemes/            # Scheme management
│   ├── expenditures/       # Expenditure tracking
│   ├── reports/            # Reporting & analytics
│   ├── admin/              # System administration
│   └── auth/callback/      # OAuth callback
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   ├── dashboard/         # Dashboard widgets
│   ├── budgets/           # Budget forms & lists
│   ├── schemes/           # Scheme management
│   ├── expenditures/      # Expenditure tracking
│   ├── reports/           # Report components
│   └── common/            # Reusable components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utilities & configs
│   ├── supabase/         # Supabase client
│   └── utils/            # Helper functions
│       ├── formatters.ts  # Currency, date formatting
│       ├── authorization.ts # Access control helpers
│       └── cn.ts          # Class name utility
├── types/                 # TypeScript types
│   └── index.ts           # All type definitions
├── supabase/             # Database migrations
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
└── docs/                  # BMAD Documentation
    ├── PRD.md            # Product Requirements Document
    ├── ARCHITECTURE.md   # System Architecture
    └── DEVELOPMENT_STORIES.md # Development Stories
```

## BMAD Methodology

This project was built using the **Breakthrough Method for Agile AI-Driven Development (BMAD)**, which consists of:

1. **Analysis Phase** - Requirements gathering and stakeholder analysis
2. **Product Management Phase** - Comprehensive PRD creation
3. **Architecture Phase** - System design and database schema
4. **Development Stories Phase** - Detailed implementation stories
5. **Development Phase** - Systematic implementation

All BMAD documentation is available in the `docs/` directory.

## Database Schema

The system uses 12 core tables:

- `user_profiles` - User accounts and roles
- `ministries` - Government ministries
- `departments` - Departments within ministries
- `schemes` - Government schemes/programs
- `budget_proposals` - Budget requests
- `budget_line_items` - Line-item details
- `budget_allocations` - Sanctioned budgets
- `expenditures` - Actual spending
- `approval_workflows` - Approval process tracking
- `approval_stages` - Individual approval stages
- `documents` - Supporting documents
- `audit_logs` - Complete audit trail

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for complete schema documentation.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment

Deploy to Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (Supabase URL and key)
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Key Workflows

### Budget Creation Workflow
1. Section Officer creates budget proposal for scheme
2. Department Head reviews and submits to Ministry
3. Ministry Secretary reviews and approves
4. Budget Division compiles all ministry budgets
5. Finance Ministry Admin gives final approval
6. System generates sanctioned budget allocation

### Expenditure Tracking Workflow
1. Section Officer enters expenditure against scheme
2. System validates against allocated budget
3. Department Head approves expenditure
4. System updates real-time dashboard
5. Alerts triggered for anomalies

## Currency Formatting

The system uses Indian number formatting:
- Thousands: ₹10.50 K
- Lakhs: ₹15.75 L
- Crores: ₹125.50 Cr

## Financial Year

Indian financial year runs from April 1 to March 31. Financial years are represented as:
- FY 2025-26 (April 1, 2025 - March 31, 2026)

## Security

- **Authentication**: Google OAuth 2.0
- **Authorization**: Row-Level Security (RLS) in PostgreSQL
- **Encryption**: HTTPS, TLS 1.3
- **Audit Logging**: Complete transaction history
- **Access Control**: Role-based with organizational hierarchy

## Support & Documentation

- **Setup Guide**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Product Requirements**: [docs/PRD.md](./docs/PRD.md)
- **System Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Development Stories**: [docs/DEVELOPMENT_STORIES.md](./docs/DEVELOPMENT_STORIES.md)
- **Claude Code Guidance**: [CLAUDE.md](./CLAUDE.md)

## Contributing

This is a government budget management system. Contributions should follow security best practices and comply with government data protection policies.

## License

Government of India - Internal Use

---

**Built with the BMAD Method** - A systematic approach to AI-driven development

**Last Updated**: October 2025
