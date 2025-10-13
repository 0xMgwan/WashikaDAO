const fs = require('fs');
const path = require('path');

function updateFrontendConfig() {
  // Check if deployment info exists
  const deploymentFile = 'governance-deployment.json';
  if (!fs.existsSync(deploymentFile)) {
    console.error('❌ No deployment info found. Please deploy the contract first.');
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log('📋 Found deployment info:', deployment.contractAddress);

  // Update stacks.ts file
  const stacksFile = path.join('frontend', 'src', 'utils', 'stacks.ts');
  if (!fs.existsSync(stacksFile)) {
    console.error('❌ Frontend stacks.ts file not found');
    process.exit(1);
  }

  let stacksContent = fs.readFileSync(stacksFile, 'utf8');

  // Replace CONTRACT_ADDRESS
  const oldAddressPattern = /export const CONTRACT_ADDRESS = '[^']+';/;
  const newAddress = `export const CONTRACT_ADDRESS = '${deployment.deployerAddress}';`;
  stacksContent = stacksContent.replace(oldAddressPattern, newAddress);

  // Add SIMPLE_GOVERNANCE to CONTRACTS object if not exists
  if (!stacksContent.includes('SIMPLE_GOVERNANCE')) {
    const contractsPattern = /(export const CONTRACTS = \{[^}]*)/;
    const replacement = `$1  SIMPLE_GOVERNANCE: '${deployment.contractName}',\n`;
    stacksContent = stacksContent.replace(contractsPattern, replacement);
  }

  // Write updated file
  fs.writeFileSync(stacksFile, stacksContent);
  console.log('✅ Updated frontend/src/utils/stacks.ts');

  // Create a simple config file for reference
  const configContent = `// WashikaDAO Governance Configuration
// Generated automatically after deployment

export const GOVERNANCE_CONFIG = {
  contractAddress: '${deployment.contractAddress}',
  deployerAddress: '${deployment.deployerAddress}',
  contractName: '${deployment.contractName}',
  txid: '${deployment.txid}',
  deployedAt: '${deployment.deployedAt}',
  network: '${deployment.network}',
  explorerUrl: 'https://explorer.stacks.co/address/${deployment.contractAddress}?chain=testnet'
};
`;

  fs.writeFileSync(path.join('frontend', 'src', 'config', 'governance.ts'), configContent);
  console.log('✅ Created frontend/src/config/governance.ts');

  console.log('\n🎉 Frontend configuration updated!');
  console.log('📍 Contract Address:', deployment.contractAddress);
  console.log('🔗 Explorer:', `https://explorer.stacks.co/address/${deployment.contractAddress}?chain=testnet`);
}

if (require.main === module) {
  // Create config directory if it doesn't exist
  const configDir = path.join('frontend', 'src', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  updateFrontendConfig();
}

module.exports = { updateFrontendConfig };
