"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link2, ImageIcon, Undo2, Redo2,
} from "lucide-react";

interface Props {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? "bg-[#ff6b4e] text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-[#1a1a2e]"
      }`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#ff6b4e] underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl max-w-full my-4" } }),
      Placeholder.configure({ placeholder: "Start writing your post…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[500px] outline-none prose prose-lg max-w-none px-8 py-6 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  const groups = [
    [
      { icon: <Undo2 className="w-4 h-4" />, title: "Undo", action: () => editor.chain().focus().undo().run(), active: false },
      { icon: <Redo2 className="w-4 h-4" />, title: "Redo", action: () => editor.chain().focus().redo().run(), active: false },
    ],
    [
      { icon: <Heading1 className="w-4 h-4" />, title: "Heading 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
      { icon: <Heading2 className="w-4 h-4" />, title: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
      { icon: <Heading3 className="w-4 h-4" />, title: "Heading 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    ],
    [
      { icon: <Bold className="w-4 h-4" />, title: "Bold", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
      { icon: <Italic className="w-4 h-4" />, title: "Italic", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
      { icon: <UnderlineIcon className="w-4 h-4" />, title: "Underline", action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
      { icon: <Strikethrough className="w-4 h-4" />, title: "Strikethrough", action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
    ],
    [
      { icon: <List className="w-4 h-4" />, title: "Bullet List", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
      { icon: <ListOrdered className="w-4 h-4" />, title: "Ordered List", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
      { icon: <Quote className="w-4 h-4" />, title: "Blockquote", action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
      { icon: <Code className="w-4 h-4" />, title: "Code Block", action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock") },
      { icon: <Minus className="w-4 h-4" />, title: "Divider", action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
    ],
    [
      { icon: <Link2 className="w-4 h-4" />, title: "Insert Link", action: addLink, active: editor.isActive("link") },
      { icon: <ImageIcon className="w-4 h-4" />, title: "Insert Image", action: addImage, active: false },
    ],
  ];

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <div className="w-px h-5 bg-gray-200 mx-1" />}
            {group.map((btn, bi) => (
              <ToolbarButton key={bi} onClick={btn.action} active={btn.active} title={btn.title}>
                {btn.icon}
              </ToolbarButton>
            ))}
          </div>
        ))}
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
