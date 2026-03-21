# TTRPG Companion — Frontend Architecture

> v0.1 — 21.03.2026
> Документ описывает архитектурные решения, структуру проекта и правила написания кода.
> Написан до начала кодирования — является обязательным к соблюдению референсом.

---

## Технологический стек

| Слой | Технология | Почему |
|------|-----------|--------|
| Сборка | **Vite** | Быстрый dev-сервер, CSR, не нужен SSR |
| UI | **React 18 + TypeScript** | Компонентная модель, строгая типизация |
| Роутинг | **React Router v7** | Стабильный, nested routes, loader support |
| UI-состояние | **Zustand** | Минималистичный, без бойлерплейта Redux |
| Серверное состояние | **TanStack Query (React Query)** | Кэш, инвалидация, фоновый рефетч |
| Стили | **Tailwind CSS** | Утилитарные классы, консистентный дизайн |
| Иконки | **Lucide React** | Тонкие линии, большой набор |
| Валидация | **Zod** | Runtime-валидация данных от API |
| Линтер | **ESLint + Prettier** | Единый code style |

> **Нет** Next.js — приложение CSR, desktop-first, SSR не нужен.
> **Нет** Redux — Zustand + TanStack Query покрывают все нужды.

---

## Структура папок — Feature-Sliced Design (FSD)

FSD — методология организации кода с однонаправленными зависимостями.
**Правило:** импорт только вниз. `pages` → `widgets` → `features` → `entities` → `shared`. Никаких обратных и горизонтальных импортов между features.

```
src/
├── app/                        # Точка входа, роутер, провайдеры, глобальные стили
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx           # QueryClient, Router, Theme
│
├── pages/                      # Страницы — тонкая обёртка, только компоновка виджетов
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── CampaignsPage.tsx
│   ├── CampaignDashboardPage.tsx
│   ├── NpcListPage.tsx
│   ├── NpcDetailPage.tsx
│   ├── SessionListPage.tsx
│   ├── SessionDetailPage.tsx
│   ├── LocationListPage.tsx
│   ├── LocationDetailPage.tsx
│   ├── FactionDetailPage.tsx
│   ├── QuestDetailPage.tsx
│   ├── PartyPage.tsx
│   ├── CharacterDetailPage.tsx
│   ├── MaterialsPage.tsx
│   └── AdminPage.tsx
│
├── widgets/                    # Крупные составные блоки UI (используют несколько features)
│   ├── Sidebar/
│   ├── Topbar/
│   ├── CampaignShell/          # Sidebar + Topbar + main area — обёртка кампании
│   └── DiceRollerModal/
│
├── features/                   # Бизнес-домены. Каждый — независимый модуль.
│   ├── campaigns/
│   │   ├── ui/                 # Компоненты домена
│   │   ├── model/              # Zustand store
│   │   ├── api/                # Queries и mutations (TanStack Query)
│   │   └── index.ts            # Публичный API модуля
│   ├── npcs/
│   ├── sessions/
│   ├── locations/
│   ├── factions/
│   ├── quests/
│   ├── characters/
│   ├── materials/
│   ├── dice/
│   └── auth/
│
├── entities/                   # Доменные типы и модели — только типы, никакой логики UI
│   ├── campaign.ts
│   ├── npc.ts
│   ├── session.ts
│   ├── sessionNote.ts
│   ├── location.ts
│   ├── faction.ts
│   ├── quest.ts
│   ├── character.ts
│   ├── material.ts
│   ├── diceRoll.ts
│   └── user.ts
│
└── shared/                     # Переиспользуемое: UI-кит, утилиты, API-клиент
    ├── ui/                     # Атомарные компоненты (Button, Badge, Card, Input...)
    ├── api/
    │   ├── client.ts           # Абстракция API — переключатель mock/real
    │   ├── mockClient.ts       # Mock-реализация
    │   ├── realClient.ts       # Axios/fetch — подключается позже
    │   ├── repositories/       # Репозитории по доменам
    │   └── mockData/           # Статические mock-данные
    ├── hooks/                  # Общие хуки (useDebounce, useLocalStorage...)
    ├── lib/                    # Утилиты (formatDate, cn...)
    └── types/                  # Вспомогательные типы (Nullable, ApiResponse...)
```

