// Minimal Solana helpers for testnet/devnet flows
// Uses dynamic imports to avoid bundling issues when not installed locally

export type SolConn = any;

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] || fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export async function getConnection(): Promise<SolConn> {
  const web3: any = await import('@solana/web3.js');
  const url = process.env.SOLANA_RPC_URL || (process.env.SOLANA_NETWORK === 'mainnet' ? web3.clusterApiUrl('mainnet-beta') : web3.clusterApiUrl('devnet'));
  return new web3.Connection(url, 'confirmed');
}

export async function generateKeypair(): Promise<{ publicKey: string; secretKey: Uint8Array }>{
  const web3: any = await import('@solana/web3.js');
  const kp = web3.Keypair.generate();
  return { publicKey: kp.publicKey.toBase58(), secretKey: kp.secretKey };
}

export function encryptSecret(secret: Uint8Array): { iv: string; data: string; tag: string } {
  const crypto = require('crypto');
  const keyRaw = getEnv('SOLANA_WALLET_ENC_KEY', '').trim();
  if (!keyRaw) throw new Error('SOLANA_WALLET_ENC_KEY required to encrypt wallet secret');
  const key = Buffer.from(keyRaw, 'base64');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(secret)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), data: enc.toString('base64'), tag: tag.toString('base64') };
}

export function decryptSecret(enc: { iv: string; data: string; tag: string }): Uint8Array {
  const crypto = require('crypto');
  const keyRaw = getEnv('SOLANA_WALLET_ENC_KEY', '').trim();
  if (!keyRaw) throw new Error('SOLANA_WALLET_ENC_KEY required to decrypt wallet secret');
  const key = Buffer.from(keyRaw, 'base64');
  const iv = Buffer.from(enc.iv, 'base64');
  const tag = Buffer.from(enc.tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(Buffer.from(enc.data, 'base64')), decipher.final()]);
  return new Uint8Array(dec);
}

export async function airdropSol(pubkey: string, lamports: number) {
  const web3: any = await import('@solana/web3.js');
  const conn = await getConnection();
  const pk = new web3.PublicKey(pubkey);
  try { await conn.requestAirdrop(pk, lamports); } catch {}
}

export async function mintTapTo(pubkey: string, amount: number) {
  const mintAddr = process.env.TAP_MINT_ADDRESS || '';
  if (!mintAddr) return; // no-op if mint not configured
  const web3: any = await import('@solana/web3.js');
  const spl: any = await import('@solana/spl-token');
  const conn = await getConnection();
  const feePayerPriv = process.env.TAP_MINT_AUTH_SECRET || '';
  if (!feePayerPriv) return;
  const feeKey = web3.Keypair.fromSecretKey(Buffer.from(feePayerPriv, 'base64'));
  const mint = new web3.PublicKey(mintAddr);
  const owner = new web3.PublicKey(pubkey);
  const ata = await spl.getOrCreateAssociatedTokenAccount(conn, feeKey, mint, owner);
  // Assume 0 decimals for TAP test mint or adjust via env TAP_DECIMALS
  const decimals = Number(process.env.TAP_DECIMALS || 0);
  const mintAmount = BigInt(amount) * BigInt(10 ** decimals);
  await spl.mintTo(conn, feeKey, mint, ata.address, feeKey, Number(mintAmount));
}

