#!/bin/bash

echo "🧪 Тестирование API endpoint..."
echo ""

# Тест 1: Прямой доступ к PHP файлу
echo "📋 Тест 1: Прямой доступ к PHP файлу"
echo "URL: https://agent.integration-ai.ru/api/create-appointment.php"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 13:00:00",
  "timeplus": "2025-10-23 14:00:00",
  "services": [1522063]
}')

echo "Ответ:"
echo "$RESPONSE1"
echo ""

# Тест 2: Красивый URL
echo "📋 Тест 2: Красивый URL"
echo "URL: https://agent.integration-ai.ru/api/create-appointment"
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://agent.integration-ai.ru/api/create-appointment" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 14:00:00",
  "timeplus": "2025-10-23 15:00:00",
  "services": [1522063]
}')

echo "Ответ:"
echo "$RESPONSE2"
echo ""

# Тест 3: Проверка доступности файла
echo "📋 Тест 3: Проверка доступности файла"
echo "URL: https://agent.integration-ai.ru/api/create-appointment.php (GET)"
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "https://agent.integration-ai.ru/api/create-appointment.php")

echo "Ответ:"
echo "$RESPONSE3"
echo ""

# Анализ результатов
echo "📊 Анализ результатов:"
if [[ "$RESPONSE1" == *"HTTP_CODE:200"* ]] && [[ "$RESPONSE1" == *"status"* ]]; then
    echo "✅ Тест 1 (прямой PHP): УСПЕШНО"
elif [[ "$RESPONSE1" == *"HTTP_CODE:405"* ]]; then
    echo "❌ Тест 1 (прямой PHP): 405 Method Not Allowed"
elif [[ "$RESPONSE1" == *"HTTP_CODE:404"* ]]; then
    echo "❌ Тест 1 (прямой PHP): 404 Not Found"
else
    echo "❌ Тест 1 (прямой PHP): НЕИЗВЕСТНАЯ ОШИБКА"
fi

if [[ "$RESPONSE2" == *"HTTP_CODE:200"* ]] && [[ "$RESPONSE2" == *"status"* ]]; then
    echo "✅ Тест 2 (красивый URL): УСПЕШНО"
elif [[ "$RESPONSE2" == *"HTTP_CODE:405"* ]]; then
    echo "❌ Тест 2 (красивый URL): 405 Method Not Allowed"
elif [[ "$RESPONSE2" == *"HTTP_CODE:404"* ]]; then
    echo "❌ Тест 2 (красивый URL): 404 Not Found"
else
    echo "❌ Тест 2 (красивый URL): НЕИЗВЕСТНАЯ ОШИБКА"
fi

if [[ "$RESPONSE3" == *"HTTP_CODE:405"* ]]; then
    echo "✅ Тест 3 (GET запрос): Корректно возвращает 405 (только POST разрешен)"
elif [[ "$RESPONSE3" == *"HTTP_CODE:404"* ]]; then
    echo "❌ Тест 3 (GET запрос): 404 - файл не найден"
else
    echo "ℹ️  Тест 3 (GET запрос): Неожиданный ответ"
fi

echo ""
echo "💡 Рекомендации:"
if [[ "$RESPONSE1" == *"HTTP_CODE:405"* ]] && [[ "$RESPONSE2" == *"HTTP_CODE:405"* ]]; then
    echo "- Проблема с конфигурацией nginx - POST запросы не обрабатываются"
    echo "- Нужно обновить конфигурацию nginx на сервере"
elif [[ "$RESPONSE1" == *"HTTP_CODE:404"* ]]; then
    echo "- PHP файл не найден на сервере"
    echo "- Нужно развернуть файл create-appointment.php"
else
    echo "- Проверьте логи nginx и PHP-FPM для диагностики"
fi