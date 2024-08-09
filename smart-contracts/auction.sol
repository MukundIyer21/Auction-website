// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract Auction {
    address public owner;
    address public caller;
    mapping(address => uint[]) private userIdToItems;
    mapping(uint => address[]) private ownershipHistory;
    mapping(uint => address) private itemToCurrentOwner;

    event ItemAdded(address indexed user, uint indexed itemId);
    event ItemTransferred(address indexed from, address indexed to, uint indexed itemId);
    event CallerChanged(address indexed newCaller);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == caller, "Only owner or caller can execute this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setCaller(address _caller) public onlyOwner {
        caller = _caller;
        emit CallerChanged(_caller);
    }

    function getItemsForUser(address userId) public view returns(uint[] memory) {
        return userIdToItems[userId];
    }

    function addItemForUser(address userId, uint itemId) public onlyAuthorized {
        require(itemToCurrentOwner[itemId] == address(0), "Item already exists");
        ownershipHistory[itemId].push(userId);
        userIdToItems[userId].push(itemId);
        itemToCurrentOwner[itemId] = userId;
        emit ItemAdded(userId, itemId);
    }

    function getOwnershipHistoryForItem(uint itemId) public view returns (address[] memory) {
        return ownershipHistory[itemId];
    }

    function transferItem(address to, address from, uint itemId) public onlyAuthorized {
        require(itemToCurrentOwner[itemId] == from, "Item not owned by sender");
        
        uint[] storage fromItems = userIdToItems[from];
        for(uint i = 0; i < fromItems.length; i++) {
            if(fromItems[i] == itemId) {
                fromItems[i] = fromItems[fromItems.length - 1];
                fromItems.pop();
                break;
            }
        }

        ownershipHistory[itemId].push(to);
        userIdToItems[to].push(itemId);
        itemToCurrentOwner[itemId] = to;

        emit ItemTransferred(from, to, itemId);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        owner = newOwner;
    }
}