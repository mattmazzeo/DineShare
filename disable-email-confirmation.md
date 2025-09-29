# Disable Email Confirmation in Supabase Dashboard

To make signup easier for development, you need to disable email confirmation in your Supabase dashboard:

## Steps:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/ayhrbjglswfxumcmfmvn

2. **Navigate to Authentication Settings**:
   - Click on "Authentication" in the left sidebar
   - Click on "Settings" tab

3. **Disable Email Confirmation**:
   - Find "Email confirmation" section
   - **Uncheck** "Enable email confirmations"
   - **Uncheck** "Enable email change confirmations" 
   - **Uncheck** "Enable phone confirmations"

4. **Save Changes**:
   - Click "Save" at the bottom of the page

## Alternative: Use Supabase CLI

You can also run this command to disable email confirmation:

```bash
supabase projects update --project-ref ayhrbjglswfxumcmfmvn --disable-email-confirmations
```

## What This Does:

- ✅ Users can sign up and immediately access the app
- ✅ No email verification required
- ✅ No waiting for confirmation emails
- ✅ Perfect for development and testing

## After Making This Change:

1. Try signing up again in your app
2. You should be able to sign in immediately after signup
3. No email verification needed!

This makes development much faster and easier! 🚀
