import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { copy } from "@/lib/copy";
import { siteOrigin } from "@/lib/seo";
import { SiteHeader, MobileCta, RefCapture } from "@/components/chrome/SiteChrome";
import { Footer } from "@/components/chrome/Footer";
import { CookieBanner } from "@/components/chrome/CookieBanner";
import { MotionRoot } from "@/components/motion/MotionRoot";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
};

const parallaxBoot = `(function(){try{if(!localStorage.getItem("ob_cookie"))document.documentElement.dataset.cookie="open"}catch(e){}function arm(){var root=document.documentElement;var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function tick(){root.style.setProperty("--scroll-y",window.scrollY+"px")}tick();addEventListener("scroll",tick,{passive:true});root.dataset.parallax="on";if(!reduce)root.dataset.motion="on"}if(document.readyState==="complete"){(window.requestIdleCallback||function(cb){setTimeout(cb,1)})(arm)}else{addEventListener("load",function(){(window.requestIdleCallback||function(cb){setTimeout(cb,1)})(arm)})}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: parallaxBoot }} />
        <a className="skip-link btn btn-secondary" href="#main">
          {copy("nav.skip")}
        </a>
        <div className="site-frame">
          <Suspense fallback={null}>
            <RefCapture />
          </Suspense>
          <SiteHeader />
          <main id="main">{children}</main>
          <Footer />
        </div>
        <CookieBanner />
        <MobileCta />
        <MotionRoot />
        <Analytics />
      </body>
    </html>
  );
}
