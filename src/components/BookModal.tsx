import { useState } from "react";
import { Book } from "../gist";
import { StarRating } from "./StarRating";
import { Tag } from "./Tag";

type BookFormData = Omit<Book, "id">;

interface BookModalProps {
  book: Book | null;
  onSave: (form: BookFormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function BookModal({
  book,
  onSave,
  onDelete,
  onClose,
  saving,
}: BookModalProps) {
  const [form, setForm] = useState<BookFormData>(
    book
      ? {
          title: book.title,
          author: book.author,
          rating: book.rating,
          startDate: book.startDate,
          endDate: book.endDate,
          tags: book.tags,
          notes: book.notes,
        }
      : {
          title: "",
          author: "",
          rating: 3,
          startDate: "",
          endDate: "",
          tags: [],
          notes: "",
        },
  );
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({
        ...f,
        tags: [...f.tags, t],
      }));
    }
    setTagInput("");
  };

  const inputCls =
    "w-full px-2.5 py-2 border border-black text-[12px] outline-none mb-3.5";
  const labelCls =
    "block text-[10px] font-bold text-black lowercase tracking-wider mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl p-7 w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto border-2 border-[#E84832] bg-[#E7E4DE]"
      >
        <h2
          className="mb-2 text-[34px] text-[#E84832] tracking-[0.1em]"
          style={{ fontFamily: "'Jersey 15', sans-serif" }}
        >
          {book ? "edit book" : "add book"}
        </h2>

        <label className={labelCls}>Title</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({ ...f, title: e.target.value.toUpperCase() }))
          }
        />

        <label className={labelCls}>Author</label>
        <input
          className={inputCls}
          value={form.author}
          onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
        />

        <label className={labelCls}>Rating</label>
        <div className="flex items-center gap-2.5 mb-3.5">
          <StarRating
            rating={form.rating}
            onChange={(r) => setForm((f) => ({ ...f, rating: r }))}
            size={24}
          />
          <span className="text-sm text-[#ABA8A3]">{form.rating}/5</span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>Start date</label>
            <input
              className={inputCls}
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </div>
          <div className="flex-1">
            <label className={labelCls}>End date</label>
            <input
              className={inputCls}
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
        </div>

        <label className={labelCls}>Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.tags.map((t) => (
            <Tag
              key={t}
              label={t}
              onRemove={() =>
                setForm((f) => {
                  const newTags = f.tags.filter((x) => x !== t);

                  return {
                    ...f,
                    tags: newTags,
                  };
                })
              }
            />
          ))}
        </div>
        <div className="flex gap-2 mb-3.5">
          <input
            className="flex-1 px-2.5 py-2 border border-black text-[10px] outline-none"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
          />
          <button
            onClick={addTag}
            className="px-4 py-2 rounded-md border border-none bg-[#E84832] text-[12px] text-[#E7E4DE] cursor-pointer hover:bg-[#4A90D9]"
          >
            ADD
          </button>
        </div>

        <label className={labelCls}>Notes</label>
        <textarea
          className="w-full px-2.5 py-2 border border-black bg-[#D8D6D0] text-[12px] outline-none mb-3.5 h-20 resize-y"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className={`flex-1 py-2 rounded-md text-[#E7E4DE] text-[12px] cursor-pointer ${
              saving ? "bg-[#4A90D9]" : "bg-[#E84832] hover:bg-[#4A90D9]"
            }`}
          >
            {saving ? "SAVING..." : book ? "SAVE" : "ADD BOOK"}
          </button>
          {book && (
            <button
              onClick={() => onDelete(book.id)}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-[#E8A838] text-[#E7E4DE] text-[12px] cursor-pointer hover:bg-[#4A90D9] transition-colors"
            >
              DELETE
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#ABA8A3] text-[#E7E4DE] text-[12px] cursor-pointer hover:bg-[#4A90D9]"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
