import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const PROSE_CLS =
  'outline-none prose prose-sm prose-invert max-w-none font-sans ' +
  'prose-p:text-on-surface prose-p:leading-relaxed prose-p:my-1 ' +
  'prose-strong:text-on-surface prose-strong:font-semibold ' +
  'prose-em:text-on-surface-variant/80 ' +
  'prose-ul:text-on-surface prose-ol:text-on-surface ' +
  'prose-li:my-0.5 prose-li:marker:text-primary/50 ' +
  'prose-blockquote:border-l-primary/40 prose-blockquote:text-on-surface-variant/70 prose-blockquote:italic ' +
  'prose-hr:border-outline-variant/20';

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  icon: string;
  title: string;
}

function ToolbarBtn({ onClick, active, icon, title }: ToolbarBtnProps) {
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

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = '5rem' }: Props) {
  const lastEmitted = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: PROSE_CLS,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const emitted = html === '<p></p>' ? '' : html;
      lastEmitted.current = emitted;
      onChange(emitted);
    },
  });

  // Sync when value changes externally (e.g. drawer reopen)
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== lastEmitted.current) {
      editor.commands.setContent(incoming, false);
      lastEmitted.current = incoming;
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-outline-variant/25 hover:border-outline-variant/40 focus-within:!border-primary rounded-sm bg-surface-container-low transition-colors">
      {/* Always-visible toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant/15">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} icon="B" title="Bold"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} icon="I" title="Italic"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')} icon="S̶" title="Strikethrough"
        />
        <div className="w-px h-3.5 bg-outline-variant/25 mx-1 flex-shrink-0" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} icon="ms:format_list_bulleted" title="Bullet list"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} icon="ms:format_list_numbered" title="Ordered list"
        />
        <div className="w-px h-3.5 bg-outline-variant/25 mx-1 flex-shrink-0" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} icon="ms:format_quote" title="Blockquote"
        />
      </div>

      {/* Editor area */}
      <div className="px-3 py-2.5 relative">
        {editor.isEmpty && placeholder && (
          <span className="absolute top-2.5 left-3 text-sm text-on-surface-variant/30 pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
