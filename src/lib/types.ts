export interface User {
    id: string;
    email: string;
    role?: 'USER' | 'ADMIN';
}

export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface RegisterCredentials {
    email: string;
    password?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    blogId: string;
    userId: string;
    user: {
        id: string;
        email: string;
    };
    _count: {
        likes: number;
    };
    likedByMe?: boolean;
}

export interface Blog {
    id: string;
    title: string;
    content: string;
    summary?: string;
    slug: string;
    imageUrl?: string;
    isPublished: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        email: string;
    };
    _count: {
        likes: number;
        comments: number;
    };
    likedByMe?: boolean;
}

export interface FeedResponse {
    data: Blog[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
