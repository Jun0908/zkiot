import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";
import dynamic from "next/dynamic";

// dynamic import のまま
const Provider = dynamic(() => import("./providers/ClientProvider"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "zk-IOT",
  description: "zk-IOT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">{/* ← ダーク固定（next-themes未使用ならこれでOK） */}
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <div className="flex min-h-[100dvh] flex-col">
          <Provider>
            {/* ヘッダー：白直書きをやめてトークン参照へ */}
            <header className="sticky top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur" />

            {/* トースト */}
            <Toaster />

            {/* コンテンツ：固定フッターと重ならないよう下余白を確保 */}
            <main className="container mx-auto max-w-screen-md flex-1 px-5 pb-24">
              {children}
            </main>

         
          </Provider>
        </div>
      </body>
    </html>
  );
}




