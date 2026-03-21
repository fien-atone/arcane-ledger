import type { Group } from '@/entities/group';

export const MOCK_GROUPS: Group[] = [
  // ── Farchester ──────────────────────────────────────────────────────────
  {
    id: 'faction-fc-red',
    campaignId: 'campaign-farchester',
    name: 'Красные (Имперская фракция)',
    type: 'faction',
    aliases: ['Red Faction', 'Imperial Guard'],
    description:
      'Представляют имперский порядок. Лорд-Адмирал Кронхейв назначен 2 года назад — именно при нём построена стена. Стражники в красном подчиняются Кронхейву.',
    goals: 'Удержать Фарчестер под имперским контролем. Подавить любую оппозицию.',
    symbols: 'Красная форма стражи, имперский орёл',
    partyRelation: 'neutral',
    createdAt: '2026-02-24T00:00:00Z',
    updatedAt: '2026-02-24T00:00:00Z',
  },
  {
    id: 'faction-fc-blue',
    campaignId: 'campaign-farchester',
    name: 'Синие (Городская фракция)',
    type: 'faction',
    aliases: ['Blue Faction', 'City Guard'],
    description:
      'Представляют интересы коренных жителей Фарчестера. Бургомистр Стоунгрив изначально из «свободолюбивых». Воодушевлённо относятся к эльфам, в отличие от красных.',
    goals: 'Защита города от шпионов Ордена Гефары. Разобраться с демонстрантами. Нормализовать продовольственную ситуацию.',
    symbols: 'Синяя форма стражи',
    partyRelation: 'allied',
    createdAt: '2026-02-24T00:00:00Z',
    updatedAt: '2026-02-24T00:00:00Z',
  },

  // ── Drakkenheim ─────────────────────────────────────────────────────────
  {
    id: 'faction-dk-lanterns',
    campaignId: 'campaign-drakkenheim',
    name: 'The Hooded Lanterns',
    type: 'military',
    aliases: ['Фонари', 'Lanterns'],
    description:
      'Охраняют Эмбервуд и стремятся возродить старую власть — восстановить прежнюю столицу. Члены фракции носят характерные фонари.',
    goals: 'Восстановить Дракенхейм. Защитить Эмбервуд от угроз делириума.',
    symbols: 'Фонарь, серый плащ',
    partyRelation: 'allied',
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'faction-dk-queens',
    campaignId: 'campaign-drakkenheim',
    name: "Queen's Men",
    type: 'criminal',
    aliases: ['Люди Королевы', 'Queens Men'],
    description:
      'Разбойники и воры, разделённые на несколько подгрупп: Канализационные кобры (Прогнутый ряд), Роза и Шипы (Старый Имперский Паб), Раненые сердца (Дворец Сми). Символ — красный ромб как татуировка.',
    goals: 'Контроль над преступным миром Эмбервуда и окрестностей.',
    symbols: 'Красный ромб (бубновая масть), татуировка',
    partyRelation: 'neutral',
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'faction-dk-amethyst',
    campaignId: 'campaign-drakkenheim',
    name: 'The Amethyst Academy',
    type: 'academy',
    aliases: ['Аметистовая Академия', 'Amethysts'],
    description:
      'Могущественная магическая организация, заинтересованная в делириуме. Скрывают информацию об Оскаре Йорене.',
    goals: 'Монополия на изучение и использование делириума.',
    symbols: 'Аметистовый кристалл',
    partyRelation: 'unknown',
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'faction-dk-flame',
    campaignId: 'campaign-drakkenheim',
    name: 'The Followers of the Falling Fire',
    type: 'religion',
    aliases: ['Падшее Пламя', 'Followers'],
    description:
      'Религиозный культ, почитающий метеорит делириума как священное знамение. Базируются у Врат Чемпиона.',
    goals: 'Распространение культа делириума. Контроль над руинами Дракенхейма.',
    symbols: 'Падающая звезда, оранжевое пламя',
    partyRelation: 'hostile',
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'faction-dk-silver',
    campaignId: 'campaign-drakkenheim',
    name: 'Knights of the Silver Order',
    type: 'military',
    aliases: ['Серебряный Орден', 'Silver Knights'],
    description:
      'Рыцарский орден, стремящийся уничтожить заражение делириумом и очистить Дракенхейм.',
    goals: 'Полное уничтожение делириума. Восстановление порядка.',
    symbols: 'Серебряный щит, белый плащ',
    partyRelation: 'neutral',
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-09-01T00:00:00Z',
  },
];
