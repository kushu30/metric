// src/app/(app)/vouch/page.tsx
import { Suspense } from "react";
import VouchComponent from "./VouchComponent";

export default function VouchPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading vouch page...</div>}>
      <VouchComponent />
    </Suspense>
  );
}
