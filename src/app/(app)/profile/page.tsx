"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { BrowserProvider } from "ethers";
import { SiweMessage } from "siwe";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LinkedAccount {
  provider: string;
  address: string;
}

interface UserProfile {
  name: string;
  email: string;
  image: string;
  role: string;
  balance: number;
  linkedAccounts: LinkedAccount[];
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const fetchProfile = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error("Failed to fetch profile.");
      const data = await response.json();
      setProfile(data);
      setSelectedRole(data.role);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLinkWallet = async () => {
    setIsLinking(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask or other wallet not found.");
      
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const chainId = (await provider.getNetwork()).chainId;

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Link this wallet to your Metric account.",
        uri: window.location.origin,
        version: "1",
        chainId: Number(chainId),
        nonce: new Date().getTime().toString(),
      });

      const signature = await signer.signMessage(message.prepareMessage());

      const response = await fetch('/api/user/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: JSON.stringify(message), signature }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to link wallet.");
      }

      toast.success("Wallet linked successfully!");
      fetchProfile();

    } catch (error: any) {
       if (error.code !== 4001) {
         toast.error("Linking Failed", { description: error.message });
       }
    } finally {
      setIsLinking(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || selectedRole === profile?.role) return;
    setIsUpdatingRole(true);
    try {
      const response = await fetch('/api/user/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole: selectedRole }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role.");
      }
      await update({ role: selectedRole });
      await fetchProfile();
      toast.success("Your role has been updated successfully.");
    } catch (error: any) {
      toast.error("Update Failed", { description: error.message });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const isWalletLinked = profile?.linkedAccounts.some(acc => acc.provider === 'credentials');

  return (
    <div className="flex justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading profile...</p> : profile ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img src={profile.image || `https://avatar.vercel.sh/${profile.email}`} alt="Profile" className="w-16 h-16 rounded-full" />
                <div>
                  <h2 className="text-xl font-semibold">{profile.name || "User"}</h2>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Linked Accounts</h3>
                <ul className="space-y-2">
                  {profile.linkedAccounts.map(acc => (
                    <li key={acc.provider} className="text-sm p-3 border rounded-md bg-gray-50 truncate">
                      {acc.provider === 'google' && `Google: ${profile.email}`}
                      {acc.provider === 'credentials' && `Wallet: ${acc.address}`}
                    </li>
                  ))}
                </ul>
                {!isWalletLinked && (
                  <Button onClick={handleLinkWallet} disabled={isLinking}>
                    {isLinking ? "Check Wallet..." : "Link Web3 Wallet"}
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Manage Role</h3>
                <div className="flex items-center space-x-4">
                   <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borrower">Borrower</SelectItem>
                        <SelectItem value="lender">Lender</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleUpdateRole} disabled={isUpdatingRole || selectedRole === profile.role}>
                      {isUpdatingRole ? "Saving..." : "Save Role"}
                    </Button>
                </div>
              </div>
            </div>
          ) : (
            <p>Could not load profile information.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}