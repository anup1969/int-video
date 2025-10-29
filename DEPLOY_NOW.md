# 🚀 DEPLOY TO NETLIFY - STEP BY STEP (10 Minutes)

## ✅ Prerequisites Complete

- ✅ Code is ready and built successfully
- ✅ All changes committed to Git
- ✅ .env.local configured
- ✅ Netlify CLI installed

---

## 📋 Step 1: Push to GitHub (3 minutes)

### 1.1 Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: **int-video**
3. Description: "Interactive Video Campaign Builder - VideoAsk Clone"
4. Visibility: **Private** (or Public if you prefer)
5. **DO NOT** check "Initialize this repository with README"
6. Click "Create repository"

### 1.2 Connect Local Repo to GitHub

```bash
cd C:\Users\PCS\code\int-video

# Add GitHub remote
git remote add origin https://github.com/anup1969/int-video.git

# Push code
git branch -M main
git push -u origin main
```

**Verify:** Go to https://github.com/anup1969/int-video and see your code!

---

## 🌐 Step 2: Deploy to Netlify (5 minutes)

### 2.1 Connect Repository

1. Go to: https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify (if not already)
5. Select repository: **int-video**
6. Click on the repository

### 2.2 Configure Build Settings

**Build settings:**
- Branch to deploy: `main`
- Build command: `npm run build`
- Publish directory: `.next`

Click **"Deploy site"**

⏳ **Wait 2-3 minutes** for initial deployment...

### 2.3 Add Environment Variables

While it's deploying:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add these one by one:

```
Variable 1:
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://uwzzdxroqqynmqkmwlpk.supabase.co

Variable 2:
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3enpkeHJvcXF5bm1xa213bHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODYwMTcsImV4cCI6MjA3NzE2MjAxN30.ybAiI65Cj1U42tkhh5BX9sbimQ3sZzv1wWdOr5hRPlo

Variable 3:
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3enpkeHJvcXF5bm1xa213bHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU4NjAxNywiZXhwIjoyMDc3MTYyMDE3fQ.EFwNdaOoUTUSmoEitGZaH64b8UqJiW99j9rLRi5b5iU
```

4. Click **"Save"**

### 2.4 Trigger Redeploy

After adding environment variables:
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 2-3 minutes

### 2.5 Change Site Name

1. Go to **Site settings** → **General** → **Site details**
2. Click **"Change site name"**
3. New name: **gtintvideo**
4. Click **"Save"**

---

## 🎯 Step 3: Set Up Database (5 minutes)

### 3.1 Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk
2. Click **SQL Editor** in left sidebar
3. Click **"New query"**

### 3.2 Run Database Setup

1. Open file: `C:\Users\PCS\code\int-video\supabase\setup.sql`
2. **Copy ALL content** (Ctrl+A, Ctrl+C)
3. **Paste** into Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait ~10 seconds for completion

### 3.3 Verify Tables Created

1. Click **"Table Editor"** in left sidebar
2. You should see 3 tables:
   - ✅ **campaigns**
   - ✅ **steps**
   - ✅ **connections**

### 3.4 Create Storage Bucket (Optional - for later)

1. Click **"Storage"** in left sidebar
2. Click **"Create a new bucket"**
3. Name: **videos**
4. Public: **Yes**
5. File size limit: **500MB**
6. Allowed MIME types: `video/mp4, video/quicktime, video/webm`
7. Click **"Create bucket"**

---

## ✅ Step 4: Test Your Live Site!

### 4.1 Access Your Site

Go to: **https://gtintvideo.netlify.app**

### 4.2 Test Features

✅ Flow Builder loads
✅ Can drag answer types to canvas
✅ Can edit nodes
✅ Can set logic branching
✅ **Click "Save" button** - First save creates campaign in database
✅ Refresh page - Should retain campaign (if database set up)
✅ Preview works (mobile/desktop)
✅ Zoom controls work

### 4.3 Check Save Functionality

1. **Create a few nodes**
2. **Click "Save" button** (top right)
3. **Watch status:** "Saving..." → "Saved"
4. **Refresh the page**
5. **Campaign should reload!** ✅

---

## 🐛 Troubleshooting

### Issue: "Site not found" or 404

**Solution:** Wait 2-3 minutes after deployment. Netlify needs time to propagate.

### Issue: Save button shows "Save failed"

**Solution:**
1. Check browser console (F12) for errors
2. Verify environment variables are set in Netlify
3. Verify database tables exist in Supabase
4. Try re-deploying: Deploys tab → Trigger deploy

### Issue: Database connection error

**Solution:**
1. Verify environment variables in Netlify
2. Check Supabase project is active
3. Verify anon key is correct
4. Re-deploy after fixing

### Issue: Video upload fails

**Solution:**
1. Create storage bucket in Supabase (Step 3.4)
2. Verify bucket is public
3. Check allowed MIME types include video formats

---

## 📊 Deployment Checklist

- [ ] Pushed code to GitHub
- [ ] Connected GitHub to Netlify
- [ ] Initial deployment successful
- [ ] Added 3 environment variables
- [ ] Redeployed after adding env vars
- [ ] Changed site name to gtintvideo
- [ ] Ran database SQL in Supabase
- [ ] Verified 3 tables exist
- [ ] Created videos storage bucket
- [ ] Tested site is live
- [ ] Tested save functionality works
- [ ] Tested campaign persists after refresh

---

## 🎉 Success!

Once all checklist items are complete:

✅ **Your site is live at:** https://gtintvideo.netlify.app
✅ **Database is connected**
✅ **Save/Load works**
✅ **Auto-save active**
✅ **Video upload ready**

**You now have a fully functional Interactive Video Campaign Builder!** 🚀

---

## 🔄 Future Deployments

After making code changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Netlify will **automatically** rebuild and redeploy! ✨

---

**Need help?** Check the main README.md or create an issue on GitHub.

**Last Updated:** October 29, 2025
