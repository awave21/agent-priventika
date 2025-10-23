# Инструкции по развертыванию API endpoint

## Проблема
API endpoint `/api/create-appointment` возвращает ошибку 405 Method Not Allowed из-за неправильной конфигурации nginx на продакшн сервере.

## Диагностика проблемы
Запустите тест для проверки текущего состояния:
```bash
./test-api.sh
```

## Решение

### Шаг 1: Подключение к продакшн серверу
```bash
ssh root@agent.integration-ai.ru
# или используйте ваш метод подключения к серверу
```

### Шаг 2: Создание резервной копии текущей конфигурации
```bash
sudo cp /etc/nginx/sites-available/agent.integration-ai.ru /etc/nginx/sites-available/agent.integration-ai.ru.backup.$(date +%Y%m%d_%H%M%S)
```

### Шаг 3: Обновление конфигурации nginx
Замените содержимое файла `/etc/nginx/sites-available/agent.integration-ai.ru` на:

```nginx
server {
    listen 80;
    server_name agent.integration-ai.ru;
    root /var/www/html/public;

    index index.php index.html index.htm;

    # Основная локация для фронтенда
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # API endpoints - поддержка красивых URL
    location /api/create-appointment {
        try_files $uri /api/create-appointment.php;
    }

    # Прямой доступ к PHP файлам в /api/
    location /api/ {
        try_files $uri $uri/ =404;
    }

    # Обработка PHP файлов
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;  # Adjust PHP version
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        
        # Добавляем поддержку POST запросов
        fastcgi_param REQUEST_METHOD $request_method;
        fastcgi_param CONTENT_TYPE $content_type;
        fastcgi_param CONTENT_LENGTH $content_length;
    }

    # Скрываем .ht файлы
    location ~ /\.ht {
        deny all;
    }
}
```

### Шаг 4: Развертывание PHP файла
```bash
# Создаем директорию для API
sudo mkdir -p /var/www/html/public/api

# Копируем PHP файл (замените путь на актуальный)
sudo cp /path/to/your/project/public/api/create-appointment.php /var/www/html/public/api/

# Устанавливаем правильные права доступа
sudo chown www-data:www-data /var/www/html/public/api/create-appointment.php
sudo chmod 644 /var/www/html/public/api/create-appointment.php
```

### Шаг 5: Проверка и перезагрузка nginx
```bash
# Проверяем конфигурацию
sudo nginx -t

# Если конфигурация корректна, перезагружаем nginx
sudo systemctl reload nginx

# Проверяем статус nginx
sudo systemctl status nginx
```

### Шаг 6: Тестирование API
```bash
# Тест прямого доступа к PHP файлу
curl -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 13:00:00",
  "timeplus": "2025-10-23 14:00:00",
  "services": [1522063]
}'

# Тест красивого URL
curl -X POST "https://agent.integration-ai.ru/api/create-appointment" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 13:00:00",
  "timeplus": "2025-10-23 14:00:00",
  "services": [1522063]
}'
```

## Ожидаемый результат
После успешного развертывания вы должны получить JSON ответ вида:
```json
{
  "status": true,
  "messages": ["Данные успешно изменены."],
  "object": {
    "id": 30547417,
    "account_id": 27484,
    "client_id": 15206380,
    "executor_id": 130671,
    "start_datetime": "2025-10-23 13:00:00",
    "finish_datetime": "2025-10-23 14:00:00",
    "status": "scheduled",
    ...
  },
  "appointment_id": 30547417
}
```

## Устранение неполадок

### Если получаете 405 Method Not Allowed:
- Проверьте, что конфигурация nginx обновлена
- Убедитесь, что nginx перезагружен
- Проверьте логи: `sudo tail -f /var/log/nginx/error.log`

### Если получаете 404 Not Found:
- Убедитесь, что PHP файл скопирован в правильную директорию
- Проверьте права доступа к файлу
- Убедитесь, что PHP-FPM работает: `sudo systemctl status php8.1-fpm`

### Если получаете 500 Internal Server Error:
- Проверьте логи PHP: `sudo tail -f /var/log/php8.1-fpm.log`
- Проверьте логи nginx: `sudo tail -f /var/log/nginx/error.log`
- Убедитесь, что все зависимости PHP установлены

## Автоматический скрипт развертывания
Для автоматизации процесса используйте скрипт `deploy-api.sh`:
```bash
chmod +x deploy-api.sh
sudo ./deploy-api.sh
```

## Проверка после развертывания
Запустите тест для проверки работоспособности:
```bash
./test-api.sh
```

Все тесты должны показать статус "УСПЕШНО".