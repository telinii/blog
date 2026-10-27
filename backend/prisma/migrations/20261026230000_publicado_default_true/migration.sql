-- Posts novos passam a nascer publicados.
-- Os posts existentes também são publicados para não sumirem da home.
ALTER TABLE `Post` MODIFY `publicado` BOOLEAN NOT NULL DEFAULT true;
UPDATE `Post` SET `publicado` = true;

-- A listagem pública filtra por publicado e ordena por data.
CREATE INDEX `Post_publicado_data_idx` ON `Post`(`publicado`, `data`);
