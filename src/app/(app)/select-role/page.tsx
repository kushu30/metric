// src/app/(app)/select-role/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, Landmark, Users } from "lucide-react";

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

    } catch (error: any)
    {
      toast.error("Error", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
       <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(600px_260px_at_10%_10%,rgba(16,185,129,.08),transparent_40%),radial-gradient(700px_300px_at_90%_80%,rgba(99,102,241,.06),transparent_45%)]" />
      <Card className="w-full max-w-lg border-white/10 bg-white/[0.02] z-10">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl">Welcome to Metric</CardTitle>
          <CardDescription className="text-white/60">To get started, please select your primary role on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              variant={selectedRole === 'borrower' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('borrower')}
              className="w-full h-24 flex-col gap-2 border-white/10 text-white hover:bg-white/10"
            >
              <Landmark/>
              Borrower
            </Button>
            <Button 
              variant={selectedRole === 'lender' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('lender')}
              className="w-full h-24 flex-col gap-2 border-white/10 text-white hover:bg-white/10"
            >
              <Briefcase/>
              Lender
            </Button>
            <Button 
              variant={selectedRole === 'both' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('both')}
              className="w-full h-24 flex-col gap-2 border-white/10 text-white hover:bg-white/10"
            >
              <Users />
              Both
            </Button>
          </div>
          <Button 
            onClick={handleRoleSelection} 
            className="w-full bg-white text-black hover:bg-white/90"
            disabled={!selectedRole || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}