#!/usr/bin/env node

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');
const fs = require('fs');

async function deployContract(contractPath, contractName, privateKey) {
  try {
    console.log(`\n🚀 Deploying ${contractName}...`);
    
    // Read contract source
    const codeBody = fs.readFileSync(contractPath, 'utf8');
    
    // Set up network
    const network = STACKS_TESTNET;
    
    // Create transaction
    const txOptions = {
      contractName: contractName,
      codeBody: codeBody,
      senderKey: privateKey,
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 100000n, // Use BigInt for fee
    };
    
    console.log('📝 Creating transaction...');
    const transaction = await makeContractDeploy(txOptions);
    
    // Broadcast transaction
    console.log('📡 Broadcasting transaction...');
    const broadcastResponse = await broadcastTransaction({
      transaction,
      network,
    });
    
    if (broadcastResponse.error) {
      console.log('❌ Error:', JSON.stringify(broadcastResponse, null, 2));
      return false;
    }
    
    console.log('✅ Success!');
    console.log('Transaction ID:', broadcastResponse.txid || broadcastResponse);
    console.log(`View on explorer: https://explorer.stacks.co/txid/${broadcastResponse.txid || broadcastResponse}?chain=testnet`);
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Get arguments
const contractPath = process.argv[2];
const contractName = process.argv[3];
const privateKey = process.env.STACKS_PRIVATE_KEY || process.argv[4];

if (!contractPath || !contractName || !privateKey) {
  console.log('Usage: node deploy-single.js <contract-path> <contract-name> [private-key]');
  console.log('Or set STACKS_PRIVATE_KEY environment variable');
  process.exit(1);
}

deployContract(contractPath, contractName, privateKey);
