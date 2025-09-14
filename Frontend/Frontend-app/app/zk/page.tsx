'use client';

import { useState } from 'react';
import { generateTempProof, verifyTempProof } from '@/test/utils/util';
import Navbar from "@/components/header/navbar"

// Simple demo UI with Tailwind
export default function ZkTempPage() {
  const [t, setT] = useState<string>('36.50');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    ok: string;
    publicSignals: string[];
    verified: boolean;
    calldata: any;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const onProve = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      // scale to integer (x100)
      const tScaled = Math.round(parseFloat(t) * 100);

      // run proving in browser
      const { proof, publicSignals, calldata } = await generateTempProof(tScaled);

      // publicSignals contains outputs (and any public inputs).
      // Our circuit exposes 'ok' as output; check it:
      const ok = publicSignals[publicSignals.length - 1] ?? '0';

      // (optional) verify on client
      const verified = await verifyTempProof(publicSignals, proof);

      setResult({ ok, publicSignals, verified, calldata });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
       <Navbar />
      <h1 className="text-2xl font-bold">ZK Proof: Temperature ≤ 37.00°C</h1>

      <div className="grid gap-3">
        <label className="text-sm">Temperature (°C)</label>
        <input
          className="border rounded-xl p-3"
          type="number"
          step="0.01"
          value={t}
          onChange={(e) => setT(e.target.value)}
          placeholder="e.g. 36.50"
        />
        <button
          onClick={onProve}
          disabled={loading}
          className="rounded-2xl border px-4 py-2 hover:shadow disabled:opacity-60"
        >
          {loading ? 'Proving...' : 'Generate Proof'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm break-words">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm">ok (1 means ≤ 37.00°C): <b>{result.ok}</b></div>
          <div className="text-sm">Verified locally: <b>{String(result.verified)}</b></div>
          <details className="text-sm">
            <summary className="cursor-pointer">publicSignals</summary>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(result.publicSignals, null, 2)}
            </pre>
          </details>
          <details className="text-sm">
            <summary className="cursor-pointer">Solidity calldata</summary>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(result.calldata, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
