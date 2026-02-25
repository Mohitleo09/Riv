'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { blogApi } from '@/lib/api';
import { Loader2, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { IconButton } from '@/components/ui/icon-button';

const EMOJIS = ['❤️', '🔥', '✨', '🙌', '🚀', '🤔', '👀', '💡', '✍️', '🖤'];

import { motion } from 'framer-motion';
import { calculateReadingTime } from '@/lib/utils';

export default function NewBlogPage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(false);

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
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addEmoji = (emoji: string) => {
        setContent(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

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
                    <input
                        type="text"
                        placeholder="Blog Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-transparent border-none text-2xl font-bold text-white outline-none placeholder:text-neutral-700 p-0"
                    />

                    <textarea
                        placeholder="What's happening?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full bg-transparent border-none text-lg text-neutral-200 outline-none resize-none min-h-[300px] leading-relaxed placeholder:text-neutral-700 p-0"
                    />

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
                            <div className="relative">
                                <IconButton
                                    icon={<Smile className="w-5 h-5" />}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                />
                                {showEmojiPicker && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-3 flex flex-wrap gap-2 w-48 z-50 shadow-2xl">
                                        {EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => addEmoji(emoji)}
                                                className="text-xl hover:scale-125 transition-transform p-1.5"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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


