import React from 'react';
import { Link } from 'react-router-dom';
import { Footer, D20Icon } from '@/shared/ui';
import { CHANGELOG } from '@/shared/changelog/entries';

// ── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'location_on',
    title: 'Locations & Maps',
    desc: 'Hierarchical world-building: regions, settlements, districts, buildings, dungeons. Upload maps and drop markers linked to locations and NPCs.',
    wide: true,
    accent: 'primary',
  },
  {
    icon: 'group',
    title: 'NPCs',
    desc: 'Rich character sheets with portrait, appearance, backstory, personality, GM notes, and social relations.',
    wide: false,
    accent: 'secondary',
  },
  {
    icon: 'shield_person',
    title: 'Party & Characters',
    desc: 'Player character profiles with inline WYSIWYG editing — backstory, motivation, bonds, flaws.',
    wide: false,
    accent: 'primary',
  },
  {
    icon: 'groups',
    title: 'Factions & Groups',
    desc: 'Track guilds, cults, families, councils. Manage membership, goals, and relationship to the party.',
    wide: false,
    accent: 'tertiary',
  },
  {
    icon: 'event',
    title: 'Session Journal',
    desc: 'Log every session with short recap and full notes. Auto-formatted timeline of your campaign.',
    wide: false,
    accent: 'secondary',
  },
  {
    icon: 'favorite',
    title: 'Social Relations',
    desc: 'Directional relationship graph between any entities — characters, NPCs, groups. Friendliness scale with notes.',
    wide: true,
    accent: 'primary',
  },
  {
    icon: 'blur_on',
    title: 'Species & Races',
    desc: 'Homebrew species catalogue with traits, size, and lore. Linked to characters and NPCs automatically.',
    wide: false,
    accent: 'tertiary',
  },
  {
    icon: 'assignment',
    title: 'Quests',
    desc: 'Active and completed quest tracking with objectives, status, and related sessions.',
    wide: false,
    accent: 'secondary',
  },
  {
    icon: 'd20',
    title: 'Dice Roller',
    desc: 'd4 through d100 — roll any combination, see full history. Always available from the sidebar.',
    wide: false,
    accent: 'primary',
  },
  {
    icon: 'lock',
    title: 'GM Notes',
    desc: 'Private notes on every entity — locations, NPCs, characters, groups. Separate from player-facing content.',
    wide: false,
    accent: 'tertiary',
  },
];

