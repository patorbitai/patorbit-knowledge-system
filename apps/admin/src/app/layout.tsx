import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patorbit Admin | Career Intelligence Platform',
  description: 'Admin panel for the Patorbit platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  );
}
