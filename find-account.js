#!/usr/bin/env node

const { generateWallet, getStxAddress } = require('@stacks/wallet-sdk');

async function findAccount(mnemonic, targetAddress) {
  try {
    console.log('🔍 Searching for account with address:', targetAddress);
    console.log('');
    
    const wallet = await generateWallet({
      secretKey: mnemonic,
      password: '',
    });
    
    // Check first 10 accounts
    for (let i = 0; i < 10; i++) {
      const account = wallet.accounts[i];
      
      // Try testnet
      const testnetAddress = getStxAddress({
        account,
        transactionVersion: 0x80,
      });
      
      console.log(`Account ${i}: ${testnetAddress}`);
      
      if (testnetAddress === targetAddress) {
        console.log('');
        console.log('✅ FOUND IT!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Account Index: ${i}`);
        console.log(`Testnet Address: ${testnetAddress}`);
        console.log(`Private Key: ${account.stxPrivateKey}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('📋 Update your .env.deploy:');
        console.log(`STACKS_PRIVATE_KEY=${account.stxPrivateKey}`);
        return;
      }
    }
    
    console.log('');
    console.log('❌ Address not found in first 10 accounts');
    console.log('This might be a different wallet or derivation path');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const seedPhrase = process.argv[2];
const targetAddress = process.argv[3];

if (!seedPhrase || !targetAddress) {
  console.log('Usage: node find-account.js "seed phrase" "target-address"');
  process.exit(1);
}

findAccount(seedPhrase, targetAddress);
