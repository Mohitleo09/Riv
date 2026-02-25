import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import Navbar from '@/components/navbar';
import PageProgressBar from '@/components/page-progress-bar';
import PageTransition from '@/components/page-transition';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Rival — Where great ideas find their voice',
    description: 'A minimalist space for writers and creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <Providers>
                    <Suspense fallback={null}>
                        <PageProgressBar />
                    </Suspense>
                    <Navbar />
                    <PageTransition>
                        <main className="min-h-screen">
                            {children}
                        </main>
                    </PageTransition>
                </Providers>
            </body>
        </html>
    );
}