---

## Слой данных — Repository Pattern

Ключевой принцип: компоненты и хуки не знают, откуда приходят данные — из mock или с сервера. Переключение происходит в одном месте.

### Переключатель mock/real

```ts
// shared/api/client.ts
import { mockClient } from './mockClient';
import { realClient } from './realClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // mock по умолчанию

export const apiClient = USE_MOCK ? mockClient : realClient;
```

### Репозиторий (один на домен)

```ts
// shared/api/repositories/npcRepository.ts
import { apiClient } from '../client';
import type { NPC } from '@/entities/npc';

export const npcRepository = {
  list: (campaignId: string): Promise<NPC[]> =>
    apiClient.get(`/campaigns/${campaignId}/npcs`),

  getById: (campaignId: string, npcId: string): Promise<NPC> =>
    apiClient.get(`/campaigns/${campaignId}/npcs/${npcId}`),

  create: (campaignId: string, data: Omit<NPC, 'id'>): Promise<NPC> =>
    apiClient.post(`/campaigns/${campaignId}/npcs`, data),

  update: (campaignId: string, npcId: string, data: Partial<NPC>): Promise<NPC> =>
    apiClient.put(`/campaigns/${campaignId}/npcs/${npcId}`, data),

  delete: (campaignId: string, npcId: string): Promise<void> =>
    apiClient.delete(`/campaigns/${campaignId}/npcs/${npcId}`),
};
```

### TanStack Query поверх репозитория

```ts
// features/npcs/api/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { npcRepository } from '@/shared/api/repositories/npcRepository';

export const useNpcs = (campaignId: string) =>
  useQuery({
    queryKey: ['npcs', campaignId],
    queryFn: () => npcRepository.list(campaignId),
  });

export const useUpdateNpc = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ npcId, data }: { npcId: string; data: Partial<NPC> }) =>
      npcRepository.update(campaignId, npcId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['npcs', campaignId] });
    },
  });
};
```

### Mock-данные

```ts
// shared/api/mockData/npcs.ts
import type { NPC } from '@/entities/npc';

export const MOCK_NPCS: NPC[] = [
  {
    id: 'npc-1',
    campaignId: 'campaign-1',
    name: 'Malakor the Gray',
    aliases: ['The Gray Wanderer', 'Old Man'],
    status: 'alive',
    species: 'Human',
    appearance: 'Tall, weathered face, silver staff',
    description: 'A mysterious wanderer...',
    factionMemberships: [],
    locations: ['loc-1'],
    lastSeenLocationId: 'loc-1',
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-09-01T00:00:00Z',
  },
];
```

---

## Правила написания кода

### TypeScript

- `strict: true` везде — `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`
- `interface` — для props компонентов и доменных моделей
- `type` — для union-типов, алиасов, утилитарных типов
- Запрет `any` — если тип неизвестен, используй `unknown` с type guard
- Zod-схемы для валидации данных на границе API

```ts
// ✅
interface NpcCardProps {
  npc: NPC;
  onSelect: (id: string) => void;
}

// ✅
type NpcStatus = 'alive' | 'dead' | 'missing' | 'unknown' | 'hostile';

// ❌
const handleData = (data: any) => { ... }
```

### Компоненты

- Один компонент — одна ответственность
- Логика вынесена в кастомный хук рядом с компонентом
- Компонент > 250 строк — сигнал к декомпозиции
- Нет class components — только функциональные
- Props через `interface`, дефолтные значения деструктурированием

```ts
// features/npcs/ui/NpcCard.tsx
interface NpcCardProps {
  npc: NPC;
  onSelect?: (id: string) => void;
  showGmNotes?: boolean;
}

export const NpcCard = ({ npc, onSelect, showGmNotes = false }: NpcCardProps) => {
  // только рендер
};
```

### Хуки вместо контейнеров

Паттерн "container/presentational" устарел. Логика выносится в хук:

