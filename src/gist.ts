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

export async function readBooks(): Promise<Book[]> {
  const res = await fetch(`${API}/gists/${GIST_ID}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`Gist read failed: ${res.status}`);
  const data = await res.json();
  const raw: string | undefined = data.files?.[GIST_FILENAME]?.content;
  if (!raw) return [];
  return JSON.parse(raw) as Book[];
}

export async function writeBooks(books: Book[], token: string): Promise<void> {
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
          content: JSON.stringify(books, null, 2),
        },
      },
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Gist write failed: ${res.status}`);
  }
}
