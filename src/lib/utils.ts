export function calculateReadingTime(text: string): number {
    const wordsPerMinute = 225; // Average reading speed
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

export function calculateEngagementScore(likes: number, comments: number): number {
    // Basic weightage: Like = 1, Comment = 3
    return (likes * 1) + (comments * 3);
}

export function calculateStreak(dates: string[]): number {
    if (!dates || dates.length === 0) return 0;

    const uniqueDates = Array.from(new Set(dates)).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = today;

    for (const dateStr of uniqueDates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const diffInDays = Math.floor((current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0 || diffInDays === 1) {
            streak++;
            current = date;
        } else {
            break;
        }
    }

    return streak;
}
