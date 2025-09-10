-- Delete all users except tom@walkermob.com to reset new user experience
-- This will cascade to profiles and other related tables due to foreign key constraints

DELETE FROM auth.users 
WHERE email != 'tom@walkermob.com';