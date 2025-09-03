// src/app/(app)/vouch/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useSession } from 'next-auth/react';

export default function VouchPage() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const userIdToVouch = searchParams.get('userId');
    const [isVouching, setIsVouching] = useState(false);

    // In a real app, you would fetch the user's details to display them
    const userToVouchName = "User " + userIdToVouch?.substring(0, 6);

    const handleVouch = async () => {
        if (status !== 'authenticated') {
            toast.error("Please sign in to vouch for a user.");
            return;
        }
        setIsVouching(true);
        try {
            const response = await fetch('/api/user/vouch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIdToVouch }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to vouch for user.");
            }
            
            toast.success("Vouch successful!", {
                description: data.message,
            });

        } catch (error: any) {
            toast.error("Vouching Failed", { description: error.message });
        } finally {
            setIsVouching(false);
        }
    };

    if (!userIdToVouch) {
        return (
            <div className="text-center p-8">
                <p>Invalid vouch link. User ID is missing.</p>
            </div>
        );
    }
    
    if (status === 'loading') {
        return <div className="p-8">Loading session...</div>
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
             <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(600px_260px_at_10%_10%,rgba(16,185,129,.08),transparent_40%),radial-gradient(700px_300px_at_90%_80%,rgba(99,102,241,.06),transparent_45%)]" />
            <Card className="w-full max-w-md text-center border-white/10 bg-white/[0.02]">
                <CardHeader>
                    <CardTitle className="text-white/80">Vouch for a Peer</CardTitle>
                    <CardDescription className="text-white/60">
                        You have been asked to vouch for the identity of another Metric user.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-white/80">Do you know and trust <span className="font-bold text-white">{userToVouchName}</span>?</p>
                    <Button 
                        onClick={handleVouch} 
                        disabled={isVouching || status !== 'authenticated'} 
                        className="w-full bg-white text-black hover:bg-white/90"
                    >
                        {isVouching ? "Submitting..." : `Yes, I Vouch for ${userToVouchName}`}
                    </Button>
                    {status !== 'authenticated' && <p className="text-xs text-yellow-400">You must be signed in to vouch.</p>}
                </CardContent>
            </Card>
        </div>
    );
}