# 🚀 Simple 3-Step Deployment

## ✅ Code Already Pushed to GitHub!

Your code is live at: https://github.com/anup1969/int-video

---

## 🌐 Deploy to Netlify (2 Options)

### **Option A: Via Netlify Dashboard** (Easiest - 5 min)

1. **Go to Netlify:** https://app.netlify.com
2. **Click:** "Add new site" → "Import an existing project"
3. **Select:** GitHub → "int-video" repository
4. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Click:** "Deploy site"
6. **Wait:** 2-3 minutes for deployment

### **Option B: Via CLI** (Advanced - 2 min)

```bash
cd C:\Users\PCS\code\int-video

# Deploy
netlify deploy --prod
```

When prompted:
- Select your team
- Site name: gtintvideo
- Build directory: `.next`

---

## 🔧 Add Environment Variables

**After deployment, add these in Netlify:**

1. Go to: **Site settings** → **Environment variables**
2. Add these 3 variables:

```
NEXT_PUBLIC_SUPABASE_URL
= https://uwzzdxroqqynmqkmwlpk.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3enpkeHJvcXF5bm1xa213bHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODYwMTcsImV4cCI6MjA3NzE2MjAxN30.ybAiI65Cj1U42tkhh5BX9sbimQ3sZzv1wWdOr5hRPlo

SUPABASE_SERVICE_ROLE_KEY
= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3enpkeHJvcXF5bm1xa213bHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU4NjAxNywiZXhwIjoyMDc3MTYyMDE3fQ.EFwNdaOoUTUSmoEitGZaH64b8UqJiW99j9rLRi5b5iU
```

3. **Trigger redeploy:** Deploys tab → Trigger deploy

---

## 🗄️ Set Up Database

1. **Go to:** https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk
2. **Click:** SQL Editor → New query
3. **Open:** `supabase/setup.sql`
4. **Copy all** and paste
5. **Click:** Run

---

## ✅ Done!

**Your site:** https://gtintvideo.netlify.app (or your assigned URL)

**Test:**
- Create some nodes
- Click "Save"
- Refresh page
- Campaign should reload!

---

**Total Time:** 10 minutes
**Status:** 🎉 Live and functional!
