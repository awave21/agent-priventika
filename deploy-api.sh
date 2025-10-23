#!/bin/bash

# Скрипт развертывания API endpoint для создания записей к врачу
set -e

echo "🚀 Развертывание API endpoint для создания записей к врачу..."
echo ""

# Проверяем права доступа
if [ "$EUID" -ne 0 ]; then
    echo "❌ Этот скрипт должен запускаться с правами root (sudo)"
    echo "💡 Используйте: sudo ./deploy-api.sh"
    exit 1
fi

# Проверяем, что мы на продакшн сервере
if [ ! -d "/var/www/html" ]; then
    echo "❌ Директория /var/www/html не найдена."
    echo "💡 Убедитесь, что вы на продакшн сервере с настроенным веб-сервером."
    exit 1
fi

# Проверяем наличие исходных файлов
if [ ! -f "public/api/create-appointment.php" ]; then
    echo "❌ Файл public/api/create-appointment.php не найден."
    echo "💡 Запустите скрипт из корневой директории проекта."
    exit 1
fi

if [ ! -f "nginx.conf" ]; then
    echo "❌ Файл nginx.conf не найден."
    echo "💡 Запустите скрипт из корневой директории проекта."
    exit 1
fi

# Создаем резервные копии
echo "💾 Создание резервных копий..."
BACKUP_NAME="api_backup_$(date +%Y%m%d_%H%M%S)"

if [ -f "/var/www/html/public/api/create-appointment.php" ]; then
    cp "/var/www/html/public/api/create-appointment.php" "/tmp/$BACKUP_NAME.php"
    echo "✅ Резервная копия API: /tmp/$BACKUP_NAME.php"
fi

if [ -f "/etc/nginx/sites-available/agent.integration-ai.ru" ]; then
    cp "/etc/nginx/sites-available/agent.integration-ai.ru" "/tmp/$BACKUP_NAME.nginx"
    echo "✅ Резервная копия nginx: /tmp/$BACKUP_NAME.nginx"
fi

# Развертывание API файла
echo ""
echo "📤 Развертывание API файла..."
mkdir -p /var/www/html/public/api
cp public/api/create-appointment.php /var/www/html/public/api/
chown www-data:www-data /var/www/html/public/api/create-appointment.php
chmod 644 /var/www/html/public/api/create-appointment.php
echo "✅ API файл развернут: /var/www/html/public/api/create-appointment.php"

# Обновление конфигурации nginx
echo ""
echo "🔧 Обновление конфигурации nginx..."
cp nginx.conf /etc/nginx/sites-available/agent.integration-ai.ru
echo "✅ Конфигурация nginx обновлена"

# Проверка конфигурации nginx
echo ""
echo "🔍 Проверка конфигурации nginx..."
if nginx -t 2>/dev/null; then
    echo "✅ Конфигурация nginx корректна"
    
    # Перезагрузка nginx
    echo ""
    echo "🔄 Перезагрузка nginx..."
    systemctl reload nginx
    echo "✅ nginx успешно перезагружен"
    
    # Проверка статуса nginx
    if systemctl is-active --quiet nginx; then
        echo "✅ nginx работает корректно"
    else
        echo "❌ nginx не запущен"
        echo "💡 Проверьте статус: systemctl status nginx"
    fi
else
    echo "❌ Ошибка в конфигурации nginx!"
    echo ""
    echo "🔄 Восстанавливаем резервную копию..."
    if [ -f "/tmp/$BACKUP_NAME.nginx" ]; then
        cp "/tmp/$BACKUP_NAME.nginx" /etc/nginx/sites-available/agent.integration-ai.ru
        systemctl reload nginx
        echo "✅ Резервная копия восстановлена"
    fi
    echo ""
    echo "💡 Проверьте конфигурацию вручную: nginx -t"
    exit 1
fi

# Ожидание перед тестированием
echo ""
echo "⏳ Ожидание 3 секунды перед тестированием..."
sleep 3

