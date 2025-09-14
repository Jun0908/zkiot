// src/index.ts
import { config as dotenv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  type Address,
} from 'viem';
import { mainnet } from 'viem/chains';
import { z } from 'zod';

// ── dotenv: 外部から起動されても .env を拾えるよう多段読み込み ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv({ path: path.join(__dirname, '../.env') });
dotenv({ path: path.join(__dirname, '../../.env'), override: false });

// ── ENV ──
const MAINNET_RPC_URL = (process.env.MAINNET_RPC_URL || '').trim();
const FALLBACK_MAINNET = 'https://cloudflare-eth.com'; // 無料のL1パブリックRPC
const DEFAULT_AGENT = (process.env.AGENT_ADDRESS || '').trim();

// Mainnet優先の viem client（ENSはL1での解決が公式推奨）
const primaryClient = createPublicClient({
  transport: http(MAINNET_RPC_URL || FALLBACK_MAINNET),
  chain: mainnet,
});

// ── MCP Server ──
const server = new McpServer({ name: 'ens-name-server', version: '1.1.0' });

// 入力スキーマ（ZodRawShape を inputSchema に渡す）
const EnsInputShape = {
  // どちらか一方（address or ensName）を受け付ける。両方省略なら AGENT_ADDRESS を使う
  address: z.string().optional(),   // 0x... もしくは誤って .eth が来た場合も許容して処理側で吸収
  ensName: z.string().optional(),   // "jun0908.eth" など
  withAvatar: z.boolean().optional(),      // ENS Avatar URL も返す
  preferShortened: z.boolean().optional(), // ENSなし時に短縮表記で返す（既定は false=フル）
} satisfies z.ZodRawShape;

const EnsInput = z.object(EnsInputShape);

// 正規化（前後空白・改行の除去）
const norm = (v?: string | null) => (v ?? '').trim() || null;

// ENS: 逆引き → 正引きで検証（推奨手順）
async function resolveEnsPrimary(
  addr: Address,
  opts: { withAvatar?: boolean; preferShortened?: boolean }
): Promise<string> {
  // 1) reverse（Primary ENS name）
  let name: string | null = null;
  try {
    name = await primaryClient.getEnsName({ address: addr });
  } catch (e) {
    console.error('[ENS] reverse lookup failed:', (e as Error).message);
  }

  // 2) 見つかった場合は forward で検証（スプーフィング防止）
  if (name) {
    try {
      const fwd = await primaryClient.getEnsAddress({ name });
      if (fwd && fwd.toLowerCase() === addr.toLowerCase()) {
        if (opts.withAvatar) {
          try {
            const avatar = await primaryClient.getEnsAvatar({ name });
            if (avatar) return `name=${name}\navatar=${avatar}`;
          } catch {
            /* avatar失敗は無視してENS名のみ返す */
          }
        }
        return name;
      }
      console.error('[ENS] forward verification failed. name:', name, 'addr:', addr);
    } catch (e) {
      console.error('[ENS] forward lookup error:', (e as Error).message);
    }
  }

  // 3) ENSが無い → アドレスで返す
  if (opts.preferShortened) {
    const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    return `No ENS set. Using address: ${short}`;
  }
  return `No ENS set. Using address: ${addr}`;
}

// ツール登録: agent_ens_name
server.registerTool(
  'agent_ens_name',
  {
    title: 'Get ENS primary name (and optionally avatar) for an address',
    description:
      'Returns the ENS primary name (reverse → verified by forward). ' +
      'Accepts { address?: "0x..", ensName?: "name.eth", withAvatar?: boolean, preferShortened?: boolean }. ' +
      'If both address and ensName are omitted, uses AGENT_ADDRESS from env.',
    inputSchema: EnsInputShape,
  },
  async (args) => {
    const { address, ensName, withAvatar, preferShortened } = EnsInput.parse(args ?? {});
    const addrRaw = norm(address);
    const nameRaw = norm(ensName);

    let checksum: Address | null = null;

    // 1) address が 0x... ならそのまま採用
    if (addrRaw && isAddress(addrRaw)) {
      checksum = getAddress(addrRaw) as Address;
    }
    // 2) ensName が来た or address に .eth が入っている → 正引きでアドレス取得
    else if (nameRaw || (addrRaw && /\.eth$/i.test(addrRaw))) {
      const name = (nameRaw || addrRaw)!;
      try {
        const fwd = await primaryClient.getEnsAddress({ name });
        if (!fwd) {
          return { content: [{ type: 'text', text: `❌ ENS not found for name: ${name}` }] };
        }
        checksum = getAddress(fwd) as Address;
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ ENS forward lookup failed: ${(e as Error).message}` }] };
      }
    }
    // 3) どちらも無ければ AGENT_ADDRESS を使う
    else {
      const envAddr = norm(DEFAULT_AGENT);
      if (!envAddr || !isAddress(envAddr)) {
        return {
          content: [{ type: 'text', text: '❌ address not provided and AGENT_ADDRESS invalid/missing' }],
        };
      }
      checksum = getAddress(envAddr) as Address;
    }

    try {
      const label = await resolveEnsPrimary(checksum, { withAvatar, preferShortened });
      return { content: [{ type: 'text', text: label }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `❌ ENS lookup failed: ${(e as Error).message}` }] };
    }
  }
);

// Startup（stdio: stdoutは使用しない。ログはstderrへ）
(async () => {
  try {
    await server.connect(new StdioServerTransport());
    console.error('[READY] ens-name-server started');
  } catch (err) {
    console.error('[FATAL] start failed:', err);
    process.exit(1);
  }
})();
