/*
  # Изменение таблицы followups: chat_id становится опциональным

  1. Изменения
    - Делаем `chat_id` nullable (напоминания теперь глобальные, не привязаны к чатам)
    - Удаляем индекс по `chat_id` (больше не нужен для глобальных напоминаний)

  2. Обоснование
    - Напоминания используются как общие правила системы
    - Привязка к чату больше не требуется
*/

-- Делаем chat_id nullable
ALTER TABLE followups
  ALTER COLUMN chat_id DROP NOT NULL;

-- Удаляем индекс по chat_id (больше не нужен)
DROP INDEX IF EXISTS idx_followups_chat_id;