const ROADMAP = [
  { icon: 'inventory_2', title: 'Items & Artifacts', desc: 'Magical items, homebrew equipment, cursed relics — with properties and history.' },
  { icon: 'timeline', title: 'Campaign Timeline', desc: 'Visual chronological map of sessions, events, and quest milestones.' },
  { icon: 'picture_as_pdf', title: 'Export to PDF', desc: 'Print-ready character sheets, session summaries, and location compendium.' },
  { icon: 'person_play', title: 'Player View', desc: 'Separate access level — players see their own sheet and shared world lore.' },
  { icon: 'menu_book', title: 'GM Screen', desc: 'Dedicated GM screen with encounter tools, reference tables, and session prep.' },
  { icon: 'cloud_sync', title: 'Cloud Sync', desc: 'Real-time sync across devices and players.' },
];

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, wide, accent }: typeof FEATURES[0]) {
  const accentMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
  };
  const accentClass = accentMap[accent as keyof typeof accentMap];
  return (
    <div className={`${wide ? 'md:col-span-2' : ''} bg-surface-container-low border border-outline-variant/10 p-8 flex flex-col gap-4 hover:border-outline-variant/25 transition-colors group`}>
      <div className="w-8 h-8 group-hover:scale-110 transition-transform">
        {icon === 'd20'
          ? <D20Icon className={`w-8 h-8 ${accentClass}`} />
          : <span className={`material-symbols-outlined ${accentClass} text-[2rem] leading-none`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        }
      </div>
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface mb-1">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function RoadmapCard({ icon, title, desc }: typeof ROADMAP[0]) {
  return (
    <div className="flex items-start gap-4 p-5 border border-outline-variant/10 rounded-sm bg-surface-container-lowest">
      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-sm bg-surface-container border border-outline-variant/20">
        <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-on-surface-variant mb-0.5">{title}</p>
        <p className="text-xs text-on-surface-variant/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10 flex justify-between items-center px-10 py-5">
        <span className="text-2xl font-serif italic text-primary tracking-tight">Arcane Ledger</span>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Features</a>
          <a href="#roadmap" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Roadmap</a>
          <Link to="/changelog" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Changelog</Link>
        </div>
        <Link
          to="/login"
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 rounded-sm text-xs font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Open App
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-8">

        {/* ── Hero ── */}
        <section className="pt-48 pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-full text-[10px] font-label uppercase tracking-widest text-primary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Demo · v{CHANGELOG[0]?.version ?? '0.0.0'}
          </div>

          <h1 className="font-headline text-6xl md:text-8xl font-bold text-on-surface tracking-tight leading-[1.05] mb-8">
            Your campaign.<br />
            <span className="text-primary italic">Remembered.</span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl leading-relaxed mb-12">
            Arcane Ledger is a GM-first campaign companion for TTRPG. Track your world — locations, NPCs, factions, sessions, and characters — in one focused tool.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/login"
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-sm font-bold text-sm uppercase tracking-wider shadow-[0_0_40px_-8px_rgba(242,202,80,0.4)] hover:opacity-90 transition-opacity"
            >
              Begin Your Chronicle
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 text-sm rounded-sm transition-colors"
            >
              Explore features
            </a>
          </div>

          <p className="mt-6 text-[11px] text-on-surface-variant/30 font-label uppercase tracking-widest">
            All data stored locally in your browser · No account required
          </p>
        </section>

        {/* ── Stat strip ── */}
        <section className="border-y border-outline-variant/10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
          {([
            { n: '10+', label: 'Entity types' },
            { n: '∞', label: 'Locations & maps' },
            { n: (
              <svg viewBox="0 0 512 512" fill="currentColor" className="w-10 h-10 mx-auto text-primary">
                <path d="M217.5 56.4L77.9 140.2l61.4 44.7L217.5 56.4zM64 169.6V320.3l59.2-107.6L64 169.6zM104.8 388L240 469.1V398.8L104.8 388zM272 469.1L407.2 388 272 398.8v70.3zM448 320.3V169.6l-59.2 43L448 320.3zM434.1 140.2L294.5 56.4l78.2 128.4 61.4-44.7zM243.7 3.4c7.6-4.6 17.1-4.6 24.7 0l200 120c7.2 4.3 11.7 12.1 11.7 20.6V368c0 8.4-4.4 16.2-11.7 20.6l-200 120c-7.6 4.6-17.1 4.6-24.7 0l-200-120C36.4 384.2 32 376.4 32 368V144c0-8.4 4.4-16.2 11.7-20.6l200-120zM225.3 365.5L145 239.4 81.9 354l143.3 11.5zM338.9 224H173.1L256 354.2 338.9 224zM256 54.8L172.5 192H339.5L256 54.8zm30.7 310.7L430.1 354 367 239.4 286.7 365.5z" />
              </svg>
            ), label: 'Dice roller' },
            { n: 'Beta', label: 'In active dev' },
          ] as { n: React.ReactNode; label: string }[]).map(({ n, label }) => (
            <div key={label} className="text-center flex flex-col items-center">
              <div className="font-headline text-4xl font-bold text-primary mb-1 leading-none">{n}</div>
              <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/50">{label}</p>
            </div>
          ))}
        </section>

        {/* ── Features ── */}
        <section id="features" className="mb-32">
          <div className="mb-12">
            <span className="text-[10px] font-label uppercase tracking-widest text-primary block mb-3">What's inside</span>
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">Everything a GM needs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* ── Roadmap ── */}
        <section id="roadmap" className="mb-32">
          <div className="mb-12">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-3">Coming next</span>
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">On the horizon</h2>
            <p className="text-on-surface-variant mt-3 max-w-xl">These features are planned or in progress. The app is actively developed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ROADMAP.map((r) => (
              <RoadmapCard key={r.title} {...r} />
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="border-t border-outline-variant/10 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-0">
          <div>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 block mb-3">Get in touch</span>
            <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Say hello</h2>
            <p className="text-on-surface-variant text-sm max-w-sm">Questions, feedback, collaboration — reach out on any of these.</p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <a
              href="https://t.me/inoise"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 hover:text-primary text-on-surface-variant rounded-sm transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Telegram · @inoise
            </a>
            <a
              href="https://twitter.com/inoise"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 hover:text-primary text-on-surface-variant rounded-sm transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">alternate_email</span>
              Twitter · @inoise
            </a>
            <a
              href="mailto:ivnshumov@gmail.com"
              className="flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 hover:text-primary text-on-surface-variant rounded-sm transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              ivnshumov@gmail.com
            </a>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-outline-variant/10 py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container mb-8 border border-outline-variant/10 shadow-[0_0_30px_rgba(242,202,80,0.08)]">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.75rem' }}>auto_stories</span>
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-4">Ready to start?</h2>
          <p className="text-on-surface-variant mb-10 max-w-md">Use the test credentials to explore — or sign in and start building your world.</p>
          <Link
            to="/login"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-12 py-4 rounded-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_40px_-8px_rgba(242,202,80,0.3)]"
          >
            Open Arcane Ledger
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
