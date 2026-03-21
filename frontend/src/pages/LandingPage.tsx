import { Link } from 'react-router-dom';
import { Footer } from '@/shared/ui';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* ── Top Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md shadow-[0_16px_32px_-12px_rgba(227,226,232,0.04)] flex justify-between items-center px-12 py-6">
        <div className="text-2xl font-serif italic text-primary tracking-tight">
          Arcane Ledger
        </div>
        <div className="hidden md:flex items-center space-x-12">
          <a
            href="#features"
            className="text-on-surface-variant font-medium hover:text-primary-fixed transition-colors duration-300"
          >
            The Archive
          </a>
          <a
            href="#codex"
            className="text-on-surface-variant font-medium hover:text-primary-fixed transition-colors duration-300"
          >
            Codex
          </a>
          <a
            href="#chronicles"
            className="text-on-surface-variant font-medium hover:text-primary-fixed transition-colors duration-300"
          >
            Chronicles
          </a>
        </div>
        <Link
          to="/login"
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-sm font-semibold hover:scale-95 duration-200 ease-in-out inline-block"
        >
          Sign In
        </Link>
      </nav>

      {/* ── Main Content ── */}
      <main className="pt-32 pb-24 px-6 md:px-12 flex flex-col items-center max-w-5xl mx-auto text-center">

        {/* ── Hero ── */}
        <header className="mb-16">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary mb-4 block">
            Editorial Worldbuilding
          </span>
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-on-surface mb-8 tracking-tight leading-tight">
            Arcane Ledger:<br />
            Your campaign.{' '}
            <span className="italic text-primary">Remembered.</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            A bespoke digital grimoire designed for the modern chronicler.
            Effortlessly map interconnected lore for GMs while providing
            players a living, high-fidelity ledger of their heroic journey.
          </p>
        </header>

        {/* ── CTA ── */}
        <div className="mb-24 flex flex-col items-center gap-6">
          <Link
            to="/login"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-12 py-5 rounded-sm text-lg font-bold shadow-[0_0_40px_-10px_rgba(242,202,80,0.3)] hover:scale-95 transition-transform duration-200 inline-block"
          >
            Begin Your Chronicle
          </Link>
          <div className="flex items-center gap-4 text-on-surface-variant text-sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Encrypted Lore
            </span>
            <span className="w-1 h-1 bg-outline-variant rounded-full" />
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">group</span>
              Shared Ledger
            </span>
          </div>
        </div>

        {/* ── App Mockup ── */}
        <section className="w-full relative group" id="features">
          <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000" />
          <div className="relative bg-surface-container-low rounded-lg p-2 shadow-2xl overflow-hidden border border-outline-variant/20">
            <div className="bg-surface-container-lowest rounded-sm overflow-hidden aspect-[16/10] flex items-center justify-center border border-outline-variant/10 relative">
              <img
                alt="Arcane Ledger Interface Mockup"
                className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMFFnvoJyClLSQwD688CeOp7Y3X4XJzA6M0bTPLZXoheSSGAXZWsSLDzzBv1oMyB-XmPbQ7g4NxJgBPQdlkuQSgvbJy6q4tOo45dN1FZXL9HjW7yfj4lfckaGXFQMM2xYk6KGb28xqlfZhKdW9E52xdgxQjY8ZlaRp2NRBNqi4zBBPCWm32Z0iAzo1e7dz8ZZI1B62NN2q5BYaKEieBF6TSIoK5Qm9_-qEiJ02EhAGIsifCSsfV2rXSbBqCXrPpj2BpnUaQ8R0rB6B"
              />
              {/* Floating Quest Card */}
              <div className="absolute top-12 left-12 p-6 bg-surface-container-high/90 backdrop-blur-xl rounded-sm border border-outline-variant/20 shadow-2xl max-w-xs text-left hidden md:block">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary">auto_stories</span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary">
                    Active Quest
                  </span>
                </div>
                <h3 className="font-headline text-xl mb-2">The Sunken Spire</h3>
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  The echoes of the deep calling from beneath the shifting sands of Olaria.
                </p>
              </div>
              {/* Floating Character Card */}
              <div className="absolute bottom-12 right-12 p-4 bg-surface-container-high/80 backdrop-blur-md rounded-sm border border-outline-variant/20 shadow-xl hidden md:flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Valerius Thorne</div>
                  <div className="text-[10px] text-secondary">Level 12 Chronicler</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Bento Grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-32 w-full text-left">
          {/* Large left card */}
          <div className="md:col-span-8 bg-surface-container-low p-10 flex flex-col justify-end min-h-[400px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span className="material-symbols-outlined text-primary opacity-20" style={{ fontSize: '6rem' }}>
                hub
              </span>
            </div>
            <div className="relative z-10">
              <span className="font-label text-[10px] uppercase tracking-widest text-primary mb-2 block">
                For the Architect
              </span>
              <h2 className="font-headline text-3xl mb-4">Neural World-Mapping</h2>
              <p className="font-body text-on-surface-variant max-w-md">
                Connect NPCs, locations, and secret plot threads with a semantic engine that
                remembers what your players might forget. No more flipping through notes during a
                boss fight.
              </p>
            </div>
          </div>

          {/* Small right card */}
          <div className="md:col-span-4 bg-surface-container p-10 flex flex-col justify-between border border-outline-variant/10">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '2.5rem' }}>
              inventory_2
            </span>
            <div>
              <h2 className="font-headline text-2xl mb-4">Vaulted Artifacts</h2>
              <p className="font-body text-sm text-on-surface-variant">
                A dedicated system for homebrew items, magical properties, and cursed relics that
                grow with your players.
              </p>
            </div>
          </div>

          {/* Small left card */}
          <div className="md:col-span-4 bg-surface-container p-10 flex flex-col justify-between border border-outline-variant/10">
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '2.5rem' }}>
              history_edu
            </span>
            <div>
              <h2 className="font-headline text-2xl mb-4">Session Scribe</h2>
              <p className="font-body text-sm text-on-surface-variant">
                Automated timeline generation turns your messy session notes into an elegant,
                readable chronicle for your group.
              </p>
            </div>
          </div>

          {/* Large right card */}
          <div className="md:col-span-8 bg-surface-container-low p-10 flex flex-col justify-end min-h-[400px] relative overflow-hidden">
            <img
              alt="Fantasy Atmosphere"
              className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9YW4WWxGT0zYtmctEKSTTGWOV6C64opOm7gdQv24agmaQALL4S0MX5ozX_8B13_Amvb3jUprmfbyN-8wAnB2uBT-ENc-toUqfmlQEp_87DuYTeJXqF7hAAb82UvdHiGD6PJQTIX99qvFBfMPnFioQT0GErztOwTNRUfT2XJ4QvIuSn9h7058E9u2SHDDwBVPskq04AItG8PIPnyRcV6_X4uTawMRpVyNxB16dtux_0UJp8LrYDIlFc_04A8sDG5QA5uDJIwbNGzon"
            />
            <div className="relative z-10">
              <span className="font-label text-[10px] uppercase tracking-widest text-primary mb-2 block">
                The Player Experience
              </span>
              <h2 className="font-headline text-3xl mb-4">Living Character Tomes</h2>
              <p className="font-body text-on-surface-variant max-w-md">
                Beyond just stats. Track relationships, personal growth, and inventory with a UI
                that feels as premium as the story you're telling.
              </p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mt-48 mb-24 py-24 w-full border-t border-outline-variant/20 flex flex-col items-center">
          <h2 className="font-headline text-4xl mb-8">Ready to write your history?</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/login"
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-sm font-bold inline-block text-center"
            >
              Create Free Account
            </Link>
            <button className="px-10 py-4 rounded-sm border border-outline-variant/40 hover:bg-surface-container transition-colors font-medium">
              Explore the Codex
            </button>
          </div>
          <p className="mt-8 text-on-surface-variant text-xs font-label uppercase tracking-widest">
            Free for up to 3 campaigns. No scroll required.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
