const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = require('@stacks/transactions');
const { StacksTestnet } = require('@stacks/network');
const fs = require('fs');

async function deployPoolContract(poolName, contributionAmount, cycleBlocks, maxMembers, privateKey) {
  const network = new StacksTestnet();
  
  // Read the template contract
  const contractCode = fs.readFileSync('./contracts/rosca-pool-template.clar', 'utf8');
  
  // Generate unique contract name
  const contractName = `rosca-${poolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  
  console.log(`\n🚀 Deploying ${contractName}...`);
  console.log(`📝 Parameters:`);
  console.log(`   - Name: ${poolName}`);
  console.log(`   - Contribution: ${contributionAmount / 1000000} STX`);
  console.log(`   - Cycle: ${cycleBlocks} blocks`);
  console.log(`   - Max Members: ${maxMembers}`);
  
  try {
    const txOptions = {
      contractName,
      codeBody: contractCode,
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    
    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.error);
    }

    console.log('✅ Success!');
    console.log(`Transaction ID: ${broadcastResponse.txid}`);
    console.log(`Contract: ${txOptions.senderKey ? 'YOUR_ADDRESS' : 'UNKNOWN'}.${contractName}`);
    console.log(`View on explorer: https://explorer.stacks.co/txid/${broadcastResponse.txid}?chain=testnet`);
    
    return {
      txid: broadcastResponse.txid,
      contractName,
    };
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log('Usage: node deploy-pool.js <name> <contribution-stx> <cycle-days> <max-members>');
    console.log('Example: node deploy-pool.js "Village Pool" 5 7 10');
    process.exit(1);
  }

  const [name, contributionSTX, cycleDays, maxMembers] = args;
  const contributionAmount = Math.floor(parseFloat(contributionSTX) * 1000000);
  const cycleBlocks = parseInt(cycleDays) * 144;
  
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: STACKS_PRIVATE_KEY environment variable not set');
    process.exit(1);
  }

  deployPoolContract(name, contributionAmount, cycleBlocks, parseInt(maxMembers), privateKey)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { deployPoolContract };
