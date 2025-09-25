import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Governance token: basic minting and transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // Test initial state
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-total-supply', [], deployer.address),
            Tx.contractCall('governance-token', 'get-balance', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(0);
        block.receipts[1].result.expectOk().expectUint(0);

        // Test minting (should fail for non-DAO)
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(1000000000) // 1000 WASHA
            ], wallet1.address),
        ]);
        
        block.receipts[0].result.expectErr(types.uint(401)); // ERR_UNAUTHORIZED

        // Test minting by deployer (acts as DAO initially)
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(1000000000) // 1000 WASHA
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check balance after minting
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('governance-token', 'get-total-supply', [], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1000000000);
        block.receipts[1].result.expectOk().expectUint(1000000000);

        // Test transfer
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'transfer', [
                types.uint(500000000), // 500 WASHA
                types.principal(wallet1.address),
                types.principal(wallet2.address),
                types.none()
            ], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check balances after transfer
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('governance-token', 'get-balance', [types.principal(wallet2.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(500000000);
        block.receipts[1].result.expectOk().expectUint(500000000);
    },
});

Clarinet.test({
    name: "Governance token: delegation and voting power",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // Mint tokens to wallet1
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(1000000000) // 1000 WASHA
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check initial voting power (should be 0 as no delegation)
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-current-votes', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(0);

        // Self-delegate to activate voting power
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet1.address)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check voting power after self-delegation
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-current-votes', [types.principal(wallet1.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(1000000000);

        // Delegate to another address
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet2.address)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check voting power moved to delegate
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-current-votes', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('governance-token', 'get-current-votes', [types.principal(wallet2.address)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(0);
        block.receipts[1].result.expectUint(1000000000);

        // Test self-delegation error
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet1.address)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectErr(types.uint(405)); // ERR_SELF_DELEGATION
    },
});

Clarinet.test({
    name: "Governance token: burn functionality",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Mint tokens
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(1000000000) // 1000 WASHA
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Test burn
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'burn', [types.uint(300000000)], wallet1.address), // 300 WASHA
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check balance and total supply after burn
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('governance-token', 'get-total-supply', [], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(700000000);
        block.receipts[1].result.expectOk().expectUint(700000000);

        // Test burn more than balance
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'burn', [types.uint(800000000)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectErr(types.uint(402)); // ERR_INSUFFICIENT_BALANCE
    },
});
