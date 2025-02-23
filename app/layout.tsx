import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const excalifont = localFont({
    src: '../fonts/Excalifont.woff2',
    variable: '--font-excalifont',
});

export const metadata: Metadata = {
    title: 'Strokeshare',
    description: 'A drawing platform where creativity meets technology.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="icon"
                    href="/icon?<generated>"
                    type="image/<generated>"
                    sizes="<generated>"
                />
                <link
                    rel="apple-touch-icon"
                    href="/apple-icon?<generated>"
                    type="image/<generated>"
                    sizes="<generated>"
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${excalifont.variable} antialiased`}
            >
                <ThemeProvider attribute="class" defaultTheme="system">
                    {children}
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
}
