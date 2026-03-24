import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { useParty, useSaveCharacter } from '@/features/characters/api/queries';
import { CharacterEditDrawer } from '@/features/characters/ui';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, BackLink } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

// ── WYSIWYG inline field ─────────────────────────────────────────────────────

type TextField = 'gmNotes' | 'background' | 'appearance' | 'personality' | 'motivation' | 'bonds' | 'flaws';

interface InlineFieldProps {
  label: string;
  value: string | undefined;
  field: TextField;
  activeField: TextField | null;
  onActivate: (field: TextField) => void;
  onSave: (field: TextField, html: string) => void;
  isGmNotes?: boolean;
}

function ToolbarButton({
  onClick, active, icon, title,
}: { onClick: () => void; active?: boolean; icon: string; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-[13px] font-bold
        ${active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
    >
      {icon.startsWith('material:')
        ? <span className="material-symbols-outlined text-[15px]">{icon.slice(9)}</span>
        : icon}
    </button>
  );
}

function TipTapEditor({ field, initialHtml, onSave }: {
  field: TextField;
  initialHtml: string;
  onSave: (field: TextField, html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml || '',
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[4rem] prose prose-sm prose-invert max-w-none font-sans ' +
          'prose-p:text-on-surface prose-p:leading-relaxed prose-p:my-1 ' +
          'prose-strong:text-on-surface prose-strong:font-semibold ' +
          'prose-em:text-on-surface-variant/80 ' +
          'prose-headings:text-on-surface prose-headings:font-headline prose-headings:font-bold ' +
          'prose-h2:text-base prose-h3:text-sm ' +
          'prose-ul:text-on-surface prose-ol:text-on-surface ' +
          'prose-li:my-0.5 prose-li:marker:text-primary/50 ' +
          'prose-blockquote:border-l-primary/40 prose-blockquote:text-on-surface-variant/70 prose-blockquote:italic ' +
          'prose-hr:border-outline-variant/20',
      },
    },
    onBlur: ({ editor: e }) => {
      const html = e.getHTML();
      onSave(field, html === '<p></p>' ? '' : html);
    },
  });

  if (!editor) return null;

  return (
    <div className="relative">
      <BubbleMenu
        editor={editor}
className="flex items-center gap-0.5 px-1.5 py-1 bg-surface-container-highest border border-outline-variant/30 rounded-sm shadow-xl"
      >
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} icon="B" title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} icon="I" title="Italic" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')} icon="S̶" title="Strikethrough" />
        <div className="w-px h-4 bg-outline-variant/30 mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })} icon="H2" title="Heading 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })} icon="H3" title="Heading 3" />
        <div className="w-px h-4 bg-outline-variant/30 mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} icon="material:format_list_bulleted" title="Bullet list" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} icon="material:format_list_numbered" title="Ordered list" />
        <div className="w-px h-4 bg-outline-variant/30 mx-0.5" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} icon="material:format_quote" title="Blockquote" />
      </BubbleMenu>

      <div className="border border-primary/40 rounded-sm px-3 py-2.5 bg-surface-container-low focus-within:border-primary transition-colors">
        <EditorContent editor={editor} />
      </div>
      <p className="text-[10px] text-on-surface-variant/30 mt-1.5 text-right">
        Select text to format · Esc to cancel
      </p>
    </div>
  );
}

