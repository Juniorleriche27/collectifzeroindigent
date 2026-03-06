import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

export const marketingDisplayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-marketing-display",
  weight: ["500", "700", "800"],
});

export const marketingBodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-marketing-body",
  weight: ["400", "500", "600", "700"],
});

