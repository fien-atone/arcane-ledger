import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/10 py-10 px-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-serif italic text-primary text-lg tracking-tight">Arcane Ledger</span>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">Home</Link>
          <Link to="/changelog" className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">Changelog</Link>
          <a href="https://t.me/inoise" target="_blank" rel="noopener noreferrer" className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">Telegram</a>
          <a href="mailto:ivnshumov@gmail.com" className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">Email</a>
        </div>

        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/30">
          © 2026 Ivan Shumov
        </p>
      </div>
    </footer>
  );
}
