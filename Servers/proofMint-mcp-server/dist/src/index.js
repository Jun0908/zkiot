// src/index.ts
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ethers, Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes, isAddress, getAddress, AbiCoder, zeroPadValue, hexlify, randomBytes, } from 'ethers';
// Your contract ABI JSON
import abiJson from '../abi/CompliantLotNFT.abi.json' with { type: 'json' };
const ABI = abiJson;
const iface = new ethers.Interface(ABI);
const coder = AbiCoder.defaultAbiCoder();
/* ---------- env helpers ---------- */
function need(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Environment variable ${name} is required`);
    return v;
}
function getProvider() { return new JsonRpcProvider(need('RPC_URL')); }
function getWallet() { return new Wallet(need('WALLET_PRIVATE_KEY'), getProvider()); }
function getContract(runner) {
    const addr = "0x3DA4100499F91DA2FAb809Db4d03A68D5bf4622C";
    const provider = getProvider();
    return new Contract(addr, ABI, runner ?? provider);
}
/* ---------- utils ---------- */
function hex32(x) {
    if (!x.startsWith('0x'))
        throw new Error('expected 0x-prefixed hex');
    if (x.length === 66)
        return x;
    if (x.length < 66)
        return zeroPadValue(x, 32);
    throw new Error('hex32 too long');
}
function now() { return Math.floor(Date.now() / 1000); }
function randomNonce32() { return hexlify(randomBytes(32)); }
/** keccak256( abi.encode(commitRoot, keccak256(period), keccak256(device)) ) */
function computeTokenId(commitRoot, period, device) {
    const periodHash = keccak256(toUtf8Bytes(period));
    const deviceHash = keccak256(toUtf8Bytes(device));
    const packed = coder.encode(['bytes32', 'bytes32', 'bytes32'], [commitRoot, periodHash, deviceHash]);
    return BigInt(keccak256(packed));
}
function buildDomain(chainId, verifyingContract) {
    return { name: 'CompliantLot', version: '1', chainId, verifyingContract };
}
/* ---------- schemas ---------- */
const VoucherZod = z.object({
    to: z.string().refine(isAddress, 'invalid address'),
    tokenId: z.string().optional(), // if omitted we compute
    commitRoot: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'commitRoot must be 32-byte hex'),
    vkHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'vkHash must be 32-byte hex'),
    schema: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'schema must be 32-byte hex'),
    period: z.string().min(1, 'period is required'),
    device: z.string().min(1, 'device is required'),
    tokenURI: z.string().default(''),
    deadlineSecFromNow: z.number().int().positive().default(15 * 60),
    deadlineUnix: z.number().int().positive().optional(),
    nonce: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'nonce must be 32-byte hex').optional(),
});
const TypedDataTypes = {
    MintVoucher: [
        { name: 'to', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'commitRoot', type: 'bytes32' },
        { name: 'vkHash', type: 'bytes32' },
        { name: 'schema', type: 'bytes32' },
        { name: 'periodHash', type: 'bytes32' },
        { name: 'deviceHash', type: 'bytes32' },
        { name: 'tokenURI', type: 'string' },
        { name: 'deadline', type: 'uint64' },
        { name: 'nonce', type: 'bytes32' },
    ],
};
/** Parse Minted / Transfer for tokenId */
function extractMintedTokenId(receipt) {
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'Minted' || parsed?.name === 'Transfer') {
                const tid = parsed.args?.tokenId;
                if (tid !== undefined)
                    return tid;
            }
        }
        catch { /* ignore */ }
    }
    return null;
}
/* ---------- MCP server ---------- */
const server = new McpServer({ name: 'zk-iot-mint', version: '1.0.0' });
/* 1) voucher_sign */
server.registerTool('voucher_sign', {
    title: 'Create & sign EIP-712 MintVoucher',
    description: 'Off-chain verification PASSED → sign voucher for mintWithVoucher()',
    inputSchema: VoucherZod.shape, // ← ここが重要（ZodRawShape）
}, async (raw, _extra) => {
    const input = VoucherZod.parse(raw);
    const provider = getProvider();
    const { chainId } = await provider.getNetwork();
    const contractAddr = need('CONTRACT_ADDRESS');
    const wallet = getWallet();
    const to = getAddress(input.to);
    const commitRoot = hex32(input.commitRoot);
    const vkHash = hex32(input.vkHash);
    const schema = hex32(input.schema);
    const periodHash = keccak256(toUtf8Bytes(input.period));
    const deviceHash = keccak256(toUtf8Bytes(input.device));
    const tokenId = input.tokenId !== undefined
        ? BigInt(input.tokenId)
        : computeTokenId(commitRoot, input.period, input.device);
    const deadline = input.deadlineUnix !== undefined
        ? BigInt(input.deadlineUnix)
        : BigInt(now() + input.deadlineSecFromNow);
    const nonce = (input.nonce ?? randomNonce32());
    const tokenURI = input.tokenURI ?? '';
    const voucher = {
        to,
        tokenId,
        commitRoot,
        vkHash,
        schema,
        periodHash,
        deviceHash,
        tokenURI,
        deadline,
        nonce,
    };
    const domain = buildDomain(chainId, contractAddr);
    const signature = await wallet.signTypedData(domain, TypedDataTypes, voucher);
    const digest = ethers.TypedDataEncoder.hash(domain, TypedDataTypes, voucher);
    const payload = { voucher, signature, digest, domain, types: TypedDataTypes };
    return {
        content: [
            {
                type: 'text',
                text: `✅ Voucher signed\n` +
                    `signer: ${await wallet.getAddress()}\n` +
                    `chainId: ${chainId.toString()}\n` +
                    `verifyingContract: ${contractAddr}\n` +
                    `tokenId: ${tokenId.toString()}\n` +
                    `deadline: ${deadline.toString()}\n` +
                    `nonce: ${nonce}\n\n` +
                    `--- JSON ---\n` +
                    '```json\n' + JSON.stringify(payload, null, 2) + '\n```',
            },
        ],
    };
});
/* 2) voucher_mint */
server.registerTool('voucher_mint', {
    title: 'Call mintWithVoucher(voucher, signature)',
    description: 'Sends the transaction and returns tx hash + tokenId.',
    // ★ トップレベルは RawShape を渡す（=プレーンオブジェクト）
    inputSchema: {
        voucher: z.object({
            to: z.string().refine(isAddress),
            tokenId: z.string(),
            commitRoot: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
            vkHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
            schema: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
            periodHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
            deviceHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
            tokenURI: z.string(),
            deadline: z.string(), // BigInt安全のため文字列
            nonce: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
        }),
        signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
    },
}, async ({ voucher, signature }, _extra) => {
    const wallet = getWallet();
    const contract = getContract(wallet);
    const v = {
        to: getAddress(voucher.to),
        tokenId: BigInt(voucher.tokenId),
        commitRoot: voucher.commitRoot,
        vkHash: voucher.vkHash,
        schema: voucher.schema,
        periodHash: voucher.periodHash,
        deviceHash: voucher.deviceHash,
        tokenURI: voucher.tokenURI,
        deadline: BigInt(voucher.deadline),
        nonce: voucher.nonce,
    };
    const tx = await contract.mintWithVoucher(v, signature);
    const receipt = await tx.wait();
    const tokenId = extractMintedTokenId(receipt);
    const payload = { txHash: receipt.hash, tokenId: tokenId?.toString() ?? null };
    return {
        content: [
            {
                type: 'text',
                text: `✅ Mint tx sent\n` +
                    `txHash: ${receipt.hash}\n` +
                    (tokenId !== null ? `tokenId: ${tokenId.toString()}\n` : '') +
                    `\n--- JSON ---\n` +
                    '```json\n' + JSON.stringify(payload, null, 2) + '\n```',
            },
        ],
    };
});
/* 3) compute_token_id */
server.registerTool('compute_token_id', {
    title: 'Compute deterministic tokenId',
    description: 'keccak256(commitRoot, keccak256(period), keccak256(device))',
    inputSchema: {
        commitRoot: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
        period: z.string(),
        device: z.string(),
    },
}, async ({ commitRoot, period, device }, _extra) => {
    const id = computeTokenId(commitRoot, period, device);
    const periodHash = keccak256(toUtf8Bytes(period));
    const deviceHash = keccak256(toUtf8Bytes(device));
    const payload = { tokenId: id.toString(), periodHash, deviceHash };
    return {
        content: [
            {
                type: 'text',
                text: `✅ tokenId computed: ${id.toString()}\n\n` +
                    `--- JSON ---\n` +
                    '```json\n' + JSON.stringify(payload, null, 2) + '\n```',
            },
        ],
    };
});
/* 4) set_mint_signer (owner-only) */
server.registerTool('set_mint_signer', {
    title: 'Set mintSigner on the contract (owner only)',
    description: 'Calls setMintSigner(address)',
    inputSchema: { signer: z.string().refine(isAddress) },
}, async ({ signer }, _extra) => {
    const wallet = getWallet();
    const contract = getContract(wallet);
    const tx = await contract.setMintSigner(getAddress(signer));
    const receipt = await tx.wait();
    return { content: [{ type: 'text', text: `✅ setMintSigner done. txHash: ${receipt.hash}` }] };
});
/* 5) info */
server.registerTool('info', {
    title: 'Show chain & domain',
    description: 'Returns chainId and EIP-712 domain used for Voucher',
    inputSchema: {}, // ← これでOK（RawShape）
}, async (_args, _extra) => {
    const provider = getProvider();
    const { chainId } = await provider.getNetwork();
    const addr = need('CONTRACT_ADDRESS');
    const domain = buildDomain(chainId, addr);
    const payload = { chainId: chainId.toString(), contract: addr, domain };
    return {
        content: [
            {
                type: 'text',
                text: `✅ info\n` +
                    `chainId: ${chainId.toString()}\n` +
                    `contract: ${addr}\n\n` +
                    `--- JSON ---\n` +
                    '```json\n' + JSON.stringify(payload, null, 2) + '\n```',
            },
        ],
    };
});
await server.connect(new StdioServerTransport());
