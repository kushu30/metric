"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SelectRolePage() {
  const router = useRouter();
  const { update } = useSession(); // Get the update function from the session hook
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set role.");
      }
      
      // Manually trigger a session update to fetch the new role
      await update({ role: selectedRole });

      toast.success("Welcome to Metric!", {
        description: "Your role has been set and your insurance contribution has been made.",
      });

      if (selectedRole === 'lender') {
        router.push('/lender-dashboard');
      } else {
        router.push('/dashboard');
      }

    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Metric</CardTitle>
          <CardDescription>To get started, please select your primary role on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              variant={selectedRole === 'borrower' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('borrower')}
              className="w-full"
            >
              Borrower
            </Button>
            <Button 
              variant={selectedRole === 'lender' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('lender')}
              className="w-full"
            >
              Lender
            </Button>
            <Button 
              variant={selectedRole === 'both' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('both')}
              className="w-full"
            >
              Both
            </Button>
          </div>
          <Button 
            onClick={handleRoleSelection} 
            className="w-full"
            disabled={!selectedRole || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}