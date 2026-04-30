export const COLORS = ["#4A90D9", "#E84832", "#E7E4DE", "#D8D6D0", "#ABA8A3"];

export const TAG_SECTIONS: Record<string, Record<string, string>> = {
  meta: {
    fav: "#E84832",
  },
  format: {
    nonfiction: "#4A90D9",
    anthology: "#B883D5",
    poetry: "#66B681",
    memoir: "#A7D379",
    essay: "#A8B7E9",
    play: "#EB714C",
    "graphic novel": "#DDC54C",
  },
  genre: {
    contemporary: "#82AFEB",
    horror: "#8E89C7",
    gothic: "#92394F",
    mystery: "#A9C0CA",
    fantasy: "#E97AAF",
    historical: "#C13046",
    dystopia: "#70809A",
    apocalypse: "#92C371",
    philosophy: "#535353",
    "sci fi": "#5BB8C4",
    "magical realism": "#5BC19A",
    "coming of age": "#84BEC7",
  },
  theme: {
    language: "#EBAE4C",
    ecological: "#54A688",
    oceanic: "#5C73D7",
    feminism: "#F3A0C1",
    queer: "#C6AFE7",
  },
  language: {
    esp: "#F49C59",
    "pt-br": "#77cb93",
  },
};

export const TAG_PALETTE: Record<string, string> = Object.values(
  TAG_SECTIONS,
).reduce((acc, section) => ({ ...acc, ...section }), {});
