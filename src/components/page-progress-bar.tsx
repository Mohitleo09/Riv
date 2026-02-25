'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 150); // Sharp, minimal delay for maximum perceived speed

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
            <div className="h-full bg-white animate-fast-progress shadow-[0_0_12px_rgba(255,255,255,0.7)]"></div>
            <style jsx>{`
                @keyframes fast-progress {
                    0% { width: 0%; opacity: 1; }
                    20% { width: 30%; }
                    50% { width: 85%; }
                    100% { width: 100%; opacity: 0; }
                }
                .animate-fast-progress {
                    animation: fast-progress 0.2s cubic-bezier(.41,.12,.23,.98) forwards;
                }
            `}</style>
        </div>
    );
}
