import { Book } from "../gist";
import { StarRating } from "./StarRating";
import { Tag } from "./Tag";

interface BookItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  isAdmin: boolean;
}

export function BookCard({ book, onEdit, isAdmin }: BookItemProps) {
  return (
    <div className="m-4 border border-black mb-3.5 p-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-2.5 flex-1">
          <span
            className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 inline-block"
            style={{ background: book.color }}
          />
          <div>
            <div className="font-bold text-[12px] text-gray-800 tracking-wide">
              {book.title}
            </div>
            <div className="text-[12px] text-black mt-0.5 flex items-center gap-1">
              {book.author}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating rating={book.rating} size={14} />
          <div className="text-[12px] text-black">
            {book.startDate}
            {book.endDate ? `—${book.endDate}` : ""}
          </div>
        </div>
      </div>

      {book.notes ? (
        <div className="my-3 px-3 py-2.5 text-[12px] text-black leading-relaxed bg-[#D8D6D0]">
          {book.notes}
        </div>
      ) : (
        <br />
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[12px] text-black mr-0.5">Tags:</span>
          {book.tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => onEdit(book)}
            className="px-3.5 py-1.5 rounded-md bg-[#E84832] text-[#E7E4DE] text-[12px] cursor-pointer hover:bg-[#4A90D9] transition-opacity"
          >
            EDIT
          </button>
        )}
      </div>
    </div>
  );
}

export function BookRow({ book, onEdit, isAdmin }: BookItemProps) {
  return (
    <div
      onClick={() => isAdmin && onEdit(book)}
      className={`flex items-center gap-3 px-3.5 py-3 border-b border-black last:border-b-0 transition-colors ${isAdmin ? "cursor-pointer hover:bg-[#D8D6D0]" : ""}`}
    >
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ background: book.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[12px] text-gray-800 truncate">
          {book.title}
        </div>
        <div className="text-[12px] text-black mt-0.5 flex items-center gap-1">
          {book.author}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <StarRating rating={book.rating} size={12} />
        <div className="text-[12px] text-black">
          {book.startDate}
          {book.endDate ? `—${book.endDate}` : ""}
        </div>
      </div>
    </div>
  );
}
