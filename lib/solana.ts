/**
 * Solana blockchain utilities for TapTap Matrix
 */

import { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo, transfer } from '@solana/spl-token';

// Environment configuration
export const getSolanaConfig = () => {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const rpcUrl = process.env.SOLANA_RPC_URL || (
    network === 'mainnet' ? clusterApiUrl('mainnet-beta') : clusterApiUrl('devnet')
  );
  const tapMintAddress = process.env.TAP_MINT_ADDRESS;
  const tapMintAuthSecret = process.env.TAP_MINT_AUTH_SECRET;
  const decimals = Number(process.env.TAP_DECIMALS || 0);
  
  return {
    network,
    rpcUrl,
    tapMintAddress,
    tapMintAuthSecret,
    decimals,
  };
};

// Connection instance
export const getSolanaConnection = () => {
  const { rpcUrl } = getSolanaConfig();
  return new Connection(rpcUrl, 'confirmed');
};

// Get mint authority keypair from environment
export const getMintAuthority = (): Keypair => {
  const { tapMintAuthSecret } = getSolanaConfig();
  if (!tapMintAuthSecret) {
    throw new Error('TAP_MINT_AUTH_SECRET not configured');
  }
  
  const secret = Buffer.from(tapMintAuthSecret, 'base64');
  return Keypair.fromSecretKey(Uint8Array.from(secret));
};

// Mint TAP tokens to a recipient
export const mintTapTokens = async (
  recipientAddress: string,
  amount: number
): Promise<string> => {
  const { tapMintAddress, decimals } = getSolanaConfig();
  if (!tapMintAddress) {
    throw new Error('TAP_MINT_ADDRESS not configured');
  }

  const connection = getSolanaConnection();
  const mintAuthority = getMintAuthority();
  const recipient = new PublicKey(recipientAddress);
  const mint = new PublicKey(tapMintAddress);

  // Get or create associated token account
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    mintAuthority,
    mint,
    recipient
  );

  // Calculate raw amount with decimals
  const rawAmount = BigInt(amount) * (BigInt(10) ** BigInt(decimals));

  // Mint tokens
  const signature = await mintTo(
    connection,
    mintAuthority,
    mint,
    ata.address,
    mintAuthority,
    Number(rawAmount)
  );

  return signature;
};

// Transfer TAP tokens between accounts
export const transferTapTokens = async (
  fromKeypair: Keypair,
  toAddress: string,
  amount: number
): Promise<string> => {
  const { tapMintAddress, decimals } = getSolanaConfig();
  if (!tapMintAddress) {
    throw new Error('TAP_MINT_ADDRESS not configured');
  }

  const connection = getSolanaConnection();
  const mint = new PublicKey(tapMintAddress);
  const toPublicKey = new PublicKey(toAddress);

  // Get associated token accounts
  const fromAta = await getOrCreateAssociatedTokenAccount(
    connection,
    fromKeypair,
    mint,
    fromKeypair.publicKey
  );

  const toAta = await getOrCreateAssociatedTokenAccount(
    connection,
    fromKeypair,
    mint,
    toPublicKey
  );

  // Calculate raw amount with decimals
  const rawAmount = BigInt(amount) * (BigInt(10) ** BigInt(decimals));

  // Transfer tokens
  const signature = await transfer(
    connection,
    fromKeypair,
    fromAta.address,
    toAta.address,
    fromKeypair,
    Number(rawAmount)
  );

  return signature;
};

// Airdrop SOL for testing (devnet only)
export const airdropSol = async (
  publicKey: PublicKey,
  amount: number = 1
): Promise<string> => {
  const { network } = getSolanaConfig();
  if (network === 'mainnet') {
    throw new Error('Airdrop not available on mainnet');
  }

  const connection = getSolanaConnection();
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );

  // Wait for confirmation
  await connection.confirmTransaction(signature);
  return signature;
};

// Get SOL balance
export const getSolBalance = async (publicKey: PublicKey): Promise<number> => {
  const connection = getSolanaConnection();
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
};

// Get TAP token balance
export const getTapBalance = async (publicKey: PublicKey): Promise<number> => {
  const { tapMintAddress, decimals } = getSolanaConfig();
  if (!tapMintAddress) {
    throw new Error('TAP_MINT_ADDRESS not configured');
  }

  const connection = getSolanaConnection();
  const mint = new PublicKey(tapMintAddress);

  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      getMintAuthority(), // Use mint authority as payer for read operations
      mint,
      publicKey
    );

    const balance = await connection.getTokenAccountBalance(ata.address);
    const rawBalance = BigInt(balance.value.amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    
    return Number(rawBalance / divisor);
  } catch (error) {
    console.error('Error getting TAP balance:', error);
    return 0;
  }
};

// Generate a new keypair
export const generateKeypair = (): Keypair => {
  return Keypair.generate();
};

// Encrypt secret key for storage
export const encryptSecret = (secretKey: Uint8Array): string => {
  // For demo purposes, just base64 encode
  // In production, use proper encryption with SOLANA_WALLET_ENC_KEY
  return Buffer.from(secretKey).toString('base64');
};

// Decrypt secret key from storage
export const decryptSecret = (encryptedSecret: string): Uint8Array => {
  // For demo purposes, just base64 decode
  // In production, use proper decryption with SOLANA_WALLET_ENC_KEY
  return Uint8Array.from(Buffer.from(encryptedSecret, 'base64'));
};

// Alias for mintTapTokens to match expected import
export const mintTapTo = mintTapTokens;

// Validate Solana address
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};
