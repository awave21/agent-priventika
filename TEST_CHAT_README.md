# Тестовая страница для вебхука

## Обзор
Создана упрощенная тестовая страница для тестирования интеграции с вебхуком `https://n8n.chatmedbot.ru/webhook/klientiks-test`.

## Файлы

### 1. Тестовая страница
- **Файл:** `src/views/TestChatView.vue`
- **Маршрут:** `/test-chats`
- **Описание:** Простая страница для тестирования отправки сообщений на вебхук

### 2. SQL скрипт для создания тестовой таблицы
- **Файл:** `database/sql/create_test_messages_table.sql`
- **Описание:** Создает копию таблицы `save_messages` с именем `savemessagetest`

## Использование

### 1. Настройка базы данных
Выполните SQL скрипт в Supabase SQL Editor:

```sql
-- Создает таблицу savemessagetest как копию save_messages
CREATE TABLE savemessagetest (LIKE save_messages INCLUDING ALL);

-- Копирует все данные
INSERT INTO savemessagetest SELECT * FROM save_messages;
```

### 2. Использование тестовой страницы

1. **Перейдите на `/test-chats`** в приложении
2. **Тестовый чат создастся автоматически** при загрузке страницы
3. **Напишите любое сообщение** - оно отправится на вебхук
4. **Проверьте в панели n8n**, что вебхук получил данные

### 3. Навигация
Пункт **"Тест"** в боковом меню ведет на `/test-chats`

## Структура отправляемых данных

Тестовая страница отправляет на вебхук следующие данные:

```json
{
  "headers": {
    "connection": "upgrade",
    "host": "n8n.chatmedbot.ru",
    "x-real-ip": "172.18.0.1",
    "x-forwarded-for": "172.18.0.1",
    "x-forwarded-proto": "https",
    "content-length": "516",
    "accept": "application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7",
    "content-type": "application/json",
    "user-agent": "axios/1.12.0",
    "accept-encoding": "gzip, compress, deflate, br"
  },
  "params": {},
  "query": {},
  "body": {
    "messages": [
      {
        "messageId": "7d96a608-3be7-4751-bb0c-[random]",
        "dateTime": "2025-10-17T08:29:18.895Z",
        "channelId": "[test-chat-id]",
        "chatType": "instagram",
        "chatId": "_111bt",
        "type": "text",
        "isEcho": false,
        "contact": {
          "name": "⚡",
          "igsid": "1545614590217988"
        },
        "text": "[your-message]",
        "status": "inbound"
      }
    ]
  },
  "webhookUrl": "https://n8n.chatmedbot.ru/webhook/klientiks-test",
  "executionMode": "production"
}
```

## Отличия от основной страницы чатов

1. **Отдельный маршрут:** `/test-chats` вместо `/chats`
2. **Автоматическое создание:** Тестовый чат создается автоматически при загрузке
3. **Отправка на вебхук:** Все сообщения отправляются на вебхук автоматически
4. **Отдельная таблица БД:** Использует таблицу `savemessagetest` (нужно создать отдельно)

## Навигация

Пункт **"Тест"** добавлен в боковое меню между "Чаты" и "Лист игнор" с иконкой пробирки (FlaskConical).

## Важные замечания

1. **Таблица `savemessagetest` должна быть создана отдельно** в Supabase
2. **Сообщения из тестовых чатов не попадают** в основную таблицу `save_messages`
3. **Real-time функциональность** работает только с основной таблицей сообщений
4. **Тестовые чаты** помечаются префиксом `test_` в ID