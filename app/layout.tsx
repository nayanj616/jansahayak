import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-900">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
