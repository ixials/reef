import { useState, useMemo, useEffect, useCallback } from "react";
import { readGist, writeGist, Book, TagSections } from "./gist";
import { C } from "./colors";
import { BookModal } from "./components/BookModal";
import { BookCard, BookRow } from "./components/BookCard";
import { LoginModal } from "./components/LoginModal";
import { TagFilter } from "./components/TagFilter";
import { SortFilter } from "./components/SortFilter";
import { TagSettings } from "./components/TagSettings";
import mawile from "./assets/mawile.png";

const AUTH_KEY = "reef_token";

type ViewMode = "card" | "list";
type ModalMode = "add" | "edit" | "login" | "settings" | null;
type SortMode = "recent" | "rating-down" | "rating-up";
type BookFormData = Omit<Book, "id">;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<TagSections>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [modal, setModal] = useState<ModalMode>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_KEY),
  );
  const [loginError, setLoginError] = useState("");
  const isAdmin = !!token;

  useEffect(() => {
    readGist()
      .then(({ books, tags }) => {
        setBooks(books);
        setTags(tags);
        setLoading(false);
      })
      .catch((e: Error) => {
        setLoadError(e.message);
        setLoading(false);
      });
  }, []);

  const persist = useCallback(
    async (newBooks: Book[], newTags: TagSections) => {
      if (!token) return;
      setSaving(true);
      try {
        await writeGist({ books: newBooks, tags: newTags }, token);
        setBooks(newBooks);
        setTags(newTags);
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
    await persist(newBooks, tags);
    setModal(null);
    setEditBook(null);
  };

  const deleteBook = async (id: number) => {
    if (!confirm("Delete this book?")) return;
    await persist(
      books.filter((b) => b.id !== id),
      tags,
    );
    setModal(null);
    setEditBook(null);
  };

  const saveTags = async (newTags: TagSections) => {
    await persist(books, newTags);
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

    if (selectedTags.length > 0) {
      b = b.filter((book) =>
        selectedTags.every((tag) => book.tags.includes(tag)),
      );
    }

    const parse = (d: string) => {
      const [month, day, year] = d.split("/");
      return new Date(
        2000 + Number(year),
        Number(month) - 1,
        Number(day),
      ).getTime();
    };

    if (sort === "recent") {
      b = [...b].sort((a, z) => {
        if (!a.endDate && !z.endDate) return 0;
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;

        return parse(z.endDate) - parse(a.endDate);
      });
    }
    if (sort === "rating-down") {
      b = [...b].sort((a, z) => {
        const ratingDiff = z.rating - a.rating;
        if (ratingDiff !== 0) return ratingDiff;
        if (!a.endDate && !z.endDate) return 0;
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;
        return parse(z.endDate) - parse(a.endDate);
      });
    }
    if (sort === "rating-up") {
      b = [...b].sort((a, z) => {
        const ratingDiff = a.rating - z.rating;
        if (ratingDiff !== 0) return ratingDiff;
        if (!a.endDate && !z.endDate) return 0;
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;
        return parse(z.endDate) - parse(a.endDate);
      });
    }
    return b;
  }, [books, search, sort, selectedTags]);

  const avgRating = filtered.length
    ? (filtered.reduce((a, b) => a + b.rating, 0) / filtered.length).toFixed(2)
    : "-";

  return (
    <div className="min-h-screen bg-reef-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
        {/* Header */}
        <div className="pt-8 mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3 sm:gap-5">
            <img
              src={mawile}
              alt="reef icon"
              className="w-14 h-14 object-contain"
            />

            <div
              className="text-[52px] leading-none tracking-widest text-reef-red"
              style={{ fontFamily: "'Jersey 15', sans-serif" }}
            >
              reef.
            </div>
            <div className="text-[12px] text-black hidden sm:block">
              goodreads redo
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
                className="px-3 py-1.5 rounded-md bg-reef-red text-[12px] text-reef-cream cursor-pointer hover:bg-reef-blue"
              >
                LOG OUT
              </button>
            ) : (
              <button
                onClick={() => setModal("login")}
                className="px-3 py-1.5 rounded-md bg-reef-red text-[12px] text-reef-cream cursor-pointer hover:bg-reef-blue"
              >
                LOG IN
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-5 items-start">
          {/* Sidebar */}
          <div className="w-full sm:w-38 shrink-0">
            <div className="rounded-xl border border-reef-red p-3.5">
              <div className="hidden sm:block font-bold text-[13px] text-black mb-2">
                pages
              </div>
              <div className="flex flex-row gap-3 sm:flex-col sm:gap-0 pl-3 text-xs">
                <div className="text-reef-red">└ books</div>
                <div className="black">└ stats</div>
                {isAdmin && (
                  <button
                    onClick={() => setModal("settings")}
                    className="block text-left text-black hover:text-reef-red cursor-pointer transition-colors"
                  >
                    └ tags
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl overflow-hidden border border-reef-red">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 px-3.5 py-3 border-b border-black items-center">
                <div className="w-full sm:flex-1 relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black text-lg select-none">
                    ⌕
                  </span>
                  <input
                    className="w-full pl-7 pr-2 h-8.5 border border-black text-[12px] outline-none"
                    placeholder="search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex-1 sm:flex-none">
                  <TagFilter
                    tagSections={tags}
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                  />
                </div>

                <SortFilter sort={sort} onChange={setSort} />

                <div className="flex border border-black rounded-md overflow-hidden">
                  {(["card", "list"] as ViewMode[]).map((v, i) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="w-8.5 h-8.5 flex items-center justify-center cursor-pointer transition-colors"
                      style={{
                        background: view === v ? C.red : "transparent",
                        borderRight: i === 0 ? "1px solid black" : "none",
                      }}
                    >
                      {v === "card" ? (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 14 14"
                          fill={view === v ? C.cream : C.default}
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
                          fill={view === v ? C.cream : C.default}
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
                    className="w-8.5 h-8.5 rounded-md bg-reef-red text-reef-cream text-[24px] flex items-center justify-center cursor-pointer hover:bg-reef-blue transition-opacity border-none leading-none"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="h-[calc(100vh-340px)] sm:h-[calc(100vh-220px)] overflow-y-auto bg-reef-cream">
                {loading && (
                  <div className="py-10 text-center text-xs text-black">
                    Loading…
                  </div>
                )}
                {loadError && (
                  <div className="p-6 text-xs text-reef-red">
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
                      tagSections={tags}
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
                      tagSections={tags}
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
            tagSections={tags}
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
        {modal === "settings" && (
          <TagSettings
            customTags={tags}
            onSave={saveTags}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </div>
  );
}
