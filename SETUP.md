# 🚀 Teclanc.AI Setup Guide

## Quick Start

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Get Your Gemini API Key

**The current API key in `.env` is invalid or expired. You need to get a new one:**

1. Visit **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your new API key

### 3️⃣ Configure Your API Key

Open the `.env` file in the root directory and replace:

```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

With your actual API key:

```env
GEMINI_API_KEY=AIzaSyC...your-actual-key-here
```

### 4️⃣ Run the Application

```bash
npm run dev
```

The app will be available at: **http://localhost:5000**

---

## ⚠️ Troubleshooting

### "Invalid API Key" Error

**Symptom:** Red error message saying "401: Invalid API key"

**Solution:**
1. Make sure you've replaced `YOUR_API_KEY_HERE` in `.env` with your actual Gemini API key
2. Ensure there are no extra spaces or quotes around the API key
3. Restart the development server after changing `.env`

### "Rate Limit Exceeded" Error

**Symptom:** Error message about quota or rate limits

**Gemini Free Tier Limits:**
- ✅ **Free forever** (no credit card required)
- ⚠️ **15 requests per minute**
- ⚠️ **1,500 requests per day**
- ⚠️ **1 million tokens per day**

**Solution:**
- Wait for the countdown timer shown in the error message
- The app now has **built-in rate limiting** to prevent hitting limits
- **Automatic retry** with smart delays
- If you hit daily quota, wait until tomorrow or upgrade to paid tier

**Tips to Avoid Rate Limits:**
- Don't spam the generate button
- Wait for each generation to complete
- Use clear, detailed prompts to reduce regenerations
- The app limits to **14 requests/minute** to stay safe

### Server Won't Start

**Solution:**
1. Make sure port 5000 is not in use
2. Delete `node_modules` and run `npm install` again
3. Check that all dependencies are installed

---

## 📚 Features

✅ AI-powered website generation  
✅ Live code preview  
✅ Responsive design (Mobile/Tablet/Desktop)  
✅ Source code viewer with tabs (HTML/CSS/JS)  
✅ Download as ZIP  
✅ Generation history  
✅ Dark/Light theme  

---

## 🔧 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.5 Flash
- **UI:** Tailwind CSS + Radix UI
- **State:** TanStack Query

---

## 📖 Documentation

For more details, see the main README.md file.

---

## 🆘 Need Help?

If you're still having issues:

1. Check the terminal/console for error messages
2. Make sure your API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Restart the dev server: `Ctrl+C` then `npm run dev`

---

**Created by Lokesh S**  
Portfolio: [teclanc.vercel.app](https://teclanc.vercel.app)
