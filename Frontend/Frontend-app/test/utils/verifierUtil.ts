// file: /test/utils/verifierUtil.ts
// Read-only on-chain verification utility (ethers v5).
// No snarkjs import; just calls a deployed Groth16 verifier.

// 1) Ethers
import { ethers } from "ethers";

// 2) Deployed verifier (your address)
export const VERIFIER_ADDRESS = "0x8c1ec01d46fedabdc0b58234638da177d60bcc0b";

// 3) Minimal ABI for verifyProof
export const VERIFIER_ABI: ethers.ContractInterface = [
  {
    inputs: [
      { internalType: "uint256[2]",     name: "_pA",         type: "uint256[2]" },
      { internalType: "uint256[2][2]",  name: "_pB",         type: "uint256[2][2]" },
      { internalType: "uint256[2]",     name: "_pC",         type: "uint256[2]" },
      { internalType: "uint256[1]",     name: "_pubSignals", type: "uint256[1]" },
    ],
    name: "verifyProof",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

// 4) Types
export type Groth16ProofCalldata = {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  pubSignals: [string];
};

// 5) Read-only provider & contract (RPC fixed; wallet not required)
function getReadOnlyContract() {
  const url = process.env.NEXT_PUBLIC_RPC_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_RPC_URL (Sepolia RPC, etc.)");
  }
  const provider = new ethers.providers.JsonRpcProvider(url);
  return new ethers.Contract(VERIFIER_ADDRESS, VERIFIER_ABI, provider);
}

// 6) Example proof (your zkesc output, already normalized)
export const SAMPLE_PROOF: Groth16ProofCalldata = {
  a: [
    "0x290745078e5caf687cb9db1228175628bababa84333d42331c65daeab999ebc1",
    "0x04cf9419b52ec13c6d63e59501a830002b1cae7536089a9a180d4ede5fbcaf0f",
  ],
  b: [
    [
      "0x004d6345aa9c91c189a05aab1ea299756c2cab70b8cb1cc80762e5d61b55cfa3",
      "0x1b1444d9a95d77c0ffff2585593d7b137922810bda9a193a0142f18497dcb522",
    ],
    [
      "0x2917d2981d4b09f853cd909a8618f328e19f52935ddfaaa20d6ba19014db89f4",
      "0x1c0416044b0fd3f9096b8e25de8ae0914ec7a77b271750d3978a815cd32eeccf",
    ],
  ],
  c: [
    "0x2f029358e0b2b7f4728d819ddc1370842946f4a282e1b62bbeee19e1f0f445e8",
    "0x073def4354fe236c7d6f9aba0fb6020c5ece3827e1d084a7eef65c0dc32c64db",
  ],
  pubSignals: ["0x01"], // length must be 1
};

// 7) Verify function
export async function verifyOnChain(
  proof: Groth16ProofCalldata = SAMPLE_PROOF
): Promise<boolean> {
  const contract = getReadOnlyContract();
  // ethers v5 accepts decimal or hex strings for uint256
  const ok: boolean = await contract.verifyProof(proof.a, proof.b, proof.c, proof.pubSignals);
  return ok;
}

