"use client";

import React, { useMemo, useRef, useState } from "react";
import Navbar from "@/components/header/navbar"

type StepState = "idle" | "running" | "pass" | "fail";

type PublicJson = {
  statement?: string;                // e.g., "T <= 37°C (all samples)"
  period?: string;                   // e.g., "2025-09-13T13:00:00Z/2025-09-13T15:00:00Z"
  device?: string;                   // e.g., "factory-line-03.eth"
  commit_root?: string;              // e.g., "0x...."
  vk_hash?: string;                  // e.g., "0x...."
  maxTemp?: number;                  // e.g., 36.8
  threshold?: number;                // e.g., 37
  [k: string]: any;
};

export default function Page() {
  const proofFileRef = useRef<HTMLInputElement | null>(null);
  const publicFileRef = useRef<HTMLInputElement | null>(null);

  const [proofJson, setProofJson] = useState<any | null>(null);
  const [publicJson, setPublicJson] = useState<PublicJson | null>(null);

  const [verifierResult, setVerifierResult] = useState<"PASS" | "FAIL" | "-">(
    "-"
  );
  const [m2mTx, setM2mTx] = useState<string | null>(null);

  const [steps, setSteps] = useState<Record<string, StepState>>({
    Device: "idle",
    Ingest: "idle",
    Commit: "idle",
    Prover: "idle",
    Verifier: "idle",
    M2M: "idle",
  });

  const [events, setEvents] = useState<string[]>([]);

  // KPIs (simple)
  const kpis = useMemo(() => {
    const pass = events.filter((e) => e.includes("Proof PASS")).length;
    const fail = events.filter((e) => e.includes("Proof FAIL")).length;
    const payments = events.filter((e) => e.includes("M2M payment")).length;
    return { pass, fail, payments };
  }, [events]);

  function addEvent(msg: string) {
    const ts = new Date().toLocaleTimeString();
    setEvents((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 50));
  }

  function shortHash(s?: string, n = 6) {
    if (!s) return "-";
    if (s.length <= n * 2 + 2) return s;
    return `${s.slice(0, n + (s.startsWith("0x") ? 2 : 0))}…${s.slice(-n)}`;
  }

  async function handleUpload() {
    const pf = proofFileRef.current?.files?.[0];
    const pj = publicFileRef.current?.files?.[0];
    if (!pf || !pj) {
      alert("Select both proof.json and public.json.");
      return;
    }
    try {
      const [proofText, publicText] = await Promise.all([pf.text(), pj.text()]);
      const proof = JSON.parse(proofText);
      const pub = JSON.parse(publicText);
      setProofJson(proof);
      setPublicJson(pub);
      setVerifierResult("-");
      setM2mTx(null);

      // Update steps (Device → Ingest → Commit)
      setSteps({
        Device: "pass",
        Ingest: "pass",
        Commit: "pass",
        Prover: "running",
        Verifier: "idle",
        M2M: "idle",
      });
      addEvent("Files uploaded (proof.json / public.json)");
    } catch (e) {
      console.error(e);
      alert("Failed to parse JSON.");
    }
  }

  function pseudoHash(obj: any): string {
    // Simple demo hash
    const s = JSON.stringify(obj);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return "0x" + (h >>> 0).toString(16).padStart(8, "0");
  }

  function verifyProof() {
    if (!proofJson || !publicJson) {
      alert("Upload proof.json / public.json first.");
      return;
    }
    setSteps((st) => ({ ...st, Prover: "pass", Verifier: "running" }));

    // Demo verification rule:
    // - publicJson.maxTemp <= (publicJson.threshold || 37)
    // - commit_root & vk_hash exist
    const thr = (publicJson.threshold ?? 37) as number;
    const okTemp =
      typeof publicJson.maxTemp === "number"
        ? publicJson.maxTemp <= thr
        : true;

    const okFields = !!publicJson.commit_root && !!publicJson.vk_hash;

    const pass = okTemp && okFields;

    setTimeout(() => {
      setVerifierResult(pass ? "PASS" : "FAIL");
      setSteps((st) => ({ ...st, Verifier: pass ? "pass" : "fail" }));
      addEvent(`Proof ${pass ? "PASS" : "FAIL"} (hash=${pseudoHash(proofJson)})`);
    }, 500);
  }

  function triggerM2M() {
    if (verifierResult !== "PASS") {
      alert("Verify must be PASS first.");
      return;
    }
    setSteps((st) => ({ ...st, M2M: "running" }));
    setTimeout(() => {
      const tx =
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      setM2mTx(tx);
      setSteps((st) => ({ ...st, M2M: "pass" }));
      addEvent(`M2M payment settled (tx=${shortHash(tx, 8)})`);
    }, 600);
  }

  function blockAndReinspect() {
    setSteps((st) => ({ ...st, M2M: "idle" }));
    addEvent("Lot blocked. Re-inspection requested.");
  }

  const statement = publicJson?.statement ?? "All samples T <= 37°C";
  const period = publicJson?.period ?? "-";
  const device = publicJson?.device ?? "factory-line-03.eth";
  const commitRoot = shortHash(publicJson?.commit_root);
  const proofHash = shortHash(pseudoHash(proofJson));
  const vkHash = shortHash(publicJson?.vk_hash);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      {/* Header */}
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold">
            zkIoT — Prove without revealing
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Trusted machine-to-machine transactions with KYC-verified peers
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Stepper */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <h2 className="text-sm font-medium mb-3">Pipeline</h2>
            <div className="flex flex-wrap items-center gap-3">
              {[
                ["Device", "🖥️"],
                ["Ingest", "📥"],
                ["Commit", "🔒"],
                ["Prover", "🧮"],
                ["Verifier", "✅"],
                ["M2M", "⚙️"],
              ].map(([name, icon], idx, arr) => (
                <React.Fragment key={name}>
                  <Step badge={steps[name]} label={`${icon} ${name}`} />
                  {idx < arr.length - 1 && <Arrow />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Proof Result */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Proof Result</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  verifierResult === "PASS"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : verifierResult === "FAIL"
                    ? "bg-rose-500/15 text-rose-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {verifierResult}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Statement" value={statement} />
              <InfoRow label="Period" value={period} />
              <InfoRow label="Device" value={device} />
              <InfoRow label="commit_root" value={commitRoot} />
              <InfoRow label="proof_hash" value={proofHash} />
              <InfoRow label="vk_hash" value={vkHash} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  ref={proofFileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={() => {}}
                />
                <button
                  onClick={() => proofFileRef.current?.click()}
                  className="px-3 py-2 rounded-lg border border-border hover:bg-card/70"
                >
                  Select proof.json
                </button>
                <span className="text-muted-foreground">
                  {proofJson ? "✔︎ loaded" : "—"}
                </span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  ref={publicFileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={() => {}}
                />
                <button
                  onClick={() => publicFileRef.current?.click()}
                  className="px-3 py-2 rounded-lg border border-border hover:bg-card/70"
                >
                  Select public.json
                </button>
                <span className="text-muted-foreground">
                  {publicJson ? "✔︎ loaded" : "—"}
                </span>
              </label>

              <button
                onClick={handleUpload}
                className="ml-auto px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90"
              >
                Upload
              </button>
              <button
                onClick={verifyProof}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
                disabled={!proofJson || !publicJson}
              >
                Verify Proof
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <h2 className="text-sm font-medium mb-3">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={triggerM2M}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                disabled={verifierResult !== "PASS"}
              >
                Trigger M2M
              </button>
              <button
                onClick={blockAndReinspect}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
              >
                Block / Re-inspect
              </button>
            </div>
          </div>
        </section>

        {/* Right column */}
        <aside className="lg:col-span-5 flex flex-col gap-6">
          {/* Device Trust */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <h2 className="text-sm font-medium mb-3">Device Trust</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Dot ok /> Signature valid &nbsp;
                <span className="text-muted-foreground">(demo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Dot ok /> Nonce drift 0 &nbsp;
                <span className="text-muted-foreground">(demo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Dot ok /> fw_hash match &nbsp;
                <span className="text-muted-foreground">(demo)</span>
              </li>
            </ul>
          </div>

          {/* M2M Settlement */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <h2 className="text-sm font-medium mb-3">M2M Settlement</h2>
            <div className="text-sm grid grid-cols-1 gap-2">
              <InfoRow label="Last tx" value={m2mTx ? m2mTx : "-"} />
              <InfoRow label="Status" value={m2mTx ? "Success" : "-"} />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Pass" value={kpis.pass} />
            <KpiCard label="Fail" value={kpis.fail} />
            <KpiCard label="Payments" value={kpis.payments} />
          </div>

          {/* Event Log */}
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <h2 className="text-sm font-medium mb-3">Event Log</h2>
            <div className="h-48 overflow-auto text-sm">
              {events.length === 0 ? (
                <p className="text-muted-foreground">No events yet.</p>
              ) : (
                <ul className="space-y-1">
                  {events.map((e, i) => (
                    <li key={i} className="font-mono text-xs text-muted-foreground">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ---------- UI parts ---------- */

function Step({ badge, label }: { badge: StepState; label: string }) {
  const color =
    badge === "pass"
      ? "bg-emerald-600"
      : badge === "fail"
      ? "bg-rose-600"
      : badge === "running"
      ? "bg-blue-600"
      : "bg-muted";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-muted-foreground">➝</span>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs md:text-sm">{value}</span>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Dot({ ok = true }: { ok?: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        ok ? "bg-emerald-600" : "bg-rose-600"
      }`}
    />
  );
}

