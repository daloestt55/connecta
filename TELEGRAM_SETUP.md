# Telegram Verification Setup Guide

## Шаг 1: Создание Telegram бота

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Введите имя для бота (например: `Connecta Verification Bot`)
4. Введите username для бота (должен заканчиваться на `bot`, например: `connecta_verify_bot`)
5. **Скопируйте токен** который выдаст BotFather (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Настройка Supabase Edge Function

### Установка Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# Или через npm
npm install -g supabase
```

### Подключение к проекту

```bash
# В корне проекта
supabase login

# Привязка к вашему проекту
supabase link --project-ref your-project-ref
```

### Добавление токена как секрета

```bash
# Добавить TELEGRAM_BOT_TOKEN в Supabase Edge Functions
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Деплой функции

```bash
# Деплой функции send-telegram-code
supabase functions deploy send-telegram-code
```

## Шаг 3: Получение Chat ID

Пользователи должны получить свой Chat ID перед регистрацией:

1. В Telegram найдите **@userinfobot**
2. Нажмите **Start** или отправьте любое сообщение
3. Бот пришлет ваш **Chat ID** (число, например: `123456789`)
4. Скопируйте этот ID и используйте при регистрации

## Шаг 4: Тестирование

### Локальное тестирование функции

```bash
# Запустить локальный Supabase
supabase start

# Установить переменную окружения локально
supabase secrets set --env-file .env.local TELEGRAM_BOT_TOKEN=your_token

# Запустить функцию локально
supabase functions serve send-telegram-code
```

### Тестовый запрос

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-telegram-code' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"chatId":"YOUR_CHAT_ID","code":"123456"}'
```

Проверьте Telegram - должно прийти сообщение с кодом!

## Шаг 5: Production деплой

После успешного тестирования:

```bash
# Деплой функции на production
supabase functions deploy send-telegram-code --no-verify-jwt

# Добавить секрет на production
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here --project-ref your-project-ref
```

## Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте токен бота в Git
- Храните токен только в Supabase Secrets
- Используйте `.env.local` только для локальной разработки
- Добавьте `.env.local` в `.gitignore`

## Настройка бота (опционально)

В @BotFather можно настроить:

```
/setdescription - Описание бота
/setabouttext - Текст "About"
/setuserpic - Аватар бота
/setcommands - Команды бота
```

Пример описания:
```
Verification bot for Connecta app. 
This bot sends you verification codes during registration.
```

## Troubleshooting

### Ошибка: "Unauthorized"
- Проверьте что токен бота правильный
- Убедитесь что secrets установлены: `supabase secrets list`

### Ошибка: "Chat not found"
- Пользователь должен сначала написать боту `/start`
- Или добавить бота в контакты

### Функция не деплоится
- Проверьте что вы залогинены: `supabase login`
- Проверьте что проект привязан: `supabase link --project-ref your-ref`

## Дополнительные возможности

Можно расширить функционал:

1. **Приветственное сообщение**: добавить `/start` команду в бота
2. **Кнопки**: использовать Inline Keyboard для подтверждения
3. **Статистика**: логировать отправленные коды
4. **Rate limiting**: ограничить количество кодов на пользователя

## Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Supabase Functions](https://supabase.com/docs/guides/functions)
- [BotFather Commands](https://core.telegram.org/bots/features#botfather)
