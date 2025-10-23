# 🔐 Решение проблемы SSL сертификата

## 🚨 Проблема
Внешние клиенты получают ошибку при обращении к API:
```
SSL Issue: consider using the 'Ignore SSL issues' option
curl: (60) SSL certificate problem: self-signed certificate
```

## 🔍 Причина
На сервере `https://agent.integration-ai.ru` установлен **самоподписанный SSL сертификат**, который не доверяют браузеры и внешние клиенты.

## ✅ Решение 1: Установка настоящего SSL сертификата (РЕКОМЕНДУЕТСЯ)

### Запустите на сервере:
```bash
# Скачайте и запустите скрипт установки SSL
wget https://agent.integration-ai.ru/install-ssl-certificate.sh
chmod +x install-ssl-certificate.sh
sudo ./install-ssl-certificate.sh
```

### Или выполните команды вручную:
```bash
# 1. Установка Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. Получение SSL сертификата от Let's Encrypt
sudo certbot --nginx -d agent.integration-ai.ru --non-interactive --agree-tos --email admin@agent.integration-ai.ru

# 3. Настройка автоматического обновления
sudo crontab -e
# Добавить строку: 0 12 * * * /usr/bin/certbot renew --quiet

# 4. Перезапуск nginx
sudo systemctl reload nginx
```

### После установки настоящего SSL:
```bash
# Тест без ошибок SSL
curl -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 16:00:00",
  "timeplus": "2025-10-23 17:00:00",
  "services": [1522063]
}'
```

## 🔧 Решение 2: Временное игнорирование SSL (для тестирования)

### curl:
```bash
curl -k -X POST "https://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 16:00:00",
  "timeplus": "2025-10-23 17:00:00",
  "services": [1522063]
}'
```

### JavaScript (Node.js):
```javascript
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const response = await fetch('https://agent.integration-ai.ru/api/create-appointment.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 15206380,
    doctor_id: 130671,
    time: "2025-10-23 16:00:00",
    timeplus: "2025-10-23 17:00:00",
    services: [1522063]
  })
});
```

### Python:
```python
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

response = requests.post(
    'https://agent.integration-ai.ru/api/create-appointment.php',
    json={
        "user_id": 15206380,
        "doctor_id": 130671,
        "time": "2025-10-23 16:00:00",
        "timeplus": "2025-10-23 17:00:00",
        "services": [1522063]
    },
    verify=False
)
```

## 🌐 Решение 3: Использование HTTP (альтернатива)

```bash
curl -X POST "http://agent.integration-ai.ru/api/create-appointment.php" \
-H "Content-Type: application/json" \
-d '{
  "user_id": 15206380,
  "doctor_id": 130671,
  "time": "2025-10-23 16:00:00",
  "timeplus": "2025-10-23 17:00:00",
  "services": [1522063]
}'
```

## 📋 Проверка статуса SSL

### Проверить текущий сертификат:
```bash
curl -I https://agent.integration-ai.ru
openssl s_client -connect agent.integration-ai.ru:443 -servername agent.integration-ai.ru
```

### Проверить сертификаты Certbot:
```bash
sudo certbot certificates
```

## 🎯 Рекомендация

**Для продакшн использования:** Установите настоящий SSL сертификат (Решение 1)
**Для тестирования:** Используйте флаг `-k` в curl или игнорирование SSL в коде (Решение 2)

После установки настоящего SSL сертификата, все внешние клиенты смогут обращаться к API без ошибок SSL.