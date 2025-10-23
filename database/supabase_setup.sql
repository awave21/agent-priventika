-- Настройка real-time функциональности для таблицы save_messages в Supabase
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- Проверяем существует ли таблица save_messages
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'save_messages'
);

-- Включение Row Level Security (RLS) для таблицы save_messages
ALTER TABLE IF EXISTS public.save_messages ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own messages" ON public.save_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.save_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.save_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.save_messages;

-- Политика для чтения: пользователи видят все сообщения (для демо)
-- В продакшене рекомендуется настроить более строгие политики
CREATE POLICY "Users can view all messages" ON public.save_messages
    FOR SELECT USING (true);

-- Политика для вставки: аутентифицированные пользователи могут добавлять сообщения
CREATE POLICY "Authenticated users can insert messages" ON public.save_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Политика для обновления: пользователи могут обновлять любые сообщения (для демо)
-- В продакшене рекомендуется ограничить до своих сообщений
CREATE POLICY "Users can update messages" ON public.save_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Политика для удаления: пользователи могут удалять любые сообщения (для демо)
-- В продакшене рекомендуется ограничить до своих сообщений
CREATE POLICY "Users can delete messages" ON public.save_messages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Создание индексов для оптимизации производительности
CREATE INDEX IF NOT EXISTS idx_save_messages_chat_id ON public.save_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_save_messages_created_at ON public.save_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_save_messages_role_user ON public.save_messages(role_user);

-- Включение репликации для real-time функциональности
-- Проверяем включена ли репликация для таблицы save_messages
SELECT
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'save_messages';

-- Если таблица не включена в репликацию, добавляем её
-- (Это может потребовать прав суперпользователя)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.save_messages;

-- Проверка созданных политик
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'save_messages';

-- Проверка структуры таблицы
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'save_messages'
ORDER BY ordinal_position;

-- Рекомендация: Создайте резервную копию данных перед изменениями
-- SELECT * INTO save_messages_backup FROM save_messages;

-- Тестирование real-time функциональности
-- После выполнения скрипта попробуйте:
-- 1. Вставить новое сообщение в таблицу
-- 2. Проверить появление его в real-time клиенте
-- 3. Убедиться что политика RLS работает корректно