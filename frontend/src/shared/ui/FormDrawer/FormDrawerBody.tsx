import type { ReactNode } from 'react';

interface FormDrawerBodyProps {
  className?: string;
  children: ReactNode;
}

const BASE = 'flex-1 overflow-y-auto px-8 py-6 space-y-5';

export function FormDrawerBody({ className, children }: FormDrawerBodyProps) {
  return <div className={className ? `${BASE} ${className}` : BASE}>{children}</div>;
}
