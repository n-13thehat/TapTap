// Devnet $TAP mint setup script
// - Generates a mint authority keypair
// - Airdrops SOL
// - Creates the mint with configured decimals
// - Writes/updates .env.local with required variables

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { createMint } from '@solana/spl-token';

function log(...a){ console.log('[solana:setup]', ...a); }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function airdropWithRetry(conn, pubkey, sol=2, retries=8){
  for(let i=1;i<=retries;i++){
    try{
      const sig = await conn.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
      // Confirm
      await conn.confirmTransaction(sig, 'confirmed');
      return;
    }catch(e){
      log(`Airdrop attempt ${i} failed:`, e.message || e);
      await sleep(Math.min(1000*i, 8000));
    }
  }
  throw new Error('Airdrop failed after retries');
}

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function toBase64(u8){ return Buffer.from(u8).toString('base64'); }

function upsertEnv(entries){
  const envPath = path.resolve('.env.local');
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  const map = new Map();
  for(const line of lines){
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if(m) map.set(m[1], m[2]);
  }
  for(const [k,v] of Object.entries(entries)){
    map.set(k, String(v));
  }
  const out = Array.from(map.entries()).map(([k,v])=>`${k}=${v}`).join(os.EOL) + os.EOL;
  fs.writeFileSync(envPath, out);
  return envPath;
}

async function main(){
  const DECIMALS = Number(process.env.TAP_DECIMALS || 0);
  const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
  const RPC = process.env.SOLANA_RPC_URL || (NETWORK==='mainnet' ? clusterApiUrl('mainnet-beta') : clusterApiUrl('devnet'));

  log('Connecting to', RPC);
  const conn = new Connection(RPC, 'confirmed');

  // Generate mint authority / fee payer
  const mintAuth = Keypair.generate();
  const mintAuthPub = mintAuth.publicKey;
  log('Mint authority pubkey:', mintAuthPub.toBase58());

  log('Airdropping 2 SOL to mint authority...');
  await airdropWithRetry(conn, mintAuthPub, 2);

  log('Creating mint with decimals =', DECIMALS);
  const mintPubkey = await createMint(conn, mintAuth, mintAuth.publicKey, mintAuth.publicKey, DECIMALS);
  const mintAddr = mintPubkey.toBase58();
  log('Mint created:', mintAddr);

  // Secrets output
  const secretsDir = path.resolve('secrets');
  ensureDir(secretsDir);
  const mintAuthFile = path.join(secretsDir, 'devnet-mint-authority.json');
  fs.writeFileSync(mintAuthFile, JSON.stringify(Array.from(mintAuth.secretKey)));
  log('Saved mint authority secret to', mintAuthFile);

  // Base64 for app env
  const tapMintAuthB64 = toBase64(mintAuth.secretKey);
  // Generate 32-byte AES key for wallet encryption
  const encKeyB64 = crypto.randomBytes(32).toString('base64');

  const envPath = upsertEnv({
    SOLANA_NETWORK: 'devnet',
    SOLANA_RPC_URL: RPC,
    TAP_MINT_ADDRESS: mintAddr,
    TAP_MINT_AUTH_SECRET: tapMintAuthB64,
    SOLANA_WALLET_ENC_KEY: encKeyB64,
    TAP_DECIMALS: DECIMALS,
  });

  log('Wrote required env vars to', envPath);
  console.log('\n=== Devnet $TAP Summary ===');
  console.log('Mint:             ', mintAddr);
  console.log('Mint Authority:   ', mintAuthPub.toBase58());
  console.log('Env file:         ', envPath);
  console.log('\nAdd funds to authority if needed:', 'solana airdrop 2', mintAuthPub.toBase58());
}

main().catch((e)=>{ console.error(e); process.exit(1); });

