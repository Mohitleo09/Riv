'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const { user, register, loading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(email, password);
        } catch (err: any) {
            const msg = err.response?.data?.message;
            setError(Array.isArray(msg) ? msg[0] : (msg || 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tighter mb-2">Sign up</h1>
                    <p className="text-neutral-500 font-medium">Join our minimalist community.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-600 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-neutral-950 border border-neutral-900 rounded-2xl py-4 px-5 outline-none focus:border-white transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-600 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full bg-neutral-950 border border-neutral-900 rounded-2xl py-4 px-5 outline-none focus:border-white transition-all text-sm font-medium"
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wide px-1">{error}</p>}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-full bg-white text-black font-bold text-base hover:bg-neutral-200 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-sm text-neutral-600 font-medium tracking-tight">
                        Already have an account? <Link href="/login" className="text-white font-bold hover:underline ml-1">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
