import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SA RIPPER | SUDDEN ATTACK SERVICE",
  description: "SA RIPPER - 서든어택 전문 서비스 안내 및 문의",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}