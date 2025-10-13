import {
  AppConfig,
  UserSession,
  showConnect,
  openContractCall,
  openSTXTransfer,
} from '@stacks/connect';
import {
  StacksTestnet,
  StacksMainnet,
  StacksNetwork,
} from '@stacks/network';
import {
  callReadOnlyFunction,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  listCV,
  bufferCV,
  principalCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
} from '@stacks/transactions';

// App configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

// Network configuration
export const network: StacksNetwork = process.env.NODE_ENV === 'production' 
  ? new StacksMainnet() 
  : new StacksTestnet();

// Contract addresses (update these with actual deployed addresses)
export const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';

export const CONTRACTS = {
  SIMPLE_GOVERNANCE: 'simple-governance',
  WASHIKA_DAO: 'washika-dao',
  TREASURY: 'treasury',
  SAVINGS_STX: 'savings-stx',
  SAVINGS_SBTC: 'savings-sbtc',
  LENDING_CORE: 'lending-core',
  ORACLE_AGGREGATOR: 'oracle-aggregator',
  TIMELOCK: 'timelock',
} as const;

// Utility functions
export const connectWallet = () => {
  showConnect({
    appDetails: {
      name: 'WashikaDAO',
      icon: '/logo.svg',
    },
    redirectTo: '/',
    onFinish: () => {
      window.location.reload();
    },
    userSession,
  });
};

export const disconnectWallet = () => {
  userSession.signUserOut('/');
};

export const getUserAddress = (): string | null => {
  if (userSession.isUserSignedIn()) {
    return userSession.loadUserData().profile.stxAddress.testnet;
  }
  return null;
};

// Read-only contract calls
export const callReadOnly = async (
  contractName: string,
  functionName: string,
  functionArgs: any[] = [],
  senderAddress?: string
) => {
  try {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName,
      functionName,
      functionArgs,
      senderAddress: senderAddress || getUserAddress() || CONTRACT_ADDRESS,
      network,
    });
    return result;
  } catch (error) {
    console.error('Read-only call failed:', error);
    throw error;
  }
};

// Contract call wrapper
export const makeContractCall = async (
  contractName: string,
  functionName: string,
  functionArgs: any[] = [],
  postConditions: any[] = [],
  postConditionMode: PostConditionMode = PostConditionMode.Deny
) => {
  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName,
      functionName,
      functionArgs,
      postConditions,
      postConditionMode,
      network,
      onFinish: (data) => {
        resolve(data);
      },
      onCancel: () => {
        reject(new Error('Transaction cancelled'));
      },
    });
  });
};

// STX transfer wrapper
export const transferSTX = async (
  amount: number,
  recipient: string,
  memo?: string
) => {
  return new Promise((resolve, reject) => {
    openSTXTransfer({
      recipient,
      amount: amount.toString(),
      memo,
      network,
      onFinish: (data) => {
        resolve(data);
      },
      onCancel: () => {
        reject(new Error('Transfer cancelled'));
      },
    });
  });
};

// Simple Governance functions
export const getProposalCount = async () => {
  return callReadOnly(
    CONTRACTS.SIMPLE_GOVERNANCE,
    'get-proposal-count',
    []
  );
};

export const getSimpleProposal = async (proposalId: number) => {
  return callReadOnly(
    CONTRACTS.SIMPLE_GOVERNANCE,
    'get-proposal',
    [uintCV(proposalId)]
  );
};

export const createSimpleProposal = async (
  title: string,
  description: string,
  proposalType: string,
  amount?: number,
  recipient?: string
) => {
  const args: any[] = [
    stringUtf8CV(title),
    stringUtf8CV(description),
    stringAsciiCV(proposalType)
  ];
  
  if (amount !== undefined) {
    args.push(uintCV(amount));
  }
  
  if (recipient) {
    args.push(principalCV(recipient));
  }
  
  return makeContractCall(
    CONTRACTS.SIMPLE_GOVERNANCE,
    'create-proposal',
    args
  );
};

export const castSimpleVote = async (proposalId: number, support: number) => {
  return makeContractCall(
    CONTRACTS.SIMPLE_GOVERNANCE,
    'cast-vote',
    [uintCV(proposalId), uintCV(support)]
  );
};

// DAO functions
export const getProposal = async (proposalId: number) => {
  return callReadOnly(
    CONTRACTS.WASHIKA_DAO,
    'get-proposal',
    [uintCV(proposalId)]
  );
};

export const getProposalState = async (proposalId: number) => {
  return callReadOnly(
    CONTRACTS.WASHIKA_DAO,
    'get-proposal-state',
    [uintCV(proposalId)]
  );
};

export const createProposal = async (
  targets: string[],
  values: number[],
  signatures: string[],
  calldatas: Uint8Array[],
  description: string
) => {
  return makeContractCall(
    CONTRACTS.WASHIKA_DAO,
    'propose',
    [
      listCV(targets.map(target => principalCV(target))),
      listCV(values.map(value => uintCV(value))),
      listCV(signatures.map(sig => stringAsciiCV(sig))),
      listCV(calldatas.map(data => bufferCV(data))),
      stringUtf8CV(description),
    ]
  );
};

