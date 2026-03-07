# Final Exam Prep (React + Vite)

Study app for exam Q&A practice with subject tabs, progress tracking, and AI explanation support.

## Run Locally

1. Install dependencies
	```bash
	npm install
	```
2. Start development server
	```bash
	npm run dev
	```

## Gemini AI Sidebar Setup

The right sidebar calls a Vercel Serverless Function at `/api/gemini`.

1. Copy `.env.example` to `.env`
2. Add your Gemini server keys:
	```bash
	GEMINI_API_KEY=your_primary_gemini_api_key_here
	GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key_here
	```
3. For local testing with `/api/gemini`, run:
	```bash
	npx vercel dev
	```

When the primary key hits auth/rate/quota limits, the serverless function automatically tries the backup key.

## Deploy On Vercel (GitHub)

1. Add `GEMINI_API_KEY` and `GEMINI_API_KEY_BACKUP` in Vercel Project Settings -> Environment Variables (Production)
2. Commit and push your changes to the production branch connected to Vercel (usually `main`)
3. Vercel will automatically build and deploy from GitHub
4. If needed, use the Vercel dashboard "Redeploy" button for the latest commit

## AI Sidebar Behavior

- Click **✨ Send to AI** button on any question card
- Optional: add a custom prompt in the right sidebar first
- Only the latest request/response is shown (no chat memory/history)
