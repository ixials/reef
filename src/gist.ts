// ─── CONFIGURE THESE ───────────────────────────────────────────────────────
export const GIST_ID = "9b179e0a89447fc1af7d9fbe75b792cc";
export const GIST_FILENAME = "books.json";
// ────────────────────────────────────────────────────────────────────────────

const API = "https://api.github.com";

export interface Book {
  id: number;
  title: string;
  author: string;
  rating: number;
  startDate: string;
  endDate: string;
  tags: string[];
  notes: string;
}

export type TagSections = Record<string, Record<string, string>>;

export interface GistData {
  books: Book[];
  tags: TagSections;
}
function parseGist(raw: string): GistData {
  const parsed = JSON.parse(raw);
  // handle legacy format: bare array of books
  if (Array.isArray(parsed)) {
    return { books: parsed, tags: {} };
  }
  return parsed as GistData;
}

export async function readGist(): Promise<GistData> {
  const res = await fetch(`${API}/gists/${GIST_ID}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`Gist read failed: ${res.status}`);
  const data = await res.json();
  const raw: string | undefined = data.files?.[GIST_FILENAME]?.content;
  if (!raw) return { books: [], tags: {} };
  return parseGist(raw);
}

export async function writeGist(
  gistData: GistData,
  token: string,
): Promise<void> {
  const res = await fetch(`${API}/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(gistData, null, 2),
        },
      },
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Gist write failed: ${res.status}`);
  }
}

// ─── Legacy compat exports ──────────────────────────────────────────────────
// Keep these so nothing else breaks while you migrate
export async function readBooks(): Promise<Book[]> {
  return (await readGist()).books;
}
