import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { readGist, writeGist, Book, TagSections } from "./gist";
import { C } from "./colors";
import { useTheme } from "./theme";
import { BookModal } from "./components/BookModal";
import { BookCard, BookRow } from "./components/BookCard";
import { LoginModal } from "./components/LoginModal";
import { TagFilter } from "./components/TagFilter";
import { SortFilter } from "./components/SortFilter";
import { PeriodFilter } from "./components/PeriodFilter";
import { TagModal } from "./components/TagModal";
import { Calendar } from "./components/Calendar";
import { StatsView } from "./components/StatsView";
import { WorldMap } from "./components/WorldMap";

type PageMode = "books" | "stats" | "calendar" | "map";
import mawile from "./assets/mawile.png";

const AUTH_KEY = "reef_token";

type ViewMode = "card" | "list";
type ModalMode = "add" | "edit" | "login" | "tags" | null;
type SortMode = "recent" | "rating-down" | "rating-up" | "review";
type StatsPeriod = "all" | "year" | "this-month" | "last-month";
type BookFormData = Omit<Book, "id">;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { theme, toggle } = useTheme();
  const [page, setPage] = useState<PageMode>("books");
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<TagSections>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("this-month");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const exportFnRef = useRef<(() => void) | null>(null);

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

    const sortByAdded = (a: Book, z: Book) => z.id - a.id;

    if (sort === "recent") {
      b = [...b].sort((a, z) => {
        if (!a.endDate && !z.endDate) return sortByAdded(a, z);
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;

        const dateDiff = parse(z.endDate) - parse(a.endDate);
        return dateDiff !== 0 ? dateDiff : sortByAdded(a, z);
      });
    }
    if (sort === "rating-down") {
      b = [...b].sort((a, z) => {
        const ratingDiff = z.rating - a.rating;
        if (ratingDiff !== 0) return ratingDiff;

        if (!a.endDate && !z.endDate) return sortByAdded(a, z);
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;

        const dateDiff = parse(z.endDate) - parse(a.endDate);
        return dateDiff !== 0 ? dateDiff : sortByAdded(a, z);
      });
    }
    if (sort === "rating-up") {
      b = [...b].sort((a, z) => {
        const ratingDiff = a.rating - z.rating;
        if (ratingDiff !== 0) return ratingDiff;

        if (!a.endDate && !z.endDate) return sortByAdded(a, z);
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;

        const dateDiff = parse(z.endDate) - parse(a.endDate);
        return dateDiff !== 0 ? dateDiff : sortByAdded(a, z);
      });
    }
    if (sort === "review") {
      b = [...b].sort((a, z) => {
        const aHas = a.notes ? 1 : 0;
        const zHas = z.notes ? 1 : 0;

        if (zHas !== aHas) return zHas - aHas;

        if (!a.endDate && !z.endDate) return sortByAdded(a, z);
        if (!a.endDate) return 1;
        if (!z.endDate) return -1;

        const dateDiff = parse(z.endDate) - parse(a.endDate);
        return dateDiff !== 0 ? dateDiff : sortByAdded(a, z);
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
        <div className="pt-4 sm:pt-8 mb-2 sm:mb-4 flex items-start justify-between">
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
              reef
            </div>
            <div className="text-[12px] text-reef-black hidden sm:block">
              goodreads redo
              <br />
              bc i wanted
              <br />
              half stars
            </div>
          </div>
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-md bg-reef-red text-[12px] text-reef-cream cursor-pointer hover:bg-reef-blue"
          >
            {theme === "dark" ? "☀ LIGHT" : "☾ DARK"}
          </button>
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

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-5 items-start w-full">
          {/* Sidebar */}
          <div className="w-full sm:w-38 shrink-0">
            <div className="rounded-xl border border-reef-red p-3.5">
              <div className="hidden sm:block font-bold text-[13px] text-reef-black mb-2">
                pages
              </div>
              <div className="flex flex-row gap-3 sm:flex-col sm:gap-0 pl-3 text-xs">
                <button
                  onClick={() => setPage("books")}
                  className={`block text-left cursor-pointer transition-colors ${page === "books" ? "text-reef-red" : "text-reef-black hover:text-reef-red"}`}
                >
                  └ books
                </button>
                <button
                  onClick={() => setPage("stats")}
                  className={`block text-left cursor-pointer transition-colors ${page === "stats" ? "text-reef-red" : "text-reef-black hover:text-reef-red"}`}
                >
                  └ stats
                </button>
                <button
                  onClick={() => setPage("calendar")}
                  className={`block text-left cursor-pointer transition-colors ${page === "calendar" ? "text-reef-red" : "text-reef-black hover:text-reef-red"}`}
                >
                  └ calendar
                </button>
                <button
                  onClick={() => setPage("map")}
                  className={`block text-left cursor-pointer transition-colors ${page === "map" ? "text-reef-red" : "text-reef-black hover:text-reef-red"}`}
                >
                  └ map
                </button>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0 w-full">
            <div className="rounded-xl overflow-hidden border border-reef-red">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 px-3.5 py-3 border-b border-reef-black items-center">
                <div className="relative w-full sm:flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-reef-black text-lg select-none">
                    ⌕
                  </span>
                  <input
                    className="w-full pl-7 pr-2 h-8.5 border border-reef-black text-[12px] text-reef-black outline-none"
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
                    isAdmin={isAdmin}
                    onOpenTags={() => setModal("tags")}
                  />
                </div>

                {page === "books" && (
                  <SortFilter sort={sort} onChange={setSort} />
                )}

                {page === "stats" && (
                  <PeriodFilter
                    period={statsPeriod}
                    onChange={setStatsPeriod}
                  />
                )}

                {page === "map" && (
                  <PeriodFilter
                    period={statsPeriod}
                    onChange={setStatsPeriod}
                  />
                )}

                <div className="flex border border-reef-black rounded-md overflow-hidden">
                  {(["card", "list"] as ViewMode[]).map((v, i) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="w-8.5 h-8.5 flex items-center justify-center cursor-pointer transition-colors"
                      style={{
                        background: view === v ? C.red : "transparent",
                        borderRight:
                          i === 0
                            ? "1px solid var(--color-reef-black)"
                            : "none",
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

                {page === "stats" || page === "calendar" || page === "map" ? (
                  <button
                    onClick={() => exportFnRef.current?.()}
                    className="w-8.5 h-8.5 rounded-md bg-reef-red text-reef-cream flex items-center justify-center cursor-pointer hover:bg-reef-blue transition-opacity border-none"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <line
                        x1="7"
                        y1="0"
                        x2="7"
                        y2="9"
                        stroke={C.cream}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M3 7 L7 11.5 L11 7"
                        stroke={C.cream}
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="1"
                        y1="13"
                        x2="13"
                        y2="13"
                        stroke={C.cream}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : (
                  isAdmin && (
                    <button
                      onClick={() => {
                        setEditBook(null);
                        setModal("add");
                      }}
                      className="w-8.5 h-8.5 rounded-md bg-reef-red text-reef-cream text-[24px] flex items-center justify-center cursor-pointer hover:bg-reef-blue transition-opacity border-none leading-none"
                    >
                      +
                    </button>
                  )
                )}
              </div>

              {/* Content */}
              <div className="h-[calc(100dvh-300px)] sm:h-[calc(100dvh-220px)] overflow-y-auto bg-reef-cream">
                {page === "stats" && (
                  <StatsView
                    books={filtered}
                    tagSections={tags}
                    period={statsPeriod}
                    onExportReady={(fn) => {
                      exportFnRef.current = fn;
                    }}
                  />
                )}
                {page === "calendar" && (
                  <Calendar
                    books={filtered}
                    tagSections={tags}
                    onExportReady={(fn) => {
                      exportFnRef.current = fn;
                    }}
                  />
                )}
                {page === "map" && (
                  <WorldMap
                    books={filtered}
                    tagSections={tags}
                    period={statsPeriod}
                    onExportReady={(fn) => {
                      exportFnRef.current = fn;
                    }}
                  />
                )}
                {page === "books" && (
                  <>
                    {loading && (
                      <div className="py-10 text-center text-xs text-reef-black">
                        Loading…
                      </div>
                    )}
                    {loadError && (
                      <div className="p-6 text-xs text-reef-red">
                        Failed to load: {loadError}
                        <br />
                        <span className="text-reef-black">
                          Check GIST_ID in src/gist.ts
                        </span>
                      </div>
                    )}
                    {!loading && !loadError && filtered.length === 0 && (
                      <div className="py-10 text-center text-xs text-reef-black">
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
                      ))}{" "}
                  </>
                )}
              </div>
            </div>

            <div className="mt-2.5 text-[11px] text-reef-black flex justify-between">
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
        {modal === "tags" && (
          <TagModal
            customTags={tags}
            onSave={saveTags}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </div>
  );
}
