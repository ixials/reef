import { useEffect, useRef } from "react";
import { Book, TagSections } from "../gist";
import { C } from "../colors";
import { tagColor } from "./Tag";
import { toPng } from "html-to-image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface Props {
  books: Book[];
  tagSections: TagSections;
  period: "all" | "year" | "this-month" | "last-month";
  onExportReady?: (fn: () => void) => void;
}

function parseDate(d: string): Date | null {
  if (!d) return null;
  const [month, day, year] = d.split("/");
  return new Date(2000 + Number(year), Number(month) - 1, Number(day));
}

const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export function StatsView({
  books,
  tagSections,
  period,
  onExportReady,
}: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const ref = useRef<HTMLDivElement>(null);

  const exportImage = async () => {
    if (!ref.current) return;

    await new Promise((r) => setTimeout(r, 50)); // Let render settle
    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: C.cream,
    });

    const link = document.createElement("a");
    link.download = `reef-stats-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  useEffect(() => {
    onExportReady?.(exportImage);
  }, []);

  const filteredBooks = books.filter((b) => {
    if (period === "all") return true;
    const d = parseDate(b.endDate);
    if (!d) return false;
    if (period === "year") return d.getFullYear() === now.getFullYear();
    if (period === "this-month")
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    if (period === "last-month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        d.getFullYear() === lastMonth.getFullYear() &&
        d.getMonth() === lastMonth.getMonth()
      );
    }
    return true;
  });

  // ── Books by month ────────────────────────────────────────────────────────
  const countsByMonth: Record<string, number> = {};

  if (period === "this-month" || period === "year") {
    for (let m = 0; m <= now.getMonth(); m++) {
      countsByMonth[`${now.getFullYear()}-${String(m).padStart(2, "0")}`] = 0;
    }

    books.forEach((b) => {
      const d = parseDate(b.endDate);
      if (!d) return;
      if (d.getFullYear() !== now.getFullYear()) return;
      if (d.getMonth() > now.getMonth()) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      countsByMonth[key] = (countsByMonth[key] ?? 0) + 1;
    });
  } else if (period === "last-month") {
    for (let m = 0; m < now.getMonth(); m++) {
      countsByMonth[`${now.getFullYear()}-${String(m).padStart(2, "0")}`] = 0;
    }

    books.forEach((b) => {
      const d = parseDate(b.endDate);
      if (!d) return;
      if (d.getFullYear() !== now.getFullYear()) return;
      if (d.getMonth() >= now.getMonth()) return; // >= instead of >
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      countsByMonth[key] = (countsByMonth[key] ?? 0) + 1;
    });
  } else {
    for (let m = 0; m < 12; m++) {
      countsByMonth[m] = 0;
    }

    books.forEach((b) => {
      const d = parseDate(b.endDate);
      if (!d) return;
      const key = d.getMonth();
      countsByMonth[key] = (countsByMonth[key] ?? 0) + 1;
    });
  }

  const monthData = Object.entries(countsByMonth)
    .sort(([a], [b]) => {
      const getMonthIndex = (key: string) =>
        key.includes("-") ? Number(key.split("-")[1]) : Number(key);

      return getMonthIndex(a) - getMonthIndex(b);
    })
    .map(([key, count]) => {
      let monthIndex: number;

      if (key.includes("-")) {
        const [, m] = key.split("-");
        monthIndex = Number(m);
      } else {
        monthIndex = Number(key);
      }

      return { month: MONTH_NAMES[monthIndex], count };
    });

  // ── Tag breakdown ───────────────────────────────────────────────────────
  const tagCounts: Record<string, number> = {};

  filteredBooks.forEach((b) => {
    const tag = b.tags[0];
    if (tag) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
  });

  const total = filteredBooks.length || 1;
  const tagEntries = Object.entries(tagCounts).sort(([, a], [, b]) => b - a);
  const topEight = tagEntries.slice(0, 8);
  const rest = tagEntries.slice(8);
  const otherCount = rest.reduce((sum, [, count]) => sum + count, 0);

  const allEntries =
    otherCount > 0 ? [...topEight, ["other", otherCount]] : topEight;

  const tagData = allEntries.map(([tag, count]) => ({
    name: tag,
    value: Number(count),
    pct: Math.round((Number(count) / total) * 100),
    color: tag === "other" ? C.default : tagColor(String(tag), tagSections),
  }));

  const PieToolTip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { color: string } }[];
  }) => {
    if (!active || !payload?.length) return null;
    const {
      name,
      value,
      payload: { color },
    } = payload[0];
    return (
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 12,
          border: "1px solid var(--color-reef-black)",
          background: C.cream,
          padding: "14px 10px",
        }}
      >
        <div style={{ color, marginBottom: 4 }}>{name}</div>
        <div style={{ color: C.black }}>count : {value}</div>
      </div>
    );
  };

  // ── Ratings histogram ─────────────────────────────────────────────────────
  const ratingBuckets: Record<string, number> = {};
  [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach((r) => {
    ratingBuckets[r] = 0;
  });
  filteredBooks.forEach((b) => {
    if (b.rating) ratingBuckets[b.rating] = (ratingBuckets[b.rating] ?? 0) + 1;
  });
  const ratingData = Object.entries(ratingBuckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([r, count]) => ({ rating: r, count }));

  // ── Summary stats ─────────────────────────────────────────────────────────
  const booksRead = filteredBooks.length;
  const durations = filteredBooks
    .map((b) => {
      const s = parseDate(b.startDate);
      const e = parseDate(b.endDate);
      if (!s || !e) return null;
      return Math.round((e.getTime() - s.getTime()) / 86400000);
    })
    .filter((d): d is number => d !== null && d >= 0);
  const avgDays = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const tickStyle = { fontFamily: "monospace", fontSize: 10, fill: C.black };

  return (
    <div ref={ref} className="p-4 flex flex-col gap-4">
      {/* Books by month */}
      <div className="border border-reef-black p-4">
        <div className="flex items-center justify-center border-reef-black">
          <div
            className="text-center text-[28px] text-reef-red tracking-widest"
            style={{ fontFamily: "'Jersey 15', sans-serif" }}
          >
            books by month
          </div>
          <span
            className="text-[16px] text-reef-default ml-2 tracking-normal"
            style={{ fontFamily: "'Jersey 15', sans-serif" }}
          >
            {period === "all" ? "all time" : year}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={monthData}
            margin={{ top: 6, right: 12, bottom: 6, left: -32 }}
          >
            <CartesianGrid stroke={C.grey} />
            <XAxis dataKey="month" tick={tickStyle} />
            <YAxis tick={tickStyle} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                fontFamily: "monospace",
                fontSize: 12,
                border: "1px solid var(--color-reef-black)",
                borderRadius: 0,
                background: C.cream,
              }}
              labelStyle={{ color: C.red }}
              itemStyle={{ color: C.black }}
              cursor={{ stroke: C.blue, strokeWidth: 2 }}
            />
            <Line
              type="linear"
              dataKey="count"
              stroke={C.red}
              strokeWidth={2}
              dot={{ fill: C.red, r: 4, strokeWidth: 0 }}
              activeDot={{
                r: 4,
                fill: C.blue,
                strokeWidth: 0,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tag pie */}
      <div className="border border-reef-black p-4">
        <div
          className="text-center text-[28px] text-reef-red mb-3 tracking-widest"
          style={{ fontFamily: "'Jersey 15', sans-serif" }}
        >
          tags
        </div>{" "}
        {filteredBooks.length === 0 ? (
          <div
            className="flex items-center justify-center h-50 pb-6 text-xs text-reef-black"
            style={{ fontFamily: "monospace" }}
          >
            No books yet.
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <PieChart width={200} height={200}>
              <Pie
                data={tagData}
                cx={95}
                cy={95}
                innerRadius={0}
                outerRadius={90}
                dataKey="value"
                stroke="none"
              >
                {tagData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieToolTip />} />
            </PieChart>
            <div className="flex flex-col gap-1.5">
              {tagData.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 inline-block"
                    style={{ background: g.color }}
                  />
                  <span
                    className="text-[12px] text-reef-black"
                    style={{ fontFamily: "monospace" }}
                  >
                    {g.name}
                  </span>
                  <span
                    className="text-[10px] text-reef-default"
                    style={{ fontFamily: "monospace" }}
                  >
                    {g.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary + Ratings */}
      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        {/* Summary stats */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="border border-reef-black p-4 flex flex-col items-start">
            <div
              className="text-[64px] text-reef-red leading-none tracking-widest"
              style={{ fontFamily: "'Jersey 15', sans-serif" }}
            >
              {booksRead}
            </div>
            <div
              className="text-[12px] text-reef-black mt-1"
              style={{ fontFamily: "monospace" }}
            >
              books read
            </div>
          </div>

          <div className="border border-reef-black p-4 flex flex-col items-start">
            <div className="flex items-center justify-between border-reef-black">
              <div
                className="text-[48px] text-reef-red leading-none tracking-widest"
                style={{ fontFamily: "'Jersey 15', sans-serif" }}
              >
                {avgDays ?? "--"}
              </div>
              <span
                className="text-[16px] text-reef-default ml-2 tracking-normal"
                style={{ fontFamily: "'Jersey 15', sans-serif" }}
              >
                days
              </span>
            </div>
            <div
              className="text-[12px] text-reef-black mt-1"
              style={{ fontFamily: "monospace" }}
            >
              average time
              <br />
              to finish
            </div>
          </div>
        </div>

        {/* Ratings histogram */}
        <div className="border border-reef-black p-4 flex-1 min-w-0">
          <div
            className="text-center text-[28px] text-reef-red mb-3 tracking-widest"
            style={{ fontFamily: "'Jersey 15', sans-serif" }}
          >
            ratings
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={ratingData}
              margin={{ top: 4, right: 8, bottom: 6, left: -40 }}
            >
              <CartesianGrid stroke={C.grey} vertical={false} />
              <XAxis dataKey="rating" tick={tickStyle} />

              <YAxis tick={tickStyle} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  border: "1px solid var(--color-reef-black)",
                  borderRadius: 0,
                  background: C.cream,
                }}
                labelStyle={{ color: C.red }}
                itemStyle={{ color: C.black }}
                cursor={{ fill: "transparent" }}
              />
              <Bar
                dataKey="count"
                fill={C.red}
                radius={[2, 2, 0, 0]}
                activeBar={{ fill: C.blue }}
              >
                {ratingData.map((_, i) => (
                  <Cell key={i} fill={C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
