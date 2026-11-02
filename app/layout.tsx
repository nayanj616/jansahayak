import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: '--font-noto-devanagari',
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JanSahayak | Integrated Civic Assistance Platform — Gwalior',
  description:
    'Academic demonstration project for integrated municipal sanitation grievance redressal, field worker coordination, and government scheme discovery for Gwalior, Madhya Pradesh.',
  keywords: [
    'JanSahayak',
    'Gwalior',
    'Madhya Pradesh',
    'Swachh Gwalior',
    'Civic Assistance',
    'Municipal Corporation',
    'Government Schemes',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50/50 text-slate-900">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
