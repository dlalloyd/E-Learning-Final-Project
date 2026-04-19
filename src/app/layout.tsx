import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GeoMentor — Adaptive E-Learning',
  description: 'IRT-based personalised learning for UK Geography',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b1323] text-[#dbe2f8] min-h-screen gm-grid-bg antialiased">
        {children}
      </body>
    </html>
  );
}