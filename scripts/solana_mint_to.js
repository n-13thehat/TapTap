// Mint TAP to a recipient on devnet using env-configured mint authority
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const envLocal = path.resolve('.env.local');
const envDefault = path.resolve('.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else if (fs.existsSync(envDefault)) dotenv.config({ path: envDefault });

function requireEnv(k){ const v = process.env[k]; if(!v) throw new Error(`Missing ${k}`); return v; }

async function main(){
  const [addr, amtStr] = process.argv.slice(2);
  if(!addr || !amtStr){
    console.error('Usage: node scripts/solana_mint_to.js <recipient_pubkey> <amount>');
    process.exit(1);
  }
  const amount = Number(amtStr);
  if(!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');

  const network = process.env.SOLANA_NETWORK || 'devnet';
  const rpc = process.env.SOLANA_RPC_URL || (network==='mainnet' ? clusterApiUrl('mainnet-beta') : clusterApiUrl('devnet'));
  const decimals = Number(process.env.TAP_DECIMALS || 0);
  const mintAddr = requireEnv('TAP_MINT_ADDRESS');
  const authB64 = requireEnv('TAP_MINT_AUTH_SECRET');

  const secret = Buffer.from(authB64, 'base64');
  const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(secret));
  const recipient = new PublicKey(addr);
  const mint = new PublicKey(mintAddr);

  const conn = new Connection(rpc, 'confirmed');

  const ata = await getOrCreateAssociatedTokenAccount(conn, mintAuthority, mint, recipient);
  const rawAmount = BigInt(amount) * (BigInt(10) ** BigInt(decimals));
  const sig = await mintTo(conn, mintAuthority, mint, ata.address, mintAuthority, Number(rawAmount));

  console.log('Minted', amount, 'TAP to', recipient.toBase58());
  console.log('Signature:', sig);
  if(network !== 'mainnet'){
    console.log('Explorer:', `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });

