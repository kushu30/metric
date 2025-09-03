"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, Users, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Reusable Modals ---

const AnonAadhaarModal = ({ onVerify, isLoading }: { onVerify: () => void; isLoading: boolean }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button disabled={isLoading}>Verify</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Anon Aadhaar Verification</DialogTitle>
        <DialogDescription>
          This is a simulation. In a real app, you’d scan a QR code to generate a zero-knowledge proof.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 text-center text-sm">Simulating ZK proof generation…</div>
      <DialogFooter>
        <Button onClick={onVerify} disabled={isLoading}>
          {isLoading ? "Verifying..." : "Confirm Verification"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const SocialProofModal = ({ userId }: { userId: string | null | undefined }) => {
  const [vouchLink, setVouchLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      setVouchLink(`${window.location.origin}/vouch?userId=${userId}`);
    }
  }, [userId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Get Vouched</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Vouched For</DialogTitle>
          <DialogDescription>
            Share this unique link with two members of the Metric community. Once they vouch for you, this will be marked as complete.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="vouch-link">Your Vouch Link</Label>
          <Input id="vouch-link" readOnly value={vouchLink} />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(vouchLink);
              toast.success("Link copied to clipboard!");
            }}
          >
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page ---

export default function VerificationPage() {
  const { data: session } = useSession();
  const [verifications, setVerifications] = useState({
    anonAadhaar: false,
    socialProof: false,
  });
  const [isLoading, setIsLoading] = useState<null | "anonAadhaar" | "socialProof">(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);

  const fetchVerificationStatus = useCallback(async () => {
    if (!session) return;
    setIsFetchingStatus(true);
    try {
      const response = await fetch("/api/user/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not fetch profile.");
      const data = await response.json();
      setVerifications({
        anonAadhaar: data.anonAadhaarVerified || false,
        socialProof: data.socialProofVerified || false,
      });
    } catch (error) {
      console.error("Failed to fetch verification status", error);
      toast.error("Could not load verification status.");
    } finally {
      setIsFetchingStatus(false);
    }
  }, [session]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  // Refresh again whenever window regains focus (helps after vouch link clicked)
  useEffect(() => {
    const onFocus = () => fetchVerificationStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchVerificationStatus]);

  const handleVerification = async (type: "anonAadhaar" | "socialProof") => {
    setIsLoading(type);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const response = await fetch("/api/user/update-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationType: type, value: true }),
      });
      if (!response.ok) throw new Error("Verification failed on the server.");

      await fetchVerificationStatus(); // ✅ always refresh from DB
      toast.success(
        `${type === "anonAadhaar" ? "Anon Aadhaar" : "Social Proof"} verification successful!`
      );
    } catch (error: any) {
      toast.error("Verification Error", { description: error.message });
    } finally {
      setIsLoading(null);
    }
  };

  if (isFetchingStatus) {
    return <div className="p-8">Loading verification status...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trust & Verification</h1>
      <Card>
        <CardHeader>
          <CardTitle>Strengthen Your Profile</CardTitle>
          <CardDescription>
            Completing these steps will increase your Trust Score and unlock better loan terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Anon Aadhaar */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <ShieldCheck
                className={verifications.anonAadhaar ? "text-green-500" : "text-gray-400"}
              />
              <div>
                <h3 className="font-semibold">Anon Aadhaar Verification</h3>
                <p className="text-sm text-gray-500">
                  Prove your unique identity without revealing your Aadhaar number.
                </p>
              </div>
            </div>
            {verifications.anonAadhaar ? (
              <div className="flex items-center space-x-2 text-sm font-semibold text-green-600">
                <CheckCircle />
                <span>Completed</span>
              </div>
            ) : (
              <AnonAadhaarModal
                onVerify={() => handleVerification("anonAadhaar")}
                isLoading={isLoading === "anonAadhaar"}
              />
            )}
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Users
                className={verifications.socialProof ? "text-green-500" : "text-gray-400"}
              />
              <div>
                <h3 className="font-semibold">Peer-Based Social Proof</h3>
                <p className="text-sm text-gray-500">
                  Get vouched for by two existing members of the Metric community.
                </p>
              </div>
            </div>
            {verifications.socialProof ? (
              <div className="flex items-center space-x-2 text-sm font-semibold text-green-600">
                <CheckCircle />
                <span>Completed</span>
              </div>
            ) : (
              <SocialProofModal userId={session?.user?.id} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
