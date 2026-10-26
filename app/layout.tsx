import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "KCJ Store",
  description: "Cửa hàng thời trang KCJ",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.classList.toggle("dark",localStorage.getItem("kcj-theme")==="dark")}catch(error){console.error("Không thể tải giao diện đã lưu:",error)}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
