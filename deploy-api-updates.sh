#!/bin/bash

echo "🚀 Развертывание обновлений API на продакшн сервер"

# Копируем обновленный файл на сервер
echo "📁 Копирование обновленного API файла..."
scp public/api/create-appointment.php root@agent.integration-ai.ru:/var/www/html/api/

# Проверяем что файл скопирован
echo "✅ Проверка развертывания..."
ssh root@agent.integration-ai.ru "ls -la /var/www/html/api/create-appointment.php"

# Тестируем API без services
echo "🧪 Тестирование API без services..."
curl -k -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-24 10:00:00",
  "timeplus": "2025-10-24 11:00:00"
}'

echo ""
echo "✅ Развертывание завершено!"
echo "🌐 API обновлен на: https://agent.integration-ai.ru/api/create-appointment.php"