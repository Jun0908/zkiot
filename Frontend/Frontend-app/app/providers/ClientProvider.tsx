'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets, getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiConfig, http } from 'wagmi';
import {
  mainnet,
  sepolia,
  baseSepolia
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { toPrivyWallet } from '@privy-io/cross-app-connect/rainbow-kit';
import { useEffect, useState } from 'react';

// 環境変数から Privy App ID を取得
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm7a2v9xr033reh5g4kd3i7a0';

if (!PRIVY_APP_ID) {
  console.error("⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set. Please check your environment variables.");
} else {
  console.log("✅ Privy App ID:", PRIVY_APP_ID);
}

// QueryClient のインスタンスを作成
const queryClient = new QueryClient();

// チェーンを定義
const chains = [
  mainnet,
  sepolia,
  baseSepolia, 
] as const;

// WalletConnect のプロジェクトID
const projectId = '87e3393ad461835eee829b8e6adc2c3a';

// Privy Wallet のコネクター設定
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        toPrivyWallet({
          id: 'clxva96js0039k9pb3pw2uovx',
          name: 'Strawberry Fields',
          iconUrl: 'https://privy-assets-public.s3.amazonaws.com/strawberry.png',
        }),
      ],
    },
  ],
  {
    appName: 'test1031',
    projectId,
  }
);

/* 🔹 Manta Pacific を追加（"network" フィールドは削除）
export const mantaPacific: Chain = {
  id: 169,
  name: "Manta Pacific",
  nativeCurrency: {
    name: "Manta Token",
    symbol: "MANTA",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://pacific-rpc.manta.network/http"] },
    public: { http: ["https://pacific-rpc.manta.network/http"] },
  },
  blockExplorers: {
    default: {
      name: "Manta Pacific Explorer",
      url: "https://pacific-explorer.manta.network",
    },
  },
  testnet: false,
};
*/

// Wagmi & RainbowKit 設定
const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  // クライアント側でのみ PrivyProvider をレンダリング
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // SSR を防ぐために初回レンダリングをスキップ

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <PrivyProvider appId={PRIVY_APP_ID}>{children}</PrivyProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
