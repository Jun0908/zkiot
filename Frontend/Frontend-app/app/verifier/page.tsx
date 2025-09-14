'use client';

import { useState } from 'react';
import { verifyOnChain, SAMPLE_PROOF } from '@/test/utils/verifierUtil';
import Navbar from "@/components/header/navbar"

export default function VerifierPage() {
  const [res, setRes] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    setErr(null);
    setRes(null);
    try {
      const ok = await verifyOnChain(SAMPLE_PROOF); // or pass your pasted proof
      setRes(ok);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  return (
    <div className="p-6 space-y-3">
        <Navbar />
      <h1 className="text-xl font-bold">On-chain Proof Verification</h1>
      <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onClick}>
        Verify (read-only)
      </button>
      {res !== null && <div>Result: <b>{String(res)}</b></div>}
      {err && <div className="text-red-600 break-words text-sm">{err}</div>}
    </div>
  );
}


