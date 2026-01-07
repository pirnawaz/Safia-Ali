-- ============================================
-- SUPABASE STORAGE SETUP
-- ============================================
-- This migration creates storage buckets
-- NOTE: Storage policies MUST be created via Supabase Dashboard UI
-- See STORAGE_POLICIES.md for the policies to create manually

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documents', 'documents', false),
  ('jobcard-photos', 'jobcard-photos', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify buckets were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    RAISE NOTICE 'Storage bucket "documents" created successfully';
  END IF;
  
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'jobcard-photos') THEN
    RAISE NOTICE 'Storage bucket "jobcard-photos" created successfully';
  END IF;
END $$;

-- ============================================
-- NEXT STEPS
-- ============================================

-- Storage policies cannot be created via SQL due to permission restrictions.
-- Please create the policies manually in the Supabase Dashboard:
-- 
-- 1. Go to Storage → Policies
-- 2. Create policies for each bucket as documented in STORAGE_POLICIES.md
-- 
-- Or run the following commands in the Supabase SQL Editor with elevated permissions:
-- (This requires superuser access which is not available in the standard SQL Editor)

