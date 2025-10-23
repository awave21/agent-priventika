#!/bin/bash

echo "🔍 Детальная диагностика API endpoint..."
echo ""

# Проверка файлов
echo "📁 Проверка файлов:"
if [ -f "/var/www/html/public/api/create-appointment.php" ]; then
    echo "✅ PHP файл существует: /var/www/html/public/api/create-appointment.php"
    echo "   Размер: $(stat -c%s /var/www/html/public/api/create-appointment.php) байт"
    echo "   Права: $(stat -c%a /var/www/html/public/api/create-appointment.php)"
    echo "   Владелец: $(stat -c%U:%G /var/www/html/public/api/create-appointment.php)"
else
    echo "❌ PHP файл не найден: /var/www/html/public/api/create-appointment.php"
fi

# Проверка конфигурации nginx
echo ""
echo "🔧 Проверка конфигурации nginx:"
if [ -f "/etc/nginx/sites-available/agent.integration-ai.ru" ]; then
    echo "✅ Конфигурация nginx существует"
    echo "   Активна: $([ -L /etc/nginx/sites-enabled/agent.integration-ai.ru ] && echo "Да" || echo "Нет")"
else
    echo "❌ Конфигурация nginx не найдена"
fi

# Проверка статуса сервисов
echo ""
echo "🔄 Статус сервисов:"
echo "nginx: $(systemctl is-active nginx)"
echo "php8.1-fpm: $(systemctl is-active php8.1-fpm 2>/dev/null || echo "не найден")"
echo "php8.2-fpm: $(systemctl is-active php8.2-fpm 2>/dev/null || echo "не найден")"
echo "php8.3-fpm: $(systemctl is-active php8.3-fpm 2>/dev/null || echo "не найден")"

# Проверка портов
echo ""
echo "🌐 Проверка портов:"
echo "Порт 80: $(ss -tlnp | grep :80 | wc -l) соединений"
echo "Порт 443: $(ss -tlnp | grep :443 | wc -l) соединений"

# Тест прямого доступа к файлу
echo ""
echo "🧪 Тест 1: Прямой доступ к PHP файлу"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 17:00:00",
  "timeplus": "2025-10-23 18:00:00",
  "services": [1522063]
}' 2>/dev/null || echo "CURL_ERROR")

echo "Полный ответ:"
echo "$RESPONSE1"
echo ""

# Тест красивого URL
echo "🧪 Тест 2: Красивый URL"
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" -X POST "https://agent.integration-ai.ru/api/create-appointment" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 18:00:00",
  "timeplus": "2025-10-23 19:00:00",
  "services": [1522063]
}' 2>/dev/null || echo "CURL_ERROR")

echo "Полный ответ:"
echo "$RESPONSE2"
echo ""

# Тест GET запроса
echo "🧪 Тест 3: GET запрос (должен вернуть 405)"
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "https://agent.integration-ai.ru/api/create-appointment.php" 2>/dev/null || echo "CURL_ERROR")

echo "Ответ на GET:"
echo "$RESPONSE3"
echo ""

# Проверка логов nginx (последние 10 строк)
echo "📋 Последние записи в логах nginx:"
if [ -f "/var/log/nginx/error.log" ]; then
    echo "=== Error log ==="
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "Не удается прочитать лог ошибок"
fi

if [ -f "/var/log/nginx/access.log" ]; then
    echo "=== Access log (последние API запросы) ==="
    tail -20 /var/log/nginx/access.log | grep -E "(create-appointment|api)" || echo "API запросы не найдены в логах"
fi

# Проверка логов PHP-FPM
echo ""
echo "📋 Последние записи в логах PHP-FPM:"
for php_version in 8.1 8.2 8.3; do
    if [ -f "/var/log/php${php_version}-fpm.log" ]; then
        echo "=== PHP ${php_version} FPM log ==="
        tail -5 "/var/log/php${php_version}-fpm.log" 2>/dev/null || echo "Не удается прочитать лог PHP ${php_version}"
    fi
done

# Тест локального PHP
echo ""
echo "🧪 Тест 4: Локальный запуск PHP файла"
if [ -f "/var/www/html/public/api/create-appointment.php" ]; then
    echo "Проверка синтаксиса PHP:"
    php -l /var/www/html/public/api/create-appointment.php
    
    echo ""
    echo "Тест через CLI (симуляция POST):"
    export REQUEST_METHOD=POST
    export CONTENT_TYPE="application/json"
    echo '{
      "user_id": 15206380,
      "doctor_id": 130671,
      "time": "2025-10-23 19:00:00",
      "timeplus": "2025-10-23 20:00:00",
      "services": [1522063]
    }' | php /var/www/html/public/api/create-appointment.php 2>&1 || echo "Ошибка выполнения PHP"
fi

echo ""
echo "🔍 Диагностика завершена!"
echo ""
echo "💡 Рекомендации по устранению проблем:"
echo "1. Если HTTP_CODE не 200 - проблема с nginx или PHP-FPM"
echo "2. Если CURL_ERROR - проблема с сетью или SSL"
echo "3. Если синтаксическая ошибка PHP - проблема с кодом"
echo "4. Проверьте логи выше для детальной информации"