# Тестирование API
echo ""
echo "🧪 Тестирование API endpoint..."

# Тест 1: Прямой доступ к PHP файлу
echo "📋 Тест 1: Прямой доступ к PHP файлу"
RESPONSE1=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 15:00:00",
  "timeplus": "2025-10-23 16:00:00",
  "services": [1522063]
}' 2>/dev/null || echo "ERROR")

# Тест 2: Красивый URL
echo "📋 Тест 2: Красивый URL"
RESPONSE2=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST "https://agent.integration-ai.ru/api/create-appointment" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 16:00:00",
  "timeplus": "2025-10-23 17:00:00",
  "services": [1522063]
}' 2>/dev/null || echo "ERROR")

# Анализ результатов
echo ""
echo "📊 Результаты тестирования:"

if [[ "$RESPONSE1" == *"HTTP_CODE:200"* ]] && [[ "$RESPONSE1" == *"status"* ]] && [[ "$RESPONSE1" == *"true"* ]]; then
    echo "✅ Тест 1 (прямой PHP): УСПЕШНО"
    APPOINTMENT_ID1=$(echo "$RESPONSE1" | grep -o '"appointment_id":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "N/A")
    echo "   📋 ID записи: $APPOINTMENT_ID1"
else
    echo "❌ Тест 1 (прямой PHP): НЕУДАЧНО"
    if [[ "$RESPONSE1" == *"HTTP_CODE:405"* ]]; then
        echo "   💡 Ошибка 405: POST запросы не разрешены"
    elif [[ "$RESPONSE1" == *"HTTP_CODE:404"* ]]; then
        echo "   💡 Ошибка 404: Файл не найден"
    fi
fi

if [[ "$RESPONSE2" == *"HTTP_CODE:200"* ]] && [[ "$RESPONSE2" == *"status"* ]] && [[ "$RESPONSE2" == *"true"* ]]; then
    echo "✅ Тест 2 (красивый URL): УСПЕШНО"
    APPOINTMENT_ID2=$(echo "$RESPONSE2" | grep -o '"appointment_id":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "N/A")
    echo "   📋 ID записи: $APPOINTMENT_ID2"
else
    echo "❌ Тест 2 (красивый URL): НЕУДАЧНО"
    if [[ "$RESPONSE2" == *"HTTP_CODE:405"* ]]; then
        echo "   💡 Ошибка 405: POST запросы не разрешены"
    elif [[ "$RESPONSE2" == *"HTTP_CODE:404"* ]]; then
        echo "   💡 Ошибка 404: Маршрут не найден"
    fi
fi

# Итоговый отчет
echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📋 Выполненные действия:"
echo "1. ✅ Создана резервная копия существующих файлов"
echo "2. ✅ Развернут файл create-appointment.php"
echo "3. ✅ Обновлена конфигурация nginx"
echo "4. ✅ Перезагружен nginx"
echo "5. ✅ Выполнено тестирование API"
echo ""
echo "🔗 Доступные endpoints:"
echo "   • https://agent.integration-ai.ru/api/create-appointment.php"
echo "   • https://agent.integration-ai.ru/api/create-appointment"
echo ""
echo "📖 Документация: API_DEPLOYMENT_INSTRUCTIONS.md"
echo "🧪 Повторное тестирование: ./test-api.sh"
echo ""

# Проверка успешности развертывания
if [[ "$RESPONSE1" == *"HTTP_CODE:200"* ]] || [[ "$RESPONSE2" == *"HTTP_CODE:200"* ]]; then
    echo "🎊 API успешно развернут и работает!"
    exit 0
else
    echo "⚠️  API развернут, но тесты показывают проблемы."
    echo "💡 Проверьте логи nginx: tail -f /var/log/nginx/error.log"
    echo "💡 Проверьте логи PHP: tail -f /var/log/php*/fpm.log"
    exit 1
fi