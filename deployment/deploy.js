#!/usr/bin/env node

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} = require('@stacks/transactions');
const { StacksTestnet } = require('@stacks/network');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = new StacksTestnet();
const CONTRACTS_DIR = path.join(__dirname, '../contracts');
const FRONTEND_STACKS_FILE = path.join(__dirname, '../frontend/src/utils/stacks.ts');

/**
 * Deploy a contract to Stacks blockchain
 */
async function deployContract(contractName, contractFile, privateKey, options = {}) {
  try {
    console.log(`\n🚀 Deploying ${contractName}...`);
    
    const codeBody = fs.readFileSync(path.join(CONTRACTS_DIR, contractFile), 'utf8');
    
    const txOptions = {
      contractName,
      codeBody,
      senderKey: privateKey,
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      fee: options.fee || 150000n,
      clarityVersion: 2,
      postConditionMode: PostConditionMode.Allow,
    };
    
    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction({
      transaction,
      network: NETWORK,
    });
    
    if (broadcastResponse.error) {
      console.log('❌ Error:', JSON.stringify(broadcastResponse, null, 2));
      throw new Error(broadcastResponse.error);
    }

    const deployerAddress = transaction.auth.spendingCondition.signer;
    const contractAddress = `${deployerAddress}.${contractName}`;

    console.log('✅ SUCCESS!');
    console.log(`📍 Contract: ${contractAddress}`);
    console.log(`🔗 TX: ${broadcastResponse.txid}`);
    console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${broadcastResponse.txid}?chain=testnet`);
    
    return {
      txid: broadcastResponse.txid,
      contractAddress,
      deployerAddress,
      contractName,
      deployedAt: new Date().toISOString(),
      network: 'testnet'
    };
  } catch (error) {
    console.error(`❌ Deployment failed for ${contractName}:`, error.message);
    throw error;
  }
}

/**
 * Deploy governance contract
 */
async function deployGovernance(privateKey) {
  const result = await deployContract('simple-governance', 'simple-governance.clar', privateKey);
  
  // Update frontend configuration
  updateFrontendConfig(result.deployerAddress, 'GOVERNANCE_CONTRACT_ADDRESS');
  
  return result;
}

/**
 * Deploy savings contract
 */
async function deploySavings(privateKey) {
  const result = await deployContract('savings-stx-v4', 'savings-stx.clar', privateKey, {
    fee: 300000n // Higher fee for priority
  });
  
  // Update frontend configuration
  updateFrontendConfig(result.deployerAddress, 'CONTRACT_ADDRESS');
  
  return result;
}

/**
 * Deploy pool factory contract
 */
async function deployPoolFactory(privateKey) {
  const result = await deployContract('pool-factory-v3', 'pool-factory.clar', privateKey);
  
  return result;
}

/**
 * Deploy individual pool contract
 */
async function deployPool(poolName, contributionAmount, cycleBlocks, maxMembers, privateKey) {
  // Generate unique contract name
  const contractName = `rosca-${poolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  
  console.log(`\n🚀 Deploying ${contractName}...`);
  console.log(`📝 Parameters:`);
  console.log(`   - Name: ${poolName}`);
  console.log(`   - Contribution: ${contributionAmount / 1000000} STX`);
  console.log(`   - Cycle: ${cycleBlocks} blocks`);
  console.log(`   - Max Members: ${maxMembers}`);
  
  const result = await deployContract(contractName, 'rosca-pool-template.clar', privateKey);
  
  return result;
}

/**
 * Update frontend configuration with new contract address
 */
function updateFrontendConfig(deployerAddress, addressConstant = 'CONTRACT_ADDRESS') {
  if (fs.existsSync(FRONTEND_STACKS_FILE)) {
    let content = fs.readFileSync(FRONTEND_STACKS_FILE, 'utf8');
    content = content.replace(
      new RegExp(`export const ${addressConstant} = '[^']+';`), 
      `export const ${addressConstant} = '${deployerAddress}';`
    );
    fs.writeFileSync(FRONTEND_STACKS_FILE, content);
    console.log('✅ Frontend configuration updated!');
  }
}

/**
 * Save deployment information to JSON file
 */
function saveDeploymentInfo(deployments, filename = 'deployments.json') {
  const deploymentPath = path.join(__dirname, filename);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
  console.log(`💾 Deployment info saved to ${filename}`);
}

/**
 * Deploy all core contracts
 */
async function deployAll(privateKey) {
  const deployments = {};
  
  try {
    console.log('\n🚀 DEPLOYING ALL WASHIKADAO CONTRACTS');
    console.log('=====================================');
    
    // Deploy governance
    console.log('\n1️⃣ Deploying Governance Contract...');
    deployments.governance = await deployGovernance(privateKey);
    
    // Deploy savings
    console.log('\n2️⃣ Deploying Savings Contract...');
    deployments.savings = await deploySavings(privateKey);
    
    // Deploy pool factory
    console.log('\n3️⃣ Deploying Pool Factory...');
    deployments.poolFactory = await deployPoolFactory(privateKey);
    
    // Save all deployment info
    saveDeploymentInfo(deployments);
    
    console.log('\n🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!');
    console.log('======================================');
    console.log(`✅ Governance: ${deployments.governance.contractAddress}`);
    console.log(`✅ Savings: ${deployments.savings.contractAddress}`);
    console.log(`✅ Pool Factory: ${deployments.poolFactory.contractAddress}`);
    console.log('\n🔧 Next Steps:');
    console.log('1. Wait ~30 seconds for confirmations');
    console.log('2. Test all contracts in your dApp');
    console.log('3. Create your first pool and proposal!');
    
    return deployments;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ STACKS_PRIVATE_KEY environment variable not set');
    console.error('💡 Set it with: export STACKS_PRIVATE_KEY=your_private_key');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'governance':
        await deployGovernance(privateKey);
        break;
        
      case 'savings':
        await deploySavings(privateKey);
        break;
        
      case 'pool-factory':
        await deployPoolFactory(privateKey);
        break;
        
      case 'pool':
        if (args.length < 5) {
          console.log('Usage: node deploy.js pool <name> <contribution-stx> <cycle-days> <max-members>');
          console.log('Example: node deploy.js pool "Village Pool" 5 7 10');
          process.exit(1);
        }
        const [, name, contributionSTX, cycleDays, maxMembers] = args;
        const contributionAmount = Math.floor(parseFloat(contributionSTX) * 1000000);
        const cycleBlocks = parseInt(cycleDays) * 144;
        await deployPool(name, contributionAmount, cycleBlocks, parseInt(maxMembers), privateKey);
        break;
        
      case 'all':
        await deployAll(privateKey);
        break;
        
      default:
        console.log('🚀 WashikaDAO Contract Deployment Tool');
        console.log('=====================================');
        console.log('');
        console.log('Usage: node deploy.js <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  governance              Deploy governance contract');
        console.log('  savings                 Deploy STX savings contract');
        console.log('  pool-factory           Deploy pool factory contract');
        console.log('  pool <name> <stx> <days> <members>  Deploy individual pool');
        console.log('  all                    Deploy all core contracts');
        console.log('');
        console.log('Examples:');
        console.log('  node deploy.js governance');
        console.log('  node deploy.js pool "Village Pool" 5 7 10');
        console.log('  node deploy.js all');
        console.log('');
        console.log('Environment:');
        console.log('  STACKS_PRIVATE_KEY     Your Stacks private key (required)');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  deployContract,
  deployGovernance,
  deploySavings,
  deployPoolFactory,
  deployPool,
  deployAll,
  updateFrontendConfig,
  saveDeploymentInfo,
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
