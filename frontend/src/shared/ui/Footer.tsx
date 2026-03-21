import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Privacy', to: '#' },
  { label: 'Terms', to: '#' },
];

export function Footer() {
  return (
    <footer className="w-full py-16 border-t border-yellow-900/10 flex flex-col items-center justify-center space-y-4">
      <div className="flex space-x-6">
        {LINKS.map(({ label, to }) => (
          <Link
            key={label}
            to={to}
            className="text-neutral-500 hover:text-neutral-200 text-[10px] uppercase tracking-[0.1em] transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      <p className="font-label text-[10px] uppercase tracking-[0.2em] text-neutral-600">
        © 2026 Arcane Ledger. All rights reserved.
      </p>
    </footer>
  );
}
