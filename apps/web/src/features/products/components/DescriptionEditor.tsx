import { Placeholder } from '@tiptap/extension-placeholder';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface DescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function DescriptionEditor({
  value,
  onChange,
  placeholder = 'Detalle técnico, compatibilidad, garantía…',
}: DescriptionEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate({ editor: e }) {
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="mt-3 border border-neutral-200 focus-within:border-neutral-400">
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-100 px-2 py-1">
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold') ?? false}
          title="Negrita"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic') ?? false}
          title="Cursiva"
        >
          <em>I</em>
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 }) ?? false}
          title="Título 2"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor?.isActive('heading', { level: 3 }) ?? false}
          title="Título 3"
        >
          H3
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList') ?? false}
          title="Lista con viñetas"
        >
          • Lista
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList') ?? false}
          title="Lista numerada"
        >
          1. Lista
        </ToolbarBtn>
      </div>
      <div
        className={[
          'min-h-[80px] cursor-text p-3',
          '[&_.tiptap]:outline-none',
          '[&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mt-2',
          '[&_.tiptap_h3]:text-sm [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mt-2',
          '[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-4',
          '[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-4',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:text-neutral-400',
          '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
        ].join(' ')}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

interface ToolbarBtnProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, active, title, children }: ToolbarBtnProps): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
        active
          ? 'bg-cyan-400 text-navy-900'
          : 'text-neutral-500 hover:bg-neutral-200 hover:text-navy-800'
      }`}
    >
      {children}
    </button>
  );
}
