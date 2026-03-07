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

The right sidebar uses Gemini directly from the frontend (no backend required).

1. Copy `.env.example` to `.env`
2. Add your Gemini API key:
	```bash
	VITE_GEMINI_API_KEY=your_primary_gemini_api_key_here
	VITE_GEMINI_API_KEY_2=your_backup_gemini_api_key_here
	```
3. Restart the dev server if it is already running

When the primary key hits rate/quota limits, the app automatically tries the backup key.

## AI Sidebar Behavior

- Click **✨ Send to AI** button on any question card
- Optional: add a custom prompt in the right sidebar first
- Only the latest request/response is shown (no chat memory/history)
