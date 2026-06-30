"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, List } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function RichTextEditor({ onChange }: { onChange: (json: unknown) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<h2>Article heading</h2><p>Write clear, exam-focused reading material here.</p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON())
  });

  if (!editor) return <div className="rounded-md border border-line p-4 text-sm text-muted">Loading editor...</div>;

  return (
    <div className="rounded-md border border-line">
      <div className="flex gap-1 border-b border-line bg-surface p-2">
        <Button type="button" variant="secondary" className="min-h-8 px-2" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></Button>
        <Button type="button" variant="secondary" className="min-h-8 px-2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></Button>
        <Button type="button" variant="secondary" className="min-h-8 px-2" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></Button>
      </div>
      <EditorContent
        editor={editor}
        className={cn("min-h-40 px-4 py-3 text-sm leading-7 [&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none")}
      />
    </div>
  );
}
