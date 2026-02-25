'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white relative overflow-hidden">
            <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto text-center py-32 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
                        A workspace for <br />
                        <span className="text-neutral-500">quiet creative work.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Refine your ideas. Share your voice. A minimalist platform designed for long-form thought and deep focus.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button className="h-14 px-10 w-full rounded-full bg-white text-black hover:bg-neutral-200 text-base font-bold transition-all active:scale-95">
                                Start Writing
                            </Button>
                        </Link>
                        <Link href="/feed" className="w-full sm:w-auto">
                            <Button variant="ghost" className="h-14 px-10 w-full rounded-full text-white hover:bg-neutral-900 text-base font-bold border border-neutral-900 transition-all active:scale-95">
                                Explore Feed
                            </Button>
                        </Link>
                    </div>

                </motion.div>
            </main>

            <footer className="py-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-6xl mx-auto w-full px-12">
                <div className="flex items-center gap-4 text-neutral-500 text-sm">
                    <span className="font-bold text-white text-lg tracking-tighter">Rival</span>
                    <span>© {new Date().getFullYear()}</span>
                </div>
                <div className="flex gap-6">
                    <FooterLink label="Privacy" />
                    <FooterLink label="Terms" />
                    <FooterLink label="Twitter" />
                </div>
            </footer>
        </div>
    );
}

function FooterLink({ label }: { label: string }) {
    return (
        <span className="text-neutral-600 text-xs uppercase tracking-widest font-bold hover:text-white cursor-pointer transition-colors">
            {label}
        </span>
    );
}
