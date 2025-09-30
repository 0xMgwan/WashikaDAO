#!/usr/bin/env node

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
} = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');
const fs = require('fs');

// Only the failed contracts
const contracts = [
  { path: 'contracts/governance-token.clar', name: 'governance-token-v2' },
  { path: 'contracts/washika-dao.clar', name: 'washika-dao-v2' },
  { path: 'contracts/timelock.clar', name: 'timelock-v2' },
  { path: 'contracts/treasury.clar', name: 'treasury-v2' },
  { path: 'contracts/community-pool.clar', name: 'community-pool-v2' },
  { path: 'contracts/savings-stx.clar', name: 'savings-stx-v2' },
  { path: 'contracts/savings-sbtc.clar', name: 'savings-sbtc-v2' },
  { path: 'contracts/stacking-strategy.clar', name: 'stacking-strategy-v2' },
  { path: 'contracts/interest-model-kink.clar', name: 'interest-model-kink-v2' },
  { path: 'contracts/lending-core.clar', name: 'lending-core-v2' },
  { path: 'contracts/liquidation.clar', name: 'liquidation-v2' },
  { path: 'contracts/oracle-aggregator.clar', name: 'oracle-aggregator-v2' },
];

async function deployContract(contractPath, contractName, privateKey) {
  try {
    console.log(`\n🚀 Deploying ${contractName}...`);
    
    const codeBody = fs.readFileSync(contractPath, 'utf8');
    const network = STACKS_TESTNET;
    
    const txOptions = {
      contractName: contractName,
      codeBody: codeBody,
      senderKey: privateKey,
      network: network,
      anchorMode: AnchorMode.Any,
      fee: 150000n, // Higher fee
      clarityVersion: 2, // Force Clarity 2
    };
    
    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction({
      transaction,
      network,
    });
    
    if (broadcastResponse.error) {
      console.log('❌ Error:', JSON.stringify(broadcastResponse, null, 2));
      return { success: false, txid: null };
    }
    
    const txid = broadcastResponse.txid || broadcastResponse;
    console.log('✅ Success! TX:', txid);
    
    return { success: true, txid };
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return { success: false, txid: null };
  }
}

async function redeployAll() {
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ STACKS_PRIVATE_KEY environment variable not set');
    process.exit(1);
  }
  
  console.log('🔄 Redeploying Failed Contracts with Clarity 2');
  console.log('==============================================\n');
  
  const results = [];
  
  for (const contract of contracts) {
    const result = await deployContract(contract.path, contract.name, privateKey);
    results.push({ ...contract, ...result });
    
    if (result.success) {
      console.log('⏳ Waiting 10 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('⚠️  Skipping wait\n');
    }
  }
  
  // Summary
  console.log('\n📊 Redeployment Summary');
  console.log('=======================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${contracts.length}`);
  console.log(`❌ Failed: ${failed.length}/${contracts.length}\n`);
  
  if (successful.length > 0) {
    console.log('✅ Successfully Deployed:');
    successful.forEach(r => {
      console.log(`  - ${r.name}: https://explorer.stacks.co/txid/${r.txid}?chain=testnet`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(r => console.log(`  - ${r.name}`));
  }
  
  console.log('\n🎉 Redeployment complete!');
}

redeployAll();
