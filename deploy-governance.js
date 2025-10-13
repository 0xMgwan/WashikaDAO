#!/usr/bin/env node

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
} = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');
const fs = require('fs');

async function deployGovernanceContract(privateKey) {
  try {
    console.log(`\n🚀 Deploying simple-governance...`);
    
    const codeBody = fs.readFileSync('./contracts/simple-governance.clar', 'utf8');
    const network = STACKS_TESTNET;
    
    const txOptions = {
      contractName: 'simple-governance',
      codeBody: codeBody,
      senderKey: privateKey,
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 150000n,
      clarityVersion: 2,
    };
    
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
    const contractAddress = `${deployerAddress}.simple-governance`;

    console.log('✅ SUCCESS!');
    console.log(`📍 Contract: ${contractAddress}`);
    console.log(`🔗 TX: ${broadcastResponse.txid}`);
    console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${broadcastResponse.txid}?chain=testnet`);
    
    // Update frontend
    const stacksFile = './frontend/src/utils/stacks.ts';
    if (fs.existsSync(stacksFile)) {
      let content = fs.readFileSync(stacksFile, 'utf8');
      content = content.replace(/export const CONTRACT_ADDRESS = '[^']+';/, `export const CONTRACT_ADDRESS = '${deployerAddress}';`);
      if (!content.includes('SIMPLE_GOVERNANCE')) {
        content = content.replace(/(export const CONTRACTS = \{[^}]*)/, `$1  SIMPLE_GOVERNANCE: 'simple-governance',\n`);
      }
      fs.writeFileSync(stacksFile, content);
      console.log('✅ Frontend updated!');
    }
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      deployerAddress,
      contractName: 'simple-governance',
      txid: broadcastResponse.txid,
      deployedAt: new Date().toISOString(),
      network: 'testnet'
    };
    
    fs.writeFileSync('governance-deployment.json', JSON.stringify(deploymentInfo, null, 2));
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
    const result = await deployGovernanceContract(privateKey);
    
    console.log('\n🎉 GOVERNANCE DEPLOYED!');
    console.log('========================');
    console.log(`✅ Contract: ${result.contractAddress}`);
    console.log(`✅ Transaction: ${result.txid}`);
    console.log(`✅ Frontend updated with new address`);
    console.log('\n🔧 Next Steps:');
    console.log('1. Wait ~30 seconds for confirmation');
    console.log('2. Test governance in your app');
    console.log('3. Create your first proposal!');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployGovernanceContract };
