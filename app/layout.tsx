import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mandarines',
  description: 'Learn Mandarin Chinese — HSK 1 through HSK 4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mandarines_theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
