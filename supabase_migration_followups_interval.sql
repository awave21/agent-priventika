/*
  # Изменение структуры таблицы followups: переход на интервал

  1. Изменения
    - Удаляем колонку `trigger_time` (timestamptz)
    - Добавляем колонку `interval_minutes` (integer) - интервал в минутах от момента создания
    - Удаляем индекс по trigger_time
    - Добавляем индекс по created_at для расчета времени срабатывания

  2. Обоснование
    - Хранение интервала вместо абсолютного времени упрощает логику
    - Соответствует пользовательскому интерфейсу (выбор 5, 10, 15, 30, 60 минут)
    - Упрощает редактирование и повторное использование напоминаний
*/

-- Удаляем старый индекс по trigger_time
DROP INDEX IF EXISTS idx_followups_trigger_time;

-- Удаляем колонку trigger_time
ALTER TABLE followups
  DROP COLUMN IF EXISTS trigger_time;

-- Добавляем колонку interval_minutes
ALTER TABLE followups
  ADD COLUMN IF NOT EXISTS interval_minutes integer NOT NULL DEFAULT 5;

-- Создаём индекс по created_at и is_sent для эффективного поиска несработавших напоминаний
CREATE INDEX IF NOT EXISTS idx_followups_created_is_sent
  ON followups(created_at, is_sent)
  WHERE is_sent = false;
