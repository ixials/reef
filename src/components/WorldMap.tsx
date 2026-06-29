import { useEffect, useRef, useState } from "react";
import { Book, TagSections } from "../gist";
import { C } from "../colors";
import { tagColor } from "./Tag";
import { toPng } from "html-to-image";
import * as d3 from "d3";
import type { FeatureCollection } from "geojson";

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

const COUNTRY_NAMES: Record<string, string> = {
  AE: "United Arab Emirates",
  AF: "Afghanistan",
  AG: "Antigua and Barbuda",
  AL: "Albania",
  AM: "Armenia",
  AO: "Angola",
  AQ: "Antarctica",
  AR: "Argentina",
  AT: "Austria",
  AU: "Australia",
  AZ: "Azerbaijan",
  BA: "Bosnia and Herzegovina",
  BB: "Barbados",
  BD: "Bangladesh",
  BE: "Belgium",
  BF: "Burkina Faso",
  BG: "Bulgaria",
  BH: "Bahrain",
  BI: "Burundi",
  BJ: "Benin",
  BN: "Brunei",
  BO: "Bolivia",
  BR: "Brazil",
  BS: "Bahamas",
  BT: "Bhutan",
  BW: "Botswana",
  BY: "Belarus",
  BZ: "Belize",
  CA: "Canada",
  CD: "Democratic Republic of the Congo",
  CF: "Central African Republic",
  CG: "Republic of Congo",
  CH: "Switzerland",
  CI: "Côte d'Ivoire",
  CL: "Chile",
  CM: "Cameroon",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DE: "Germany",
  DJ: "Djibouti",
  DK: "Denmark",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  EH: "Western Sahara",
  ER: "Eritrea",
  ES: "Spain",
  ET: "Ethiopia",
  FI: "Finland",
  FJ: "Fiji",
  FK: "Falkland Islands",
  FR: "France",
  GA: "Gabon",
  GB: "United Kingdom",
  GD: "Grenada",
  GE: "Georgia",
  GH: "Ghana",
  GL: "Greenland",
  GM: "The Gambia",
  GN: "Guinea",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GT: "Guatemala",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HN: "Honduras",
  HR: "Croatia",
  HT: "Haiti",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IQ: "Iraq",
  IR: "Iran",
  IS: "Iceland",
  IT: "Italy",
  JM: "Jamaica",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KG: "Kyrgyzstan",
  KH: "Cambodia",
  KM: "Comoros",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KZ: "Kazakhstan",
  LA: "Laos",
  LB: "Lebanon",
  LK: "Sri Lanka",
  LR: "Liberia",
  LS: "Lesotho",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MD: "Moldova",
  ME: "Montenegro",
  MG: "Madagascar",
  MK: "Macedonia",
  ML: "Mali",
  MM: "Myanmar",
  MN: "Mongolia",
  MT: "Malta",
  MR: "Mauritania",
  MU: "Mauritius",
  MV: "Maldives",
  MW: "Malawi",
  MX: "Mexico",
  MY: "Malaysia",
  MZ: "Mozambique",
  NA: "Namibia",
  NE: "Niger",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PG: "Papua New Guinea",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PS: "Palestine",
  PT: "Portugal",
  PY: "Paraguay",
  QA: "Qatar",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SB: "Solomon Islands",
  SC: "Seychelles",
  SD: "Sudan",
  SE: "Sweden",
  SI: "Slovenia",
  SK: "Slovakia",
  SL: "Sierra Leone",
  SN: "Senegal",
  SO: "Somalia",
  SR: "Suriname",
  SS: "South Sudan",
  SV: "El Salvador",
  SY: "Syria",
  SZ: "Swaziland",
  TD: "Chad",
  TG: "Togo",
  TH: "Thailand",
  TJ: "Tajikistan",
  TL: "Timor-Leste",
  TM: "Turkmenistan",
  TN: "Tunisia",
  TR: "Turkey",
  TT: "Trinidad and Tobago",
  "CN-TW": "Taiwan",
  TZ: "Tanzania",
  UA: "Ukraine",
  UG: "Uganda",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VE: "Venezuela",
  VN: "Vietnam",
  VU: "Vanuatu",
  WS: "Samoa",
  XK: "Kosovo",
  YE: "Yemen",
  ZA: "South Africa",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

const MONTH_NAMES = [
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

const NAME_TO_CODE: Record<string, string> = {};
Object.entries(COUNTRY_NAMES).forEach(([code, name]) => {
  NAME_TO_CODE[name.toLowerCase()] = code;
});

export function WorldMap({ books, tagSections, period, onExportReady }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    code: string;
    books?: Book[];
  } | null>(null);

  const exportImage = async () => {
    if (!ref.current) return;
    await new Promise((r) => setTimeout(r, 50));
    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: C.cream,
    });
    const link = document.createElement("a");
    link.download = `reef-worldmap-${new Date().toISOString().slice(0, 10)}.png`;
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

  // Country -> ISO2 -> { color, books }
  const countryData: Record<string, { color: string; books: Book[] }> = {};

  filteredBooks.forEach((book) => {
    book.tags.forEach((tag) => {
      const tagLower = tag.toLowerCase().trim();

      const code =
        NAME_TO_CODE[tagLower] ??
        (COUNTRY_NAMES[tag.toUpperCase()] ? tag.toUpperCase() : null);

      if (!code) return;

      if (!countryData[code]) {
        countryData[code] = {
          color: tagColor(book.tags[0] ?? "", tagSections),
          books: [],
        };
      }

      countryData[code].books.push(book);
    });
  });

  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Draw map with D3
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    let isTouching = false;

    const width = svgRef.current.clientWidth || 800;
    const height = Math.round(width * 0.6);
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 4.8)
      .translate([width / 2 - 12, height / 2]);

    const pathGen = d3.geoPath().projection(projection);

    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
    )
      .then((r) => r.json())
      .then((geo: FeatureCollection) => {
        svg
          .selectAll("path")
          .data(geo.features)
          .enter()
          .append("path")
          .attr("d", (f) => pathGen(f) ?? "")
          .attr("stroke", C.cream)
          .attr("stroke-width", "0")
          .attr("fill", (f) => {
            const p = f.properties as Record<string, string>;
            const iso = p.ISO_A2 === "-99" ? p.ISO_A2_EH : p.ISO_A2;
            return countryData[iso]?.color ?? C.default;
          })
          .style("cursor", (f) => {
            const p = f.properties as Record<string, string>;
            const iso = p.ISO_A2 === "-99" ? p.ISO_A2_EH : p.ISO_A2;
            return countryData[iso] ? "pointer" : "default";
          })
          .on("mouseenter", function (event: MouseEvent, f) {
            if (isTouching) return;
            const p = f.properties as Record<string, string>;
            const iso = p.ISO_A2 === "-99" ? p.ISO_A2_EH : p.ISO_A2;
            if (!iso || iso === "-99") return;
            const data = countryData[iso];
            if (data) {
              const k = d3.zoomTransform(svgRef.current!).k;
              d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 1 / k);
            }
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              code: iso,
              books: data?.books,
            });
          })
          .on("mousemove", function (event: MouseEvent) {
            if (isTouching) return;
            setTooltip((prev) =>
              prev
                ? {
                    ...prev,
                    x: event.clientX,
                    y: event.clientY,
                  }
                : null,
            );
          })
          .on("mouseleave", function () {
            if (isTouching) return;
            d3.select(this).attr("stroke", "none");
            setTooltip(null);
          })
          .on("touchstart", (event: TouchEvent, f) => {
            isTouching = true;
            event.preventDefault();

            const p = f.properties as Record<string, string>;
            const iso = p.ISO_A2 === "-99" ? p.ISO_A2_EH : p.ISO_A2;
            if (!iso || iso === "-99") return;
            const data = countryData[iso];
            const touch = event.touches[0];
            setTooltip({
              x: touch.clientX,
              y: touch.clientY,
              code: iso,
              books: data?.books,
            });
          })
          .on("touchend", () => {
            setTimeout(() => {
              isTouching = false;
            }, 300);
          });

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 40])
          .on("zoom", (event) => {
            svg.selectAll("path").attr("transform", event.transform);
          });

        svg.call(zoom);
        zoomRef.current = zoom;
      });
  }, [books, tagSections, period]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1 / 2);
  };

  const handleZoomReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={ref} className="p-4 flex flex-col gap-4">
      <div className="border border-black p-4">
        <div className="flex items-center justify-center mb-3">
          <span
            className="text-center text-[28px] text-reef-red tracking-widest"
            style={{ fontFamily: "'Jersey 15', sans-serif" }}
          >
            world map
          </span>
          <span
            className="text-[16px] text-reef-default ml-2 tracking-normal"
            style={{ fontFamily: "'Jersey 15', sans-serif" }}
          >
            {period === "all"
              ? "all time"
              : period === "year"
                ? year
                : period === "this-month"
                  ? MONTH_NAMES[month]
                  : MONTH_NAMES[month - 1]}
          </span>
        </div>

        <div className="border border-black relative overflow-hidden">
          <svg ref={svgRef} className="w-full block" />

          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            {[
              ["+", handleZoomIn],
              ["-", handleZoomOut],
              ["⊙", handleZoomReset],
            ].map(([label, fn]) => (
              <button
                key={label as string}
                onClick={fn as () => void}
                className="w-7 h-7 border border-black bg-reef-cream text-black text-[14px] flex items-center justify-center hover:bg-reef-red hover:text-reef-cream transition-colors cursor-pointer"
              >
                {label as string}
              </button>
            ))}
          </div>

          {tooltip && (
            <div
              className="absolute pointer-events-none border border-black bg-reef-cream px-3 py-2"
              style={{
                position: "fixed",
                left: tooltip.x,
                top: tooltip.y - 40,
                maxWidth: 220,
                transform:
                  tooltip.x > window.innerWidth * 0.7
                    ? "translateX(calc(-100% - 20px))"
                    : "translateX(20px)",
              }}
            >
              <div className="text-reef-red text-[12px] lowercase">
                {COUNTRY_NAMES[tooltip.code] ?? tooltip.code}
              </div>

              {(tooltip.books?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {(tooltip.books ?? []).map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 inline-block mt-1"
                        style={{
                          background: tagColor(b.tags[0] ?? "", tagSections),
                        }}
                      />

                      <span className="text-[12px]">{b.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
