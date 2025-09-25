import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "DAO: proposal creation and voting",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // Setup: mint tokens and delegate voting power
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(200000000) // 200 WASHA (above threshold)
            ], deployer.address),
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet2.address),
                types.uint(600000000) // 600 WASHA (above quorum)
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));
        block.receipts[1].result.expectOk(types.bool(true));

        // Self-delegate to activate voting power
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet1.address)], wallet1.address),
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet2.address)], wallet2.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));
        block.receipts[1].result.expectOk(types.bool(true));

        // Create a proposal
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'propose', [
                types.list([types.principal(deployer.address)]), // targets
                types.list([types.uint(0)]), // values
                types.list([types.ascii("test-function")]), // signatures
                types.list([types.buff(new ArrayBuffer(0))]), // calldatas
                types.utf8("Test proposal for parameter change") // description
            ], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1); // Proposal ID 1

        // Check proposal state (should be PENDING initially)
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'get-proposal-state', [types.uint(1)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(0); // PROPOSAL_STATE_PENDING

        // Mine blocks to reach voting period
        chain.mineEmptyBlock(2); // voting-delay is 1 block

        // Check proposal state (should be ACTIVE now)
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'get-proposal-state', [types.uint(1)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(1); // PROPOSAL_STATE_ACTIVE

        // Vote on proposal
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'cast-vote', [
                types.uint(1), // proposal ID
                types.uint(1)  // support (1 = for)
            ], wallet1.address),
            Tx.contractCall('washika-dao', 'cast-vote', [
                types.uint(1), // proposal ID
                types.uint(1)  // support (1 = for)
            ], wallet2.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));
        block.receipts[1].result.expectOk(types.bool(true));

        // Check vote receipts
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'get-receipt', [
                types.uint(1),
                types.principal(wallet1.address)
            ], deployer.address),
        ]);
        
        const receipt = block.receipts[0].result.expectSome().expectTuple();
        assertEquals(receipt['has-voted'], types.bool(true));
        assertEquals(receipt['support'], types.uint(1));
        assertEquals(receipt['votes'], types.uint(200000000));
    },
});

Clarinet.test({
    name: "DAO: proposal threshold and quorum checks",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Mint tokens below threshold
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(50000000) // 50 WASHA (below 100 WASHA threshold)
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Self-delegate
        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet1.address)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Try to create proposal (should fail due to insufficient threshold)
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'propose', [
                types.list([types.principal(deployer.address)]),
                types.list([types.uint(0)]),
                types.list([types.ascii("test-function")]),
                types.list([types.buff(new ArrayBuffer(0))]),
                types.utf8("Test proposal")
            ], wallet1.address),
        ]);
        
        block.receipts[0].result.expectErr(types.uint(413)); // ERR_BELOW_THRESHOLD
    },
});

Clarinet.test({
    name: "DAO: governance parameter updates",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        // Test setting voting delay
        let block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'set-voting-delay', [types.uint(5)], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check updated value
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'get-voting-delay', [], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(5);

        // Test unauthorized access
        const wallet1 = accounts.get('wallet_1')!;
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'set-voting-delay', [types.uint(10)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectErr(types.uint(401)); // ERR_UNAUTHORIZED
    },
});

Clarinet.test({
    name: "DAO: proposal cancellation",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Setup: mint tokens and create proposal
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'mint', [
                types.principal(wallet1.address),
                types.uint(200000000)
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        block = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet1.address)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Create proposal
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'propose', [
                types.list([types.principal(deployer.address)]),
                types.list([types.uint(0)]),
                types.list([types.ascii("test-function")]),
                types.list([types.buff(new ArrayBuffer(0))]),
                types.utf8("Test proposal")
            ], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1);

        // Cancel proposal by proposer
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'cancel', [types.uint(1)], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.bool(true));

        // Check proposal state
        block = chain.mineBlock([
            Tx.contractCall('washika-dao', 'get-proposal-state', [types.uint(1)], deployer.address),
        ]);
        
        block.receipts[0].result.expectUint(2); // PROPOSAL_STATE_CANCELED
    },
});
