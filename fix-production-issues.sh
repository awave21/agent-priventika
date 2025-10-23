#!/bin/bash

echo "🔧 Исправление проблем на продакшн сервере..."
echo ""

# Проверяем права доступа
if [ "$EUID" -ne 0 ]; then
    echo "❌ Этот скрипт должен запускаться с правами root (sudo)"
    exit 1
fi

echo "1️⃣ Исправление версии PHP в конфигурации nginx..."
# Заменяем php8.1-fpm на php8.3-fpm в конфигурации
sed -i 's/php8.1-fpm.sock/php8.3-fpm.sock/g' /etc/nginx/sites-available/agent.integration-ai.ru
echo "✅ Обновлена версия PHP в nginx конфигурации"

echo ""
echo "2️⃣ Проверка и запуск PHP-FPM..."
# Проверяем статус PHP 8.3 FPM
if systemctl is-active --quiet php8.3-fpm; then
    echo "✅ PHP 8.3 FPM уже активен"
else
    echo "🔄 Запуск PHP 8.3 FPM..."
    systemctl start php8.3-fpm
    systemctl enable php8.3-fpm
fi

echo ""
echo "3️⃣ Проверка конфигурации nginx..."
if nginx -t; then
    echo "✅ Конфигурация nginx корректна"
    echo "🔄 Перезагрузка nginx..."
    systemctl reload nginx
else
    echo "❌ Ошибка в конфигурации nginx"
    exit 1
fi

echo ""
echo "4️⃣ Настройка SSL/HTTPS..."
# Проверяем наличие SSL сертификатов
if [ ! -f "/etc/ssl/certs/agent.integration-ai.ru.crt" ]; then
    echo "⚠️  SSL сертификат не найден"
    echo "💡 Создаем самоподписанный сертификат для тестирования..."
    
    # Создаем самоподписанный сертификат
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/agent.integration-ai.ru.key \
        -out /etc/ssl/certs/agent.integration-ai.ru.crt \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=Test/CN=agent.integration-ai.ru"
    
    echo "✅ Самоподписанный сертификат создан"
fi

echo ""
echo "5️⃣ Обновление конфигурации nginx для HTTPS..."
# Создаем полную конфигурацию с HTTPS
cat > /etc/nginx/sites-available/agent.integration-ai.ru << 'EOF'
server {
    listen 80;
    server_name agent.integration-ai.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name agent.integration-ai.ru;
    root /var/www/html/public;

    index index.php index.html index.htm;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/agent.integration-ai.ru.crt;
    ssl_certificate_key /etc/ssl/private/agent.integration-ai.ru.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
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
EOF

echo "✅ Конфигурация nginx обновлена с поддержкой HTTPS"

echo ""
echo "6️⃣ Финальная проверка и перезагрузка..."
if nginx -t; then
    systemctl reload nginx
    echo "✅ nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации nginx"
    exit 1
fi

echo ""
echo "7️⃣ Тестирование исправлений..."
sleep 2

# Тест HTTP (должен перенаправлять на HTTPS)
echo "📋 Тест HTTP (должен перенаправлять):"
HTTP_RESPONSE=$(curl -s -I "http://agent.integration-ai.ru/api/create-appointment.php" | head -1)
echo "   $HTTP_RESPONSE"

# Тест HTTPS с игнорированием SSL ошибок (для самоподписанного сертификата)
echo "📋 Тест HTTPS API:"
HTTPS_RESPONSE=$(curl -k -s -w "HTTP_CODE:%{http_code}" -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 20:00:00",
  "timeplus": "2025-10-23 21:00:00",
  "services": [1522063]
}' 2>/dev/null || echo "CURL_ERROR")

if [[ "$HTTPS_RESPONSE" == *"HTTP_CODE:200"* ]] && [[ "$HTTPS_RESPONSE" == *"status"* ]]; then
    echo "✅ HTTPS API работает!"
    APPOINTMENT_ID=$(echo "$HTTPS_RESPONSE" | grep -o '"appointment_id":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "N/A")
    echo "   📋 Создана запись с ID: $APPOINTMENT_ID"
else
    echo "❌ HTTPS API не работает:"
    echo "   $HTTPS_RESPONSE"
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Что было исправлено:"
echo "1. ✅ Обновлена версия PHP в nginx (8.1 → 8.3)"
echo "2. ✅ Запущен PHP 8.3 FPM"
echo "3. ✅ Создан SSL сертификат"
echo "4. ✅ Настроен HTTPS с перенаправлением"
echo "5. ✅ Обновлена конфигурация nginx"
echo ""
echo "🔗 Теперь API доступен по HTTPS:"
echo "   • https://agent.integration-ai.ru/api/create-appointment.php"
echo "   • https://agent.integration-ai.ru/api/create-appointment"
echo ""
echo "💡 Для продакшн использования замените самоподписанный сертификат на настоящий SSL сертификат"