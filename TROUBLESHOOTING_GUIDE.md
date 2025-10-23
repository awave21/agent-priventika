# Руководство по устранению проблем API endpoint

## 🚨 Текущая ситуация
API endpoint развернут успешно, но тесты показывают проблемы. Необходима детальная диагностика.

## 🔍 Шаг 1: Запуск диагностики

На продакшн сервере выполните:
```bash
sudo ./debug-api.sh
```

Этот скрипт проверит:
- Наличие и права доступа к PHP файлам
- Статус nginx и PHP-FPM
- Конфигурацию nginx
- Логи ошибок
- Прямое тестирование API

## 🛠️ Возможные проблемы и решения

### Проблема 1: SSL/HTTPS проблемы
**Симптомы**: CURL_ERROR или проблемы с HTTPS
**Решение**:
```bash
# Проверка SSL сертификата
curl -I https://agent.integration-ai.ru

# Если проблемы с SSL, тестируем HTTP
curl -X POST "http://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{"user_id": 15206380, "doctor_id": 130671, "time": "2025-10-23 17:00:00", "timeplus": "2025-10-23 18:00:00", "services": [1522063]}'
```

### Проблема 2: PHP-FPM не работает
**Симптомы**: 502 Bad Gateway или 503 Service Unavailable
**Решение**:
```bash
# Проверка статуса PHP-FPM
systemctl status php8.1-fpm
systemctl status php8.2-fpm
systemctl status php8.3-fpm

# Перезапуск PHP-FPM
sudo systemctl restart php8.1-fpm  # или нужную версию
sudo systemctl restart nginx
```

### Проблема 3: Неправильные права доступа
**Симптомы**: 403 Forbidden
**Решение**:
```bash
# Исправление прав доступа
sudo chown -R www-data:www-data /var/www/html/public/api/
sudo chmod -R 644 /var/www/html/public/api/*.php
sudo chmod 755 /var/www/html/public/api/
```

### Проблема 4: Конфигурация nginx не активна
**Симптомы**: 404 Not Found или перенаправление на фронтенд
**Решение**:
```bash
# Проверка активных сайтов
ls -la /etc/nginx/sites-enabled/

# Активация конфигурации (если не активна)
sudo ln -sf /etc/nginx/sites-available/agent.integration-ai.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Проблема 5: Неправильная версия PHP
**Симптомы**: Синтаксические ошибки или 500 Internal Server Error
**Решение**:
```bash
# Проверка версии PHP
php -v

# Проверка какая версия используется в nginx
grep "fastcgi_pass" /etc/nginx/sites-available/agent.integration-ai.ru

# Если нужно изменить версию в конфигурации nginx:
sudo sed -i 's/php8.1-fpm.sock/php8.2-fpm.sock/g' /etc/nginx/sites-available/agent.integration-ai.ru
sudo nginx -t
sudo systemctl reload nginx
```

### Проблема 6: Блокировка файрволом
**Симптомы**: Timeout или Connection refused
**Решение**:
```bash
# Проверка файрвола
sudo ufw status
sudo iptables -L

# Разрешение HTTP/HTTPS трафика
sudo ufw allow 80
sudo ufw allow 443
```

## 🧪 Ручное тестирование

### Тест 1: Локальный PHP
```bash
# Проверка синтаксиса
php -l /var/www/html/public/api/create-appointment.php

# Тест через CLI
cd /var/www/html/public/api/
echo '{"user_id": 15206380, "doctor_id": 130671, "time": "2025-10-23 17:00:00", "timeplus": "2025-10-23 18:00:00", "services": [1522063]}' | REQUEST_METHOD=POST CONTENT_TYPE=application/json php create-appointment.php
```

### Тест 2: Через nginx (локально)
```bash
# Тест с localhost
curl -X POST "http://localhost/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{"user_id": 15206380, "doctor_id": 130671, "time": "2025-10-23 17:00:00", "timeplus": "2025-10-23 18:00:00", "services": [1522063]}'
```

### Тест 3: Проверка внешнего API
```bash
# Прямой тест внешнего API Klientiks
curl -X POST "https://klientiks.ru/clientix/restapi/add/a/61ce3c58eaf0/u/edd7a5545a63/t/1fa5b4b0d9f4dcb850f58e7c460501f1/m/Appointments" \
-H "Authorization: Bearer 1fa5b4b0d9f4dcb850f58e7c460501f1" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "client_id=15206380&executor_id=130671&status=scheduled&start_datetime=2025-10-23&start_time=17:00:00&finish_datetime=2025-10-23&finish_time=18:00:00&appointed_services=1522063"
```

## 📋 Чек-лист диагностики

- [ ] Запущен скрипт `./debug-api.sh`
- [ ] Проверены логи nginx и PHP-FPM
- [ ] Проверен статус сервисов (nginx, PHP-FPM)
- [ ] Проверены права доступа к файлам
- [ ] Проверена активность конфигурации nginx
- [ ] Выполнен локальный тест PHP файла
- [ ] Проверена доступность внешнего API Klientiks

## 🆘 Если ничего не помогает

1. **Восстановите резервную копию**:
   ```bash
   sudo cp /tmp/api_backup_*.nginx /etc/nginx/sites-available/agent.integration-ai.ru
   sudo systemctl reload nginx
   ```

2. **Создайте простой тестовый PHP файл**:
   ```bash
   echo '<?php echo "PHP works!"; ?>' | sudo tee /var/www/html/public/test.php
   curl http://agent.integration-ai.ru/test.php
   ```

3. **Проверьте базовую конфигурацию nginx**:
   ```bash
   sudo nginx -T | grep -A 20 -B 5 "server_name agent.integration-ai.ru"
   ```

## 📞 Следующие шаги

После выполнения диагностики предоставьте результаты для дальнейшего анализа и исправления проблем.