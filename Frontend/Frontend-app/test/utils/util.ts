// file: /test/utils/util.ts
// Utilities for generating and verifying zkSNARK proofs with snarkjs.
// Supports both browser-side (dynamic import) and Node-side usage.

import path from "path";

// ---------------- Types ----------------

export type SolidityCalldata = {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  Input: string[];
};

export type ProofResult = {
  proof: any;
  publicSignals: string[];
  calldata: SolidityCalldata;
};

// ---------------- Browser utilities ----------------

/**
 * Generate a proof in the browser using snarkjs (dynamic import).
 * Assumes artifacts are served from /public/zk.
 */
export const generateTempProof = async (tScaled: number): Promise<ProofResult> => {
  const snarkjs = await import("snarkjs"); // dynamic import avoids SSR issues

  // Input shape must match the circuit definition
  const input = { tScaled: String(tScaled) };

  const wasmPath = `/zk/circuit2.wasm`;
  const zkeyPath = `/zk/circuit2_0001.zkey`;

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  // Convert to Solidity calldata
  const calldataBlob: string = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const argv = calldataBlob.replace(/["[\]\s]/g, "").split(",");
  const toStr = (x: string) => BigInt(x).toString();

  const a: [string, string] = [toStr(argv[0]), toStr(argv[1])];
  const b: [[string, string], [string, string]] = [
    [toStr(argv[2]), toStr(argv[3])],
    [toStr(argv[4]), toStr(argv[5])],
  ];
  const c: [string, string] = [toStr(argv[6]), toStr(argv[7])];
  const Input: string[] = argv.slice(8).map(toStr);

  return { proof, publicSignals, calldata: { a, b, c, Input } };
};

/**
 * Verify a proof in the browser (optional, for demo purposes).
 * Loads verification key from /public/zk/verification_key.json.
 */
export const verifyTempProof = async (
  publicSignals: string[],
  proof: any
): Promise<boolean> => {
  const snarkjs = await import("snarkjs");
  const vKey = await (await fetch("/zk/verification_key.json")).json();
  return snarkjs.groth16.verify(vKey, publicSignals, proof);
};

// ---------------- Node utilities ----------------

/**
 * Generate a proof in Node.js environment.
 * Looks up artifacts relative to project root (e.g., ./public/zk).
 */
export const generateTempProofNode = async (
  tScaled: number,
  fileBase = "circuit2"
) => {
  const input = { tScaled: String(tScaled) };

  const wasmPath = path.join(process.cwd(), `./public/zk/${fileBase}.wasm`);
  const provingKeyPath = path.join(process.cwd(), `./public/zk/${fileBase}_0001.zkey`);

  const snarkjs = await import("snarkjs");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    provingKeyPath
  );

  const calldataBlob: string = await snarkjs.groth16.exportSolidityCallData(
    proof,
    publicSignals
  );
  const argv = calldataBlob
    .replace(/["[\]\s]/g, "")
    .split(",")
    .map((x: string) => BigInt(x).toString());

  const a: [string, string] = [argv[0], argv[1]];
  const b: [[string, string], [string, string]] = [
    [argv[2], argv[3]],
    [argv[4], argv[5]],
  ];
  const c: [string, string] = [argv[6], argv[7]];
  const Input: string[] = argv.slice(8);

  return { a, b, c, Input, proof, publicSignals };
};

