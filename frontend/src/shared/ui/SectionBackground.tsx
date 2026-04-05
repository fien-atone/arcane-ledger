interface Props {
  variant: 'npc' | 'location' | 'quest' | 'group' | 'session' | 'party' | 'dashboard';
}

const base = import.meta.env.BASE_URL ?? '/';
const BACKGROUNDS: Partial<Record<Props['variant'], string>> = {
  npc: `${base}assets/backgrounds/npc-pattern.svg`,
};

export function SectionBackground({ variant }: Props) {
  const url = BACKGROUNDS[variant];
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 bg-[#111118]"
      style={{ backgroundImage: `url(${url})`, backgroundRepeat: 'repeat' }}
      aria-hidden
    />
  );
}
