pragma solidity ^0.5.0;

// Import our tokens to operate with them
import "./DappToken.sol";
import "./DaiToken.sol";

contract TokenFarm {
    // All code goes here for that contract
    // Give to this contract a name to deploy it to the Blockchain.
    string public name  = "Dapp Token Farm";

    // All variables in solidity need a type
    address public owner;
    DappToken public dappToken;
    DaiToken public daiToken;

    address[] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        // Store a reference to the dapToken and daiToken
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    // 1. Stakes Tokens (Deposit)
        function stakeTokens(uint _amount) public {
            // Require amount grater than 0
            require(_amount > 0, "Amount cannot be 0");
            // Transfer Mock Dai tokens to this contract for staking
            daiToken.transferFrom(msg.sender, address(this), _amount);

            // Update staking balance
            stakingBalance[msg.sender] =  stakingBalance[msg.sender] + _amount;

            // Add users to stakers array only if they haven't staked already
            if(!hasStaked[msg.sender]){
                stakers.push(msg.sender);
            }

            // Update staked status
            isStaking[msg.sender]=true;
            hasStaked[msg.sender] = true;
        }

    // 2. Unstaking Tokens (Withdraw)
        function unstakeTokens() public {
            // Fetch staking balance
            uint balance = stakingBalance[msg.sender];
            // Require amount greateer thaan 0
            require(balance > 0, "Staking blance cannot be 0");
            // Transfer Mock Daio tokens to this contract for staking
            daiToken.transfer(msg.sender, balance);
            // Reset staking balance
            stakingBalance[msg.sender] = 0;
            // Update staking status
            isStaking[msg.sender] = false;
        }

    // 3. Issuing Tokens (Earning interest for the transaction)
    function issueTokens() public {
        // Restriction to owner of the app the use of this function
        require(msg.sender ==  owner, "Caller must be the owner");
        // Loop over all the clients that hasStaked
        for(uint i=0; i < stakers.length; i++){
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if(balance > 0){
            dappToken.transfer(recipient, balance);
            }
        }
    }

}