'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { blogApi } from '@/lib/api';
import { Loader2, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { IconButton } from '@/components/ui/icon-button';
import { motion } from 'framer-motion';
import { calculateReadingTime } from '@/lib/utils';
import { EmojiPicker } from '@/components/ui/emoji-picker';

type ActiveField = 'title' | 'content' | null;

export default function NewBlogPage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeField, setActiveField] = useState<ActiveField>('content');
    const [loading, setLoading] = useState(false);

    // Track cursor position for insertion
    const titleCursorRef = useRef<number>(0);
    const contentCursorRef = useRef<number>(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || loading) return;
        setLoading(true);
        try {
            await blogApi.createBlog({ title, content, imageUrl, isPublished: true });
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImageUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Insert emoji at the current cursor position in the active field
    const insertEmoji = useCallback((emoji: string) => {
        if (activeField === 'title') {
            const pos = titleCursorRef.current;
            const newVal = title.slice(0, pos) + emoji + title.slice(pos);
            setTitle(newVal);
            // Restore cursor after state update
            requestAnimationFrame(() => {
                if (titleRef.current) {
                    titleRef.current.selectionStart = pos + emoji.length;
                    titleRef.current.selectionEnd = pos + emoji.length;
                    titleRef.current.focus();
                }
            });
            titleCursorRef.current = pos + emoji.length;
        } else {
            const pos = contentCursorRef.current;
            const newVal = content.slice(0, pos) + emoji + content.slice(pos);
            setContent(newVal);
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    contentRef.current.selectionStart = pos + emoji.length;
                    contentRef.current.selectionEnd = pos + emoji.length;
                    contentRef.current.focus();
                }
            });
            contentCursorRef.current = pos + emoji.length;
        }
        setShowEmojiPicker(false);
    }, [activeField, title, content]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-6"
        >
            <div className="flex gap-3 md:gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-neutral-900 shrink-0 items-center justify-center text-sm font-bold text-neutral-500">
                    {user?.email?.[0].toUpperCase() || 'R'}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                    {/* Title */}
                    <input
                        ref={titleRef}
                        type="text"
                        placeholder="Blog Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onFocus={() => setActiveField('title')}
                        onSelect={() => { titleCursorRef.current = titleRef.current?.selectionStart ?? 0; }}
                        onKeyUp={() => { titleCursorRef.current = titleRef.current?.selectionStart ?? 0; }}
                        className="w-full bg-transparent border-none text-2xl font-bold text-white outline-none placeholder:text-neutral-700 p-0"
                    />

                    {/* Content */}
                    <textarea
                        ref={contentRef}
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onFocus={() => setActiveField('content')}
                        onSelect={() => { contentCursorRef.current = contentRef.current?.selectionStart ?? 0; }}
                        onKeyUp={() => { contentCursorRef.current = contentRef.current?.selectionStart ?? 0; }}
                        className="w-full bg-transparent border-none text-lg text-neutral-200 outline-none resize-none min-h-[300px] leading-relaxed placeholder:text-neutral-700 p-0"
                    />

                    {/* Image Preview */}
                    {imageUrl && (
                        <div className="relative rounded-2xl overflow-hidden border border-neutral-900 mt-2">
                            <button
                                type="button"
                                onClick={() => setImageUrl(undefined)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                            <img src={imageUrl} alt="Preview" className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                    )}

                    {/* Footer Toolbar */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
                        <div className="flex items-center gap-1">
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <IconButton
                                icon={<ImageIcon className="w-5 h-5" />}
                                onClick={() => fileInputRef.current?.click()}
                            />

                            {/* Emoji Picker trigger */}
                            <div className="relative">
                                <IconButton
                                    icon={<Smile className="w-5 h-5" />}
                                    onClick={() => setShowEmojiPicker(v => !v)}
                                />
                                {showEmojiPicker && (
                                    <EmojiPicker
                                        onSelect={insertEmoji}
                                        onClose={() => setShowEmojiPicker(false)}
                                    />
                                )}
                            </div>

                            {/* Active field hint */}
                            <span className="text-[10px] text-neutral-700 ml-1 font-medium">
                                → {activeField === 'title' ? 'Title' : 'Content'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {content.length > 0 && (
                                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
                                    {calculateReadingTime(content)} MIN READ
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={!title.trim() || !content.trim() || loading}
                                className="bg-white text-black px-8 py-2.5 rounded-full text-sm font-bold disabled:opacity-50 hover:bg-neutral-200 transition-colors flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
