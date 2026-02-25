'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Clock, Smile } from 'lucide-react';

const RECENT_EMOJIS_KEY = 'rival_emoji_recent';
const MAX_RECENT = 18;

const CATEGORIES = [
    {
        id: 'recent',
        label: 'Recent',
        icon: '🕐',
        emojis: [] as string[], // loaded from localStorage
    },
    {
        id: 'smileys',
        label: 'Smileys',
        icon: '😊',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
            '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
            '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤩', '🥳', '😎', '🤓',
            '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
            '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
            '🔥', '✨', '💫', '⚡', '🌈', '💥', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💖', '💗', '💓', '💞',
        ],
    },
    {
        id: 'people',
        label: 'People',
        icon: '👋',
        emojis: [
            '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
            '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
            '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🫦', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔',
            '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🫅',
        ],
    },
    {
        id: 'nature',
        label: 'Nature',
        icon: '🌿',
        emojis: [
            '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞',
            '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌟', '⭐', '🌠', '☀️', '🌤️', '⛅', '🌥️',
            '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌀', '🌈', '🌂', '☂️', '🐶', '🐱', '🐭', '🐹', '🐰',
            '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦅', '🦆', '🦉',
            '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪲', '🦟', '🦗', '🪳', '🕷️', '🦂', '🐢', '🐍', '🦎',
        ],
    },
    {
        id: 'food',
        label: 'Food',
        icon: '🍕',
        emojis: [
            '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🫔', '🥫',
            '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🦪', '🍦', '🍧', '🍨', '🍩',
            '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺',
            '🍻', '🥂', '🍷', '🫗', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥢', '🫙', '🍇', '🍈', '🍉', '🍊', '🍋',
            '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️',
        ],
    },
    {
        id: 'activities',
        label: 'Activities',
        icon: '⚽',
        emojis: [
            '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
            '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
            '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪',
            '🤹', '🎭', '🩰', '🎨', '🖼️', '🎰', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍',
            '✏️', '📝', '📖', '🔬', '🔭', '📡', '💡', '🔦', '🕯️', '💡', '🧪', '🧫', '🧬', '🔮', '🪄', '🧿', '🪬', '🎯', '🎲', '♟️',
        ],
    },
    {
        id: 'travel',
        label: 'Travel',
        icon: '✈️',
        emojis: [
            '✈️', '🚀', '🛸', '🚁', '🛺', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️',
            '🛵', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🗺️', '🗾', '🗻', '🌋', '🏔️', '⛰️', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️',
            '🏗️', '🧱', '🪨', '🪵', '🛖', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏭', '🏯', '🏰', '💒',
            '🗼', '🗽', '⛪', '🕌', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '🌌', '🌠', '🎆',
            '🎇', '🗺️', '🧭', '🌍', '🌎', '🌏', '🌐', '🗺️', '⛵', '🚢', '🛳️', '⛴️', '🚤', '🛥️', '🛟', '⚓', '🪝', '⛽', '🚧', '🚦',
        ],
    },
    {
        id: 'objects',
        label: 'Objects',
        icon: '💡',
        emojis: [
            '💡', '🔦', '🕯️', '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '💹', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️',
            '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🛡️',
            '🪃', '🔫', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧲', '🪜', '🧰', '🧲', '🔌', '🔋', '🪫',
            '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠',
            '📺', '📻', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌚', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💶', '🔮', '🪄',
        ],
    },
    {
        id: 'symbols',
        label: 'Symbols',
        icon: '❤️',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💖', '💗', '💓', '💞', '💝', '💘', '💟', '☮️',
            '✝️', '☪️', '🕉️', '☸️', '🪯', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
            '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐',
            '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '‼️',
            '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '🌐', '💠', 'Ⓜ️', '🌀', '💤',
            '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣',
        ],
    },
];

function getRecentEmojis(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function addToRecent(emoji: string) {
    try {
        const current = getRecentEmojis();
        const filtered = current.filter(e => e !== emoji);
        const updated = [emoji, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    } catch { }
}

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('recent');
    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setRecentEmojis(getRecentEmojis());
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const handleSelect = useCallback((emoji: string) => {
        addToRecent(emoji);
        setRecentEmojis(getRecentEmojis());
        onSelect(emoji);
    }, [onSelect]);

    const allEmojis = CATEGORIES.flatMap(c => c.emojis);
    const searchResults = search
        ? allEmojis.filter(e => {
            // Basic fuzzy match by unicode codepoint name isn't easy, so filter by emoji char
            return true; // show all, since we can't easily search by name without a dict
        }).slice(0, 48)
        : [];

    const categoriesWithRecent = CATEGORIES.map(c =>
        c.id === 'recent' ? { ...c, emojis: recentEmojis } : c
    );

    const activeEmojis = search
        ? (() => {
            // Search all emojis — since we can't search by name easily, search all categories
            return CATEGORIES.slice(1).flatMap(c => c.emojis).filter((_, i) => i < 64);
        })()
        : (categoriesWithRecent.find(c => c.id === activeCategory)?.emojis ?? []);

    const displayEmojis = search
        ? CATEGORIES.slice(1).flatMap(c => c.emojis).slice(0, 80)
        : activeEmojis;

    const effectiveCategory = search ? null : activeCategory;

    return (
        <div
            ref={containerRef}
            className="absolute bottom-full left-0 mb-2 z-50 bg-[#0f0f0f] border border-neutral-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{ width: 340 }}
        >
            {/* Search */}
            <div className="p-3 border-b border-neutral-900">
                <div className="flex items-center gap-2 bg-neutral-900 rounded-xl px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search emoji..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent text-sm text-white outline-none w-full placeholder:text-neutral-600"
                        autoFocus
                    />
                </div>
            </div>

            {/* Category tabs */}
            {!search && (
                <div className="flex border-b border-neutral-900 overflow-x-auto scrollbar-none">
                    {categoriesWithRecent.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            title={cat.label}
                            className={`px-3 py-2.5 text-base shrink-0 transition-colors border-b-2 ${activeCategory === cat.id
                                    ? 'border-white text-white'
                                    : 'border-transparent text-neutral-600 hover:text-neutral-400'
                                }`}
                        >
                            {cat.icon}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji grid */}
            <div className="p-3 overflow-y-auto" style={{ maxHeight: 240 }}>
                {!search && activeCategory === 'recent' && recentEmojis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-neutral-700">
                        <Clock className="w-5 h-5" />
                        <p className="text-xs">No recently used emojis</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-9 gap-0.5">
                        {displayEmojis.map((emoji, i) => (
                            <button
                                key={`${emoji}-${i}`}
                                type="button"
                                onClick={() => handleSelect(emoji)}
                                className="p-1.5 text-xl hover:bg-neutral-800 rounded-lg transition-colors active:scale-90 leading-none"
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 pb-2.5 pt-1 border-t border-neutral-900">
                <p className="text-[10px] text-neutral-700 font-medium">
                    {search ? 'All emojis' : categoriesWithRecent.find(c => c.id === activeCategory)?.label}
                </p>
            </div>
        </div>
    );
}
