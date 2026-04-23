import { useState, useMemo, useEffect, useCallback } from "react";
import { readBooks, writeBooks, Book } from "./gist";
import { BookModal } from "./components/BookModal";
import { BookCard, BookRow } from "./components/BookCard";
import { LoginModal } from "./components/LoginModal";

const AUTH_KEY = "reef_token";

type ViewMode = "card" | "list";
type SortMode = "recent" | "rating-down" | "rating-up";
type ModalMode = "add" | "edit" | "login" | null;
type BookFormData = Omit<Book, "id">;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  const [modal, setModal] = useState<ModalMode>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_KEY),
  );
  const [loginError, setLoginError] = useState("");
  const isAdmin = !!token;

  useEffect(() => {
    readBooks()
      .then((b) => {
        setBooks(b);
        setLoading(false);
      })
      .catch((e: Error) => {
        setLoadError(e.message);
        setLoading(false);
      });
  }, []);

  const persist = useCallback(
    async (newBooks: Book[]) => {
      if (!token) return;
      setSaving(true);
      try {
        await writeBooks(newBooks, token);
        setBooks(newBooks);
      } catch (e) {
        alert("Save failed: " + (e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  const handleLogin = async (t: string) => {
    setLoginError("");
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      setLoginError("you're tripping lol");
      return;
    }
    localStorage.setItem(AUTH_KEY, t);
    setToken(t);
    setModal(null);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setToken(null);
  };

  const saveBook = async (form: BookFormData) => {
    const newBooks = editBook
      ? books.map((b) =>
          b.id === editBook.id ? { ...form, id: editBook.id } : b,
        )
      : [...books, { ...form, id: Date.now() }];
    await persist(newBooks);
    setModal(null);
    setEditBook(null);
  };

  const deleteBook = async (id: number) => {
    if (!confirm("Delete this book?")) return;
    await persist(books.filter((b) => b.id !== id));
    setModal(null);
    setEditBook(null);
  };

  const openEdit = (book: Book) => {
    if (!isAdmin) return;
    setEditBook(book);
    setModal("edit");
  };

  const filtered = useMemo(() => {
    let b = books.filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.tags.some((t) => t.includes(search.toLowerCase())),
    );
    if (sort === "rating-down") b = [...b].sort((a, z) => z.rating - a.rating);
    if (sort === "rating-up") b = [...b].sort((a, z) => a.rating - z.rating);
    return b;
  }, [books, search, sort]);

  const avgRating = filtered.length
    ? (filtered.reduce((a, b) => a + b.rating, 0) / filtered.length).toFixed(1)
    : "-";

  return (
    <div className="min-h-screen bg-[#E7E4DE]">
      {/* Header */}
      <div className="px-8 pt-8 mb-4 flex items-start justify-between">
        <div className="flex items-start gap-5">
          <div
            className="text-[52px] leading-none tracking-[0.1em] text-[#E84832]"
            style={{ fontFamily: "'Jersey 15', sans-serif" }}
          >
            reef.
          </div>
          <div className="text-[12px] text-black">
            goodreads dupe
            <br />
            bc i wanted
            <br />
            half stars
          </div>
        </div>
        <div className="mt-2">
          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-[#E84832] text-[12px] text-[#E7E4DE] cursor-pointer hover:bg-[#4A90D9]"
            >
              LOG OUT
            </button>
          ) : (
            <button
              onClick={() => setModal("login")}
              className="px-3 py-1.5 rounded-md bg-[#E84832] text-[12px] text-[#E7E4DE] cursor-pointer hover:bg-[#4A90D9]"
            >
              LOG IN
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-5 px-8 items-start">
        {/* Sidebar */}
        <div className="w-48">
          <div className="rounded-xl border border-[#E84832] p-3.5">
            <div className="font-bold text-[13px] text-black mb-2">pages</div>
            <div className="pl-3 text-xs">
              <div className="text-[#E84832]">└ books</div>
              <div className="black">└ stats</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl overflow-hidden border border-[#E84832]">
            {/* Toolbar */}
            <div className="flex gap-2 px-3.5 py-3 border-b border-black items-center">
              <div className="flex-1 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black text-lg select-none">
                  ⌕
                </span>
                <input
                  className="w-full pl-7 pr-2 h-[34px] border border-black text-[12px] outline-none"
                  placeholder="search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="h-[34px] border border-black text-[12px] px-2.5 outline-none cursor-pointer appearance-none"
                >
                  <option value="recent">recent</option>
                  <option value="rating-down">rating ↓</option>
                  <option value="rating-up">rating ↑</option>
                </select>
              </div>

              <div className="flex border border-black rounded-md overflow-hidden">
                {(["card", "list"] as ViewMode[]).map((v, i) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="w-[34px] h-[34px] flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      background: view === v ? "#E84832" : "transparent",
                      borderRight: i === 0 ? "1px solid black" : "none",
                    }}
                  >
                    {v === "card" ? (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill={view === v ? "#e7e4de" : "#aba8a3"}
                      >
                        <rect x="0" y="0" width="6" height="6" rx="1" />
                        <rect x="8" y="0" width="6" height="6" rx="1" />
                        <rect x="0" y="8" width="6" height="6" rx="1" />
                        <rect x="8" y="8" width="6" height="6" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill={view === v ? "#e7e4de" : "#aba8a3"}
                      >
                        <rect x="0" y="1" width="14" height="2" rx="1" />
                        <rect x="0" y="6" width="14" height="2" rx="1" />
                        <rect x="0" y="11" width="14" height="2" rx="1" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setEditBook(null);
                    setModal("add");
                  }}
                  className="w-[34px] h-[34px] rounded-md bg-[#E84832] text-[#E7E4DE] text-[24px] flex items-center justify-center cursor-pointer hover:bg-[#4A90D9] transition-opacity border-none leading-none"
                >
                  +
                </button>
              )}
            </div>

            {/* Content */}
            <div className="min-h-[120px] bg-[#E7E4DE]">
              {loading && (
                <div className="py-10 text-center text-xs text-black">
                  Loading…
                </div>
              )}
              {loadError && (
                <div className="p-6 text-xs text-[#E84832]">
                  Failed to load: {loadError}
                  <br />
                  <span className="text-black">
                    Check GIST_ID in src/gist.ts
                  </span>
                </div>
              )}
              {!loading && !loadError && filtered.length === 0 && (
                <div className="py-10 text-center text-xs text-black">
                  {books.length === 0
                    ? isAdmin
                      ? "No books yet — add one!"
                      : "No books yet."
                    : "No results."}
                </div>
              )}
              {!loading &&
                view === "card" &&
                filtered.map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    onEdit={openEdit}
                    isAdmin={isAdmin}
                  />
                ))}
              {!loading &&
                view === "list" &&
                filtered.map((b) => (
                  <BookRow
                    key={b.id}
                    book={b}
                    onEdit={openEdit}
                    isAdmin={isAdmin}
                  />
                ))}
            </div>
          </div>

          <div className="mt-2.5 text-[11px] text-black flex justify-between">
            <span>
              {books.length} book{books.length !== 1 ? "s" : ""} total
            </span>
            <span>
              {filtered.length} shown · avg {avgRating}
            </span>
          </div>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <BookModal
          book={modal === "edit" ? editBook : null}
          onSave={saveBook}
          onDelete={deleteBook}
          onClose={() => {
            setModal(null);
            setEditBook(null);
          }}
          saving={saving}
        />
      )}
      {modal === "login" && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => {
            setModal(null);
            setLoginError("");
          }}
          error={loginError}
        />
      )}
    </div>
  );
}
