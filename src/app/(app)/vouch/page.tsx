// src/app/(app)/vouch/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function VouchPage() {
    const searchParams = useSearchParams();
    const userIdToVouch = searchParams.get('userId');
    const [isVouching, setIsVouching] = useState(false);

    // In a real app, you would fetch the user's details to display them
    const userToVouchName = "User " + userIdToVouch?.substring(0, 6);

    const handleVouch = async () => {
        setIsVouching(true);
        try {
            // Simulate API call to vouch for the user
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(`You have successfully vouched for ${userToVouchName}!`);
        } catch (error) {
            toast.error("Failed to vouch for user.");
        } finally {
            setIsVouching(false);
        }
    };

    if (!userIdToVouch) {
        return (
            <div className="text-center">
                <p>Invalid vouch link. User ID is missing.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Vouch for a Peer</CardTitle>
                    <CardDescription>
                        You have been asked to vouch for the identity of another Metric user.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Do you know and trust <span className="font-bold">{userToVouchName}</span>?</p>
                    <Button onClick={handleVouch} disabled={isVouching} className="w-full">
                        {isVouching ? "Submitting..." : `Yes, I Vouch for ${userToVouchName}`}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}