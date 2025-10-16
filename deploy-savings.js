#!/usr/bin/env node

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
} = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');
const fs = require('fs');

async function deploySavings(privateKey) {
  try {
    console.log(`\n🚀 Deploying savings-stx contract...`);
    
    const codeBody = fs.readFileSync('./contracts/savings-stx.clar', 'utf8');
    const network = STACKS_TESTNET;
    
    const txOptions = {
      contractName: 'savings-stx-v4',
      codeBody: codeBody,
      senderKey: privateKey,
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 300000n,  // Higher fee for priority
      clarityVersion: 2,
    };
    
    console.log('📝 Bulletproof contract features:');
    console.log('   - Ultra-simple 1:1 ratio (no complex math)');
    console.log('   - No division operations (prevents division by zero)');
    console.log('   - Minimal logic (reduces failure points)');
    console.log('   - Direct STX transfers');
    
    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction({
      transaction,
      network,
    });
    
    if (broadcastResponse.error) {
      console.log('❌ Error:', JSON.stringify(broadcastResponse, null, 2));
      throw new Error(broadcastResponse.error);
    }

    const deployerAddress = transaction.auth.spendingCondition.signer;
    const contractAddress = `${deployerAddress}.savings-stx-v4`;

    console.log('✅ SUCCESS!');
    console.log(`📍 Contract: ${contractAddress}`);
    console.log(`🔗 TX: ${broadcastResponse.txid}`);
    console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${broadcastResponse.txid}?chain=testnet`);
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      deployerAddress,
      contractName: 'savings-stx-v4',
      txid: broadcastResponse.txid,
      deployedAt: new Date().toISOString(),
      network: 'testnet'
    };
    
    fs.writeFileSync('savings-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('💾 Saved deployment info');
    
    return {
      txid: broadcastResponse.txid,
      contractAddress,
      deployerAddress
    };
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

async function main() {
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ STACKS_PRIVATE_KEY not set');
    process.exit(1);
  }

  try {
    const result = await deploySavings(privateKey);
    
    console.log('\n🎉 BULLETPROOF SAVINGS CONTRACT DEPLOYED!');
    console.log('========================================');
    console.log(`✅ Contract: ${result.contractAddress}`);
    console.log(`✅ Transaction: ${result.txid}`);
    console.log('\n🔧 Next Steps:');
    console.log('1. Wait ~5-10 minutes for confirmation');
    console.log('2. Update frontend to use v4 contract');
    console.log('3. Test with ultra-simple logic');
    console.log('\n💡 Maximum simplicity = maximum reliability!');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deploySavings };
