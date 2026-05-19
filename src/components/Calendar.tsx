import { useState, useEffect, useRef } from "react";
import { Book, TagSections } from "../gist";
import { C } from "../colors";
import { tagColor } from "./Tag";
import { toPng } from "html-to-image";

interface Props {
  books: Book[];
  tagSections: TagSections;
  onExportReady?: (fn: () => void) => void;
}

function parseDate(d: string): Date | null {
  if (!d) return null;
  const [month, day, year] = d.split("/");
  return new Date(2000 + Number(year), Number(month) - 1, Number(day));
}

export function Calendar({ books, tagSections, onExportReady }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
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
    link.download = `reef-calendar-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  useEffect(() => {
    onExportReady?.(exportImage);
  }, []);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const sortedBooks = [...books].sort((a, z) => {
    const s1 = a.startDate ? parseDate(a.startDate) : null;
    const s2 = z.startDate ? parseDate(z.startDate) : null;
    if (!s1 && !s2) return 0;
    if (!s1) return 1;
    if (!s2) return -1;
    return s1.getTime() - s2.getTime();
  });

  // Books that overlap this month
  const activeBooks = sortedBooks.filter((b) => {
    const start = b.startDate ? parseDate(b.startDate) : null;
    const end = b.endDate ? parseDate(b.endDate) : null;
    if (!start && !end) return false;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const s = start ?? end!;
    const e = end ?? start!;
    return s <= monthEnd && e >= monthStart;
  });

  // For each book, compute which cells it spans within this month's grid
  type BookBar = {
    book: Book;
    startCell: number;
    endCell: number;
    color: string;
  };

  const bars: BookBar[] = activeBooks.map((b) => {
    const start = b.startDate ? parseDate(b.startDate) : null;
    const end = b.endDate ? parseDate(b.endDate) : null;
    const s = start ?? end!;
    const e = end ?? start!;

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const effectiveStart = s < monthStart ? monthStart : s;
    const effectiveEnd = e > monthEnd ? monthEnd : e;

    const startDay = effectiveStart.getDate();
    const endDay = effectiveEnd.getDate();

    const startCell = firstDay + startDay - 1;
    const endCell = firstDay + endDay - 1;

    return {
      book: b,
      startCell,
      endCell,
      color: tagColor(b.tags[0] ?? "", tagSections),
    };
  });

  const numWeeks = totalCells / 7;

  // Assign vertical lanes per week to avoid overlap
  type WeekBar = BookBar & {
    lane: number;
    weekStartCell: number;
    weekEndCell: number;
  };
  const weekBars: WeekBar[][] = Array.from({ length: numWeeks }, () => []);

  // Assign a stable lane per book across all weeks
  const bookLanes = new Map<number, number>();

  bars.forEach((bar) => {
    const startWeek = Math.floor(bar.startCell / 7);
    const endWeek = Math.floor(bar.endCell / 7);

    let lane = 0;
    while (true) {
      const conflict = Array.from(
        { length: endWeek - startWeek + 1 },
        (_, i) => startWeek + i,
      ).some((w) =>
        weekBars[w].some((b) => {
          if (b.lane !== lane) return false;
          // Only conflict if they actually overlap in columns
          return (
            b.weekStartCell <= Math.min(bar.endCell, w * 7 + 6) &&
            Math.max(bar.startCell, w * 7) <= b.weekEndCell
          );
        }),
      );
      if (!conflict) break;
      lane++;
    }

    bookLanes.set(bar.book.id, lane);

    for (let w = startWeek; w <= endWeek; w++) {
      const weekStart = w * 7;
      const weekEnd = w * 7 + 6;
      const segStart = Math.max(bar.startCell, weekStart);
      const segEnd = Math.min(bar.endCell, weekEnd);

      weekBars[w].push({
        ...bar,
        lane,
        weekStartCell: segStart,
        weekEndCell: segEnd,
      });
    }
  });

  const CELL_HEIGHT = 70;
  const BAR_HEIGHT = 16;
  const BAR_GAP = 3;
  const BAR_BOTTOM_OFFSET = 3;

  const titlesShown = new Set<string>();

  return (
    <div ref={ref} className="p-4 flex flex-col gap-4">
      <div className="p-4">
        <div className="border border-black overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Month nav */}
            <div className="flex items-center justify-between gap-6 px-4 py-3 border-b border-black">
              <button
                onClick={prevMonth}
                className="text-black hover:text-reef-red cursor-pointer text-sm transition-colors"
              >
                ◀
              </button>
              <span
                className="text-[32px] text-reef-red tracking-widest leading-none"
                style={{ fontFamily: "'Jersey 15', sans-serif" }}
              >
                {monthNames[month]}
                <span
                  className="text-[16px] text-reef-default ml-2 tracking-normal"
                  style={{ fontFamily: "'Jersey 15', sans-serif" }}
                >
                  {year}
                </span>
              </span>
              <button
                onClick={nextMonth}
                className="text-black hover:text-reef-red cursor-pointer text-sm transition-colors"
              >
                ▶
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-black">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-black py-1.5 tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto">
              {Array.from({ length: numWeeks }).map((_, weekIdx) => {
                const maxLane = weekBars[weekIdx].reduce(
                  (m, b) => Math.max(m, b.lane),
                  -1,
                );

                const rowHeight = Math.max(
                  CELL_HEIGHT,
                  BAR_BOTTOM_OFFSET +
                    (maxLane + 1) * (BAR_HEIGHT + BAR_GAP) +
                    24,
                );

                return (
                  <div
                    key={weekIdx}
                    className="relative grid grid-cols-7 border-b border-black last:border-b-0"
                    style={{ height: rowHeight }}
                  >
                    {/* Day cells */}
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const cellIdx = weekIdx * 7 + dayIdx;
                      const dayNum = cellIdx - firstDay + 1;
                      const isCurrentMonth =
                        dayNum >= 1 && dayNum <= daysInMonth;
                      const isToday =
                        isCurrentMonth &&
                        dayNum === new Date().getDate() &&
                        month === new Date().getMonth() &&
                        year === new Date().getFullYear();

                      return (
                        <div
                          key={dayIdx}
                          className={`pl-2 border-black ${
                            dayIdx !== 6 ? "border-r" : ""
                          } ${!isCurrentMonth ? "bg-reef-grey" : ""}`}
                        >
                          {isCurrentMonth && (
                            <span
                              className={`text-[10px] font-mono mt-1 ${isToday ? "bg-reef-red text-reef-cream rounded-full w-5 h-5 flex items-center justify-center" : "text-black"}`}
                            >
                              {dayNum}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Bars */}

                    {weekBars[weekIdx].map((wb, i) => {
                      const colStart = wb.weekStartCell % 7;
                      const colEnd = wb.weekEndCell % 7;
                      const left = `calc(${(colStart / 7) * 100}% + 4px)`;
                      const right = `calc(${((6 - colEnd) / 7) * 100}% + 4px)`;
                      const bottom =
                        BAR_BOTTOM_OFFSET + wb.lane * (BAR_HEIGHT + BAR_GAP);
                      const spanCols = colEnd - colStart;
                      const showTitle =
                        !titlesShown.has(wb.book.title) && spanCols >= 1;
                      if (showTitle) titlesShown.add(wb.book.title);

                      return (
                        <div
                          key={i}
                          title={wb.book.title}
                          className="absolute flex items-center overflow-hidden cursor-default"
                          style={{
                            left,
                            right,
                            bottom,
                            height: BAR_HEIGHT,
                            background: wb.color,
                            borderRadius: 10,
                          }}
                        >
                          {showTitle && (
                            <span className="text-reef-cream text-[10px] tracking-wider px-2 pt-px truncate uppercase">
                              {wb.book.title}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
