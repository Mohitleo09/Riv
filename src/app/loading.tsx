export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="space-y-8 animate-pulse">
                {/* Content placeholders */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 border-b border-neutral-900 pb-8 last:border-0 pt-8 first:pt-0">
                        {/* Avatar placeholder */}
                        <div className="w-12 h-12 rounded-full bg-neutral-900 flex-shrink-0"></div>
                        <div className="flex-1 space-y-4 pt-1">
                            <div className="flex items-center gap-2">
                                <div className="h-4 bg-neutral-900 rounded w-24"></div>
                                <div className="h-4 bg-neutral-900 rounded w-16 opacity-50"></div>
                            </div>
                            <div className="h-7 bg-neutral-900 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-neutral-900 rounded w-full"></div>
                                <div className="h-4 bg-neutral-900 rounded w-full"></div>
                                <div className="h-4 bg-neutral-900 rounded w-2/3"></div>
                            </div>

                            <div className="flex justify-between pt-6 max-w-sm">
                                <div className="h-5 bg-neutral-900 rounded w-16"></div>
                                <div className="h-5 bg-neutral-900 rounded w-16"></div>
                                <div className="h-5 bg-neutral-900 rounded w-12"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
