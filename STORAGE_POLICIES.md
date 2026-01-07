# Supabase Storage Policies - Manual Setup Guide

## ⚠️ Important Note

Storage policies cannot be created via SQL migrations due to permission restrictions. You must create them manually through the Supabase Dashboard UI.

---

## 📋 Step-by-Step Instructions

### 1. Navigate to Storage Policies
1. Go to your Supabase Dashboard
2. Click on **Storage** in the left sidebar
3. Click on **Policies** tab

---

## 📁 Bucket 1: `documents`

### Policy 1: Upload Documents (INSERT)
**Name:** `Authenticated users can upload documents`

**Allowed operation:** INSERT

**Policy definition:**
```sql
(bucket_id = 'documents'::text)
```

**Target roles:** authenticated

---

### Policy 2: View Documents (SELECT)
**Name:** `Authorized roles can view documents`

**Allowed operation:** SELECT

**Policy definition:**
```sql
(
  (bucket_id = 'documents'::text) 
  AND 
  (
    (get_user_role(auth.uid()) IN ('admin'::text, 'manager'::text, 'accounts'::text))
    OR 
    (owner = auth.uid())
  )
)
```

**Target roles:** authenticated

---

### Policy 3: Delete Documents (DELETE)
**Name:** `Owner or admin can delete documents`

**Allowed operation:** DELETE

**Policy definition:**
```sql
(
  (bucket_id = 'documents'::text)
  AND
  (
    (owner = auth.uid())
    OR
    (get_user_role(auth.uid()) = 'admin'::text)
  )
)
```

**Target roles:** authenticated

---

## 📸 Bucket 2: `jobcard-photos`

### Policy 1: Upload Photos (INSERT)
**Name:** `Authenticated users can upload job card photos`

**Allowed operation:** INSERT

**Policy definition:**
```sql
(bucket_id = 'jobcard-photos'::text)
```

**Target roles:** authenticated

---

### Policy 2: View Photos (SELECT)
**Name:** `All users can view job card photos`

**Allowed operation:** SELECT

**Policy definition:**
```sql
(bucket_id = 'jobcard-photos'::text)
```

**Target roles:** authenticated

---

### Policy 3: Delete Photos (DELETE)
**Name:** `Owner or admin can delete job card photos`

**Allowed operation:** DELETE

**Policy definition:**
```sql
(
  (bucket_id = 'jobcard-photos'::text)
  AND
  (
    (owner = auth.uid())
    OR
    (get_user_role(auth.uid()) = 'admin'::text)
  )
)
```

**Target roles:** authenticated

---

## 🎯 Quick Setup (Dashboard UI)

### For `documents` bucket:

1. **Click "New Policy"** on the documents bucket
2. **Choose "Custom"** policy
3. Fill in the details for each policy above
4. Click **"Review"** then **"Save policy"**

### For `jobcard-photos` bucket:

1. **Click "New Policy"** on the jobcard-photos bucket
2. **Choose "Custom"** policy
3. Fill in the details for each policy above
4. Click **"Review"** then **"Save policy"**

---

## ✅ Verification

After creating all policies, verify they work:

### Test Document Upload (Admin)
```javascript
// In browser console (logged in as admin)
const { data, error } = await supabase.storage
  .from('documents')
  .upload('test.txt', new Blob(['test']), {
    contentType: 'text/plain'
  })

console.log(data, error)
```

### Test Document Access (Non-Admin)
```javascript
// In browser console (logged in as non-admin)
const { data, error } = await supabase.storage
  .from('documents')
  .list()

console.log(data, error)
// Should only see own files
```

### Test Photo Upload
```javascript
// In browser console (any authenticated user)
const { data, error } = await supabase.storage
  .from('jobcard-photos')
  .upload('photo.jpg', photoFile, {
    contentType: 'image/jpeg'
  })

console.log(data, error)
```

---

## 🔒 Security Notes

### Documents Bucket
- **Private by default** (public = false)
- Only **admin, manager, and accounts** can view all documents
- Users can **view their own uploads**
- Only **owner or admin** can delete

### Job Card Photos Bucket
- **Private by default** (public = false)
- **All authenticated users** can view (for production tracking)
- Only **owner or admin** can delete

---

## 🐛 Troubleshooting

### "Policy check violation" error when uploading
- Ensure you're authenticated
- Check the bucket name is correct
- Verify the policy was created correctly

### Cannot view uploaded files
- Check you're using the correct role (admin/manager/accounts for documents)
- Verify the SELECT policy is active
- Check the file owner matches your user ID

### "Row level security" error
- Ensure RLS is enabled on storage.objects (should be by default)
- Verify all policies are created and active

---

## 📝 Policy Summary

| Bucket | Operation | Who Can Access |
|--------|-----------|----------------|
| documents | INSERT | All authenticated users |
| documents | SELECT | Admin, Manager, Accounts, or file owner |
| documents | DELETE | Admin or file owner |
| jobcard-photos | INSERT | All authenticated users |
| jobcard-photos | SELECT | All authenticated users |
| jobcard-photos | DELETE | Admin or file owner |

---

## 🔄 Alternative: SQL with Elevated Permissions

If you have superuser access to your Supabase database (not available in standard SQL Editor), you can run:

```sql
-- Connect with superuser privileges (not available in Supabase SQL Editor)
-- This is for reference only - use Dashboard UI instead

-- Documents bucket policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authorized roles can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts') OR
    owner = auth.uid()
  )
);

CREATE POLICY "Owner or admin can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (owner = auth.uid() OR get_user_role(auth.uid()) = 'admin')
);

-- Jobcard photos bucket policies
CREATE POLICY "Authenticated users can upload job card photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jobcard-photos');

CREATE POLICY "All users can view job card photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'jobcard-photos');

CREATE POLICY "Owner or admin can delete job card photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'jobcard-photos' AND
  (owner = auth.uid() OR get_user_role(auth.uid()) = 'admin')
);
```

**Note:** This will only work if you connect directly to the PostgreSQL database with superuser privileges, which is not available through the Supabase SQL Editor.

---

## ✅ Checklist

After completing the setup:

- [ ] Both buckets created (`documents`, `jobcard-photos`)
- [ ] 3 policies created for `documents` bucket (INSERT, SELECT, DELETE)
- [ ] 3 policies created for `jobcard-photos` bucket (INSERT, SELECT, DELETE)
- [ ] Tested upload to documents bucket
- [ ] Tested access restrictions (non-admin cannot see admin documents)
- [ ] Tested upload to jobcard-photos bucket
- [ ] Tested that all users can view job card photos

---

**Last Updated:** January 7, 2026