function InlineField({ label, value, field, activeField, onActivate, onSave, isGmNotes }: InlineFieldProps) {
  const isEditing = activeField === field;

  const content = isEditing ? (
    <TipTapEditor field={field} initialHtml={value ?? ''} onSave={onSave} />
  ) : value ? (
    <div
      onClick={() => onActivate(field)}
      className="cursor-text group relative prose prose-sm prose-invert max-w-none font-sans
        prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1
        prose-strong:text-on-surface prose-strong:font-semibold
        prose-em:text-on-surface-variant/80
        prose-headings:text-on-surface prose-headings:font-headline prose-headings:font-bold
        prose-h2:text-base prose-h3:text-sm
        prose-ul:text-on-surface-variant prose-ol:text-on-surface-variant
        prose-li:my-0.5 prose-li:marker:text-primary/50
        prose-blockquote:border-l-primary/40 prose-blockquote:text-on-surface-variant/70 prose-blockquote:italic
        prose-hr:border-outline-variant/20
        hover:prose-p:text-on-surface transition-colors"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  ) : (
    <button
      onClick={() => onActivate(field)}
      className="w-full flex items-center justify-between py-3 px-4 border border-dashed border-outline-variant/20 rounded-sm hover:border-primary/30 hover:bg-primary/3 transition-all group"
    >
      <span className="text-xs text-on-surface-variant/30 italic group-hover:text-on-surface-variant/50 transition-colors">Not recorded yet.</span>
      <span className="flex items-center gap-1 text-[10px] text-primary/30 group-hover:text-primary uppercase tracking-widest transition-colors">
        <span className="material-symbols-outlined text-[12px]">edit</span>
        Fill in
      </span>
    </button>
  );

  if (isGmNotes) {
    return (
      <section className="bg-surface-container-low p-8 border border-primary/20 rounded-sm relative overflow-hidden group/section">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/section:opacity-20 transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-6xl text-primary">lock</span>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">GM Notes</h3>
          </div>
          {content}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">{label}</h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        {!isEditing && value && (
          <button onClick={() => onActivate(field)}
            className="opacity-0 group-hover:opacity-100 text-on-surface-variant/30 hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[15px]">edit</span>
          </button>
        )}
      </div>
      {content}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CharacterDetailPage() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const { data: characters, isLoading, isError } = useParty(campaignId ?? '');
  const character = characters?.find((c) => c.id === charId);
  const { data: allSpecies } = useSpecies();
  const saveCharacter = useSaveCharacter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeField, setActiveField] = useState<TextField | null>(null);
  const [lightbox, setLightbox] = useState(false);

  const handleActivate = (field: TextField) => setActiveField(field);

  const handleSave = (field: TextField, html: string) => {
    if (!character) return;
    setActiveField(null);
    const trimmed = html.trim();
    if (trimmed === (character[field] ?? '').trim()) return;
    saveCharacter.mutate({
      ...character,
      [field]: trimmed || undefined,
      updatedAt: new Date().toISOString(),
    } as PlayerCharacter);
  };

  const handleImageUpload = (dataUrl: string) => {
    saveCharacter.mutate({ ...character!, image: dataUrl, updatedAt: new Date().toISOString() });
  };

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !character) {
    return (
      <main className="p-12">
        <BackLink to={`/campaigns/${campaignId}/party`}>Party</BackLink>
        <p className="text-tertiary text-sm">Character not found.</p>
      </main>
    );
  }

  const matchedSpecies = allSpecies?.find(
    (s) => s.id === character.speciesId || s.name.toLowerCase() === character.species?.toLowerCase()
  );
  const displaySpecies = matchedSpecies?.name ?? character.species;
  const displayGender = character.gender === 'nonbinary'
    ? 'Non-binary'
    : character.gender
      ? character.gender.charAt(0).toUpperCase() + character.gender.slice(1)
      : undefined;

  const demoBadge = [displaySpecies, displayGender, character.class, character.age != null ? `Age ${character.age}` : null]
    .filter(Boolean).join(' · ');

  const fieldProps = { activeField, onActivate: handleActivate, onSave: handleSave };

  return (
    <main className="flex-1 min-h-screen bg-surface">
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/party`}>Party</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            <ImageUpload
              image={character.image}
              name={character.name}
              className="w-full aspect-[21/9]"
              onUpload={handleImageUpload}
              onView={character.image ? () => setLightbox(true) : undefined}
            />

            <header className="space-y-4">
              {demoBadge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {demoBadge}
                </span>
              )}
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                {character.name}
              </h1>
            </header>

            <InlineField field="gmNotes" label="GM Notes" value={character.gmNotes} isGmNotes {...fieldProps} />
            <InlineField field="background" label="Backstory" value={character.background} {...fieldProps} />

            <SocialRelationsSection campaignId={campaignId ?? ''} entityId={charId ?? ''} />
          </div>

          {/* ── Right column ────────────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            <div className="flex justify-end">
              <button onClick={() => setDetailsOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary hover:border-primary/50 text-xs font-label uppercase tracking-widest rounded-sm transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </button>
            </div>

            <InlineField field="appearance" label="Appearance" value={character.appearance} {...fieldProps} />
            <InlineField field="personality" label="Personality" value={character.personality} {...fieldProps} />
            <InlineField field="motivation" label="Motivation & Ideals" value={character.motivation} {...fieldProps} />
            <InlineField field="bonds" label="Bonds" value={character.bonds} {...fieldProps} />
            <InlineField field="flaws" label="Flaws" value={character.flaws} {...fieldProps} />

          </div>
        </div>
      </div>

      <CharacterEditDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        campaignId={campaignId ?? ''}
        character={character}
      />

      {lightbox && character.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <img
            src={character.image}
            alt={character.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      )}
    </main>
  );
}
