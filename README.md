# Task Organizer

A collaborative team task management web application built with Next.js 14, Supabase, and Google OAuth authentication.

## Features

- **Google OAuth Authentication**: Secure sign-in with Google accounts
- **Team Dashboard**: View all tasks created by team members
- **Task Management**: Create, update, and delete your own tasks
- **Role-Based System**: Support for multiple roles (Assistive, Section Officer, Under Secretary, Professional Creator)
- **User Profiles**: Automatic profile creation with role assignment
- **Task Ownership**: Users can only modify their own tasks
- **Real-time Updates**: Powered by Supabase PostgreSQL database
- **Responsive UI**: Clean, modern design with Tailwind CSS
- **Type Safety**: Full TypeScript support

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google Cloud Platform account (for OAuth)
- A Vercel account (for deployment)

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Google OAuth**:
   - Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
     - Create a Google Cloud project
     - Configure OAuth consent screen
     - Get your Client ID and Secret

3. **Set up Supabase**:
   - Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
     - Create a Supabase project
     - Enable Google authentication
     - Create the database tables (tasks, user_profiles)
     - Get your API keys

4. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser and sign in with Google

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel.

Quick deploy:
```bash
vercel login
vercel
```

## User Roles

The application supports four roles with different access levels:

1. **Assistive**: Basic team member access
2. **Section Officer**: Standard access (default for new users)
3. **Under Secretary**: Advanced access
4. **Professional Creator**: Creator role with full access

All users can:
- View all team tasks
- Create new tasks
- Toggle completion status of their own tasks
- Delete their own tasks

To change a user's role, update it in the Supabase dashboard under the `user_profiles` table.

## Project Structure

```
├── app/
│   ├── auth/
│   │   └── callback/    # OAuth callback handler
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Main page with authentication & tasks
│   └── globals.css      # Global styles
├── components/
│   ├── TaskForm.tsx     # Form to add new tasks
│   ├── TaskList.tsx     # Team task list with ownership
│   ├── LoginPage.tsx    # Google OAuth login page
│   ├── Header.tsx       # App header with user info
│   └── Providers.tsx    # Auth context provider wrapper
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   └── supabase.ts      # Supabase client configuration
├── types/
│   └── index.ts         # TypeScript type definitions
└── public/              # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
