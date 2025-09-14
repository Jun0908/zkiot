// src/index.ts
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ethers } from 'ethers';

// ✅ あなたの ABI JSON を読み込み（パス/ファイル名は合わせてください）
import abiJson from '../abi/SuperSimpleNFT.abi.json' with { type: 'json' };
const ABI = abiJson as ethers.InterfaceAbi;
const iface = new ethers.Interface(ABI);

// 必須 env
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} is required`);
  return v;
}

const server = new McpServer({ name: 'super-simple-nft', version: '1.0.0' });

/** 共通：コントラクト生成 */
function getContract(signer?: ethers.Signer) {
  const rpc = need('RPC_URL');
  const addr = need('CONTRACT_ADDRESS');
  const provider = new ethers.JsonRpcProvider(rpc);
  const runner = signer ?? provider;
  return {
    provider,
    contract: new ethers.Contract(addr, ABI, runner),
  };
}

/** 共通：Minted(tokenId) を receipt.logs から拾う */
function extractMintedTokenId(receipt: ethers.TransactionReceipt): bigint | null {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'Minted') {
        // イベントの引数名は Solidity と合わせてください（to, tokenId）
        const tokenId = parsed.args?.tokenId as bigint;
        if (tokenId !== undefined && tokenId !== null) return tokenId;
      }
    } catch (_) { /* 解析できないログはスキップ */ }
  }
  return null;
}

/** A) 入力ゼロ：自分に1枚ミント */
server.registerTool(
  'mint_simple',
  {
    title: 'Mint 1 NFT to self',
    description: 'Calls mint() and returns tx hash and tokenId (from event).',
    inputSchema: {},
  },
  async () => {
    const rpc = need('RPC_URL');
    const pk = need('WALLET_PRIVATE_KEY'); // ← ミント送信に使う鍵
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);

    const tx = await contract.mint();
    const receipt = await tx.wait();
    const tokenId = extractMintedTokenId(receipt);

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Minted\n` +
            `txHash: ${receipt?.hash ?? tx.hash}\n` +
            (tokenId !== null ? `tokenId: ${tokenId.toString()}\n` : ''),
        },
      ],
    };
  }
);

/** B) アドレス指定で1枚（オーナーのみ） */
server.registerTool(
  'mint_to',
  {
    title: 'Mint 1 NFT to address',
    description: 'Owner-only. Calls mintTo(to).',
    inputSchema: { to: z.string().describe('0x-address') },
  },
  async ({ to }) => {
    const rpc = need('RPC_URL');
    const pk = need('WALLET_PRIVATE_KEY'); // ← コントラクトの owner 鍵にしてください
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);

    const tx = await contract.mintTo(to);
    const receipt = await tx.wait();
    const tokenId = extractMintedTokenId(receipt);

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Minted to ${to}\n` +
            `txHash: ${receipt?.hash ?? tx.hash}\n` +
            (tokenId !== null ? `tokenId: ${tokenId.toString()}\n` : ''),
        },
      ],
    };
  }
);

await server.connect(new StdioServerTransport());



