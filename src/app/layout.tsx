import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

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
    <html lang="en" className={`dark ${jakarta.variable}`}>
      <body className="bg-[#0b1323] text-[#dbe2f8] min-h-screen gm-grid-bg antialiased font-jakarta">
        {children}
      </body>
    </html>
  );
}