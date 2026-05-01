export type ChainId = "SOLANA_DEVNET" | "SOLANA_TESTNET" | "SOLANA_MAINNET";
export type TokenKind = "ROOT" | "LAYER" | "PARTNER" | "EXPERIMENTAL";
export type TokenStatus = "DRAFT" | "DEPLOYED" | "FROZEN" | "RETIRED";
export type DeploymentStatus = "PENDING" | "DEPLOYED" | "FROZEN" | "FAILED";

export interface NetworkInfo {
  chain: ChainId;
  network: string;
  label: string;
  rpcUrl: string;
  rpcOverride: boolean;
  isMainnet: boolean;
  supportsAirdrop: boolean;
  deployable: boolean;
}

export interface NetworksResponse {
  ok: boolean;
  env: { kekPresent: boolean; treasuryPresent: boolean };
  chains: NetworkInfo[];
}

export interface DeploymentInfo {
  id: string;
  tokenId: string;
  chain: ChainId;
  mintAddress: string;
  mintAuthorityCipher?: string;
  mintAuthorityPubkey: string;
  freezeAuthorityPubkey: string | null;
  status: DeploymentStatus;
  supplyMinted: string;
  txCreate: string | null;
  txFreeze: string | null;
  deployedAt: string | null;
  notes: string | null;
}

export interface TokenSummary {
  id: string;
  name: string;
  symbol: string;
  description: string | null;
  kind: TokenKind;
  parentTokenId: string | null;
  status: TokenStatus;
  decimals: number;
  supplyCap: string | null;
  holderCap: number | null;
  freezeOnDeploy: boolean;
  metadataUri: string | null;
  createdAt: string;
  updatedAt: string;
  deployments: DeploymentInfo[];
  _count?: { children: number; auditEvents: number };
}

export interface AuditEvent {
  id: string;
  action: string;
  actorUserId: string;
  deploymentId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface TokenDetail extends TokenSummary {
  parent: { id: string; name: string; symbol: string; kind: TokenKind } | null;
  children: { id: string; name: string; symbol: string; kind: TokenKind; status: TokenStatus }[];
  recentAuditEvents: AuditEvent[];
}

export const CHAIN_LABEL: Record<ChainId, string> = {
  SOLANA_DEVNET: "Devnet",
  SOLANA_TESTNET: "Testnet",
  SOLANA_MAINNET: "Mainnet",
};

export const CHAIN_TONE: Record<ChainId, string> = {
  SOLANA_DEVNET: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  SOLANA_TESTNET: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  SOLANA_MAINNET: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export const STATUS_TONE: Record<string, string> = {
  DRAFT: "border-white/20 bg-white/10 text-white/70",
  DEPLOYED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  FROZEN: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  RETIRED: "border-white/15 bg-white/5 text-white/40",
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  FAILED: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export const KIND_TONE: Record<TokenKind, string> = {
  ROOT: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  LAYER: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
  PARTNER: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200",
  EXPERIMENTAL: "border-white/20 bg-white/10 text-white/60",
};

export function shortAddr(s: string | null | undefined, head = 4, tail = 4): string {
  if (!s) return "—";
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function expectedConfirm(action: string, symbol: string): string {
  return `MAINNET-${action}-${symbol}`;
}
