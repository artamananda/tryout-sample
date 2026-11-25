-- Email asli akun ganda dan huruf besarnya tidak bisa dikembalikan;
-- yang dibatalkan hanya aturan unik-nya.
DROP INDEX IF EXISTS users_email_unique;
