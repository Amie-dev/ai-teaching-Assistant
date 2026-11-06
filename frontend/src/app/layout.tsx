import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Teaching Assistant - Agentic RAG Tutor',
  description: 'An Agentic RAG System for Course-Grounded Socratic Tutoring (B.Tech CSE Sem 7)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}

