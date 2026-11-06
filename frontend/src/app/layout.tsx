import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Teaching Assistant - Agentic RAG Tutor',
  description: 'An Agentic RAG System for Course-Grounded Socratic Tutoring (B.Tech CSE Sem 7)',
};

export const viewport: Viewport = {
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
