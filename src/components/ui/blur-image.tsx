'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlurImageProps {
    src: string;
    alt?: string;
    className?: string;
    containerClassName?: string;
}

export function BlurImage({ src, alt = "", className, containerClassName }: BlurImageProps) {
    const [isLoading, setLoading] = useState(true);

    return (
        <div className={cn("relative overflow-hidden bg-neutral-900", containerClassName)}>
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-neutral-900"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.img
                src={src}
                alt={alt}
                onLoad={() => setLoading(false)}
                initial={{ filter: 'blur(20px)', scale: 1.1, opacity: 0 }}
                animate={{
                    filter: isLoading ? 'blur(20px)' : 'blur(0px)',
                    scale: isLoading ? 1.1 : 1,
                    opacity: isLoading ? 0 : 1
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                    "w-full h-auto object-cover transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    className
                )}
            />
        </div>
    );
}
