-- Reset passwords manual untuk bypass email rate limit
-- Password baru untuk semua: password123

-- Enable pgcrypto extension (jika belum)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users 
SET 
  encrypted_password = crypt('password123', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_token = NULL,
  updated_at = NOW()
WHERE email IN (
  'admin@kosthub.com',
  'penghuni2@test.com',
  'rizky1212t@gmail.com'
);

SELECT 
  id,
  email,
  email_confirmed_at,
  confirmation_token IS NULL as token_cleared,
  updated_at
FROM auth.users
WHERE email IN (
  'admin@kosthub.com',
  'penghuni2@test.com',
  'rizky1212t@gmail.com'
)
ORDER BY email;
