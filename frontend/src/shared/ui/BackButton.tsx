import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  fallbackTo: string;
  children: React.ReactNode;
}

export function BackButton({ fallbackTo, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    // React Router sets key to 'default' for initial entry
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-4"
    >
      <span className="material-symbols-outlined text-[14px]">chevron_left</span>
      {children}
    </button>
  );
}
