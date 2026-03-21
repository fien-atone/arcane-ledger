import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Footer } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';

export default function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Уже залогинен — редирект
  if (user) return <Navigate to="/campaigns" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(email, password);
    if (ok) {
      navigate('/campaigns', { replace: true });
    } else {
      setError(true);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col justify-center items-center px-6">
      {/* Background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-matter.png')" }}
      />

      <main className="w-full max-w-[440px] z-10">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container mb-6 shadow-[0_0_30px_rgba(242,202,80,0.1)] border border-outline-variant/10">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.875rem' }}>
              auto_stories
            </span>
          </div>
          <h1 className="text-3xl font-serif italic text-primary tracking-tight mb-2">
            Arcane Ledger
          </h1>
          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/60">
            Chronicle your destiny
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-low rounded-lg p-10 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] border border-outline-variant/5 relative overflow-hidden">
          {/* Atmospheric gradient accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full" />

          <header className="mb-8">
            <h2 className="text-2xl text-on-surface font-serif mb-1">
              Welcome back, Archivist
            </h2>
            <p className="text-on-surface-variant text-sm">
              Enter your credentials to access the codex.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                autoComplete="username"
                placeholder="archivist@arcaneldger.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/20 focus:border-primary focus:outline-none text-on-surface py-3 px-1 transition-all duration-300 placeholder:text-on-surface-variant/30"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold"
              >
                Security Cipher
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/20 focus:border-primary focus:outline-none text-on-surface py-3 px-1 transition-all duration-300 placeholder:text-on-surface-variant/30"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-tertiary text-xs tracking-wide">
                Invalid credentials. Check your email and cipher.
              </p>
            )}

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group"
              >
                Sign In
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Don't have an account?{' '}
              <br />
              <span className="text-on-surface font-medium">Contact your Game Master.</span>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
