import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "STX Savings: deposit and withdrawal",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Test initial pool state
        let block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-pool-info', [], deployer.address),
        ]);
        
        const poolInfo = block.receipts[0].result.expectOk().expectTuple();
        assertEquals(poolInfo['total-stx'], types.uint(0));
        assertEquals(poolInfo['total-shares'], types.uint(0));

        // Test STX deposit
        block = chain.mineBlock([
            Tx.transferSTX(1000000000, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.savings-stx', wallet1.address), // 1000 STX
        ]);
        
        // The transfer should succeed, but we need to call deposit-stx
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'deposit-stx', [], wallet1.address, 1000000000),
        ]);
        
        block.receipts[0].result.expectOk(); // Should return shares minted

        // Check user shares
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-user-shares', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('savings-stx', 'get-user-stx-balance', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        // First deposit should mint shares 1:1 with SCALE_FACTOR
        block.receipts[0].result.expectUint(1000000000000000); // 1000 * SCALE_FACTOR
        block.receipts[1].result.expectUint(1000000000); // 1000 STX

        // Test partial withdrawal
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'withdraw-stx', [types.uint(500000000000000)], wallet1.address), // 500 shares
        ]);
        
        block.receipts[0].result.expectOk().expectUint(500000000); // Should return 500 STX

        // Check remaining balance
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-user-shares', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('savings-stx', 'get-user-stx-balance', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(500000000000000); // 500 shares remaining
        block.receipts[1].result.expectUint(500000000); // 500 STX remaining
    },
});

Clarinet.test({
    name: "STX Savings: multiple users and share calculation",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // First user deposits
        let block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'deposit-stx', [], wallet1.address, 1000000000), // 1000 STX
        ]);
        
        block.receipts[0].result.expectOk();

        // Second user deposits same amount
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'deposit-stx', [], wallet2.address, 1000000000), // 1000 STX
        ]);
        
        block.receipts[0].result.expectOk();

        // Check pool state
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-pool-info', [], deployer.address),
        ]);
        
        const poolInfo = block.receipts[0].result.expectOk().expectTuple();
        assertEquals(poolInfo['total-stx'], types.uint(2000000000)); // 2000 STX total
        assertEquals(poolInfo['total-shares'], types.uint(2000000000000000)); // 2000 * SCALE_FACTOR

        // Check individual balances
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-user-stx-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('savings-stx', 'get-user-stx-balance', [types.principal(wallet2.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(1000000000); // 1000 STX
        block.receipts[1].result.expectUint(1000000000); // 1000 STX

        // Test exchange rate
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-exchange-rate', [], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(1000000); // 1:1 ratio (SCALE_FACTOR)
    },
});

Clarinet.test({
    name: "STX Savings: stacking management",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Setup: deposit some STX
        let block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'deposit-stx', [], wallet1.address, 2000000000), // 2000 STX
        ]);
        
        block.receipts[0].result.expectOk();

        // Test enabling stacking (should fail for non-DAO)
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'enable-stacking', [], wallet1.address),
        ]);
        
        block.receipts[0].result.expectErr(types.uint(401)); // ERR_UNAUTHORIZED

        // Set stacking strategy first (as deployer/DAO)
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'set-stacking-strategy', [types.principal(deployer.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Enable stacking (as DAO)
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'enable-stacking', [], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check pool info
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-pool-info', [], deployer.address),
        ]);
        
        const poolInfo = block.receipts[0].result.expectOk().expectTuple();
        assertEquals(poolInfo['stacking-enabled'], types.bool(true));

        // Test initiate stacking
        const poxAddress = new ArrayBuffer(128);
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'initiate-stacking', [
                types.uint(1000000000), // 1000 STX
                types.buff(poxAddress),
                types.uint(1), // start cycle
                types.uint(6)  // lock period
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check stacked amount
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-pool-info', [], deployer.address),
        ]);
        
        const updatedPoolInfo = block.receipts[0].result.expectOk().expectTuple();
        assertEquals(updatedPoolInfo['stacked-stx'], types.uint(1000000000));
        assertEquals(updatedPoolInfo['available-stx'], types.uint(1000000000)); // 2000 - 1000
    },
});

Clarinet.test({
    name: "STX Savings: reward distribution",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // Setup: users deposit STX
        let block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'deposit-stx', [], wallet1.address, 1000000000), // 1000 STX
            Tx.contractCall('savings-stx', 'deposit-stx', [], wallet2.address, 1000000000), // 1000 STX
        ]);
        
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectOk();

        // Simulate reward harvest (as DAO)
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'harvest-pox-rewards', [
                types.uint(1), // cycle
                types.uint(100000000) // 1 BTC in satoshis
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check pending rewards for users
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-user-pending-btc', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('savings-stx', 'get-user-pending-btc', [types.principal(wallet2.address)], deployer.address),
        ]);
        
        // Each user should have 50% of rewards (equal shares)
        block.receipts[0].result.expectUint(50000000); // 0.5 BTC
        block.receipts[1].result.expectUint(50000000); // 0.5 BTC

        // Test claiming rewards
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'claim-btc-rewards', [], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(50000000);

        // Check accrued rewards after claim
        block = chain.mineBlock([
            Tx.contractCall('savings-stx', 'get-user-accrued-btc', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('savings-stx', 'get-user-pending-btc', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(0); // Should be reset after claim
        block.receipts[1].result.expectUint(0); // No new pending rewards
    },
});
