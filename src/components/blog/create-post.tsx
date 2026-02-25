'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { Loader2, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { IconButton } from '@/components/ui/icon-button';
import { Blog } from '@/lib/types';

const EMOJIS = ['❤️', '🔥', '✨', '🙌', '🚀', '🤔', '👀', '💡', '✍️', '🖤'];

interface CreatePostProps {
    onSuccess?: () => void;
}

export function CreatePost({ onSuccess }: CreatePostProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    const createPostMutation = useMutation({
        mutationFn: (data: Partial<Blog>) => blogApi.createBlog({ ...data, isPublished: true }),
        onSuccess: () => {
            setTitle('');
            setContent('');
            setImageUrl(undefined);
            queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
            setIsPosting(false);
            onSuccess?.();
        },
    });

    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || isPosting) return;
        setIsPosting(true);
        createPostMutation.mutate({
            title: title.trim(),
            content: content.trim(),
            imageUrl
        });
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

    if (!user) return null;

    return (
        <div className="p-4 md:p-6 border-b border-neutral-900">
            <div className="flex gap-3 md:gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-neutral-900 flex-shrink-0 items-center justify-center text-sm font-bold text-neutral-500">
                    {user.email[0].toUpperCase()}
                </div>
                <form onSubmit={handleCreatePost} className="flex-1 flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Post Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        className="bg-transparent border-none text-xl font-bold text-white outline-none placeholder:text-neutral-700"
                    />
                    <textarea
                        placeholder="What's happening?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                        className="w-full bg-transparent border-none text-[17px] text-neutral-200 outline-none resize-none placeholder:text-neutral-700 min-h-[100px] leading-relaxed"
                    />

                    {imageUrl && (
                        <div className="relative mt-2 rounded-2xl overflow-hidden border border-neutral-900">
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
                        <div className="flex items-center gap-1 relative">
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
                        <button
                            type="submit"
                            disabled={!title.trim() || !content.trim() || isPosting}
                            className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold disabled:opacity-50 hover:bg-neutral-200 transition-colors"
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
