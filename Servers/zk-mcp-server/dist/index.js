// src/index.ts
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ethers } from 'ethers';
// ====== ENV ======
const RPC_URL = process.env.RPC_URL ?? process.env.NEXT_PUBLIC_RPC_URL ?? '';
const CONTRACT_ADDRESS = '0x8c1ec01d46fedabdc0b58234638da177d60bcc0b';
if (!RPC_URL) {
    console.error('[FATAL] RPC_URL is required');
    process.exit(1);
}
if (!CONTRACT_ADDRESS) {
    console.error('[FATAL] CONTRACT_ADDRESS is required');
    process.exit(1);
}
// ====== ethers v6 ======
const provider = new ethers.JsonRpcProvider(RPC_URL);
const VERIFIER_ABI = [
    {
        inputs: [
            { internalType: 'uint256[2]', name: '_pA', type: 'uint256[2]' },
            { internalType: 'uint256[2][2]', name: '_pB', type: 'uint256[2][2]' },
            { internalType: 'uint256[2]', name: '_pC', type: 'uint256[2]' },
            { internalType: 'uint256[1]', name: '_pubSignals', type: 'uint256[1]' },
        ],
        name: 'verifyProof',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
];
const contract = new ethers.Contract(CONTRACT_ADDRESS, VERIFIER_ABI, provider);
// ====== Zod schema ======
const HexOrDec = z.string().min(1);
const VerifyInputShape = {
    a: z.tuple([HexOrDec, HexOrDec]),
    b: z.tuple([
        z.tuple([HexOrDec, HexOrDec]),
        z.tuple([HexOrDec, HexOrDec]),
    ]),
    c: z.tuple([HexOrDec, HexOrDec]),
    pubSignals: z.tuple([HexOrDec]),
    withHashes: z.boolean().optional(),
    sendTx: z.boolean().optional(),
};
const VerifyInput = z.object(VerifyInputShape);
// ====== MCP Server ======
const server = new McpServer({ name: 'groth16-verifier', version: '1.0.0' });
server.registerTool('verify_groth16', {
    title: 'Verify ZK proof for temperature <= 37°C (on-chain, read-only)',
    description: 'Calls Groth16Verifier.verifyProof(_pA,_pB,_pC,_pubSignals). ' +
        'If valid, returns "Temperature is 37°C or below". ' +
        'Arguments: { a,b,c,pubSignals } (hex/decimal strings). ' +
        'Extra options: withHashes (boolean), sendTx (boolean)',
    inputSchema: VerifyInputShape, // ✅ RawShape instead of ZodObject
}, async (args) => {
    const parsed = VerifyInput.parse(args);
    const { a, b, c, pubSignals, withHashes, sendTx } = parsed;
    // 1) On-chain read-only verification
    const ok = await contract.verifyProof(a, b, c, pubSignals);
    // 2) Optional: compute hashes
    let callDataHash;
    let proofHash;
    let chainIdStr;
    if (withHashes) {
        const data = contract.interface.encodeFunctionData('verifyProof', [a, b, c, pubSignals]);
        callDataHash = ethers.keccak256(data);
        const abi = ethers.AbiCoder.defaultAbiCoder();
        const encoded = abi.encode(['uint256[2]', 'uint256[2][2]', 'uint256[2]', 'uint256[1]'], [a, b, c, pubSignals]);
        proofHash = ethers.keccak256(encoded);
        const net = await provider.getNetwork();
        chainIdStr = net.chainId.toString();
    }
    // 3) Optional: send transaction (requires gas)
    let txHash;
    if (sendTx) {
        const pk = process.env.PRIVATE_KEY;
        if (!pk) {
            return {
                content: [{ type: 'text', text: '❌ PRIVATE_KEY not set, cannot execute sendTx.' }],
            };
        }
        const signer = new ethers.Wallet(pk, provider);
        const data = contract.interface.encodeFunctionData('verifyProof', [a, b, c, pubSignals]);
        const tx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, data });
        txHash = tx.hash;
    }
    // 4) Build response text
    const lines = [
        ok ? '✅ Temperature is 37°C or below' : '❌ Temperature exceeds 37°C (or proof invalid)',
    ];
    if (withHashes) {
        if (callDataHash)
            lines.push(`callDataHash=${callDataHash}`);
        if (proofHash)
            lines.push(`proofHash=${proofHash}`);
        if (chainIdStr)
            lines.push(`chainId=${chainIdStr}`);
        lines.push(`contract=${CONTRACT_ADDRESS}`);
    }
    if (txHash)
        lines.push(`txHash=${txHash}`);
    return {
        content: [{ type: 'text', text: lines.join('\n') }],
    };
});
// ====== Startup (stdio; stdout prohibited) ======
(async () => {
    try {
        await server.connect(new StdioServerTransport());
        console.error('[READY] MCP groth16-verifier started (ethers v6)');
    }
    catch (err) {
        console.error('[FATAL] start failed:', err);
        process.exit(1);
    }
})();
