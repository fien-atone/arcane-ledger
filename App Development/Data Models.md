# TTRPG Companion — Data Models

> **Статус:** черновик v0.4 — 22.03.2026
> Составлено на основе анализа vault Drakkenheim и Farchester кампаний.

---

## Сущности (Entities)

### 1. User

```
User {
  id
  name
  email
  avatar (optional)
  createdAt
}
```

---

### 2. Campaign
Верхнеуровневый контейнер. Всё остальное существует внутри кампании.

```
Campaign {
  id
  title
  description (optional)
  coverImage (optional)
  createdAt
  archivedAt (optional)
}
```

---

### 3. CampaignMember
Участие пользователя в кампании с конкретной ролью. Роль — на уровне кампании, не аккаунта.

```
CampaignMember {
  id
  campaignId → Campaign
  userId → User
  role: "gm" | "player"
  joinedAt
}
```

---

### 4. NPC

```
NPC {
  id
  campaignId → Campaign
  name
  aliases[]           // "Катя Браун", "Katya", "Таня Браун"
  status: "alive" | "dead" | "missing" | "unknown" | "hostile"
  species (optional)
  appearance (optional)  // внешность — помогает мастеру описывать NPC на ходу
  lastSeenLocationId → Location (optional)  // последнее известное место
  locations[] → Location                    // где можно найти (может быть несколько)
  description
  image (optional)
  createdAt
}
```

> Принадлежность к группам — через `NPCGroupMembership`.

---

### 5. PlayerCharacter (PC)

```
PlayerCharacter {
  id
  campaignId → Campaign
  userId → User
  name
  species (optional)
  class (optional)
  background (optional)
  appearance (optional)
  image (optional)
  gmNotes   // заметки GM — видит только GM
  createdAt
}
```

---

### 6. Session
Создаётся и ведётся GM.

```
Session {
  id
  campaignId → Campaign
  number            // 01, 02, ... 17
  title             // автогенерируемый: "Session 01 — {date}"
  datetime          // дата + время
  brief (optional)  // одна строчка-якорь для списка: "потерялись в канализации"
  summary           // краткое содержание (markdown)
  nextSessionNotes (optional)  // незакрытые хвосты
  createdAt
}
```

---

### 7. SessionNote
Личные заметки участника к конкретной сессии — GM или игрока. Видны только автору.

```
SessionNote {
  id
  sessionId → Session
  userId → User
  content (markdown)
  createdAt
  updatedAt
}
```

---

### 8. Location
Поддерживает иерархию (parent/child) и горизонтальные связи через `LocationConnection`.

```
Location {
  id
  campaignId → Campaign
  name
  aliases[]
  type: "region" | "settlement" | "district" | "building" | "natural" | "dungeon"
  subtype (optional)  // для settlement: "city" | "town" | "village" | "camp"
                      // для building: "tavern" | "temple" | "shop" | ...
  parentLocationId → Location (optional)
  description
  image (optional)
  createdAt
}
```

> Примеры по типам из vault:
> - `region` — Drakkenheim Region, Emberwood Village Region
> - `settlement / city` — Farchester, Drakkenheim
> - `settlement / village` — Emberwood Village
> - `district` — Bent Row
> - `building / tavern` — Bark and Buzzard, Gilded Lily
> - `natural` — Road to Emberwood, пещеры гоблинов
> - `dungeon` — Rat Nest, Champion's Gate

---

### 9. Group
Социальная группа любого масштаба — от семейного клана до тайного ордена. Тип задаётся из базового набора; мастер может добавить свой через `customType`.

```
Group {
  id
  campaignId → Campaign
  name
  aliases[]
  type: "faction"    // политическая/военная сила
       | "guild"     // профессиональное объединение
       | "family"    // клан, благородный дом, династия
       | "religion"  // церковь, культ, духовный орден
       | "criminal"  // гильдия воров, синдикат, банда
       | "military"  // наёмная компания, армейское подразделение
       | "academy"   // школа магии, бардический колледж, монастырь
       | "secret"    // тайное общество, шпионская сеть
       | "custom"    // мастер задаёт своё название через customType
  customType (optional)   // только если type = "custom"
  description
  goals (optional)
  symbols (optional)
  partyRelation (optional)  // как относятся к партии
  image (optional)
  createdAt
}
```

