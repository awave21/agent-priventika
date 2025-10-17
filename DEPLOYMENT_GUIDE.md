# Руководство по развертыванию CRM системы

## Статус сервера

**Текущий статус домена `agent.integration-ai.ru`**: ❌ Недоступен
**Локальный сервер предварительного просмотра**: ✅ Работает на `http://localhost:4173`

## Быстрое развертывание

### Nginx + Сервер

1. **Сборка проекта**
   ```bash
   npm run build
   ```

2. **Копирование файлов**
   ```bash
   # Скопируйте содержимое папки dist/ в корень веб-сервера
   cp -r dist/* /var/www/html/
   ```

3. **Настройка Nginx**
   Используйте конфигурацию из `nginx/sites-enabled/agent.integration-ai.ru`

## Диагностика проблем

### Проверка домена
```bash
# Проверка DNS
nslookup agent.integration-ai.ru

# Проверка HTTP
curl -I https://agent.integration-ai.ru

# Проверка сертификата SSL
curl -vI https://agent.integration-ai.ru
```

### Проверка сервера
```bash
# Проверка процессов
sudo systemctl status nginx

# Проверка логов
sudo tail -f /var/log/nginx/agent.integration-ai.ru_error.log
sudo tail -f /var/log/nginx/agent.integration-ai.ru_access.log

# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Проверка файлов
```bash
# Проверка наличия файлов
ls -la /var/www/html/

# Проверка прав доступа
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

## SSL Сертификат

### Автоматическое управление (Let's Encrypt)
```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d agent.integration-ai.ru

# Автоматическое обновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Ручная настройка сертификата
1. Скопируйте сертификаты в:
   - `/etc/letsencrypt/live/agent.integration-ai.ru-0001/fullchain.pem`
   - `/etc/letsencrypt/live/agent.integration-ai.ru-0001/privkey.pem`

2. Убедитесь что конфигурация Nginx указывает на правильные пути сертификатов

## Настройка Supabase

### 1. Создание таблиц
Выполните SQL скрипты в указанном порядке:
```sql
-- 1. Таблица напоминаний
\i supabase_migration_followups.sql

-- 2. Дополнительные миграции
\i supabase_migration_followups_interval.sql
\i supabase_migration_followups_make_chatid_nullable.sql
```

### 2. Настройка RLS политик
Убедитесь что Row Level Security включен и политики настроены правильно для аутентифицированных пользователей.

### 3. Получение ключей
- **Project URL**: Найдите в Settings > API вашего проекта Supabase
- **Anon Key**: `public` ключ из Settings > API

## Интеграция с Wazzup

### Настройка вебхуков
1. В личном кабинете Wazzup настройте вебхуки:
   - URL: `https://agent.integration-ai.ru/bots/webhook`
   - События: `message`, `conversation`

2. Проверьте что Laravel backend правильно обрабатывает вебхуки в:
   - `app/Http/Controllers/WazzupWebhookController.php`

### Конфигурация API
Убедитесь что настройки Wazzup API указаны в Laravel конфигурации.

## Мониторинг

### Логи приложения
```bash
# Логи Laravel
sudo tail -f /var/log/laravel.log

# Системные логи
sudo journalctl -u php-fpm -f
sudo journalctl -u nginx -f
```

### Проверка базы данных
```bash
# Подключение к Supabase
psql "postgresql://user:password@host:5432/dbname"

# Проверка таблиц
\dt
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM save_messages;
```

## Производительность

### Оптимизация Nginx
```nginx
# Кэширование статических файлов
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Оптимизация базы данных
```sql
-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_save_messages_created_at ON save_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id);
CREATE INDEX IF NOT EXISTS idx_followups_trigger_time ON followups(trigger_time) WHERE is_sent = false;
```

## Резервное копирование

### Автоматическое резервное копирование Supabase
```bash
# Ежедневное резервное копирование
sudo crontab -e
# Добавить: 0 2 * * * pg_dump "your_supabase_connection_string" > /backup/supabase_$(date +\%Y\%m\%d).sql
```

### Резервное копирование файлов
```bash
# Создание скрипта резервного копирования
#!/bin/bash
tar -czf /backup/crm_$(date +%Y%m%d).tar.gz /var/www/html/
```

## Устранение неисправностей

### Проблема: Домен недоступен
1. Проверьте DNS записи
2. Убедитесь что сервер работает
3. Проверьте firewall настройки
4. Проверьте Nginx конфигурацию

### Проблема: Ошибки базы данных
1. Проверьте подключение к Supabase
2. Убедитесь в правильности API ключей
3. Проверьте RLS политики
4. Изучите логи ошибок

### Проблема: Вебхуки не работают
1. Проверьте URL вебхука
2. Убедитесь что Laravel backend отвечает
3. Проверьте настройки Wazzup
4. Изучите логи вебхуков

### Проблема: Статические файлы не загружаются
1. Проверьте права доступа к файлам
2. Убедитесь что Nginx настроен правильно
3. Проверьте кэширование браузера
4. Очистите Cloudflare кэш если используется

## Контакты поддержки

При возникновении проблем обращайтесь к:
- Системный администратор
- Разработчик проекта
- Поддержка хостинга

---

*Последнее обновление: 17 октября 2025 года*