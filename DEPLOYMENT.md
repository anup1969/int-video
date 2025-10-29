# 🚀 Deployment Guide - Interactive Video Platform

## ✅ Git Repository Setup Complete

Your code is now version controlled! Here's what's been done:
- ✅ Git initialized
- ✅ All files committed
- ✅ Ready to push to GitHub

---

## 📦 Step 1: Push to GitHub

### Create GitHub Repository

1. **Go to GitHub:** https://github.com/anup1969
2. **Click "New Repository"**
3. **Repository settings:**
   - Name: `int-video`
   - Description: "Interactive Video Campaign Builder - VideoAsk Clone"
   - Visibility: Private (or Public)
   - **DO NOT** initialize with README, .gitignore, or license

4. **Click "Create repository"**

### Push Your Code

After creating the repo, run these commands:

```bash
cd C:\Users\PCS\code\int-video

# Add GitHub as remote
git remote add origin https://github.com/anup1969/int-video.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Easiest)

1. **Go to Netlify:** https://app.netlify.com
2. **Click "Add new site" → "Import an existing project"**
3. **Connect to GitHub:**
   - Authorize Netlify to access your GitHub
   - Select `anup1969/int-video` repository
4. **Configure build settings:**
   - Branch to deploy: `main`
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Deploy site"
5. **Change site name:**
   - Go to Site settings → General → Site details
   - Click "Change site name"
   - Enter: `gtintvideo`
   - Save

**Your site will be live at:** `https://gtintvideo.netlify.app`

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Follow prompts:
# - Create & configure a new site
# - Team: Select your team
# - Site name: gtintvideo
# - Build command: npm run build
# - Directory to deploy: .next

# Deploy
npm run build
netlify deploy --prod
```

---

## 🔧 Step 3: Environment Variables (For Phase 2)

When you're ready to add database functionality, add these in Netlify:

1. Go to Site settings → Environment variables
2. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://uwzzdxroqqynmqkmwlpk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key - when available)

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] Site is accessible at `https://gtintvideo.netlify.app`
- [ ] Flow builder loads correctly
- [ ] Can drag and drop answer types
- [ ] Edit modal works
- [ ] Preview modal works
- [ ] Zoom controls work
- [ ] Mobile view looks good

---

## 🐛 Troubleshooting

### Build fails on Netlify

**Error:** "Module not found"
- **Fix:** Check `package.json` has all dependencies
- Run `npm install` locally to verify

**Error:** "Build command failed"
- **Fix:** Verify Node version is 18
- Check build logs for specific errors

### Site loads but shows errors

**Check:**
- Browser console for JavaScript errors
- Netlify function logs (if using serverless functions)

### Need to redeploy

```bash
# Make changes, then:
git add .
git commit -m "Your changes description"
git push origin main

# Netlify will automatically rebuild and deploy
```

---

## 📞 Quick Commands Reference

```bash
# Check Git status
git status

# View commit history
git log --oneline

# Check Netlify deployment status
netlify status

# View live logs
netlify dev

# Manual deploy
netlify deploy --prod
```

---

## 🎯 Next Steps After Deployment

1. **Test the live site** thoroughly
2. **Share the URL** with stakeholders
3. **Proceed to Phase 2** - Database integration
4. **Set up custom domain** (optional)

---

**Last Updated:** October 29, 2025
**Status:** Ready for deployment
