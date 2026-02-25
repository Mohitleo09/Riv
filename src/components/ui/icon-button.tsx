'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    danger?: boolean;
}

export function IconButton({ icon, className, danger = false, ...props }: IconButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "p-2 rounded-full transition-colors",
                danger
                    ? "text-neutral-500 hover:text-red-500 hover:bg-red-500/10"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900",
                className
            )}
            {...props}
        >
            {icon}
        </button>
    );
}
