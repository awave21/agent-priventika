# 🚀 Инструкции по развертыванию обновлений API

## 🔄 Проблема
На продакшн сервере всё ещё старая версия API, которая требует обязательное поле `services`. Локальные изменения нужно развернуть на сервер.

## ✅ Решение

### Вариант 1: Автоматическое развертывание
```bash
# Запустите скрипт развертывания
./deploy-api-updates.sh
```

### Вариант 2: Ручное развертывание
```bash
# 1. Скопируйте обновленный файл на сервер
scp public/api/create-appointment.php root@agent.integration-ai.ru:/var/www/html/api/

# 2. Проверьте что файл скопирован
ssh root@agent.integration-ai.ru "ls -la /var/www/html/api/create-appointment.php"

# 3. Протестируйте API без services
curl -k -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-24 10:00:00",
  "timeplus": "2025-10-24 11:00:00"
}'
```

## 📋 Что изменилось в новой версии

### ✅ Поле `services` теперь необязательное
- **Старая версия**: `services` обязательно
- **Новая версия**: `services` необязательно

### ✅ Улучшенная обработка ошибок
- Детальные сообщения об ошибках на русском языке
- Различение успешных и неуспешных запросов
- Понятные коды ответов

## 🧪 Тестирование после развертывания

### Тест 1: Запрос без services (должен работать)
```bash
curl -k -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-24 10:00:00",
  "timeplus": "2025-10-24 11:00:00"
}'
```

### Тест 2: Запрос с services (должен работать)
```bash
curl -k -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-24 11:00:00",
  "timeplus": "2025-10-24 12:00:00",
  "services": [1522063]
}'
```

## 📊 Ожидаемые результаты

### ✅ Успешный ответ:
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment_id": 12345,
  "data": {...}
}
```

### ❌ Ошибка с причиной:
```json
{
  "success": false,
  "error": "Failed to create appointment",
  "details": {
    "start_datetime": ["Это время уже занято."]
  },
  "message": "Appointment creation failed due to validation errors"
}
```

## 🔧 Устранение проблем

Если после развертывания всё ещё получаете ошибку "Missing required field: services":

1. **Проверьте что файл скопирован:**
   ```bash
   ssh root@agent.integration-ai.ru "cat /var/www/html/api/create-appointment.php | head -30"
   ```

2. **Перезапустите nginx:**
   ```bash
   ssh root@agent.integration-ai.ru "systemctl reload nginx"
   ```

3. **Очистите кеш PHP (если есть):**
   ```bash
   ssh root@agent.integration-ai.ru "systemctl reload php8.3-fpm"
   ```

После развертывания API будет работать без обязательного поля `services`.