export const castVote = async (proposalId: number, support: number) => {
  return makeContractCall(
    CONTRACTS.WASHIKA_DAO,
    'cast-vote',
    [uintCV(proposalId), uintCV(support)]
  );
};

// Savings functions
export const depositSTX = async (amount: number) => {
  const postConditions = [
    makeStandardSTXPostCondition(
      getUserAddress()!,
      FungibleConditionCode.Equal,
      amount
    ),
  ];

  return makeContractCall(
    CONTRACTS.SAVINGS_STX,
    'deposit-stx',
    [],
    postConditions,
    PostConditionMode.Deny
  );
};

export const withdrawSTX = async (shares: number) => {
  return makeContractCall(
    CONTRACTS.SAVINGS_STX,
    'withdraw-stx',
    [uintCV(shares)]
  );
};

export const getUserShares = async (address: string) => {
  return callReadOnly(
    CONTRACTS.SAVINGS_STX,
    'get-user-shares',
    [principalCV(address)]
  );
};

export const getUserSTXBalance = async (address: string) => {
  return callReadOnly(
    CONTRACTS.SAVINGS_STX,
    'get-user-stx-balance',
    [principalCV(address)]
  );
};

export const getPoolInfo = async () => {
  return callReadOnly(CONTRACTS.SAVINGS_STX, 'get-pool-info');
};

// Lending functions
export const supplySTX = async (amount: number) => {
  const postConditions = [
    makeStandardSTXPostCondition(
      getUserAddress()!,
      FungibleConditionCode.Equal,
      amount
    ),
  ];

  return makeContractCall(
    CONTRACTS.LENDING_CORE,
    'supply-stx',
    [],
    postConditions,
    PostConditionMode.Deny
  );
};

export const borrowSTX = async (amount: number) => {
  return makeContractCall(
    CONTRACTS.LENDING_CORE,
    'borrow-stx',
    [uintCV(amount)]
  );
};

export const repaySTX = async (amount: number) => {
  const postConditions = [
    makeStandardSTXPostCondition(
      getUserAddress()!,
      FungibleConditionCode.Equal,
      amount
    ),
  ];

  return makeContractCall(
    CONTRACTS.LENDING_CORE,
    'repay-stx',
    [],
    postConditions,
    PostConditionMode.Deny
  );
};

export const getAccountLiquidity = async (address: string) => {
  return callReadOnly(
    CONTRACTS.LENDING_CORE,
    'get-account-liquidity',
    [principalCV(address)]
  );
};

// Oracle functions
export const getPrice = async (pair: string) => {
  return callReadOnly(
    CONTRACTS.ORACLE_AGGREGATOR,
    'get-price',
    [stringAsciiCV(pair)]
  );
};

// Utility function to safely extract values from Clarity responses
export const extractClarityValue = (clarityValue: any): any => {
  if (!clarityValue) return null;
  
  // Handle different Clarity types
  if (clarityValue.type) {
    switch (clarityValue.type) {
      case 'uint':
      case 'int':
        // Convert BigInt to number for easier handling in UI
        return typeof clarityValue.value === 'bigint' ? Number(clarityValue.value) : clarityValue.value;
      case 'bool':
        return clarityValue.value;
      case 'string-ascii':
      case 'string-utf8':
        return clarityValue.value;
      case 'tuple':
        // Extract tuple data - this is likely what proposals are
        const tupleData: any = {};
        if (clarityValue.value) {
          Object.keys(clarityValue.value).forEach(key => {
            tupleData[key] = extractClarityValue(clarityValue.value[key]);
          });
        }
        return tupleData;
      case 'optional':
        // Handle optional values - proposals might be wrapped in optional
        if (clarityValue.value === null) return null;
        return extractClarityValue(clarityValue.value);
      case 'list':
        return clarityValue.value?.map((item: any) => extractClarityValue(item)) || [];
      default:
        return clarityValue.value;
    }
  }
  
  // Fallback for simple values
  if (typeof clarityValue === 'string' || typeof clarityValue === 'number') {
    return clarityValue;
  }
  
  // If it has a value property, extract it
  if (clarityValue.value !== undefined) {
    return extractClarityValue(clarityValue.value);
  }
  
  return clarityValue;
};

// Utility functions for formatting
export const formatSTX = (amount: number): string => {
  return (amount / 1_000_000).toFixed(6);
};

export const formatWASHA = (amount: number): string => {
  return (amount / 1_000_000).toFixed(6);
};

export const formatBTC = (amount: number): string => {
  return (amount / 100_000_000).toFixed(8);
};

export const parseSTX = (amount: string): number => {
  return Math.floor(parseFloat(amount) * 1_000_000);
};

export const parseWASHA = (amount: string): number => {
  return Math.floor(parseFloat(amount) * 1_000_000);
};

// Transaction status helpers
export const waitForTransaction = async (txId: string): Promise<any> => {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txId}`);
      const tx = await response.json();
      
      if (tx.tx_status === 'success') {
        return tx;
      } else if (tx.tx_status === 'abort_by_response' || tx.tx_status === 'abort_by_post_condition') {
        throw new Error(`Transaction failed: ${tx.tx_status}`);
      }
      
      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      if (attempts === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
  }
  
  throw new Error('Transaction timeout');
};
