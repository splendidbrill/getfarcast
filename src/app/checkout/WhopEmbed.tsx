"use client";

import { WhopCheckoutEmbed } from "@whop/checkout/react";

export default function WhopEmbed({ planId }: { planId: string }) {
  return (
    <div className="w-full max-w-lg rounded-3xl overflow-hidden border border-black/5 shadow-lg bg-white">
      <WhopCheckoutEmbed planId={planId} />
    </div>
  );
}
