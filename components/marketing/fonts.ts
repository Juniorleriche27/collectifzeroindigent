import { Syne, Fraunces, DM_Sans } from "next/font/google";

/** Display / UI labels — Syne */
export const marketingDisplayFont = Syne({
  subsets: ["latin"],
  variable: "--font-marketing-display",
  weight: ["400", "600", "700", "800"],
});

/** Serif editorial titles — Fraunces (variable font) */
export const marketingSerifFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-marketing-serif",
  style: ["normal", "italic"],
  axes: ["SOFT"],
});

/** Body copy — DM Sans */
export const marketingBodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-marketing-body",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});
