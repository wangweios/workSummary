import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "多岗位 AI 工作汇报生成器",
  description: "适配岗位和老板人设的本地工作汇报生成器"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
