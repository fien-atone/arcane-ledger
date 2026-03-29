import { useRef } from 'react';

interface ImageUploadProps {
  image?: string;
  name: string;
  /** Tailwind sizing classes, e.g. "w-full aspect-[21/9]" or "w-48 h-64" */
  className?: string;
  onUpload: (file: File) => void;
  onView?: () => void;
  onLoad?: () => void;
}

export function ImageUpload({ image, name, className = 'w-full aspect-[16/9]', onUpload, onView, onLoad }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = '';
  };

  return (
    <div className={`relative group overflow-hidden rounded-sm bg-surface-container-low flex items-center justify-center ${className}`}>
      {image ? (
        <>
          {/* Blurred backdrop fills empty space around portrait images */}
          <img src={image} aria-hidden alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 pointer-events-none" />
          {/* Sharp contained image */}
          <img src={image} alt={name} className="relative w-full h-full object-contain drop-shadow-2xl" onLoad={onLoad} />
          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            {onView && (
              <button type="button" onClick={onView} className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">zoom_in</span>
                <span className="text-white text-xs font-label uppercase tracking-widest drop-shadow">View</span>
              </button>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">photo_camera</span>
              <span className="text-white text-xs font-label uppercase tracking-widest drop-shadow">Replace</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="font-headline text-[8rem] font-bold text-on-surface-variant/10 select-none leading-none">
            {initials}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
          >
            <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">photo_camera</span>
            <span className="text-white text-xs font-label uppercase tracking-widest mt-1 drop-shadow">Upload Portrait</span>
          </button>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
