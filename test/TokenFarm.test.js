/* eslint-disable */

const DaiToken = artifacts.require("DaiToken");
const DappToken = artifacts.require("DappToken");
const TokenFarm = artifacts.require("TokenFarm");

require("chai")
  .use(require("chai-as-promised"))
  .should();

// Helper function to generate our tokens
function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

// owner = account[0], investor = account[1]
contract("TokenFarm", ([owner, investor]) => {
  let daiToken, dappToken, tokenFarm;

  // Here we want to recreat what is happening in our migrations smart contracts (2_dedploy_contracts.js)
  before(async () => {
    // Load contracts
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

    // Transfer all Dapp tokens to TokenFarm (1 milion)
    await dappToken.transfer(tokenFarm.address, tokens("1000000"));

    // Send tokens to investor
    await daiToken.transfer(investor, tokens("100"), { from: owner });
  });

  describe("Mock DAI deployment", async () => {
    it("Contract has a name", async () => {
      const name = await daiToken.name();
      assert.equal(name, "Mock DAI Token");
    });
  });

  describe("DApp Token deployment", async () => {
    it("Contract has a name", async () => {
      const name = await dappToken.name();
      assert.equal(name, "DApp Token");
    });
  });

  describe("Token Farm deployment", async () => {
    it("Contract has a name", async () => {
      const name = await tokenFarm.name();
      assert.equal(name, "Dapp Token Farm");
    });

    it("Contract has tokens", async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens("1000000"));
    });
  });

  describe("Farming tokens", async () => {
    it("Rewards investor for staking mDai tokens", async () => {
      let result;
      // Check investor balance before staking
      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("100"),
        "investor Mock DAI wallet balance should be correct before staking"
      );

      // Stake Mock DAI tokens
      await daiToken.approve(tokenFarm.address, tokens("100"), {
        from: investor,
      });
      await tokenFarm.stakeTokens(tokens("100"), { from: investor });

      // Check staking result
      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("0"),
        "investor Mock DAI wallet balance should be correct"
      );

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens("100"),
        "Token Farm Mock DAI balance should be correct after staking"
      );

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result.toString(),
        tokens("100"),
        "Investor staking balance correct after staking"
      );

      result = await tokenFarm.isStaking(investor);
      assert.equal(
        result.toString(),
        "true",
        "Investor staking status correct after staking"
      );

      // Issue Tokens
      await tokenFarm.issueTokens({ from: owner });

      // Check Balances after issuance
      result = await dappToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("100"),
        "Investor DApp Token wallet balance correct after issuance"
      );

      // Ensure that only owner can issue tokens
      await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

      // Unstake Tokens
      await tokenFarm.unstakeTokens({ from: investor });

      // Check results after unstaking
      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("100"),
        "Investor Mock DAI  waallet balance correct after staking"
      );

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens("0"),
        "Token Farm Mock DAI balance correct aafter staking"
      );

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result.toString(),
        tokens("0"),
        "Investor staking balance correct after staking"
      );

      result = await tokenFarm.isStaking(investor);
      assert.equal(
        result.toString(),
        "false",
        "Investor staking status correct after staking"
      );
    });
  });
});
