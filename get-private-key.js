#!/usr/bin/env node

// Script to derive private key from seed phrase
// Usage: node get-private-key.js "your seed phrase here"

const { generateWallet, getStxAddress } = require('@stacks/wallet-sdk');

async function derivePrivateKey(mnemonic) {
  try {
    console.log('🔑 Deriving private key from seed phrase...\n');
    
    // Generate wallet from mnemonic
    const wallet = await generateWallet({
      secretKey: mnemonic,
      password: '',
    });
    
    // Get the first account (index 0)
    const account = wallet.accounts[0];
    
    // Get testnet address (using index for testnet)
    const testnetAddress = getStxAddress({
      account,
      transactionVersion: 0x80, // Testnet version
    });
    
    console.log('✅ Wallet Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Testnet Address: ${testnetAddress}`);
    console.log(`Private Key: ${account.stxPrivateKey}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Copy this to your .env.deploy file:');
    console.log(`STACKS_PRIVATE_KEY=${account.stxPrivateKey}`);
    console.log('STACKS_NETWORK=testnet\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nUsage: node get-private-key.js "your twelve word seed phrase here"');
  }
}

// Get seed phrase from command line argument
const seedPhrase = process.argv[2];

if (!seedPhrase) {
  console.log('❌ Please provide your seed phrase as an argument\n');
  console.log('Usage: node get-private-key.js "your twelve word seed phrase here"\n');
  console.log('⚠️  WARNING: Never share your seed phrase or private key with anyone!');
  process.exit(1);
}

derivePrivateKey(seedPhrase);
