import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patorbit | Career Intelligence Platform',
  description: 'The future of career development, powered by AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  );
}
