'use client';

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
    >
      Sign Out
    </button>
  );
}
