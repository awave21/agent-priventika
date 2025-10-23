-- SQL скрипт для создания копии таблицы save_messages как savemessagetest в Supabase
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- 1. Создаем новую таблицу savemessagetest как копию save_messages
CREATE TABLE savemessagetest (LIKE save_messages INCLUDING ALL);

-- 2. Копируем все данные из save_messages в savemessagetest
INSERT INTO savemessagetest
SELECT * FROM save_messages;

-- 3. Проверяем количество скопированных записей
SELECT COUNT(*) as total_records FROM savemessagetest;

-- 4. Опционально: очистить тестовую таблицу для начала с чистого листа
-- DELETE FROM savemessagetest WHERE created_at < NOW() - INTERVAL '1 day';
-- Или для полной очистки:
-- TRUNCATE TABLE savemessagetest;

-- 5. Проверить структуру созданной таблицы
-- \d savemessagetest;

-- 6. Пример выборки тестовых данных
-- SELECT id, chat_id, message_text, created_at FROM savemessagetest LIMIT 10;