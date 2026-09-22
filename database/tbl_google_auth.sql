-- Migration: Add google_id column for Google OAuth to tbl_admins and tbl_super_admins

ALTER TABLE `tbl_admins` ADD COLUMN `google_id` VARCHAR(100) NULL UNIQUE AFTER `uuid`;
ALTER TABLE `tbl_super_admins` ADD COLUMN `google_id` VARCHAR(100) NULL UNIQUE AFTER `uuid`;
