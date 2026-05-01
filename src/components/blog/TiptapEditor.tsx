"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, useCallback, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link2, ImageIcon, Undo2, Redo2, Loader2, X,
} from "lucide-react";

function ImageNodeView({ node, deleteNode, selected }: ReactNodeViewProps) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const src: string = node.attrs.src;
    if (src?.startsWith(process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN ?? "___")) {
      try {
        await fetch("/api/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ src }),
        });
      } catch {
        // still remove from editor even if S3 call fails
      }
    }
    deleteNode();
  };

  return (
    <NodeViewWrapper className="inline-block">
      <div
        className="relative inline-block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          className={`rounded-xl max-w-full my-4 ${selected ? "ring-2 ring-[#ff6b4e]" : ""}`}
        />
        {(hovered || selected) && (
          <button
            type="button"
            contentEditable={false}
            onMouseDown={(e) => { e.preventDefault(); handleDelete(); }}
            disabled={deleting}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
            title="Delete image"
          >
            {deleting
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <X className="w-3 h-3" />
            }
          </button>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const ImageWithDelete = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

interface Props {
  content: string;
  onChange: (html: string) => void;
}

type GroupBtn = {
  icon: React.ReactNode;
  title: string;
  action: () => void;
  active: boolean;
  disabled?: boolean;
};

function ToolbarButton({
  onClick, active, title, children, disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : active
          ? "bg-[#ff6b4e] text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-[#1a1a2e]"
      }`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ content, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#ff6b4e] underline" } }),
      ImageWithDelete,
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
    if (uploading) return;
    fileInputRef.current?.click();
  }, [uploading]);

  const handleImageFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { filename } = await res.json();

      const baseName = filename.replace(/\.[^/.]+$/, "");
      const src = `${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/optimized/${baseName}.webp`;
      editor.chain().focus().setImage({ src }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
    }
  }, [editor]);

  if (!editor) return null;

  const groups: GroupBtn[][] = [
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
      { icon: uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />, title: "Insert Image", action: addImage, active: false, disabled: uploading },
    ],
  ];

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <div className="w-px h-5 bg-gray-200 mx-1" />}
            {group.map((btn, bi) => (
              <ToolbarButton key={bi} onClick={btn.action} active={btn.active} title={btn.title} disabled={btn.disabled}>
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
