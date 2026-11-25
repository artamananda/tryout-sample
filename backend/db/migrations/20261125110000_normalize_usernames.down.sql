-- Huruf besar/kecil asli dan username kembar yang diganti tidak bisa dikembalikan;
-- yang dibatalkan hanya aturan unik-nya.
DROP INDEX IF EXISTS users_username_unique;
