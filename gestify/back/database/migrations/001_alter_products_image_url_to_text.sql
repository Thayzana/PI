-- Migration 001: ampliar coluna de imagem para suportar Base64 e URLs longas
-- Execute no banco projetoFinal (ou o definido em DATABASE_URL)
--
-- Uso manual:
--   psql -U postgres -d projetoFinal -f back/database/migrations/001_alter_products_image_url_to_text.sql
--
-- Ou: npm run db:migrate

BEGIN;

ALTER TABLE products
  ALTER COLUMN image_url TYPE TEXT
  USING image_url::TEXT;

COMMENT ON COLUMN products.image_url IS
  'URL externa ou data URI Base64 da foto do produto (sem limite de 512 caracteres)';

COMMIT;
