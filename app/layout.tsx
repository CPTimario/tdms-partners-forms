import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';

import './globals.css';
import PrivacyWidget from '@/components/GlobalPrivacy/PrivacyWidget';
import EmotionRegistry from '@/components/mui/EmotionRegistry';
import MuiProviders from '@/components/mui/MuiProviders';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isThemeMode, THEME_STORAGE_KEY } from '@/lib/theme';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TDMS Partners Forms',
  description: 'Ten Days Missions Support Partners Forms',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_STORAGE_KEY)?.value;
  const initialTheme = isThemeMode(themeCookie) ? themeCookie : undefined;

  return (
    <html lang="en" data-theme={initialTheme}>
      <head>
        <meta name="emotion-insertion-point" content="emotion-insertion-point" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <EmotionRegistry>
          {/* predictable portal root for MUI/portaled components (Snackbar, dialogs, popovers) */}
          <div id="mui-portal-root" />
          <MuiProviders initialTheme={initialTheme as 'light' | 'dark' | undefined}>
            {children}
            <ThemeToggle />
            <PrivacyWidget />
          </MuiProviders>
        </EmotionRegistry>
      </body>
    </html>
  );
}
