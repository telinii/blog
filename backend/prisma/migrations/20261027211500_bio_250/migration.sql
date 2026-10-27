-- A bio editável aceita até 250 caracteres (perfilSchema), mas a coluna
-- nasceu VARCHAR(191) — o default do Prisma na época. Sem isso, uma bio
-- entre 192 e 250 caracteres estourava com P2000 (LengthMismatch).
ALTER TABLE `User` MODIFY `bio` VARCHAR(250) NOT NULL;
