import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ethers } from 'ethers';

// ✅ コンパイルした ABI を読み込み（パスは合わせてね）
import abiJson from '../abi/SuperSimpleToken.abi.json' with { type: 'json' };
const ABI = abiJson as ethers.InterfaceAbi;
const iface = new ethers.Interface(ABI);

// ==== env helper ====
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} is required`);
  return v;
}

const server = new McpServer({ name: 'super-simple-token', version: '1.0.0' });

// ==== 共通：コントラクト生成 ====
function getContract(signer?: ethers.Signer) {
  const rpc = need('RPC_URL');
  const addr = need('0xff8b8b6d15a8bb0fef29160996d8d2129d389995');
  const provider = new ethers.JsonRpcProvider(rpc);
  const runner = signer ?? provider;
  return {
    provider,
    contract: new ethers.Contract(addr, ABI, runner),
  };
}

// ==== 共通：decimals を取得 ====
async function getDecimals(contract: ethers.Contract): Promise<number> {
  const d = await contract.decimals();
  return Number(d);
}

// ==== 共通：Transfer/Minted を receipt.logs から拾う ====
function extractTransfer(receipt: ethers.TransactionReceipt): {
  from?: string; to?: string; value?: bigint;
} | null {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'Transfer') {
        return {
          from: parsed.args?.from as string,
          to: parsed.args?.to as string,
          value: parsed.args?.value as bigint,
        };
      }
    } catch (_) {}
  }
  return null;
}

function extractMinted(receipt: ethers.TransactionReceipt): {
  to?: string; amount?: bigint;
} | null {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'Minted') {
        return {
          to: parsed.args?.to as string,
          amount: parsed.args?.amount as bigint,
        };
      }
    } catch (_) {}
  }
  return null;
}

// ==== A) 自分にファウセット（mint()）====
server.registerTool(
  'mint_simple',
  {
    title: 'Mint faucet amount to self',
    description: 'Calls mint() and returns tx hash and minted amount.',
    inputSchema: {},
  },
  async () => {
    const rpc = need('RPC_URL');
    const pk = need('WALLET_PRIVATE_KEY'); // ← 送信に使う鍵
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);

    const decimals = await getDecimals(contract);
    const tx = await contract.mint();
    const receipt = await tx.wait();
    const minted = extractMinted(receipt);

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Minted to self\n` +
            `txHash: ${receipt?.hash ?? tx.hash}\n` +
            (minted?.amount != null
              ? `amount: ${ethers.formatUnits(minted.amount, decimals)}\n`
              : ''),
        },
      ],
    };
  }
);

// ==== B) オーナーが指定アドレスへミント ====
server.registerTool(
  'mint_to',
  {
    title: 'Mint to address (owner only)',
    description: 'Owner-only. Calls mintTo(to, amount). amount is human-readable (e.g. "1.5").',
    inputSchema: { to: z.string().describe('0x-address'), amount: z.string().describe('human amount') },
  },
  async ({ to, amount }) => {
    const rpc = need('RPC_URL');
    const pk = need('WALLET_PRIVATE_KEY'); // ← コントラクト owner 鍵
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);

    const decimals = await getDecimals(contract);
    const value = ethers.parseUnits(amount, decimals);
    const tx = await contract.mintTo(to, value);
    const receipt = await tx.wait();
    const minted = extractMinted(receipt);

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Minted to ${to}\n` +
            `txHash: ${receipt?.hash ?? tx.hash}\n` +
            (minted?.amount != null
              ? `amount: ${ethers.formatUnits(minted.amount, decimals)}\n`
              : ''),
        },
      ],
    };
  }
);

// ==== C) 送金（transfer）====
server.registerTool(
  'transfer',
  {
    title: 'Transfer tokens',
    description: 'Calls transfer(to, amount). amount is human-readable (e.g. "2.3").',
    inputSchema: { to: z.string().describe('0x-address'), amount: z.string().describe('human amount') },
  },
  async ({ to, amount }) => {
    const rpc = need('RPC_URL');
    const pk = need('WALLET_PRIVATE_KEY'); // ← 送信者の鍵（残高が必要）
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);

    const decimals = await getDecimals(contract);
    const value = ethers.parseUnits(amount, decimals);
    const tx = await contract.transfer(to, value);
    const receipt = await tx.wait();
    const t = extractTransfer(receipt);

    return {
      content: [
        {
          type: 'text',
          text:
            `✅ Transferred to ${to}\n` +
            `txHash: ${receipt?.hash ?? tx.hash}\n` +
            (t?.value != null
              ? `amount: ${ethers.formatUnits(t.value, decimals)}\n`
              : ''),
        },
      ],
    };
  }
);

// ==== D) 残高表示（balanceOf）====
server.registerTool(
  'balance_of',
  {
    title: 'Show balance',
    description: 'Reads balanceOf(address). If no address, uses the WALLET_PRIVATE_KEY address.',
    inputSchema: { address: z.string().optional().describe('0x-address (optional)') },
  },
  async ({ address }) => {
    const rpc = need('RPC_URL');
    const pk = need('WALLET_PRIVATE_KEY');
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract();

    const who = address ?? (await wallet.getAddress());
    const [decimals, bal] = await Promise.all([
      getDecimals(contract),
      contract.balanceOf(who),
    ]);

    return {
      content: [
        {
          type: 'text',
          text:
            `👛 Balance\n` +
            `address: ${who}\n` +
            `balance: ${ethers.formatUnits(bal, decimals)}\n`,
        },
      ],
    };
  }
);

await server.connect(new StdioServerTransport());