```ts
// features/npcs/ui/NpcList.tsx
export const NpcList = ({ campaignId }: { campaignId: string }) => {
  const { data: npcs, isLoading } = useNpcs(campaignId);
  const role = useAuthStore((s) => s.role);

  if (isLoading) return <Skeleton />;
  return (
    <div>
      {npcs?.map((npc) => <NpcCard key={npc.id} npc={npc} showGmNotes={role === 'gm'} />)}
    </div>
  );
};
```

### Именование

| Что | Стиль | Пример |
|-----|-------|--------|
| Компоненты | PascalCase | `NpcCard`, `SessionDetail` |
| Хуки | camelCase с `use` | `useNpcs`, `useCampaignStore` |
| Файлы компонентов | PascalCase | `NpcCard.tsx` |
| Файлы утилит/хуков | camelCase | `formatDate.ts`, `useDebounce.ts` |
| Константы | UPPER_SNAKE | `MOCK_NPCS`, `QUERY_KEYS` |
| Типы/Интерфейсы | PascalCase | `NPC`, `Campaign`, `NpcCardProps` |
| CSS-классы | Tailwind утилиты, без кастомных имён |  |

### Публичный API модуля (barrel exports)

Каждый feature-модуль экспортирует только то, что нужно снаружи:

```ts
// features/npcs/index.ts
export { NpcList } from './ui/NpcList';
export { NpcCard } from './ui/NpcCard';
export { useNpcs, useUpdateNpc } from './api/queries';
// НЕ экспортируем внутренние хелперы
```

Импорт снаружи:
```ts
// ✅
import { NpcList } from '@/features/npcs';

// ❌ — нарушает инкапсуляцию модуля
import { NpcList } from '@/features/npcs/ui/NpcList';
```

### Состояние (Zustand)

- Zustand — только для UI-состояния (открыт ли сайдбар, режим редактирования, выбранный ID)
- Серверные данные (списки NPC, сессии и т.д.) — только через TanStack Query
- Никогда не дублировать API-данные в Zustand store

```ts
// features/campaigns/model/store.ts
interface CampaignUiState {
  sidebarCollapsed: boolean;
  editMode: boolean;
  toggleSidebar: () => void;
  setEditMode: (v: boolean) => void;
}

export const useCampaignUiStore = create<CampaignUiState>((set) => ({
  sidebarCollapsed: false,
  editMode: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setEditMode: (v) => set({ editMode: v }),
}));
```

### SOLID в контексте React

| Принцип | Как применяется |
|---------|----------------|
| **S** — Single Responsibility | Один компонент — один блок UI. Логика — в хук. Запросы — в queries.ts |
| **O** — Open/Closed | Компоненты расширяются через props, не модифицируются. `showGmNotes`, `variant` |
| **L** — Liskov | Если компонент принимает `NPC`, он должен работать с любым валидным NPC |
| **I** — Interface Segregation | Не передавай в компонент весь объект если нужно 2 поля. Деструктурируй props |
| **D** — Dependency Inversion | Компоненты зависят от абстракций (репозиторий), не от конкретного fetch/axios |

---

## Переменные окружения

```
# .env.development
VITE_USE_MOCK=true

# .env.production
VITE_USE_MOCK=false
VITE_API_URL=https://api.ttrpg-companion.app
```

---

## Роли и доступ

Роль пользователя в кампании (`gm` | `player`) хранится в auth store и передаётся в компоненты через хук:

```ts
const role = useAuthStore((s) => s.getCampaignRole(campaignId));
const isGm = role === 'gm';

// В JSX:
{isGm && <GmOnlyBlock />}
```

Никаких отдельных роутов для GM/Player — один экран, разный контент по роли.

---

## Что не делать

- ❌ Не писать логику в `pages/` — только компоновка виджетов
- ❌ Не импортировать между `features/` напрямую — только через `shared/` или `entities/`
- ❌ Не хранить серверные данные в Zustand
- ❌ Не использовать `any`
- ❌ Не делать компоненты > 250 строк без декомпозиции
- ❌ Не обращаться к API напрямую из компонента — только через репозиторий + query

---

*Документ обновляется по мере принятия новых архитектурных решений.*
