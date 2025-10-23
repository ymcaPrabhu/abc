# Deployment Instructions

## Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel with your email (pnarayan1@gmail.com):
   ```bash
   vercel login
   ```
   Follow the prompts to authenticate with your email.

3. Deploy the project:
   ```bash
   vercel
   ```
   - When prompted, select your Vercel account
   - Confirm the project settings
   - The CLI will deploy your project and give you a URL

4. Set up environment variables in Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   Enter the values from your Supabase project when prompted.

5. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com) and sign in with pnarayan1@gmail.com
2. Click "Add New..." → "Project"
3. Import this Git repository
4. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

### Option 3: Push to GitHub and Auto-Deploy

1. Push this repository to GitHub
2. Go to Vercel dashboard and import the GitHub repository
3. Vercel will automatically deploy on every push to the main branch

## After Deployment

1. Your app will be live at a Vercel URL (e.g., `task-organizer-xyz.vercel.app`)
2. Test the deployment by adding and managing tasks
3. You can add a custom domain in Vercel project settings if desired

## Environment Variables Needed

Make sure to set these in Vercel before deploying:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You can add these in the Vercel dashboard under:
Project Settings → Environment Variables
