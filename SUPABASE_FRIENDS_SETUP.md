# Supabase Friends System Setup

## Миграция применена ✅

Создана таблица `friendships` и необходимые функции для работы с друзьями.

## Необходимо выполнить SQL в Supabase Dashboard

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект: **ovwhuvapliwlkuunpqbc**
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `supabase/migrations/20260224_create_friendships.sql`
5. Вставьте в SQL Editor и нажмите **Run**

## Что создано:

### 1. Таблица `friendships`
```sql
- id: UUID (primary key)
- user_id: UUID (ссылка на auth.users)
- friend_id: UUID (ссылка на auth.users)
- status: TEXT ('friend', 'pending_incoming', 'pending_outgoing', 'blocked')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 2. View `friends_view`
Объединяет данные friendships с метаданными пользователей (username, avatar, isVerified)

### 3. RPC Functions
- `add_friend_request(friend_username)` - отправить запрос в друзья
- `accept_friend_request(friend_user_id)` - принять запрос
- `remove_friend(friend_user_id)` - удалить друга
- `block_user(blocked_user_id)` - заблокировать пользователя

### 4. Row Level Security (RLS)
Пользователи могут видеть и управлять только своими friendships

## TypeScript API (src/app/utils/friends.ts)

```typescript
import { getFriends, addFriendRequest, acceptFriendRequest, removeFriend, blockUser } from "@/app/utils/friends";

// Загрузить всех друзей
const friends = await getFriends();

// Добавить в друзья
const result = await addFriendRequest('username');

// Принять запрос
await acceptFriendRequest(friendId);

// Удалить друга
await removeFriend(friendId);

// Заблокировать
await blockUser(userId);
```

## Обновлённые компоненты:

- ✅ **Chat.tsx** - загружает друзей из Supabase
- ✅ **Friends.tsx** - загружает друзей из Supabase + все функции управления

## Демо данные удалены

Теперь вместо захардкоженных Alice, Bob, Charlie будут загружаться реальные пользователи из базы.

---

**Важно:** После применения миграции все пользователи смогут добавлять друг друга по username.
