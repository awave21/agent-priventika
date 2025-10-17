#!/bin/bash

# Скрипт быстрого развертывания CRM системы
# Использование: ./deploy.sh [локальный|продакшн]

set -e

echo "🚀 Начинаем развертывание CRM системы..."

# Определяем режим развертывания
MODE=${1:-локальный}

case $MODE in
    "локальный")
        echo "📋 Режим: Локальное развертывание"
        DEPLOY_PATH="/var/www/html"
        ;;
    "продакшн")
        echo "📋 Режим: Продакшн развертывание"
        DEPLOY_PATH="/var/www/html"
        ;;
    *)
        echo "❌ Неизвестный режим: $MODE"
        echo "Использование: $0 [локальный|продакшн]"
        exit 1
        ;;
esac

# Проверка зависимостей
echo "🔍 Проверка зависимостей..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "❌ curl не установлен"
    exit 1
fi

# Установка зависимостей проекта
echo "📦 Установка зависимостей..."
npm install

# Проверка типов
echo "🔍 Проверка TypeScript..."
npm run typecheck

# Сборка проекта
echo "🔨 Сборка проекта..."
npm run build

# Создание резервной копии (если существует)
if [ -d "$DEPLOY_PATH" ]; then
    echo "💾 Создание резервной копии..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$DEPLOY_PATH" "/tmp/$BACKUP_NAME"
    echo "✅ Резервная копия создана: /tmp/$BACKUP_NAME"
fi

# Развертывание
echo "📤 Развертывание файлов..."
if [ "$MODE" = "локальный" ]; then
    # Локальное развертывание
    mkdir -p "$DEPLOY_PATH"
    cp -r dist/* "$DEPLOY_PATH/"
else
    # Продакшн развертывание
    sudo cp -r dist/* "$DEPLOY_PATH/"
    sudo chown -R www-data:www-data "$DEPLOY_PATH"
    sudo chmod -R 755 "$DEPLOY_PATH"
fi

# Проверка развертывания
echo "🔍 Проверка развертывания..."
if curl -I "http://localhost" >/dev/null 2>&1; then
    echo "✅ Локальный сервер отвечает"
else
    echo "⚠️  Локальный сервер не отвечает, но файлы скопированы"
fi

# Проверка домена (если в продакшен режиме)
if [ "$MODE" = "продакшн" ]; then
    echo "🌐 Проверка домена agent.integration-ai.ru..."
    if curl -I "https://agent.integration-ai.ru" >/dev/null 2>&1; then
        echo "✅ Домен доступен"
    else
        echo "❌ Домен недоступен"
        echo "💡 Проверьте настройки сервера и DNS"
    fi
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте Supabase подключение в приложении"
echo "2. Проверьте работу вебхуков Wazzup"
echo "3. Убедитесь что Laravel backend работает"
echo ""
echo "📖 Документация:"
echo "   - PROJECT_README.md - полная документация"
echo "   - DEPLOYMENT_GUIDE.md - инструкции по развертыванию"
echo "   - QUICK_CHECK.md - текущий статус"
echo ""
echo "🔧 Быстрые команды:"
echo "   npm run dev     - запуск разработки"
echo "   npm run build   - сборка проекта"
echo "   npm run preview - предварительный просмотр"
echo "   sudo systemctl status nginx - проверка сервера"

if [ -f "/tmp/$BACKUP_NAME" ]; then
    echo ""
    echo "💡 Резервная копия: /tmp/$BACKUP_NAME"
fi