---

### 10. Quest

```
Quest {
  id
  campaignId → Campaign
  title
  description
  clientId → NPC (optional)
  reward (optional)
  status: "active" | "completed" | "failed" | "unknown"
  notes   // прогресс, детали, ходы (markdown)
  createdAt
  completedAt (optional)
}
```

---

### 11. Material
Библиотека материалов кампании. Может быть вики-страницей, ссылкой или прикреплённым файлом (рулбук, карта, PDF и т.д.). Доступна всем участникам кампании.

```
Material {
  id
  campaignId → Campaign
  title
  type: "page" | "link" | "file"

  // type = "page"
  content (markdown, optional)

  // type = "link"
  url (optional)

  // type = "file"
  fileKey (optional)    // ключ в хранилище (S3 или аналог)
  mimeType (optional)   // "application/pdf", "image/jpeg", ...
  fileName (optional)   // оригинальное имя файла

  createdAt
}
```

> Примеры использования:
> - `page` — лор мира, история фракции, космология
> - `link` — внешняя вики, Google Doc с правилами хоумрула
> - `file` — PDF рулбука, карта в высоком разрешении, таблица заклинаний

---

### 12. DiceRoll
История бросков. Данные хранятся с v1 — UI лога появится позже.

```
DiceRoll {
  id
  campaignId → Campaign
  sessionId → Session (optional)  // к какой сессии привязан бросок
  userId → User                   // кто бросал
  dice[]                          // кубики: [{sides: 20, result: 17}, {sides: 6, result: 3}]
  modifier (optional)             // +3, -1 и т.д.
  total                           // итоговый результат
  isPrivate: boolean              // приватный бросок — виден только бросающему
  createdAt
}
```

---

## Связи (Relations)

### NPCGroupMembership
NPC может состоять в нескольких группах одновременно.

```
NPCGroupMembership {
  npcId → NPC
  groupId → Group
  role (optional)       // "leader" | "member" | "affiliated" | свободная строка
  note (optional)       // дополнительный контекст членства
}
```

---

### LocationConnection
Горизонтальные связи между локациями — соседство, маршруты, переходы.

```
LocationConnection {
  locationAId → Location
  locationBId → Location
  type (optional): "adjacent" | "route" | "portal"
  note (optional)  // "Дорога через Лес Фонарей"
}
```

---

## Что не входит в v1 (out of scope)

- **Механики D&D** — статы, хиты, ячейки заклинаний, КД
- **Session Prep** — отдельная будущая фича
- **Долги персонажей** — часть свободных заметок
- **LocationGroup** — связь группа/локация; отложено
- **Изображения у сущностей** — загрузка файлов; отложено
- **Медиафайлы** (музыка, видео) — не в скоупе

> Файлы в Material (PDFы, карты) — в скоупе, но реализация файлового хранилища отложена.

---

## Открытые вопросы

| ID | Вопрос | Влияет на |
|----|--------|-----------|
| Q-09 | "Мой персонаж" у игрока — отдельный пункт навигации или через общий список PC? | Nav, PC Detail |

## Закрытые вопросы

| ID | Решение |
|----|---------|
| Q-01 | Оффлайн-режим — не нужен в v1 ✅ |
| Q-02 | Гранулярное скрытие полей — отложено (VIS-03 = Could have) ✅ |
| Q-03 | Роли на уровне кампании, не аккаунта ✅ |
| Q-04 | `SessionNote` — личные заметки игрока к сессии ✅ |
| Q-05 | Долги — часть заметок, не модель ✅ |
| Q-06 | Session Prep — будущая фича, не v1 ✅ |
| Q-07 | Изображения у сущностей — отложено ✅ |
| Q-08 | Lore → переименован в `Material`, типы page/link/file, виден всем участникам кампании ✅ |

---

*Следующий шаг: обновить ERD → проработать список экранов (Фаза 2)*
