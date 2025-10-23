#!/bin/bash

echo "🔐 Установка настоящего SSL сертификата для agent.integration-ai.ru"

# Обновляем систему
echo "📦 Обновление системы..."
apt update

# Устанавливаем Certbot
echo "🛠️ Установка Certbot..."
apt install -y certbot python3-certbot-nginx

# Проверяем конфигурацию nginx
echo "🔍 Проверка конфигурации nginx..."
nginx -t

# Получаем SSL сертификат
echo "🔐 Получение SSL сертификата от Let's Encrypt..."
certbot --nginx -d agent.integration-ai.ru --non-interactive --agree-tos --email admin@agent.integration-ai.ru

# Проверяем статус сертификата
echo "✅ Проверка статуса сертификата..."
certbot certificates

# Настраиваем автоматическое обновление
echo "🔄 Настройка автоматического обновления..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Перезапускаем nginx
echo "🔄 Перезапуск nginx..."
systemctl reload nginx

# Тестируем SSL
echo "🧪 Тестирование SSL..."
curl -I https://agent.integration-ai.ru

echo "✅ SSL сертификат установлен успешно!"
echo "🌐 Теперь API доступен по HTTPS без ошибок SSL:"
echo "   https://agent.integration-ai.ru/api/create-appointment.php"