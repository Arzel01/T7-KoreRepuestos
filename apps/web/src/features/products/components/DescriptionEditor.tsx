import { Placeholder } from '@tiptap/extension-placeholder';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface DescriptionEditorProps {
  value: string;
  onChange: (text: string) => void;
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
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor: e }) {
      onChange(e.getText());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getText()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="input-technical mt-3 min-h-[80px] cursor-text p-3 [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:text-ink-500 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]">
      <EditorContent editor={editor} />
    </div>
  );
}
