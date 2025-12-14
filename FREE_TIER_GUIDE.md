# 🆓 Gemini Free Tier Guide

## What You Get for FREE

✅ **Completely Free** - No credit card required  
✅ **No Expiration** - Free tier never expires  
✅ **Production Ready** - Same quality as paid tiers  
✅ **Full Features** - Access to Gemini 2.5 Flash model  

---

## 📊 Free Tier Limits

| Limit Type | Free Tier | What This Means |
|-----------|-----------|-----------------|
| **Requests per Minute** | 15 RPM | Generate ~15 websites per minute |
| **Requests per Day** | 1,500 per day | Generate ~1,500 websites daily |
| **Tokens per Day** | 1 million | Enough for complex websites |

---

## 🛡️ Built-in Protections

Teclanc.AI now has **smart rate limiting** to protect you from hitting limits:

### ✅ What We Added:

1. **Pre-request Validation**
   - Checks limits before sending to Gemini
   - Prevents unnecessary API calls
   - Saves your quota

2. **Smart Rate Limiting**
   - Limits to **14 requests/minute** (safer than 15)
   - Limits to **1,400 requests/day** (safer than 1,500)
   - Automatic request tracking

3. **Automatic Retry Logic**
   - If rate limit hit: waits 2-4 seconds and retries
   - Up to 2 automatic retries
   - Exponential backoff delays

4. **User-Friendly Messages**
   - Shows exact wait time in seconds
   - Clear error explanations
   - Countdown timers in notifications

---

## 🚦 What Happens When You Hit a Limit?

### Per-Minute Limit (15 RPM)

**If you generate too fast:**

```
⏱️ Rate Limit Reached
Gemini free tier limit reached. 
Please wait 23 seconds before trying again.
```

**What happens:**
- Shows countdown timer
- Automatically retries after wait time
- Request queued safely

### Daily Limit (1,500/day)

**If you exceed daily quota:**

```
❌ Daily Quota Exceeded
You've used 1,500 requests today.
Try again tomorrow or upgrade to paid tier.
```

**What happens:**
- No more generations until tomorrow (resets at midnight UTC)
- All existing generations still accessible
- History and downloads still work

---

## 💡 Tips to Maximize Your Free Quota

### 1. Write Better Prompts
❌ Bad: "create website"  
✅ Good: "create a modern portfolio website with hero section, about, projects gallery, and contact form using blue color scheme"

**Why:** Better prompts = fewer regenerations

### 2. Don't Spam the Button
- Wait for each generation to complete
- Use the preview to refine
- Edit code manually if needed

### 3. Use History Feature
- Previous generations saved automatically
- Load old designs instead of regenerating
- Download and reuse code

### 4. Batch Your Work
- Plan your designs first
- Generate during testing/development
- Use editing features to tweak

---

## 📈 If You Need More Quota

### Option 1: Use Multiple API Keys (Free)
- Create multiple Google accounts
- Get multiple free API keys
- Rotate keys in `.env`

### Option 2: Upgrade to Paid (Google AI)
Visit: https://ai.google.dev/pricing

**Paid Tier Benefits:**
- 360 requests/minute
- Higher daily limits
- Priority support
- Same pricing as ChatGPT

### Option 3: Wait for Reset
- Daily limits reset at **midnight UTC**
- Minute limits reset every 60 seconds
- No action needed, automatic

---

## 🔍 How to Check Your Usage

Currently, Gemini doesn't provide a dashboard for free tier usage, but **Teclanc.AI tracks it for you**:

- Server logs show request counts
- Error messages show exact limits
- Built-in tracker prevents overuse

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:
- Spam the generate button repeatedly
- Share your API key publicly
- Use same key for multiple projects
- Ignore rate limit warnings

### ✅ DO:
- Wait for generation to complete
- Keep API key in `.env` file
- Use one key per project
- Follow the countdown timers

---

## 🆘 Troubleshooting Rate Limits

### "Please wait X seconds"
**This is NORMAL.** Just wait for the timer.

### "Daily quota exceeded"
**Solution:** 
1. Wait until tomorrow (midnight UTC)
2. Or create another free Google account
3. Or upgrade to paid tier

### Getting rate limits immediately
**Possible causes:**
- Multiple people using same API key
- Server restarted (tracker reset)
- Previous requests still in quota window

**Solution:**
Wait 60 seconds for minute limit to reset

---

## 📊 Real-World Usage Examples

### Solo Developer (Typical Use)
- **10-20 generations per day**
- Well within free tier ✅
- No issues expected

### Testing/Development
- **50-100 generations per day**
- Still within free tier ✅
- Use good prompts to reduce iterations

### Heavy Production Use
- **500+ generations per day**
- May hit daily limit ⚠️
- Consider paid tier or multiple keys

### Multiple Users
- **If 5+ people sharing one key**
- Will hit rate limits quickly ⚠️
- Use separate keys per user

---

## 🎯 Best Practices

1. **During Development:**
   - Test with simple prompts first
   - Save successful generations to history
   - Edit code manually for minor changes

2. **For Production:**
   - Use descriptive, detailed prompts
   - Download and cache generated code
   - Only regenerate when absolutely needed

3. **For Collaboration:**
   - Each team member gets their own API key
   - Don't share keys in version control
   - Use environment variables properly

---

## 🚀 Summary

The Gemini free tier is **generous and perfect** for:
- Personal projects ✅
- Learning and experimentation ✅
- Small business websites ✅
- Portfolio building ✅

With Teclanc.AI's **smart rate limiting**, you'll rarely hit limits unless you're:
- Using it in production with high traffic ❌
- Sharing the key with many users ❌
- Spamming generations unnecessarily ❌

**Bottom line:** The free tier is MORE than enough for 99% of users! 🎉

---

**Questions?** Check SETUP.md for more troubleshooting tips.
