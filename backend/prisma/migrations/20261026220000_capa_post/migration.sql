-- Foto de capa opcional do post.
-- Guarda o caminho público (/uploads/uuid.ext), não o binário.
ALTER TABLE `Post` ADD COLUMN `capa` VARCHAR(191) NULL;
