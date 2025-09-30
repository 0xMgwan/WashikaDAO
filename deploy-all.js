#!/usr/bin/env node

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
} = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');
const fs = require('fs');

// Contract deployment order
const contracts = [
  // Phase 1: Traits
  { path: 'contracts/traits/sip010-ft-trait.clar', name: 'sip010-ft-trait' },
  { path: 'contracts/traits/oracle-price-trait.clar', name: 'oracle-price-trait' },
  { path: 'contracts/traits/dao-governable-trait.clar', name: 'dao-governable-trait' },
  { path: 'contracts/traits/market-trait.clar', name: 'market-trait' },
  
  // Phase 2: Core
  { path: 'contracts/governance-token.clar', name: 'governance-token' },
  { path: 'contracts/washika-dao.clar', name: 'washika-dao' },
  { path: 'contracts/timelock.clar', name: 'timelock' },
  { path: 'contracts/treasury.clar', name: 'treasury' },
  
  // Phase 3: Community Pool ⭐
  { path: 'contracts/community-pool.clar', name: 'community-pool' },
  
  // Phase 4: Savings
  { path: 'contracts/savings-stx.clar', name: 'savings-stx' },
  { path: 'contracts/savings-sbtc.clar', name: 'savings-sbtc' },
  { path: 'contracts/stacking-strategy.clar', name: 'stacking-strategy' },
  
  // Phase 5: Lending
  { path: 'contracts/interest-model-kink.clar', name: 'interest-model-kink' },
  { path: 'contracts/lending-core.clar', name: 'lending-core' },
  { path: 'contracts/liquidation.clar', name: 'liquidation' },
  { path: 'contracts/oracle-aggregator.clar', name: 'oracle-aggregator' },
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
      fee: 100000n,
      clarityVersion: 2, // Use Clarity 2
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

async function deployAll() {
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('❌ STACKS_PRIVATE_KEY environment variable not set');
    process.exit(1);
  }
  
  console.log('🚀 WashikaDAO Deployment');
  console.log('========================\n');
  
  const results = [];
  
  for (const contract of contracts) {
    const result = await deployContract(contract.path, contract.name, privateKey);
    results.push({ ...contract, ...result });
    
    // Wait 10 seconds between deployments
    if (result.success) {
      console.log('⏳ Waiting 10 seconds before next deployment...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('⚠️  Skipping wait due to error\n');
    }
  }
  
  // Summary
  console.log('\n📊 Deployment Summary');
  console.log('=====================\n');
  
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
    console.log('\n❌ Failed Deployments:');
    failed.forEach(r => console.log(`  - ${r.name}`));
  }
  
  console.log('\n🎉 Deployment complete!');
}

deployAll();
