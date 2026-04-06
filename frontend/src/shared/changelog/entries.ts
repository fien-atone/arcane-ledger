export interface ChangelogEntry {
  version: string;
  date: string;
  title: { en: string; ru: string };
  items: {
    icon: string;
    text: { en: string; ru: string };
    tag?: 'new' | 'improved' | 'fixed';
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.0',
    date: '2026-04-05',
    title: {
      en: 'Multiplayer: visibility, subscriptions, and roles',
      ru: 'Мультиплеер: видимость, подписки и роли',
    },
    items: [
      {
        icon: 'visibility',
        text: {
          en: 'Visibility system — the GM controls what players see: NPCs, locations, quests, groups. Control at the entity, field, and relationship level.',
          ru: 'Система видимости — мастер управляет тем, что видят игроки: NPC, локации, квесты, группы. Контроль на уровне сущностей, полей и связей.',
        },
        tag: 'new',
      },
      {
        icon: 'link',
        text: {
          en: 'Relationship visibility — the GM reveals specific NPC connections to groups and locations directly from the character or group page.',
          ru: 'Видимость связей — мастер раскрывает конкретные связи NPC с группами и локациями прямо со страницы персонажа или группы.',
        },
        tag: 'new',
      },
      {
        icon: 'sync',
        text: {
          en: 'Real-time updates — all GM changes instantly appear for players via WebSocket subscriptions.',
          ru: 'Обновления в реальном времени — все изменения мастера мгновенно появляются у игроков через WebSocket-подписки.',
        },
        tag: 'new',
      },
      {
        icon: 'shield',
        text: {
          en: 'Role-based restrictions — players cannot edit, add, or delete entities. All fields are read-only.',
          ru: 'Ролевые ограничения — игроки не могут редактировать, добавлять или удалять сущности. Все поля read-only.',
        },
        tag: 'new',
      },
      {
        icon: 'person_add',
        text: {
          en: 'Campaign invitations — the GM invites players by email, with accept/decline flow and character assignment.',
          ru: 'Приглашения в кампанию — мастер приглашает игроков по email, система accept/decline, привязка персонажей.',
        },
        tag: 'new',
      },
      {
        icon: 'hub',
        text: {
          en: 'Social graph — interactive NPC relationship visualization (force layout + chord diagram).',
          ru: 'Социальный граф — интерактивная визуализация связей NPC (force layout + chord diagram).',
        },
        tag: 'new',
      },
      {
        icon: 'admin_panel_settings',
        text: {
          en: 'Administration — user management, profile editing with name change and password reset.',
          ru: 'Администрирование — управление пользователями, профиль с редактированием имени и смена пароля.',
        },
        tag: 'new',
      },
      {
        icon: 'edit_note',
        text: {
          en: 'Personal session notes — each participant keeps their own private notes.',
          ru: 'Личные заметки к сессиям — каждый участник ведёт свои приватные заметки.',
        },
        tag: 'new',
      },
    ],
  },
  {
    version: '0.2.3',
    date: '2026-03-27',
    title: {
      en: 'Quests, social connections, and improvements',
      ru: 'Квесты, социальные связи и доработки',
    },
    items: [
      {
        icon: 'auto_awesome',
        text: {
          en: 'Quests — full CRUD: create, edit (drawer), delete. Edit-in-place status with dropdown. Description, Reward, and GM Notes — inline rich text.',
          ru: 'Квесты — полный CRUD: создание, редактирование (drawer), удаление. Статус edit-in-place с dropdown. Description, Reward и GM Notes — inline rich text.',
        },
        tag: 'new',
      },
      {
        icon: 'visibility_off',
        text: {
          en: 'New quest status Undiscovered, status colors: Completed — green, Failed — red, icons per status.',
          ru: 'Новый статус квеста Undiscovered, цвета статусов: Completed — зелёный, Failed — красный, иконки по статусам.',
        },
        tag: 'improved',
      },
      {
        icon: 'handshake',
        text: {
          en: 'NPC social connections — add, edit (5 levels: Hostile to Allied), delete. Segmented bar in BG3 style.',
          ru: 'Социальные связи NPC — добавление, редактирование (5 уровней: Hostile → Allied), удаление. Сегментированный бар в стиле BG3.',
        },
        tag: 'new',
      },
      {
        icon: 'palette',
        text: {
          en: 'Relationship colors — from red through yellow to green (Hostile to Neutral to Allied).',
          ru: 'Цвета отношений — от красного через жёлтый до зелёного (Hostile → Neutral → Allied).',
        },
        tag: 'improved',
      },
    ],
  },
  {
    version: '0.2.2',
    date: '2026-03-27',
    title: {
      en: 'Dashboard, campaigns, and navigation',
      ru: 'Дашборд, кампании и навигация',
    },
    items: [
      {
        icon: 'dashboard',
        text: {
          en: 'Redesigned campaign dashboard — quick navigation with counters, smart next session block (Today/Tomorrow/Next), recent sessions, party, recent NPCs.',
          ru: 'Переработанный дашборд кампании — быстрая навигация со счётчиками, умный блок следующей сессии (Today/Tomorrow/Next), последние сессии, партия, недавние NPC.',
        },
        tag: 'new',
      },
      {
        icon: 'edit',
        text: {
          en: 'Campaign editing — inline editing of name and description (rich text) right on the dashboard.',
          ru: 'Редактирование кампании — inline-редактирование названия и описания (rich text) прямо на дашборде.',
        },
        tag: 'new',
      },
      {
        icon: 'archive',
        text: {
          en: 'Campaign archiving — move between Active and Archive with inline confirmation.',
          ru: 'Архивация кампаний — перемещение между Active и Archive с inline-подтверждением.',
        },
        tag: 'new',
      },
      {
        icon: 'list',
        text: {
          en: 'Simplified campaign list — compact rows with session badges (Today/Tomorrow/Next), Active and Archive sections.',
          ru: 'Упрощённый список кампаний — компактные строки с бейджами сессий (Today/Tomorrow/Next), разделы Active и Archive.',
        },
        tag: 'improved',
      },
      {
        icon: 'event',
        text: {
          en: 'Session badges in list — Today, Tomorrow, Next, Previous — on all screens (dashboard, session list, campaign list).',
          ru: 'Бейджи сессий в списке — Today, Tomorrow, Next, Previous — на всех экранах (дашборд, список сессий, список кампаний).',
        },
        tag: 'improved',
      },
      {
        icon: 'menu',
        text: {
          en: 'Minimal Topbar on campaign screen — logo and profile only. All Campaigns in campaign sidebar.',
          ru: 'Минимальный Topbar на экране кампаний — только логотип и профиль. All Campaigns в сайдбаре кампании.',
        },
        tag: 'improved',
      },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-03-26',
    title: {
      en: 'Sessions, connections, and unified style',
      ru: 'Сессии, связи и единый стиль',
    },
    items: [
      {
        icon: 'auto_stories',
        text: {
          en: 'Full session management — create, edit, delete. Brief (public) and GM Notes (GM-only) with inline editing.',
          ru: 'Полноценное управление сессиями — создание, редактирование, удаление. Brief (публичный) и GM Notes (только для мастера) с inline-редактированием.',
        },
        tag: 'new',
      },
      {
        icon: 'calendar_today',
        text: {
          en: 'Custom DatePicker with dark theme, month navigation, weekend highlighting, and a "Today" button.',
          ru: 'Кастомный DatePicker с тёмной темой, навигацией по месяцам, подсветкой выходных и кнопкой «Today».',
        },
        tag: 'new',
      },
      {
        icon: 'link',
        text: {
          en: 'NPC, Location, Session, and Quest linking — manage connections on all screens with inline delete confirmation.',
          ru: 'Привязки NPC ↔ Локации ↔ Сессии ↔ Квесты — управление связями на всех экранах с inline-подтверждением удаления.',
        },
        tag: 'new',
      },
      {
        icon: 'place',
        text: {
          en: 'LocationIcon — unified location icon component with correct category color, protected from CSS cascade (inline style).',
          ru: 'LocationIcon — единый компонент иконки локации с правильным цветом категории, защищённым от CSS-каскада (inline style).',
        },
        tag: 'improved',
      },
      {
        icon: 'palette',
        text: {
          en: 'Location icons no longer change color on hover/selection — they always keep their category color.',
          ru: 'Иконки локаций больше не меняют цвет при наведении/выделении — всегда сохраняют цвет категории.',
        },
        tag: 'fixed',
      },
      {
        icon: 'person',
        text: {
          en: 'Enriched NPC preview — Appearance, Personality, Background, Motivation, groups, and locations.',
          ru: 'Обогащённое превью NPC — Appearance, Personality, Background, Motivation, группы и локации.',
        },
        tag: 'improved',
      },
      {
        icon: 'delete',
        text: {
          en: 'Group and group type deletion — with inline confirmation instead of system dialog.',
          ru: 'Удаление групп и типов групп — с inline-подтверждением вместо системного диалога.',
        },
        tag: 'new',
      },
      {
        icon: 'cleaning_services',
        text: {
          en: 'Removed Materials (model and UI), image from groups, nextSessionNotes from sessions.',
          ru: 'Удалены Materials (модель и UI), image из групп, nextSessionNotes из сессий.',
        },
        tag: 'improved',
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-03-25',
    title: {
      en: 'Location types: categories, colors, and management',
      ru: 'Типы локаций: категории, цвета и управление',
    },
    items: [
      {
        icon: 'account_tree',
        text: {
          en: 'Location type management — create, rename, and delete your own types right in the app. Built-in types are protected from deletion.',
          ru: 'Управление типами локаций — создавайте, переименовывайте и удаляйте собственные типы прямо в приложении. Встроенные типы защищены от удаления.',
        },
        tag: 'new',
      },
      {
        icon: 'palette',
        text: {
          en: 'Color-coded categories — each type belongs to a category (World, Geographic, Civilization, Water Bodies, Points of Interest, Path). Icons and badges are colored by category throughout the interface.',
          ru: 'Категории с цветовой кодировкой — каждый тип принадлежит к категории (Мировой, Географический, Цивилизация, Водоёмы, Точки интереса, Путь). Иконки и значки окрашены по категории во всём интерфейсе.',
        },
        tag: 'new',
      },
      {
        icon: 'category',
        text: {
          en: 'Nesting rules — configure which type can contain another. The location creation form automatically filters valid parents.',
          ru: 'Правила вложенности — настраивайте, какой тип может содержать другой. Форма создания локации автоматически фильтрует допустимых родителей.',
        },
        tag: 'new',
      },
      {
        icon: 'format_list_bulleted',
        text: {
          en: 'Location list — hierarchical sorting: parents come first, children are grouped beneath with indentation.',
          ru: 'Список локаций — иерархическая сортировка: родители идут первыми, дочерние элементы сгруппированы под ними с отступом.',
        },
        tag: 'improved',
      },
      {
        icon: 'new_releases',
        text: {
          en: '"What\'s New" banner no longer overlaps other interface elements.',
          ru: 'Плашка «What\'s New» больше не перекрывается другими элементами интерфейса.',
        },
        tag: 'fixed',
      },
    ],
  },
  {
    version: '0.1.9',
    date: '2026-03-24',
    title: {
      en: 'Character creation and editing',
      ru: 'Персонаж, создание и редактирование',
    },
    items: [
      {
        icon: 'person',
        text: {
          en: 'Character page fully redesigned: hero image, demographic badge, WYSIWYG inline field editing (GM Notes, Background, Appearance, etc.).',
          ru: 'Страница персонажа полностью переработана: hero-изображение, демографический бейдж, WYSIWYG-редактирование полей прямо на странице (GM Notes, Background, Appearance и др.).',
        },
        tag: 'improved',
      },
      {
        icon: 'edit',
        text: {
          en: 'Inline text field editing for characters — with formatting (bold, italic, headings, lists, quotes) via a floating toolbar.',
          ru: 'Inline-редактирование текстовых полей персонажа — с форматированием (жирный, курсив, заголовки, списки, цитаты) через всплывающую панель.',
        },
        tag: 'new',
      },
      {
        icon: 'photo_camera',
        text: {
          en: 'Character image upload with lightbox support — click the photo to open full-screen view.',
          ru: 'Загрузка изображения персонажа с поддержкой лайтбокса — клик по фото открывает полноэкранный просмотр.',
        },
        tag: 'new',
      },
      {
        icon: 'add',
        text: {
          en: 'Character creation is now available directly from the Party section.',
          ru: 'Создание персонажа теперь доступно прямо из раздела Party.',
        },
        tag: 'new',
      },
      {
        icon: 'add_location',
        text: {
          en: 'Location creation — the "Add Location" button is now active and opens a full form.',
          ru: 'Создание локации — кнопка «Add Location» теперь активна, открывает полную форму.',
        },
        tag: 'new',
      },
      {
        icon: 'auto_stories',
        text: {
          en: 'New campaign creation — form with name, description, and cover color scheme selection.',
          ru: 'Создание новой кампании — форма с названием, описанием и выбором цветовой схемы обложки.',
        },
        tag: 'new',
      },
      {
        icon: 'groups',
        text: {
          en: 'Group membership management — add and remove members with confirmation right on the group page.',
          ru: 'Управление составом группы — добавление и удаление участников с подтверждением прямо на странице группы.',
        },
        tag: 'new',
      },
    ],
  },
  {
    version: '0.1.8',
    date: '2026-03-24',
    title: {
      en: 'Managed group types',
      ru: 'Управляемые типы групп',
    },
    items: [
      {
        icon: 'category',
        text: {
          en: 'Group types — now a managed reference. Create, edit, and delete types right in the app. Accessible via the "Group Types" submenu.',
          ru: 'Типы групп — теперь управляемый справочник. Создавайте, редактируйте и удаляйте типы прямо в приложении. Доступно через подраздел «Group Types» в меню.',
        },
        tag: 'new',
      },
      {
        icon: 'grid_view',
        text: {
          en: 'Group type icon picker — search through ~120 Material Symbols icons.',
          ru: 'Выбор иконки для типа группы — пикер с поиском по ~120 иконкам Material Symbols.',
        },
        tag: 'new',
      },
      {
        icon: 'groups',
        text: {
          en: 'Group page — members moved to the main column: card grid with status dot, species, and role. Removed "Other Groups" and "Known Bases".',
          ru: 'Страница группы — участники перенесены в основную колонку: сетка карточек со статус-точкой, видом и ролью. Убраны «Other Groups» и «Known Bases».',
        },
        tag: 'improved',
      },
      {
        icon: 'tune',
        text: {
          en: 'Group create/edit form — type and party relation now use pill buttons instead of dropdowns.',
          ru: 'Форма создания/редактирования группы — тип и отношение к партии теперь выбираются кнопками-пилюлями вместо выпадающих списков.',
        },
        tag: 'improved',
      },
      {
        icon: 'filter_list_off',
        text: {
          en: 'Group list — removed relation filter, kept type filters with counts.',
          ru: 'Список групп — убран фильтр по отношению, оставлены фильтры по типу с отображением количества.',
        },
        tag: 'improved',
      },
    ],
  },
  {
    version: '0.1.7',
    date: '2026-03-24',
    title: {
      en: 'Unified visual language',
      ru: 'Единый визуальный язык',
    },
    items: [
      {
        icon: 'style',
        text: {
          en: 'Preview cards — unified badge style across all sections: NPCs, Locations, Groups, Species, Party, Quests. Icon + text with dot separator.',
          ru: 'Карточки превью — единый стиль бейджей во всех разделах: NPC, Локации, Группы, Виды, Партия, Квесты. Иконка + текст с разделителем «·».',
        },
        tag: 'improved',
      },
      {
        icon: 'format_list_bulleted',
        text: {
          en: 'Species list — fixed fonts and row selection behavior: now matches all other lists.',
          ru: 'Список видов (Species) — исправлены шрифты и поведение при выборе строки: теперь соответствует всем остальным спискам.',
        },
        tag: 'fixed',
      },
      {
        icon: 'title',
        text: {
          en: 'Unified preview headings: Species no longer used enlarged text-5xl in the preview panel.',
          ru: 'Заголовки превью унифицированы: Species больше не использовал увеличенный text-5xl в панели предпросмотра.',
        },
        tag: 'fixed',
      },
      {
        icon: 'edit_off',
        text: {
          en: 'Removed "Edit" button from faction preview — editing is available via the full page.',
          ru: 'Убрана кнопка «Edit» из превью фракции — редактирование доступно через полную страницу.',
        },
        tag: 'improved',
      },
      {
        icon: 'format_strikethrough',
        text: {
          en: 'Removed large session number from the background decoration in session preview.',
          ru: 'Убран крупный номер сессии из фонового декора в превью сессии.',
        },
        tag: 'improved',
      },
    ],
  },
  {
    version: '0.1.6',
    date: '2026-03-23',
    title: {
      en: 'Maps: markers and navigation',
      ru: 'Карты: маркеры и навигация',
    },
    items: [
      {
        icon: 'edit_location',
        text: {
          en: 'Marker editing — you can now change the name and location binding right from the popup. Click a selected location to unbind it.',
          ru: 'Редактирование маркеров — теперь можно изменить название и привязку к локации прямо из попапа. Клик по выбранной локации — снимает привязку.',
        },
        tag: 'new',
      },
      {
        icon: 'add_location_alt',
        text: {
          en: 'Add location from map — place a marker and create a child location in one action.',
          ru: 'Добавление локации с карты — ставьте маркер и создавайте дочернюю локацию одним действием.',
        },
        tag: 'improved',
      },
      {
        icon: 'save',
        text: {
          en: 'Marker auto-save — the map saves immediately when adding, deleting, or binding a marker.',
          ru: 'Автосохранение маркеров — карта сохраняется сразу при добавлении, удалении или привязке маркера.',
        },
        tag: 'fixed',
      },
      {
        icon: 'format_list_numbered',
        text: {
          en: 'Map sidebar: locations sorted by marker number, showing "X of Y" counters and free marker count.',
          ru: 'Сайдбар карты: локации отсортированы по номеру маркера, показаны счётчики «X of Y» и число свободных маркеров.',
        },
        tag: 'improved',
      },
      {
        icon: 'person_pin',
        text: {
          en: 'NPCs in location — presence note (evenings, temporarily, etc.), add and remove via the location card.',
          ru: 'NPC в локации — заметка о присутствии (по вечерам, временно и т.д.), добавление и удаление через карточку локации.',
        },
        tag: 'new',
      },
    ],
  },
  {
    version: '0.1.5',
    date: '2026-03-23',
    title: {
      en: 'The world takes shape',
      ru: 'Мир обретает форму',
    },
    items: [
      {
        icon: 'blur_on',
        text: {
          en: 'Races and species — a dedicated section with description, size, and traits for each race. Accessible via the "Species" menu.',
          ru: 'Расы и виды — отдельный раздел с описанием, размером и чертами для каждой расы. Доступно через меню «Species».',
        },
        tag: 'new',
      },
      {
        icon: 'favorite',
        text: {
          en: 'Social relationships — characters, NPCs, and groups now have a friendliness scale. Relationships are bidirectional: what Alvin feels about Kronhave may differ from what Kronhave feels about Alvin.',
          ru: 'Социальные отношения — у персонажей, NPC и групп теперь есть шкала дружелюбности. Отношения двусторонние: то, что чувствует Alvin к Kронхейву, может не совпадать с тем, что Кронхейв чувствует к Alvin.',
        },
        tag: 'new',
      },
      {
        icon: 'location_city',
        text: {
          en: 'Settlements now have a size: village, town, metropolis, etc.',
          ru: 'Поселениям добавлен размер: деревня, город, мегаполис и т.д.',
        },
        tag: 'improved',
      },
      {
        icon: 'partly_cloudy_day',
        text: {
          en: 'Regions now have climate: temperate, tropical, arctic, and more.',
          ru: 'Регионам добавлен климат: умеренный, тропический, арктический и другие.',
        },
        tag: 'improved',
      },
    ],
  },
  {
    version: '0.1.4',
    date: '2026-03-15',
    title: {
      en: 'Maps and navigation',
      ru: 'Карты и навигация',
    },
    items: [
      {
        icon: 'map',
        text: {
          en: 'Location map — upload an image and place markers. Markers are auto-numbered and mirrored in a list next to the map.',
          ru: 'Карта локации — загружайте изображение и расставляйте маркеры. Маркеры нумеруются автоматически и дублируются в список рядом с картой.',
        },
        tag: 'new',
      },
      {
        icon: 'pin_drop',
        text: {
          en: 'A marker can be bound to a location or NPC from the database — the name is auto-filled.',
          ru: 'Маркер можно привязать к локации или NPC из базы — название подставляется автоматически.',
        },
        tag: 'new',
      },
      {
        icon: 'zoom_in_map',
        text: {
          en: 'Mini-map on the location card — if the location is marked on the parent map, we show its position.',
          ru: 'Мини-карта в карточке локации — если локация отмечена на карте родителя, показываем её положение.',
        },
        tag: 'new',
      },
      {
        icon: 'palette',
        text: {
          en: 'Marker colors aligned with the app design.',
          ru: 'Цвета маркеров приведены в соответствие с дизайном приложения.',
        },
        tag: 'fixed',
      },
    ],
  },
  {
    version: '0.1.3',
    date: '2026-03-01',
    title: {
      en: 'Sides and factions',
      ru: 'Стороны и фракции',
    },
    items: [
      {
        icon: 'groups',
        text: {
          en: 'Groups section — factions, guilds, families, cults, and other organizations. Each group has a description, goals, and a member list.',
          ru: 'Раздел «Groups» — фракции, гильдии, семьи, культы и другие организации. Каждая группа имеет описание, цели и список участников.',
        },
        tag: 'new',
      },
      {
        icon: 'shield_person',
        text: {
          en: 'Party — a dedicated section for player characters with detailed cards.',
          ru: 'Партия (Party) — отдельный раздел для игровых персонажей с подробными карточками.',
        },
        tag: 'new',
      },
      {
        icon: 'assignment',
        text: {
          en: 'Quests — a list of active and completed campaign objectives.',
          ru: 'Квесты — список активных и завершённых заданий кампании.',
        },
        tag: 'new',
      },
    ],
  },
  {
    version: '0.1.2',
    date: '2026-02-15',
    title: {
      en: 'Journal and characters',
      ru: 'Журнал и персонажи',
    },
    items: [
      {
        icon: 'event',
        text: {
          en: 'Sessions — keep a journal of game sessions with brief and full summaries.',
          ru: 'Сессии — ведите журнал игровых встреч с кратким и полным конспектом.',
        },
        tag: 'new',
      },
      {
        icon: 'person',
        text: {
          en: 'NPCs — detailed cards: appearance, personality, background, group connections.',
          ru: 'NPC — подробные карточки: внешность, личность, история, связи с группами.',
        },
        tag: 'new',
      },
      {
        icon: 'location_on',
        text: {
          en: 'Locations — hierarchical places: region, settlement, district, building.',
          ru: 'Локации — иерархия мест: регион → поселение → район → здание.',
        },
        tag: 'new',
      },
    ],
  },
  {
    version: '0.1.1',
    date: '2026-02-01',
    title: {
      en: 'First launch',
      ru: 'Первый запуск',
    },
    items: [
      {
        icon: 'auto_stories',
        text: {
          en: 'Arcane Ledger — the TTRPG campaign management app is live.',
          ru: 'Arcane Ledger — приложение для ведения TTRPG-кампаний запущено.',
        },
        tag: 'new',
      },
      {
        icon: 'campaign',
        text: {
          en: 'Support for multiple campaigns, GM and Player roles.',
          ru: 'Поддержка нескольких кампаний, роли GM и Player.',
        },
        tag: 'new',
      },
      {
        icon: 'casino',
        text: {
          en: 'Built-in dice roller with history.',
          ru: 'Встроенный бросок кубиков с историей.',
        },
        tag: 'new',
      },
    ],
  },
];
