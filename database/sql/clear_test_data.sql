-- SQL скрипт для очистки тестовых данных

-- 1. Очистка таблицы savemessagetest (основная таблица для тестовых сообщений)
DELETE FROM savemessagetest WHERE chat_id LIKE 'test_%';
SELECT COUNT(*) as remaining_test_messages FROM savemessagetest WHERE chat_id LIKE 'test_%';

-- 2. Альтернативно: полная очистка таблицы savemessagetest
-- TRUNCATE TABLE savemessagetest;

-- 3. Если есть таблица test_chat_histories, очистить её тоже
-- DELETE FROM test_chat_histories WHERE chat_id LIKE 'test_%';

-- 4. Проверить результат очистки
SELECT
    'savemessagetest' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE chat_id LIKE 'test_%') as test_records
FROM savemessagetest;

-- 5. API способ очистки (альтернатива):
-- curl -X DELETE 'https://supabase.chatmedbot.ru/rest/v1/savemessagetest?chat_id=like.*test_*' \
-- -H "apikey: YOUR_SUPABASE_ANON_KEY" \
-- -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"

-- 5. Примеры полезных запросов для диагностики
-- Посмотреть все тестовые чаты:
-- SELECT DISTINCT chat_id FROM savemessagetest WHERE chat_id LIKE 'test_%';

-- Посмотреть сообщения конкретного чата:
-- SELECT * FROM savemessagetest WHERE chat_id = 'your_chat_id' ORDER BY created_at DESC;

-- Удалить конкретный чат:
-- DELETE FROM savemessagetest WHERE chat_id = 'your_chat_id';