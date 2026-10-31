import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BlogBackground } from "@/components/blog-background";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonte do "blog" do hero. Regular 400 de verdade: sem negrito sintético,
// o que manteria a palavra borrada e pesada ao crescer.
const playfair = localFont({
  src: "./fonts/PlayfairDisplay-Regular.ttf",
  variable: "--font-playfair",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Blog",
    template: "%s · Blog",
  },
  description: "Posts sobre desenvolvimento e tecnologia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        {/* Roda antes do resto do body: evita abrir claro e piscar escuro.
            localStorage manda; sem escolha salva, segue o sistema. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var salvo=localStorage.getItem("tema");var sistema=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=salvo||(sistema?"dark":"light")}catch(e){}})()`,
          }}
        />

        <BlogBackground />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
