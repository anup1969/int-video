# Remaining Implementation - URL Shortener & Usage Limiter

**Current Status:** 75% Complete
**Remaining:** Campaign Viewer tracking + Campaign Builder settings

---

## 🚀 WHAT'S LEFT TO DO

### 1. Campaign Viewer - Add Usage Tracking (15 minutes)

**File:** `pages/campaign/[id].js`

**Add at the top with other state:**
```javascript
const [limitReached, setLimitReached] = useState(false);
```

**Add in useEffect (after campaign is loaded):**
```javascript
useEffect(() => {
  if (!id) return;

  const trackVisit = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}/track-visit`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.limitReached) {
        setLimitReached(true);
      }
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  trackVisit();
}, [id]);
```

**Add early return (before return statement):**
```javascript
// Show limit reached message
if (limitReached) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Campaign No Longer Available
        </h1>
        <p className="text-gray-600 text-lg">
          This campaign has reached its usage limit and is no longer accepting responses.
        </p>
      </div>
    </div>
  );
}
```

---

### 2. Campaign Builder - Add Usage Limit Settings (15 minutes)

**File:** `pages/index.js`

**Find the campaign settings section and add:**

**Step 1: Add state near top of component:**
```javascript
const [usageLimit, setUsageLimit] = useState(null);
```

**Step 2: Load usage limit when campaign is loaded:**
```javascript
// In loadCampaign or wherever campaign data is loaded:
if (campaignData.usage_limit) {
  setUsageLimit(campaignData.usage_limit);
}
```

**Step 3: Add UI in settings panel (find where other settings are):**
```javascript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Usage Limit (Optional)
    <span className="text-gray-500 font-normal ml-2">
      Limit how many unique visitors can view this campaign
    </span>
  </label>
  <input
    type="number"
    min="1"
    placeholder="Leave empty for unlimited views"
    value={usageLimit || ''}
    onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : null)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
  />
  {usageLimit && (
    <p className="text-sm text-gray-600 mt-1">
      Campaign will be disabled after {usageLimit} unique {usageLimit === 1 ? 'visitor' : 'visitors'}
    </p>
  )}
</div>
```

**Step 4: Save usage limit when saving campaign:**
```javascript
// In saveCampaign function, add to the update/save call:
await supabase
  .from('campaigns')
  .update({
    usage_limit: usageLimit,
    // ... other fields
  })
  .eq('id', campaignId);
```

---

## 📝 ALTERNATIVE: Quick Code Patches

If you want me to do the edits, just tell me to continue. Here's what I'll do:

1. Find the campaign viewer file
2. Add the tracking + limit reached UI
3. Find the campaign builder file
4. Add the usage limit input field
5. Test with `npm run build`
6. Deploy to production

---

## 🧪 TESTING AFTER IMPLEMENTATION

### Test Short URLs:
1. Go to dashboard
2. Click compress icon on any campaign
3. Verify short URL is copied
4. Open short URL in browser
5. Should redirect to campaign

### Test Usage Limiting:
1. Edit a campaign in builder
2. Set usage limit to 2
3. Save campaign
4. Open campaign in incognito window (visitor 1)
5. Open campaign in different browser (visitor 2)
6. Open campaign in third browser - should show "Campaign No Longer Available"
7. Check dashboard - should show "2/2 views"

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Run `npm run build` - verify no errors
- [ ] Test short URL generation locally
- [ ] Test usage limiting locally
- [ ] Commit changes: `git add . && git commit -m "Add URL shortener and usage limiter features"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Deploy: `vercel --prod`
- [ ] Set alias: `vercel alias <url> int-video.vercel.app`
- [ ] Test on production
- [ ] Update README.md with new features

---

## 📊 COMPLETION ESTIMATE

- Campaign Viewer changes: 5 minutes
- Campaign Builder changes: 10 minutes
- Testing: 5 minutes
- Deployment: 5 minutes

**Total: ~25 minutes to complete**

---

**Ready to continue? Just say "continue" and I'll finish the implementation!**
