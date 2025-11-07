# Authentication Setup Guide

## Overview
This guide will help you set up and test the authentication system for the Interactive Video Campaign Platform.

## Prerequisites
- Supabase account with a project created
- Access to Supabase SQL Editor
- Environment variables configured in `.env.local`

---

## 1. Database Setup

### Step 1: Run the SQL Script

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (uwzzdxroqqynmqkmwlpk)
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `scripts/setup-user-profiles.sql`
6. Paste it into the SQL editor
7. Click "Run" (or press Cmd/Ctrl + Enter)

You should see success messages for each operation.

### Step 2: Verify Database Tables

After running the script, verify the following tables exist:

1. Go to "Table Editor" in Supabase Dashboard
2. Check for:
   - `user_profiles` table
   - `campaigns` table with `user_id` column
   - `test_reports` table with `user_id` column
   - `ad_hoc_reports` table with `user_id` column

---

## 2. Email Authentication Setup

Email authentication is **already configured** in Supabase by default! No additional setup needed.

### Email Settings (Optional Customization)

1. Go to Authentication > Email Templates
2. Customize the confirmation email template
3. Configure email settings:
   - SMTP settings (optional, uses Supabase's default)
   - Email rate limiting
   - Confirmation requirements

---

## 3. OAuth Providers Setup (Optional - For Later)

### Google OAuth

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable "Google"
3. Follow these steps to get credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret
4. Paste credentials into Supabase
5. Save

### Apple OAuth

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable "Apple"
3. Follow Apple Developer setup:
   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Create a Services ID
   - Configure Sign in with Apple
   - Generate a private key
4. Enter credentials in Supabase
5. Save

---

## 4. Mobile OTP Setup (Optional - For Later)

To enable SMS OTP authentication:

1. Choose an SMS provider:
   - **Twilio** (recommended)
   - MessageBird
   - Vonage

### Twilio Setup

1. Create account at [Twilio](https://www.twilio.com/)
2. Get phone number
3. Copy Account SID and Auth Token
4. In Supabase:
   - Go to Authentication > Providers
   - Enable "Phone"
   - Select "Twilio"
   - Enter credentials
   - Save

---

## 5. Testing the Authentication System

### A. Test Email Signup

1. Open `http://localhost:3002/login`
2. Click "Sign Up" tab
3. Fill in:
   - Full Name: "Test User"
   - Email: your-email@example.com
   - Mobile: +919876543210
   - Password: TestPass123!
   - Confirm Password: TestPass123!
   - Check "I accept the Terms & Conditions"
4. Click "Create Account"
5. Check your email for confirmation link
6. Click the confirmation link
7. You should be logged in and redirected to dashboard

### B. Test Email Login

1. Go to `http://localhost:3002/login`
2. Enter email and password
3. Click "Sign In"
4. Should redirect to dashboard with user dropdown visible

### C. Test Profile Page

1. After logging in, click on your avatar in the header
2. Click "Profile Settings"
3. Test each tab:
   - **Profile**: Update name, bio, upload avatar
   - **Password**: Change password
   - **Preferences**: Toggle notifications, theme

### D. Test Protected Routes

1. Log out by clicking avatar → "Sign Out"
2. Try to access `/dashboard` directly
3. Should redirect to `/login?returnUrl=/dashboard`
4. After logging in, should return to `/dashboard`

### E. Test User Dropdown

1. Log in
2. Click avatar in header
3. Verify dropdown shows:
   - User name and email
   - Links to Dashboard, Profile, Tester, Admin Reports
   - Sign Out button
4. Test each link

---

## 6. Common Issues & Troubleshooting

### Issue: "Auth session missing"
**Solution**: Clear browser cookies and try again

### Issue: Email confirmation link not working
**Solution**: Check Supabase > Authentication > Email Templates
- Ensure confirmation is required
- Check spam folder

### Issue: Profile not created after signup
**Solution**: Check if trigger is working:
```sql
SELECT * FROM user_profiles WHERE id = 'user-id-here';
```

### Issue: Avatar upload failing
**Solution**: Check Supabase Storage policies:
- Bucket `campaign-videos` should allow authenticated uploads
- Check RLS policies on storage

### Issue: Can't update profile
**Solution**: Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

---

## 7. Next Steps

1. **Configure OAuth** (when ready):
   - Get Google OAuth credentials
   - Get Apple OAuth credentials
   - Enable in Supabase

2. **Set up SMS** (when ready):
   - Choose SMS provider
   - Get credentials
   - Configure in Supabase

3. **Testing**:
   - Test all auth flows
   - Test on mobile devices
   - Test password reset
   - Test session management

4. **Deploy to Production**:
   - Update environment variables in Vercel
   - Test on production URL
   - Monitor for any issues

---

## 8. Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Email confirmation required
- [ ] Strong password requirements configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Environment variables secure
- [ ] Storage policies configured
- [ ] Session timeout configured

---

## 9. Useful SQL Queries

### Check all users
```sql
SELECT * FROM auth.users ORDER BY created_at DESC;
```

### Check user profiles
```sql
SELECT * FROM user_profiles ORDER BY created_at DESC;
```

### Check failed auth attempts
```sql
SELECT * FROM auth.audit_log_entries
WHERE action = 'login'
ORDER BY created_at DESC
LIMIT 50;
```

### Delete test user (for cleanup)
```sql
-- This will cascade delete profile too
DELETE FROM auth.users WHERE email = 'test@example.com';
```

---

## 10. API Endpoints

All authentication is handled by Supabase Auth SDK. The following operations are available:

- `supabase.auth.signUp()` - Create new user
- `supabase.auth.signInWithPassword()` - Email/password login
- `supabase.auth.signInWithOtp()` - Mobile OTP login
- `supabase.auth.signInWithOAuth()` - Social login
- `supabase.auth.signOut()` - Logout
- `supabase.auth.updateUser()` - Update password/email
- `supabase.auth.resetPasswordForEmail()` - Password reset

---

## Support

For issues or questions:
- Check Supabase docs: https://supabase.com/docs/guides/auth
- Check your browser console for errors
- Check Supabase logs in Dashboard > Logs
