# Руководство по использованию API для клиентов

## 🔗 Доступные endpoints

### HTTPS (рекомендуется для продакшн)
- `https://agent.integration-ai.ru/api/create-appointment.php`
- `https://agent.integration-ai.ru/api/create-appointment`

### HTTP (для тестирования)
- `http://agent.integration-ai.ru/api/create-appointment.php`
- `http://agent.integration-ai.ru/api/create-appointment`

## 🚨 SSL Issue: Решения

### Вариант 1: Игнорирование SSL (для тестирования)

**curl:**
```bash
curl -k -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 15:00:00",
  "timeplus": "2025-10-23 16:00:00",
  "services": [1522063]
}'
```

**JavaScript (fetch):**
```javascript
// В Node.js
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

fetch('https://agent.integration-ai.ru/api/create-appointment.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 15206380,
    doctor_id: 130671,
    time: "2025-10-23 15:00:00",
    timeplus: "2025-10-23 16:00:00",
    services: [1522063]
  })
});
```

**Python (requests):**
```python
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

response = requests.post(
    'https://agent.integration-ai.ru/api/create-appointment.php',
    json={
        "user_id": 15206380,
        "doctor_id": 130671,
        "time": "2025-10-23 15:00:00",
        "timeplus": "2025-10-23 16:00:00",
        "services": [1522063]
    },
    verify=False
)
```

### Вариант 2: Использование HTTP (проще для тестирования)

**curl:**
```bash
curl -X POST "http://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 15:00:00",
  "timeplus": "2025-10-23 16:00:00",
  "services": [1522063]
}'
```

**JavaScript:**
```javascript
fetch('http://agent.integration-ai.ru/api/create-appointment.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 15206380,
    doctor_id: 130671,
    time: "2025-10-23 15:00:00",
    timeplus: "2025-10-23 16:00:00",
    services: [1522063]
  })
});
```

## 📋 Формат запроса

### Обязательные поля:
- `user_id` (number) - ID клиента
- `doctor_id` (number) - ID врача
- `time` (string) - Время начала в формате "YYYY-MM-DD HH:MM:SS"
- `timeplus` (string) - Время окончания в формате "YYYY-MM-DD HH:MM:SS"
- `services` (array) - Массив ID услуг

### Пример запроса:
```json
{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 15:00:00",
  "timeplus": "2025-10-23 16:00:00",
  "services": [1522063]
}
```

## ✅ Формат успешного ответа

```json
{
  "status": true,
  "messages": ["Данные успешно изменены."],
  "object": {
    "id": 30547564,
    "appointment_id": 30547564,
    "client_id": 15206380,
    "executor_id": 130671,
    "start_datetime": "2025-10-23 15:00:00",
    "finish_datetime": "2025-10-23 16:00:00",
    "status": "scheduled",
    "executor_name": "Магомедова Нукижат Сергеевна",
    "clients_name": "Московец Максим Андреевич"
  }
}
```

## ❌ Формат ответа с ошибкой

```json
{
  "error": "Missing required field: user_id"
}
```

## 🔧 Для продакшн использования

Рекомендуется установить настоящий SSL сертификат (Let's Encrypt) вместо самоподписанного:

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d agent.integration-ai.ru

# Автоматическое обновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

После установки настоящего SSL сертификата, клиенты смогут использовать HTTPS без игнорирования SSL ошибок.