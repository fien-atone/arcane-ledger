const base = import.meta.env.BASE_URL ?? '/';

export function SectionBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 bg-[#111118]"
      style={{ backgroundImage: `url(${base}assets/backgrounds/grid-pattern.svg)`, backgroundRepeat: 'repeat' }}
      aria-hidden
    />
  );
}
