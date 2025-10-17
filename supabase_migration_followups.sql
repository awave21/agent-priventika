/*
  # Создание таблицы напоминаний (followups)

  1. Новая таблица `followups`
    - `id` (uuid, primary key) - уникальный идентификатор напоминания
    - `chat_id` (text) - ID чата, к которому привязано напоминание
    - `text` (text) - текст напоминания
    - `trigger_time` (timestamptz) - время срабатывания напоминания
    - `is_default` (boolean) - использовать ли контекст чата по умолчанию
    - `is_sent` (boolean) - было ли отправлено напоминание
    - `sent_at` (timestamptz, nullable) - когда было отправлено
    - `created_at` (timestamptz) - время создания записи
    - `updated_at` (timestamptz) - время последнего обновления

  2. Индексы
    - По `trigger_time` с фильтром `WHERE is_sent = false` - для быстрого поиска несработавших напоминаний
    - По `chat_id` - для получения всех напоминаний конкретного чата

  3. Безопасность
    - Включён RLS (Row Level Security)
    - Политики для authenticated пользователей:
      - SELECT: могут читать все напоминания
      - INSERT: могут создавать новые напоминания
      - UPDATE: могут обновлять любые напоминания
      - DELETE: могут удалять любые напоминания
*/

-- Создаём таблицу
CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL,
  text text NOT NULL,
  trigger_time timestamptz NOT NULL,
  is_default boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаём индексы для производительности
CREATE INDEX IF NOT EXISTS idx_followups_trigger_time
  ON followups(trigger_time)
  WHERE is_sent = false;

CREATE INDEX IF NOT EXISTS idx_followups_chat_id
  ON followups(chat_id);

-- Включаем Row Level Security
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

-- Политика на чтение (SELECT)
CREATE POLICY "Authenticated users can view followups"
  ON followups
  FOR SELECT
  TO authenticated
  USING (true);

-- Политика на создание (INSERT)
CREATE POLICY "Authenticated users can create followups"
  ON followups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Политика на обновление (UPDATE)
CREATE POLICY "Authenticated users can update followups"
  ON followups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Политика на удаление (DELETE)
CREATE POLICY "Authenticated users can delete followups"
  ON followups
  FOR DELETE
  TO authenticated
  USING (true);
