'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Clock } from 'lucide-react';

// ─── Recent emoji storage ─────────────────────────────────────────────────────
const RECENT_KEY = 'rival_emoji_recent';
const MAX_RECENT = 16;

function getRecent(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(emoji: string) {
    try {
        const list = [emoji, ...getRecent().filter(e => e !== emoji)].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch { /* noop */ }
}

// ─── Full emoji dataset with searchable keywords ──────────────────────────────
// Each entry: [emoji, ...search keywords]
const EMOJI_DATA: [string, ...string[]][] = [
    // Smileys & Emotion
    ['😀', 'grinning', 'happy', 'smile', 'face'],
    ['😃', 'big eyes', 'happy', 'smile'],
    ['😄', 'grin', 'happy', 'laugh'],
    ['😁', 'beaming', 'happy', 'grin'],
    ['😆', 'laughing', 'happy', 'haha'],
    ['😅', 'sweat smile', 'nervous', 'laugh'],
    ['🤣', 'rofl', 'laugh', 'rolling floor'],
    ['😂', 'joy', 'laugh', 'cry', 'tears', 'lol'],
    ['🙂', 'slightly smiling', 'smile'],
    ['🙃', 'upside down', 'silly'],
    ['😉', 'wink', 'flirty'],
    ['😊', 'blush', 'happy', 'smile', 'warm'],
    ['😇', 'angel', 'halo', 'innocent'],
    ['🥰', 'hearts', 'love', 'adore', 'affection'],
    ['😍', 'heart eyes', 'love', 'amazing'],
    ['🤩', 'star struck', 'excited', 'wow'],
    ['😘', 'kiss', 'love', 'heart'],
    ['😗', 'kiss', 'lips'],
    ['😚', 'kiss', 'love'],
    ['😙', 'kiss', 'smile'],
    ['😋', 'yum', 'hungry', 'food', 'delicious'],
    ['😛', 'tongue', 'silly', 'playful'],
    ['😜', 'wink tongue', 'silly', 'crazy'],
    ['🤪', 'crazy', 'silly', 'weird'],
    ['🤑', 'money', 'rich', 'cash', 'dollar'],
    ['🤗', 'hugs', 'hug', 'warm', 'love'],
    ['🤭', 'oops', 'secret', 'giggle'],
    ['🤫', 'shh', 'quiet', 'secret', 'hush'],
    ['🤔', 'thinking', 'hmm', 'ponder', 'question'],
    ['😐', 'neutral', 'meh', 'blank'],
    ['😑', 'expressionless', 'blank', 'dead'],
    ['😶', 'no mouth', 'silent', 'speechless'],
    ['😏', 'smirk', 'sly', 'confident'],
    ['😒', 'unamused', 'bored', 'side eye'],
    ['🙄', 'eye roll', 'annoyed', 'whatever'],
    ['😬', 'grimace', 'nervous', 'awkward'],
    ['😔', 'pensive', 'sad', 'down'],
    ['😪', 'sleepy', 'tired', 'yawn'],
    ['🤤', 'drool', 'hungry', 'food'],
    ['😴', 'sleeping', 'sleep', 'tired', 'zzz'],
    ['😷', 'mask', 'sick', 'covid', 'ill'],
    ['🤒', 'sick', 'ill', 'thermometer', 'fever'],
    ['🤕', 'hurt', 'injured', 'bandage'],
    ['🤢', 'nausea', 'sick', 'green', 'disgusted'],
    ['🤮', 'vomit', 'sick', 'gross'],
    ['🤧', 'sneeze', 'sick', 'allergy'],
    ['🥵', 'hot', 'fire', 'sweat'],
    ['🥶', 'cold', 'freeze', 'ice'],
    ['😵', 'dizzy', 'dead', 'cross eyes'],
    ['🤯', 'mind blown', 'shocked', 'explode'],
    ['😎', 'cool', 'sunglasses', 'awesome'],
    ['🤓', 'nerd', 'geek', 'glasses'],
    ['🧐', 'monocle', 'curious', 'fancy'],
    ['😕', 'confused', 'worried'],
    ['😟', 'worried', 'sad', 'anxious'],
    ['🙁', 'frown', 'unhappy', 'sad'],
    ['😮', 'surprised', 'open mouth', 'wow'],
    ['😲', 'astonished', 'shocked', 'wow'],
    ['😳', 'flushed', 'embarrassed', 'blushing'],
    ['🥺', 'pleading', 'puppy eyes', 'cute', 'begging'],
    ['😦', 'frown', 'worried', 'open mouth'],
    ['😧', 'anguished', 'distress'],
    ['😨', 'fear', 'scared', 'worried'],
    ['😰', 'cold sweat', 'anxious', 'stressed'],
    ['😥', 'sad', 'disappointed', 'tear'],
    ['😢', 'cry', 'sad', 'tear'],
    ['😭', 'sob', 'cry', 'tears', 'wailing'],
    ['😱', 'scream', 'shocked', 'fear', 'horror'],
    ['😤', 'steam', 'angry', 'frustrated'],
    ['😡', 'angry', 'mad', 'red', 'rage'],
    ['😠', 'angry', 'mad'],
    ['🤬', 'swearing', 'angry', 'cursing'],
    ['😈', 'devil', 'evil', 'smirk'],
    ['👿', 'devil', 'angry', 'evil'],
    ['💀', 'skull', 'dead', 'death', 'danger'],
    ['☠️', 'skull crossbones', 'pirate', 'death'],
    ['💩', 'poop', 'funny', 'silly'],
    ['🤡', 'clown', 'funny', 'joker'],
    ['👹', 'ogre', 'monster'],
    ['👺', 'goblin', 'red', 'demon'],
    ['👻', 'ghost', 'halloween', 'spooky'],
    ['👽', 'alien', 'ufo', 'extraterrestrial'],
    ['👾', 'alien monster', 'game', 'pixel'],
    ['🔥', 'fire', 'hot', 'lit', 'flame', 'trending'],
    ['✨', 'sparkles', 'shine', 'magic', 'special'],
    ['💫', 'dizzy', 'stars', 'magic'],
    ['⚡', 'lightning', 'fast', 'electricity', 'bolt'],
    ['🌈', 'rainbow', 'colorful', 'pride', 'hope'],
    ['💥', 'explosion', 'boom', 'impact', 'crash'],
    // Hearts
    ['❤️', 'red heart', 'love', 'like'],
    ['🧡', 'orange heart', 'love'],
    ['💛', 'yellow heart', 'love', 'happy'],
    ['💚', 'green heart', 'nature', 'love'],
    ['💙', 'blue heart', 'calm', 'love'],
    ['💜', 'purple heart', 'love', 'royalty'],
    ['🖤', 'black heart', 'dark', 'love'],
    ['🤍', 'white heart', 'love', 'pure'],
    ['🤎', 'brown heart', 'earth', 'love'],
    ['💔', 'broken heart', 'sad', 'heartbreak'],
    ['💖', 'sparkling heart', 'love'],
    ['💗', 'pink heart', 'love'],
    ['💓', 'beating heart', 'love'],
    ['💞', 'revolving hearts', 'love'],
    ['💕', 'two hearts', 'love', 'romance'],
    ['💝', 'heart ribbon', 'love', 'gift'],
    ['💘', 'heart arrow', 'love', 'cupid'],
    // Hands & gestures
    ['👋', 'wave', 'hello', 'goodbye', 'hi'],
    ['🤚', 'raised back hand', 'stop'],
    ['✋', 'raised hand', 'stop', 'high five'],
    ['👌', 'ok', 'great', 'perfect', 'chef kiss'],
    ['✌️', 'peace', 'victory', 'two', 'v'],
    ['🤞', 'fingers crossed', 'luck', 'hope'],
    ['🤟', 'i love you', 'rock', 'sign'],
    ['🤘', 'rock on', 'metal', 'cool'],
    ['👈', 'point left', 'direction'],
    ['👉', 'point right', 'direction'],
    ['👆', 'point up', 'above'],
    ['👇', 'point down', 'below'],
    ['☝️', 'index up', 'one'],
    ['👍', 'thumbs up', 'like', 'approve', 'good'],
    ['👎', 'thumbs down', 'dislike', 'bad'],
    ['✊', 'fist', 'power', 'fight'],
    ['👊', 'punch', 'fist'],
    ['👏', 'clap', 'applause', 'congrats'],
    ['🙌', 'celebration', 'hooray', 'raise hands'],
    ['🤝', 'handshake', 'deal', 'agreement'],
    ['🙏', 'pray', 'please', 'thanks', 'namaste', 'folded hands'],
    ['✍️', 'writing', 'pen', 'author', 'blogger'],
    ['💪', 'flex', 'muscle', 'strong', 'power'],
    // People
    ['🧑', 'person'],
    ['👦', 'boy', 'man'],
    ['👧', 'girl', 'woman'],
    ['🧔', 'beard', 'man'],
    ['👨', 'man'],
    ['👩', 'woman'],
    // Nature & Animals
    ['🐶', 'dog', 'puppy', 'woof'],
    ['🐱', 'cat', 'kitten', 'meow'],
    ['🐭', 'mouse', 'rat'],
    ['🐰', 'rabbit', 'bunny', 'easter'],
    ['🦊', 'fox', 'cunning'],
    ['🐻', 'bear'],
    ['🐼', 'panda', 'china'],
    ['🐨', 'koala', 'australia'],
    ['🐯', 'tiger', 'cat'],
    ['🦁', 'lion', 'king', 'roar'],
    ['🐮', 'cow', 'moo'],
    ['🐷', 'pig', 'oink'],
    ['🐸', 'frog', 'green'],
    ['🐵', 'monkey', 'fun', 'silly'],
    ['🐔', 'chicken', 'bird'],
    ['🦅', 'eagle', 'bird', 'freedom'],
    ['🦋', 'butterfly', 'beautiful', 'transform'],
    ['🌱', 'seedling', 'grow', 'plant', 'nature'],
    ['🌿', 'herb', 'green', 'plant'],
    ['🍀', 'clover', 'luck', 'four leaf'],
    ['🌸', 'cherry blossom', 'flower', 'spring', 'japan'],
    ['🌺', 'hibiscus', 'flower', 'tropical'],
    ['🌻', 'sunflower', 'flower', 'yellow'],
    ['🌹', 'rose', 'love', 'flower'],
    ['💐', 'bouquet', 'flowers', 'gift'],
    ['🌙', 'crescent moon', 'night', 'sleep'],
    ['⭐', 'star', 'favorite', 'like'],
    ['🌟', 'glowing star', 'awesome', 'shining'],
    ['☀️', 'sun', 'sunny', 'day', 'bright'],
    ['🌊', 'wave', 'ocean', 'surf', 'water'],
    ['❄️', 'snowflake', 'cold', 'winter', 'ice'],
    // Food
    ['🍕', 'pizza', 'food', 'italian'],
    ['🍔', 'burger', 'hamburger', 'fast food'],
    ['🍟', 'fries', 'fast food'],
    ['🍜', 'noodles', 'ramen', 'soup', 'noodle'],
    ['🍣', 'sushi', 'japanese', 'fish'],
    ['🍩', 'donut', 'sweet', 'breakfast'],
    ['🍪', 'cookie', 'sweet', 'chocolate'],
    ['🎂', 'cake', 'birthday', 'celebrate'],
    ['🍰', 'cake', 'dessert', 'slice'],
    ['🧁', 'cupcake', 'sweet', 'dessert'],
    ['🍫', 'chocolate', 'sweet'],
    ['🍬', 'candy', 'sweet', 'cute'],
    ['🍭', 'lollipop', 'sweet', 'candy'],
    ['🍵', 'tea', 'hot drink', 'green tea'],
    ['☕', 'coffee', 'hot', 'morning', 'cafe'],
    ['🧋', 'bubble tea', 'boba', 'drink'],
    ['🍺', 'beer', 'drink', 'cheers', 'alcohol'],
    ['🍻', 'cheers', 'beer', 'party'],
    ['🥂', 'champagne', 'toast', 'celebrate'],
    ['🍷', 'wine', 'red', 'drink'],
    ['🍇', 'grapes', 'fruit', 'wine'],
    ['🍎', 'apple', 'fruit', 'red'],
    ['🍊', 'orange', 'fruit', 'citrus'],
    ['🍋', 'lemon', 'fruit', 'sour'],
    ['🍌', 'banana', 'fruit', 'yellow'],
    ['🍓', 'strawberry', 'fruit', 'sweet'],
    ['🥑', 'avocado', 'healthy', 'green'],
    // Activities
    ['⚽', 'football', 'soccer', 'sport'],
    ['🏀', 'basketball', 'sport', 'ball'],
    ['🎮', 'video game', 'gaming', 'controller'],
    ['🎯', 'target', 'bullseye', 'goal', 'aim'],
    ['🏆', 'trophy', 'winner', 'champion', 'award'],
    ['🥇', 'gold medal', 'first', 'winner'],
    ['🎨', 'art', 'paint', 'creative', 'design'],
    ['🎭', 'theater', 'drama', 'art'],
    ['🎵', 'music note', 'song', 'music'],
    ['🎶', 'musical notes', 'music', 'song'],
    ['🎤', 'microphone', 'sing', 'performer'],
    ['🎧', 'headphones', 'music', 'listen'],
    ['📚', 'books', 'reading', 'study', 'learn', 'education'],
    ['📖', 'book', 'read', 'story'],
    ['✏️', 'pencil', 'write', 'edit'],
    ['📝', 'memo', 'note', 'write'],
    ['💡', 'lightbulb', 'idea', 'bright', 'innovation'],
    ['🔬', 'microscope', 'science', 'research'],
    ['🔭', 'telescope', 'space', 'astronomy'],
    ['🚀', 'rocket', 'launch', 'space', 'fast'],
    ['✈️', 'airplane', 'travel', 'fly', 'plane'],
    ['🚗', 'car', 'drive', 'travel', 'vehicle'],
    ['🏠', 'house', 'home', 'building'],
    ['🏖️', 'beach', 'vacation', 'summer', 'sun'],
    ['🌍', 'earth', 'globe', 'world', 'international'],
    // Objects
    ['💻', 'laptop', 'computer', 'work', 'tech'],
    ['📱', 'phone', 'mobile', 'smartphone'],
    ['⌨️', 'keyboard', 'type', 'computer'],
    ['📷', 'camera', 'photo', 'picture'],
    ['🎥', 'video camera', 'film', 'movie'],
    ['📡', 'satellite', 'signal', 'communication'],
    ['🔑', 'key', 'access', 'unlock'],
    ['🔒', 'locked', 'secure', 'private'],
    ['💰', 'money bag', 'rich', 'cash', 'wealth'],
    ['💵', 'dollar', 'money', 'cash'],
    ['📈', 'chart up', 'growth', 'profit', 'success'],
    ['📉', 'chart down', 'loss', 'decline'],
    ['📊', 'bar chart', 'analytics', 'data'],
    ['🔔', 'bell', 'notification', 'alert'],
    ['📢', 'announcement', 'loud', 'megaphone'],
    ['⚙️', 'gear', 'settings', 'tool', 'config'],
    ['🛠️', 'tools', 'build', 'fix', 'repair'],
    ['💎', 'diamond', 'gem', 'luxury', 'valuable'],
    ['👑', 'crown', 'king', 'queen', 'royalty'],
    ['🏅', 'medal', 'award', 'achievement'],
    ['🎁', 'gift', 'present', 'surprise'],
    ['🎉', 'party', 'celebrate', 'confetti'],
    ['🎊', 'celebration', 'party', 'confetti'],
    ['🎈', 'balloon', 'party', 'birthday'],
    ['🎀', 'ribbon', 'gift', 'cute'],
    ['🌐', 'globe', 'internet', 'web', 'worldwide'],
    ['📌', 'pin', 'location', 'save', 'mark'],
    ['🔗', 'link', 'chain', 'url', 'connect'],
    ['📎', 'paperclip', 'attach', 'link'],
    // Symbols
    ['❌', 'cross', 'wrong', 'no', 'error', 'x'],
    ['✅', 'check', 'done', 'correct', 'yes', 'complete'],
    ['⚠️', 'warning', 'caution', 'danger'],
    ['🚫', 'prohibited', 'not allowed', 'ban'],
    ['💯', 'hundred', 'perfect', 'score', '100'],
    ['‼️', 'double exclamation', 'important'],
    ['⁉️', 'exclamation question', 'confused'],
    ['🔥', 'fire', 'hot', 'trending'],
    ['💤', 'zzz', 'sleep', 'tired'],
    ['♻️', 'recycle', 'green', 'environment', 'eco'],
    ['✔️', 'check mark', 'done', 'yes'],
    ['➕', 'plus', 'add'],
    ['➖', 'minus', 'remove'],
    ['❓', 'question mark', 'help', 'confused'],
    ['❗', 'exclamation', 'important', 'alert'],
    ['Ⓜ️', 'metro', 'm'],
    ['🆕', 'new', 'fresh'],
    ['🆓', 'free'],
    ['🔝', 'top', 'up'],
    ['⬆️', 'up arrow', 'increase'],
    ['⬇️', 'down arrow', 'decrease'],
    ['➡️', 'right arrow', 'next'],
    ['⬅️', 'left arrow', 'back'],
    ['🔄', 'refresh', 'reload', 'cycle', 'repeat'],
    ['🔃', 'clockwise', 'rotate'],
    ['💠', 'diamond', 'blue'],
    ['🔮', 'crystal ball', 'magic', 'future', 'predict'],
    ['🪄', 'magic wand', 'spell', 'trick'],
    ['🧿', 'eye', 'evil eye', 'protection'],
    ['☮️', 'peace', 'harmony'],
];

// ─── Build search index ────────────────────────────────────────────────────────
interface EmojiEntry { emoji: string; keywords: string[] }
const EMOJI_INDEX: EmojiEntry[] = EMOJI_DATA.map(([emoji, ...keywords]) => ({ emoji, keywords }));

function searchEmojis(query: string): string[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const exact: string[] = [];
    const partial: string[] = [];
    for (const { emoji, keywords } of EMOJI_INDEX) {
        const hasExact = keywords.some(k => k === q);
        const hasPartial = keywords.some(k => k.includes(q));
        if (hasExact) exact.push(emoji);
        else if (hasPartial) partial.push(emoji);
    }
    return [...exact, ...partial].slice(0, 48);
}

// ─── Categories with full emoji sets ─────────────────────────────────────────
const CATEGORIES = [
    {
        id: 'recent', label: 'Recently Used', icon: '🕐',
        emojis: [] as string[],
    },
    {
        id: 'smileys', label: 'Smileys & Emotion', icon: '😊',
        emojis: EMOJI_DATA.filter((_, i) => i < 60).map(d => d[0]),
    },
    {
        id: 'hearts', label: 'Hearts & Love', icon: '❤️',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💖', '💗', '💓', '💞', '💕', '💝', '💘', '🥰', '😍', '😘', '💏', '💑'],
    },
    {
        id: 'hands', label: 'Hands & Gestures', icon: '👋',
        emojis: EMOJI_DATA.filter(d => ['wave', 'wave', 'thumbs up', 'thumbs down', 'clap', 'pray', 'writing', 'flex', 'point', 'fist', 'peace', 'ok'].some(k => d.slice(1).includes(k))).map(d => d[0]),
    },
    {
        id: 'nature', label: 'Nature & Animals', icon: '🌿',
        emojis: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦋', '🌱', '🌿', '🍀', '🌸', '🌺', '🌻', '🌹', '💐', '🌙', '⭐', '🌟', '☀️', '🌊', '❄️', '🔥', '✨', '💫', '⚡', '🌈', '💥'],
    },
    {
        id: 'food', label: 'Food & Drink', icon: '🍕',
        emojis: ['🍕', '🍔', '🍟', '🍜', '🍣', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍵', '☕', '🧋', '🍺', '🍻', '🥂', '🍷', '🍇', '🍎', '🍊', '🍋', '🍌', '🍓', '🥑'],
    },
    {
        id: 'activities', label: 'Activities', icon: '⚽',
        emojis: ['⚽', '🏀', '🎮', '🎯', '🏆', '🥇', '🎨', '🎭', '🎵', '🎶', '🎤', '🎧', '📚', '📖', '✏️', '📝', '💡', '🔬', '🔭', '🚀', '✈️', '🚗', '🏖️'],
    },
    {
        id: 'objects', label: 'Objects', icon: '💻',
        emojis: ['💻', '📱', '⌨️', '📷', '🎥', '📡', '🔑', '🔒', '💰', '💵', '📈', '📉', '📊', '🔔', '📢', '⚙️', '🛠️', '💎', '👑', '🏅', '🎁', '🎉', '🎊', '🎈', '🌐', '📌', '🔗', '💡', '🔮', '🪄'],
    },
    {
        id: 'symbols', label: 'Symbols', icon: '✅',
        emojis: ['❌', '✅', '⚠️', '🚫', '💯', '‼️', '⁉️', '❓', '❗', '♻️', '✔️', '➕', '➖', '⬆️', '⬇️', '➡️', '⬅️', '🔄', '🔥', '💤', '🔝', '🆕', '🆓'],
    },
];

// ─── Component ─────────────────────────────────────────────────────────────────
interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('smileys');
    const [recent, setRecent] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setRecent(getRecent());
        searchRef.current?.focus();
    }, []);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [onClose]);

    const searchResults = useMemo(() => searchEmojis(query), [query]);

    const handleSelect = useCallback((emoji: string) => {
        saveRecent(emoji);
        setRecent(getRecent());
        onSelect(emoji);
    }, [onSelect]);

    const tabsWithRecent = CATEGORIES.map(c =>
        c.id === 'recent' ? { ...c, emojis: recent } : c
    );

    const gridEmojis = query
        ? searchResults
        : (tabsWithRecent.find(c => c.id === activeTab)?.emojis ?? []);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-full left-0 mb-2 z-[100] flex flex-col"
            style={{ width: 352, height: 420 }}
        >
            {/* Glass card */}
            <div className="flex flex-col h-full bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">

                {/* Search bar */}
                <div className="px-3 pt-3 pb-2 shrink-0">
                    <div className="flex items-center gap-2 bg-neutral-800/70 rounded-xl px-3 py-2 border border-neutral-700/40">
                        <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search emoji..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="text-neutral-600 hover:text-white text-xs"
                            >✕</button>
                        )}
                    </div>
                </div>

                {/* Category tabs — hidden when searching */}
                {!query && (
                    <div className="flex items-center gap-0.5 px-2 pb-1 overflow-x-auto scrollbar-none shrink-0">
                        {tabsWithRecent.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                title={cat.label}
                                className={`px-2.5 py-1.5 rounded-lg text-base transition-all shrink-0 ${activeTab === cat.id
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/50'
                                    }`}
                            >
                                {cat.icon}
                            </button>
                        ))}
                    </div>
                )}

                {/* Divider */}
                <div className="h-px bg-neutral-800 shrink-0" />

                {/* Category label */}
                {!query && (
                    <div className="px-3 py-1.5 shrink-0">
                        <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                            {tabsWithRecent.find(c => c.id === activeTab)?.label}
                        </span>
                    </div>
                )}

                {/* Emoji grid — scrollable */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {query && searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 gap-2 text-neutral-700">
                            <span className="text-3xl">🔍</span>
                            <p className="text-xs">No results for "{query}"</p>
                        </div>
                    ) : !query && activeTab === 'recent' && recent.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-700">
                            <Clock className="w-5 h-5" />
                            <p className="text-xs">No recently used emojis yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-8 gap-0">
                            {gridEmojis.map((emoji, i) => (
                                <button
                                    key={`${emoji}-${i}`}
                                    type="button"
                                    onClick={() => handleSelect(emoji)}
                                    title={EMOJI_DATA.find(d => d[0] === emoji)?.[1] ?? emoji}
                                    className="flex items-center justify-center p-1.5 text-2xl rounded-lg hover:bg-neutral-800 active:scale-90 transition-all duration-100 leading-none aspect-square"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-3 py-1.5 border-t border-neutral-800 shrink-0 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-700">
                        {query ? `${searchResults.length} results` : `${gridEmojis.length} emojis`}
                    </span>
                    <span className="text-[10px] text-neutral-700">Click to insert</span>
                </div>
            </div>
        </div>
    );
}
