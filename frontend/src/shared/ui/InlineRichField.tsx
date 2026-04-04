import { useState, useRef, useEffect, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active, icon, title,
}: { onClick: () => void; active?: boolean; icon: string; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors flex-shrink-0 ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high'
      }`}
    >
      {icon.startsWith('ms:')
        ? <span className="material-symbols-outlined text-[14px]">{icon.slice(3)}</span>
        : <span className="text-[11px] font-bold leading-none">{icon}</span>}
    </button>
  );
}

// ── TipTap editor (shown when editing) ────────────────────────────────────────

function EditingField({
  initialHtml, onSave, onCancel,
}: { initialHtml: string; onSave: (html: string) => void; onCancel: () => void }) {
  const cancelledRef = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false })],
    content: initialHtml || '',
    autofocus: 'end',
    editorProps: {
      attributes: {
        class:
          'outline-none min-h-[3rem] prose prose-sm prose-invert max-w-none font-sans ' +
          'prose-p:text-on-surface prose-p:leading-relaxed prose-p:my-1 ' +
          'prose-strong:text-on-surface prose-strong:font-semibold ' +
          'prose-em:text-on-surface-variant/80 ' +
          'prose-ul:text-on-surface prose-ol:text-on-surface ' +
          'prose-li:my-0.5 prose-li:marker:text-primary/50 ' +
          'prose-blockquote:border-l-primary/40 prose-blockquote:text-on-surface-variant/70 prose-blockquote:italic ' +
          'prose-hr:border-outline-variant/20',
      },
    },
    onBlur: ({ editor: e }) => {
      if (cancelledRef.current) return;
      const html = e.getHTML();
      onSave(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelledRef.current = true;
        onCancel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  if (!editor) return null;

  return (
    <div className="border border-primary/40 rounded-sm bg-surface-container-low transition-colors focus-within:border-primary">
      {/* Always-visible toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant/15">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} icon="B" title="Bold" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} icon="I" title="Italic" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')} icon="S̶" title="Strikethrough" />
        <div className="w-px h-3.5 bg-outline-variant/25 mx-1 flex-shrink-0" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} icon="ms:format_list_bulleted" title="Bullet list" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} icon="ms:format_list_numbered" title="Ordered list" />
        <div className="w-px h-3.5 bg-outline-variant/25 mx-1 flex-shrink-0" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} icon="ms:format_quote" title="Blockquote" />
        <div className="flex-1" />
        <span className="text-[10px] text-on-surface-variant/25 pr-1 select-none">Esc to cancel</span>
      </div>
      <div className="px-3 py-2.5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  label: string;
  value: string | undefined;
  onSave: (html: string) => void;
  isGmNotes?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}

export const InlineRichField = memo(function InlineRichField({ label, value, onSave, isGmNotes, placeholder = 'Not recorded yet.', readOnly }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (html: string) => {
    setIsEditing(false);
    onSave(html);
  };

  const handleCancel = () => setIsEditing(false);

  const readView = value ? (
    <div
      onClick={readOnly ? undefined : () => setIsEditing(true)}
      className={`prose prose-sm prose-invert max-w-none font-sans
        prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1
        prose-strong:text-on-surface prose-strong:font-semibold
        prose-em:text-on-surface-variant/80
        prose-ul:text-on-surface-variant prose-ol:text-on-surface-variant
        prose-li:my-0.5 prose-li:marker:text-primary/50
        prose-blockquote:border-l-primary/40 prose-blockquote:text-on-surface-variant/70 prose-blockquote:italic
        prose-hr:border-outline-variant/20
        ${readOnly ? '' : 'cursor-text group/prose hover:prose-p:text-on-surface'} transition-colors`}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  ) : readOnly ? (
    <p className="text-xs text-on-surface-variant/30 italic">{placeholder}</p>
  ) : (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full flex items-center justify-between py-3 px-4 border border-dashed border-outline-variant/20 rounded-sm hover:border-primary/30 hover:bg-primary/3 transition-all group/empty"
    >
      <span className="text-xs text-on-surface-variant/30 italic group-hover/empty:text-on-surface-variant/50 transition-colors">
        {placeholder}
      </span>
      <span className="flex items-center gap-1 text-[10px] text-primary/30 group-hover/empty:text-primary uppercase tracking-widest transition-colors">
        <span className="material-symbols-outlined text-[12px]">edit</span>
        Fill in
      </span>
    </button>
  );

  const content = isEditing
    ? <EditingField initialHtml={value ?? ''} onSave={handleSave} onCancel={handleCancel} />
    : readView;

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
    <div className="space-y-3 group/field">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">{label}</h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        {!isEditing && value && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover/field:opacity-100 text-on-surface-variant/30 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
          </button>
        )}
      </div>
      {content}
    </div>
  );
}, (prev, next) => prev.value === next.value && prev.label === next.label && prev.readOnly === next.readOnly && prev.isGmNotes === next.isGmNotes);
