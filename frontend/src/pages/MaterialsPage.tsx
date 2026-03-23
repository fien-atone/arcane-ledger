import { useState } from 'react';
import { useParams } from 'react-router-dom';

type MaterialTab = 'all' | 'pages' | 'links' | 'files';

interface MockMaterial {
  id: string;
  title: string;
  type: 'page' | 'link' | 'file';
  description: string;
  content?: string;
  url?: string;
  fileType?: string;
  updatedAt: string;
}

const MOCK_MATERIALS: MockMaterial[] = [
  {
    id: 'm-1',
    title: 'World Overview',
    type: 'page',
    description: 'High-level overview of the campaign world, history, and lore.',
    content:
      'This world was shaped by the Convergence — an event 300 years ago when four elemental planes collided, leaving scars of wild magic across the continent.\n\nThe major powers have been in an uneasy truce since the Pact of Ardenna, but tensions are rising as deliriite deposits have been discovered near the border regions.',
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'm-2',
    title: 'House Rules',
    type: 'page',
    description: 'Campaign-specific rules and rulings in effect.',
    content:
      'Initiative: We use Popcorn Initiative. Each player picks who goes next.\n\nResting: Short rests take 10 minutes. Long rests require a safe haven.\n\nDeath: At 0 HP, roll on the Injury Table before making death saves.',
    updatedAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'm-3',
    title: 'D&D Beyond Campaign',
    type: 'link',
    description: 'Main campaign page on D&D Beyond with character sheets.',
    url: 'https://dndbeyond.com',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'm-4',
    title: 'Campaign Map',
    type: 'link',
    description: 'Interactive world map on Inkarnate.',
    url: 'https://inkarnate.com',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'm-5',
    title: 'Session Zero Notes.pdf',
    type: 'file',
    description: 'Notes from the session zero — setting expectations and safety tools.',
    fileType: 'pdf',
    updatedAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'm-6',
    title: 'Deliriite — Properties & Dangers',
    type: 'page',
    description: 'Research on the mysterious crystalline substance at the heart of the campaign.',
    content:
      'Deliriite (colloquially "delirium") is a deep violet crystal found only in areas struck by the Convergence event.\n\nProperties:\n- Raw exposure causes mutation in living creatures over time\n- When refined, can be used to power magical constructs\n- Highly addictive as a narcotic\n- Creatures fully consumed by it become "Tainted"\n\nKnown deposits: Drakkenheim crater (largest), several smaller veins along the Dran River.',
    updatedAt: '2026-03-15T00:00:00Z',
  },
];

const TAB_FILTERS: Array<{ value: MaterialTab; label: string; icon: string }> = [
  { value: 'all', label: 'All', icon: 'grid_view' },
  { value: 'pages', label: 'Pages', icon: 'article' },
  { value: 'links', label: 'Links', icon: 'link' },
  { value: 'files', label: 'Files', icon: 'attach_file' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const TYPE_ICON: Record<MockMaterial['type'], string> = {
  page: 'article',
  link: 'link',
  file: 'attach_file',
};

export default function MaterialsPage() {
  const { id: _campaignId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<MaterialTab>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(MOCK_MATERIALS[0].id);

  const filtered = MOCK_MATERIALS.filter((m) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pages' && m.type === 'page') ||
      (activeTab === 'links' && m.type === 'link') ||
      (activeTab === 'files' && m.type === 'file');
    const matchesSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selected = MOCK_MATERIALS.find((m) => m.id === selectedId) ?? MOCK_MATERIALS[0];

  return (
    <main className="flex-1 min-h-screen bg-surface flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5 flex-shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Materials
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Reference pages, links, and files for this campaign.
            </p>
          </div>
          <button
            disabled
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Material</span>
          </button>
        </div>
      </header>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Left panel: list (35%) ───────────────────────────── */}
        <div className="w-full lg:w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-y-auto">

          {/* Search */}
          <div className="p-4 border-b border-outline-variant/10 flex-shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search materials…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
              />
            </div>
          </div>

          {/* Tab filters */}
          <div className="flex border-b border-outline-variant/10 flex-shrink-0">
            {TAB_FILTERS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                  activeTab === value
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-on-surface-variant/40 italic p-6">No materials found.</p>
            )}
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-4 border-b border-outline-variant/5 transition-all ${
                  selectedId === m.id
                    ? 'bg-primary/5 border-l-2 border-l-primary'
                    : 'hover:bg-surface-container border-l-2 border-l-transparent'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5 ${
                    selectedId === m.id ? 'text-primary' : 'text-on-surface-variant/30'
                  }`}
                >
                  {TYPE_ICON[m.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-headline leading-tight truncate ${
                      selectedId === m.id ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {m.title}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/40 mt-0.5 truncate">
                    {m.description}
                  </p>
                  <p className="text-[9px] text-on-surface-variant/20 mt-1 uppercase tracking-widest">
                    {formatDate(m.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right panel: content preview (65%) ──────────────── */}
        <div className="hidden lg:flex flex-col flex-1 overflow-y-auto">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-outline-variant/10 bg-surface flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary/60 text-[18px]">
                {TYPE_ICON[selected.type]}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                {selected.type}
              </span>
            </div>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant/30 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-12 py-10 max-w-3xl">
            <h2 className="font-headline text-4xl font-bold text-on-surface mb-3 tracking-tight">
              {selected.title}
            </h2>
            <p className="text-xs text-on-surface-variant/40 mb-8 uppercase tracking-widest">
              Updated {formatDate(selected.updatedAt)}
            </p>

            {selected.type === 'page' && selected.content && (
              <div className="space-y-6">
                {selected.content.split('\n\n').map((para, i) => (
                  <p key={i} className="text-on-surface-variant leading-relaxed text-base">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {selected.type === 'link' && (
              <div className="space-y-6">
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {selected.description}
                </p>
                <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant/20 rounded-sm">
                  <span className="material-symbols-outlined text-primary">link</span>
                  <span className="text-sm text-on-surface-variant italic flex-1">
                    External link — opens in browser
                  </span>
                  <button
                    disabled
                    className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm opacity-50 cursor-not-allowed"
                  >
                    Open
                  </button>
                </div>
              </div>
            )}

            {selected.type === 'file' && (
              <div className="space-y-6">
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {selected.description}
                </p>
                <div className="flex items-center gap-4 p-6 bg-surface-container-low border border-outline-variant/20 rounded-sm">
                  <span className="material-symbols-outlined text-4xl text-primary/30">
                    picture_as_pdf
                  </span>
                  <div>
                    <p className="text-sm font-headline text-on-surface">{selected.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 mt-1">
                      {selected.fileType?.toUpperCase()} file
                    </p>
                  </div>
                  <button
                    disabled
                    className="ml-auto px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm opacity-50 cursor-not-allowed"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: show selected content below list */}
        <div className="lg:hidden w-full" />
      </div>
    </main>
  );
}
