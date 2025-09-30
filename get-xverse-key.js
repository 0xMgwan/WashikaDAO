#!/usr/bin/env node

// Xverse uses a different derivation path than Leather
// Xverse: m/44'/5757'/0'/0/0 (BIP44)
// Leather: m/44'/5757'/0'/0 (different)

const bip39 = require('bip39');
const { HDKey } = require('@scure/bip32');
const { getPublicKey, publicKeyToAddress, TransactionVersion } = require('@stacks/transactions');

async function getXverseKey(mnemonic) {
  try {
    console.log('🔑 Deriving Xverse wallet keys...\n');
    
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Xverse derivation path for Stacks
    const path = "m/44'/5757'/0'/0/0";
    
    // Derive the key
    const hdKey = HDKey.fromMasterSeed(seed);
    const child = hdKey.derive(path);
    
    if (!child.privateKey) {
      throw new Error('Failed to derive private key');
    }
    
    // Get private key as hex (add 01 suffix for compressed key)
    const privateKeyHex = Buffer.from(child.privateKey).toString('hex') + '01';
    
    // Derive public key from private key using secp256k1
    const secp256k1 = require('@noble/secp256k1');
    const pubKeyBytes = secp256k1.getPublicKey(child.privateKey, true); // compressed
    
    // Hash the public key to get address hash (RIPEMD160(SHA256(pubkey)))
    const crypto = require('crypto');
    const sha256 = crypto.createHash('sha256').update(Buffer.from(pubKeyBytes)).digest();
    const ripemd160 = crypto.createHash('ripemd160').update(sha256).digest();
    
    // Get testnet address using c32
    const c32 = require('c32check');
    const testnetAddress = c32.c32address(26, ripemd160.toString('hex')); // 26 = testnet version
    
    console.log('✅ Xverse Wallet Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Derivation Path: ${path}`);
    console.log(`Testnet Address: ${testnetAddress}`);
    console.log(`Private Key: ${privateKeyHex}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Copy this to your .env.deploy file:');
    console.log(`STACKS_PRIVATE_KEY=${privateKeyHex}`);
    console.log('STACKS_NETWORK=testnet\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure you have the correct seed phrase from Xverse wallet');
  }
}

const seedPhrase = process.argv[2];

if (!seedPhrase) {
  console.log('❌ Please provide your Xverse seed phrase\n');
  console.log('Usage: node get-xverse-key.js "your twelve word seed phrase"\n');
  console.log('⚠️  Get your seed phrase from Xverse: Settings → Show Secret Recovery Phrase');
  process.exit(1);
}

getXverseKey(seedPhrase);
