DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS guarantee_claims;
DROP TABLE IF EXISTS weekly_report_logs;
DROP TABLE IF EXISTS referral_rewards;
ALTER TABLE transaction_programs DROP COLUMN IF EXISTS bonus_tryouts;
ALTER TABLE orders
    DROP COLUMN IF EXISTS upgrade_from_package_id,
    DROP COLUMN IF EXISTS referrer_user_id,
    DROP COLUMN IF EXISTS referral_code,
    DROP COLUMN IF EXISTS discount,
    DROP COLUMN IF EXISTS list_price;
DROP INDEX IF EXISTS users_referral_code_unique;
ALTER TABLE users DROP COLUMN IF EXISTS referral_code;
DROP TABLE IF EXISTS mentoring_slots;
DROP TABLE IF EXISTS live_class_ratings;
DROP TABLE IF EXISTS live_class_attendances;
DROP TABLE IF EXISTS live_classes;
ALTER TABLE packages
    DROP COLUMN IF EXISTS has_guarantee,
    DROP COLUMN IF EXISTS study_group_url,
    DROP COLUMN IF EXISTS mentoring_fee,
    DROP COLUMN IF EXISTS tutor_fee_percent;
