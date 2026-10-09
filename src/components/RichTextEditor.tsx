"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type ToolBtn = {
  title: string;
  label: React.ReactNode;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
};

/** Thin wrapper: a styled toolbar button */
function Btn({ title, label, action, active, disabled }: ToolBtn) {
  return (
    <button
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focused
        action();
      }}
      disabled={disabled}
      className={[
        "px-2 py-1 rounded text-sm font-medium transition-colors select-none",
        "border border-transparent",
        active
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        disabled ? "opacity-30 pointer-events-none" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-1 self-center" />;
}

export default function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit does not include Underline, but configure it explicitly
      // to ensure no duplication if package versions change
      StarterKit.configure({
        heading:   { levels: [1, 2, 3] },
        // Strike is included in StarterKit — keep it
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // Underline is NOT part of StarterKit — safe to add separately
      Underline,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "outline-none min-h-[400px] prose prose-sm max-w-none p-6 focus:outline-none",
      },
    },
  });

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-xl min-h-[450px] flex items-center justify-center text-gray-400 text-sm animate-pulse">
        Memuat editor…
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {/* History */}
        <Btn
          title="Undo (Ctrl+Z)"
          label="↩"
          disabled={!editor.can().undo()}
          action={() => editor.chain().focus().undo().run()}
        />
        <Btn
          title="Redo (Ctrl+Y)"
          label="↪"
          disabled={!editor.can().redo()}
          action={() => editor.chain().focus().redo().run()}
        />

        <Divider />

        {/* Inline marks */}
        <Btn
          title="Bold (Ctrl+B)"
          label={<strong>B</strong>}
          active={editor.isActive("bold")}
          action={() => editor.chain().focus().toggleBold().run()}
        />
        <Btn
          title="Italic (Ctrl+I)"
          label={<em>I</em>}
          active={editor.isActive("italic")}
          action={() => editor.chain().focus().toggleItalic().run()}
        />
        <Btn
          title="Underline (Ctrl+U)"
          label={<span className="underline">U</span>}
          active={editor.isActive("underline")}
          action={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Btn
          title="Strikethrough"
          label={<span className="line-through text-xs">S</span>}
          active={editor.isActive("strike")}
          action={() => editor.chain().focus().toggleStrike().run()}
        />

        <Divider />

        {/* Text alignment */}
        <Btn
          title="Align Left"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <rect x="3" y="10" width="12" height="2" rx="1" />
              <rect x="3" y="15" width="16" height="2" rx="1" />
              <rect x="3" y="20" width="10" height="2" rx="1" />
            </svg>
          }
          active={editor.isActive({ textAlign: "left" })}
          action={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <Btn
          title="Align Center"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <rect x="6" y="10" width="12" height="2" rx="1" />
              <rect x="4" y="15" width="16" height="2" rx="1" />
              <rect x="7" y="20" width="10" height="2" rx="1" />
            </svg>
          }
          active={editor.isActive({ textAlign: "center" })}
          action={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <Btn
          title="Align Right"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <rect x="9" y="10" width="12" height="2" rx="1" />
              <rect x="5" y="15" width="16" height="2" rx="1" />
              <rect x="11" y="20" width="10" height="2" rx="1" />
            </svg>
          }
          active={editor.isActive({ textAlign: "right" })}
          action={() => editor.chain().focus().setTextAlign("right").run()}
        />
        <Btn
          title="Justify"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <rect x="3" y="10" width="18" height="2" rx="1" />
              <rect x="3" y="15" width="18" height="2" rx="1" />
              <rect x="3" y="20" width="14" height="2" rx="1" />
            </svg>
          }
          active={editor.isActive({ textAlign: "justify" })}
          action={() => editor.chain().focus().setTextAlign("justify").run()}
        />

        <Divider />

        {/* Lists */}
        <Btn
          title="Bullet List"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="4" cy="7" r="1.5" />
              <rect x="7" y="6" width="14" height="2" rx="1" />
              <circle cx="4" cy="13" r="1.5" />
              <rect x="7" y="12" width="14" height="2" rx="1" />
              <circle cx="4" cy="19" r="1.5" />
              <rect x="7" y="18" width="14" height="2" rx="1" />
            </svg>
          }
          active={editor.isActive("bulletList")}
          action={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Btn
          title="Ordered List"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <text x="2" y="9" fontSize="8" fontFamily="monospace">1.</text>
              <rect x="9" y="6" width="12" height="2" rx="1" />
              <text x="2" y="15" fontSize="8" fontFamily="monospace">2.</text>
              <rect x="9" y="12" width="12" height="2" rx="1" />
              <text x="2" y="21" fontSize="8" fontFamily="monospace">3.</text>
              <rect x="9" y="18" width="12" height="2" rx="1" />
            </svg>
          }
          active={editor.isActive("orderedList")}
          action={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <Divider />

        {/* Indent — TipTap uses sink/lift on lists */}
        <Btn
          title="Indent"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <path d="M3 11l4 3-4 3V11z" />
              <rect x="9" y="12" width="12" height="2" rx="1" />
              <rect x="3" y="19" width="18" height="2" rx="1" />
            </svg>
          }
          action={() => editor.chain().focus().sinkListItem("listItem").run()}
        />
        <Btn
          title="Outdent"
          label={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <path d="M8 11l-4 3 4 3V11z" />
              <rect x="6" y="12" width="15" height="2" rx="1" />
              <rect x="3" y="19" width="18" height="2" rx="1" />
            </svg>
          }
          action={() => editor.chain().focus().liftListItem("listItem").run()}
        />

        <Divider />

        {/* Heading shortcuts */}
        <select
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .setHeading({ level: Number(v[1]) as 1 | 2 | 3 })
                .run();
          }}
          className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-400 ml-1"
        >
          <option value="p">Paragraf</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      {/* ── Editor content area ── */}
      <div className="flex-1 overflow-auto relative">
        {editor.isEmpty && (
          <div className="absolute top-6 left-6 text-gray-400 text-sm pointer-events-none select-none">
            {placeholder ?? "Mulai mengetik di sini…"}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
