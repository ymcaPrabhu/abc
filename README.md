# Task Organizer

A simple and elegant task management web application built with Next.js 14 and Supabase.

## Features

- Create, read, update, and delete tasks
- Mark tasks as completed
- Real-time updates with Supabase
- Clean and responsive UI with Tailwind CSS
- TypeScript for type safety

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Vercel account (for deployment)

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
     - Create a Supabase project
     - Create the tasks table
     - Get your API keys

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel.

Quick deploy:
```bash
vercel login
vercel
```

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main page with task logic
│   └── globals.css      # Global styles
├── components/
│   ├── TaskForm.tsx     # Form to add new tasks
│   └── TaskList.tsx     # List of tasks
├── lib/
│   └── supabase.ts      # Supabase client configuration
└── public/              # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
