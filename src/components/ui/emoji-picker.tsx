'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [emojiData, setEmojiData] = useState<any>(null);

    // Lazy-load the emoji dataset (~1MB) only when picker opens
    useEffect(() => {
        import('@emoji-mart/data').then(mod => {
            setEmojiData(mod.default ?? mod);
        });
    }, []);

    // Close on outside click (with small delay so opening click doesn't close immediately)
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handler);
        };
    }, [onClose]);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-full left-0 mb-2 z-[9999]"
            onMouseDown={e => e.stopPropagation()}
        >
            {!emojiData ? (
                // Loading skeleton while emoji dataset downloads
                <div
                    className="bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl shadow-black/80 flex items-center justify-center"
                    style={{ width: 352, height: 420 }}
                >
                    <div className="flex flex-col items-center gap-3 text-neutral-700">
                        <span className="text-4xl animate-pulse">😊</span>
                        <p className="text-xs">Loading emojis…</p>
                    </div>
                </div>
            ) : (
                <Picker
                    data={emojiData}
                    onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
                    theme="dark"
                    set="native"
                    previewPosition="none"
                    skinTonePosition="search"
                    maxFrequentRows={2}
                    perLine={9}
                    emojiSize={22}
                    emojiButtonSize={34}
                    locale="en"
                    style={{
                        '--em-rgb-background': '17, 17, 17',
                        '--em-rgb-accent': '255, 255, 255',
                        '--em-rgb-color': '229, 229, 229',
                        '--em-rgb-input': '30, 30, 30',
                        '--em-color-border': 'rgba(255,255,255,0.06)',
                        '--em-color-shadow': 'rgba(0,0,0,0.6)',
                        '--em-font-size': '13px',
                        '--em-font-family': 'inherit',
                        fontFamily: 'inherit',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                    } as React.CSSProperties}
                />
            )}
        </div>
    );
}
