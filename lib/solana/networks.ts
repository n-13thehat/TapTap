import { clusterApiUrl } from "@solana/web3.js";
import type { ChainId } from "@prisma/client";

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export interface ChainMeta {
  chain: ChainId;
  network: SolanaCluster;
  rpcUrl: string;
  isMainnet: boolean;
  supportsAirdrop: boolean;
  label: string;
}

export const ALL_CHAINS: ChainId[] = [
  "SOLANA_DEVNET",
  "SOLANA_TESTNET",
  "SOLANA_MAINNET",
];

export function getChainMeta(chain: ChainId): ChainMeta {
  switch (chain) {
    case "SOLANA_DEVNET":
      return {
        chain,
        network: "devnet",
        rpcUrl: process.env.SOLANA_DEVNET_RPC || clusterApiUrl("devnet"),
        isMainnet: false,
        supportsAirdrop: true,
        label: "Solana Devnet",
      };
    case "SOLANA_TESTNET":
      return {
        chain,
        network: "testnet",
        rpcUrl: process.env.SOLANA_TESTNET_RPC || clusterApiUrl("testnet"),
        isMainnet: false,
        supportsAirdrop: true,
        label: "Solana Testnet",
      };
    case "SOLANA_MAINNET":
      return {
        chain,
        network: "mainnet-beta",
        rpcUrl:
          process.env.SOLANA_MAINNET_RPC || clusterApiUrl("mainnet-beta"),
        isMainnet: true,
        supportsAirdrop: false,
        label: "Solana Mainnet",
      };
  }
}
