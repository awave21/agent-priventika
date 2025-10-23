# 🚀 Ручное развертывание обновлений API

## Шаг 1: Подтвердите SSH подключение
Когда скрипт спрашивает:
```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
Введите: **yes**

## Шаг 2: Альтернативное ручное развертывание

Если возникают проблемы с SSH, выполните команды по отдельности:

### 1. Скопируйте файл на сервер:
```bash
scp public/api/create-appointment.php root@agent.integration-ai.ru:/var/www/html/api/
```

### 2. Проверьте что файл скопирован:
```bash
ssh root@agent.integration-ai.ru "ls -la /var/www/html/api/create-appointment.php"
```

### 3. Протестируйте API:
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

## Шаг 3: Ожидаемый результат

После успешного развертывания API должен вернуть:
- ✅ Успешный ответ с данными записи
- ❌ Или ошибку с причиной (но НЕ "Missing required field: services")

## Если всё ещё получаете ошибку "Missing required field: services"

Проверьте содержимое файла на сервере:
```bash
ssh root@agent.integration-ai.ru "head -50 /var/www/html/api/create-appointment.php"
```

Должно быть видно в строке ~29:
```php
$requiredFields = ['user_id', 'doctor_id', 'time', 'timeplus'];
```

А НЕ:
```php
$requiredFields = ['user_id', 'doctor_id', 'time', 'timeplus', 'services'];