'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();

    return (
        <nav className="h-16 flex items-center justify-between px-4 md:px-6 bg-black sticky top-0 z-50 border-b border-neutral-900">
            {/* Left: Brand */}
            <div className="flex-1 shrink-0">
                <Link href="/" className="text-xl font-bold tracking-tight transition-colors hover:text-neutral-400">Rival</Link>
            </div>

            {/* Center: Main Navigation */}
            <div className="flex items-center justify-center gap-4 md:gap-8">
                <Link
                    href="/feed"
                    className={cn("text-[10px] md:text-xs uppercase tracking-widest font-bold transition-colors", pathname === '/feed' ? "text-white" : "text-neutral-500 hover:text-white")}
                >
                    Feed
                </Link>
                {user && (
                    <Link
                        href="/dashboard"
                        className={cn("text-[10px] md:text-xs uppercase tracking-widest font-bold transition-colors", pathname.startsWith('/dashboard') ? "text-white" : "text-neutral-500 hover:text-white")}
                    >
                        Dashboard
                    </Link>
                )}
            </div>

            {/* Right: Auth/Profile */}
            <div className="flex-1 flex items-center justify-end gap-3 md:gap-6">
                {loading ? (
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-12 md:w-16 bg-neutral-900" />
                        <Skeleton className="h-8 w-8 md:h-8 md:w-16 bg-neutral-900 rounded-full" />
                    </div>
                ) : user ? (
                    <>
                        <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-neutral-800">
                            <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                {user.email[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-neutral-400 truncate max-w-[80px]">
                                {user.email.split('@')[0]}
                            </span>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="text-[10px] md:text-xs uppercase tracking-widest font-bold bg-white text-black px-4 md:px-5 py-2 rounded-full hover:bg-neutral-200 transition-colors">Join</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
