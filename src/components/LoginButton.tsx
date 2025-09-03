'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { SiweMessage } from "siwe";
import { BrowserProvider } from "ethers";
import { useState, useRef } from "react";

export default function LoginButton() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const isConnecting = useRef(false);

  const handleWalletSignIn = async () => {
  if (isConnecting.current) return; // lock
  isConnecting.current = true;
  setIsLoading(true);

  try {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install it.");
      return;
    }

    const provider = new BrowserProvider(window.ethereum);

    // 1. Try to read existing accounts
    let accounts = await provider.send("eth_accounts", []);

    // 2. If no accounts, then request access
    if (!accounts || accounts.length === 0) {
      try {
        accounts = await provider.send("eth_requestAccounts", []);
      } catch (err: any) {
        if (err.code === -32002) {
          // 🔑 The MetaMask "already processing" case
          alert("A MetaMask request is already open. Please check your MetaMask popup.");
          return; // stop here — don't retry
        }
        throw err;
      }
    }

    if (!accounts || accounts.length === 0) {
      alert("No Ethereum account found.");
      return;
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const { chainId } = await provider.getNetwork();

    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId: Number(chainId),
      nonce: new Date().getTime().toString(),
    });

    const signature = await signer.signMessage(message.prepareMessage());

    await signIn("credentials", {
      message: JSON.stringify(message),
      signature,
      redirect: true,
    });

  } catch (error: any) {
    if (error.code !== 4001 && error.code !== -32002) {
      console.error("Authentication error:", error);
      alert("Error signing in. Check the console for details.");
    }
  } finally {
    isConnecting.current = false;
    setIsLoading(false);
  }
};


  if (session) {
    return (
      <div className="text-center">
        <p>Signed in as {session.user?.email || session.user?.id}</p>
        <button 
          onClick={() => signOut()} 
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-4">Not signed in</p>
      <div className="flex flex-col space-y-2 w-60 mx-auto">
        <button 
          onClick={() => signIn("google")}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Sign in with Google
        </button>
        <button 
          onClick={handleWalletSignIn}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Sign in with Wallet"}
        </button>
      </div>
    </div>
  );
}
