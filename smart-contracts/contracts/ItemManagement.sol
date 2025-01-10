// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ItemManagement {
    mapping(address => mapping(bytes16 => bool)) private userItems;
    mapping(address => bytes16[]) private userItemsList;
    mapping(address => mapping(bytes16 => uint256)) private userItemIndex;
    mapping(address => bool) private admins;
    mapping(bytes16 => address) private itemOwner;

    address public owner;

    event ItemAdded(address indexed user, string itemId, uint256 index);
    event ItemTransferred(address indexed from, address indexed to, string itemId);
    event ItemDeleted(address indexed user, string itemId);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error ItemAlreadyExistsForOwner(address owner, string itemId, string message);
    error ItemDoesNotExistWithUser(address owner, string itemId, string message);
    error InvalidAddress(address invalidAddress, string message);
    error TransferToSelf(address sender, string message);
    error NotOwner(address sender, address owner, string message);
    error NotAdmin(address sender, string message);
    error AlreadyAdmin(address admin, string message);
    error NotAnAdmin(address admin, string message);
    error OwnerCannotBeRemovedAsAdmin(address owner, string message);
    error TransferFailed(address from, address to, string itemId, string message);
    error InvalidIndex(uint256 index, string message);
    error InvalidItemId(string itemId, string message);
    error ItemAlreadyExists(string itemId, string message);
    error ItemDoesNotExist(string itemId, string message);


    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner(
                msg.sender,
                owner,
                "Caller is not the contract owner"
            );
        }
        _;
    }

    modifier onlyAdmin() {
        if (!admins[msg.sender]) {
            revert NotAdmin(
                msg.sender,
                "Caller is not registered as an admin"
            );
        }
        _;
    }

    function stringToBytes16(string memory source) public pure returns (bytes16 result) {
        if (bytes(source).length == 0) {
            revert InvalidItemId(source, "Item ID cannot be empty");
        }
        if (bytes(source).length > 16) {
            revert InvalidItemId(source, "Item ID must be 16 bytes or less");
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    function bytes16ToString(bytes16 _bytes16) public pure returns (string memory) {
        bytes memory bytesArray = new bytes(16);
        uint8 length;
        for (length = 0; length < 16; length++) {
            if (_bytes16[length] == 0) {
                break;
            }
            bytesArray[length] = _bytes16[length];
        }

        bytes memory bytesArrayTrimmed = new bytes(length);
        for (uint8 i = 0; i < length; i++) {
            bytesArrayTrimmed[i] = bytesArray[i];
        }
        return string(bytesArrayTrimmed);
    }

    function addAdmin(address admin) external onlyOwner {
        if (admin == address(0)) {
            revert InvalidAddress(
                admin,
                "Cannot add zero address as admin"
            );
        }
        if (admins[admin]) {
            revert AlreadyAdmin(
                admin,
                "Address is already registered as admin"
            );
        }

        admins[admin] = true;
        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlyOwner {
        if (!admins[admin]) {
            revert NotAnAdmin(
                admin,
                "Address is not currently an admin"
            );
        }
        if (admin == owner) {
            revert OwnerCannotBeRemovedAsAdmin(
                owner,
                "Contract owner cannot be removed from admin role"
            );
        }
        
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert InvalidAddress(
                newOwner,
                "Cannot transfer ownership to zero address"
            );
        }

        address oldOwner = owner;
        owner = newOwner;
        admins[newOwner] = true;
        emit OwnershipTransferred(oldOwner, newOwner);
        emit AdminAdded(newOwner);
    }

    function canAddItem(address owner, string calldata itemId) external view returns (bool, string memory) {  
        bytes16 itemBytes = stringToBytes16(itemId);

        if (!admins[msg.sender]) {
            return (false, "Caller is not registered as an admin");
        }

        if (itemOwner[itemBytes] != address(0)) {
            return (false, "Item ID already exists");
        }

        if (userItems[owner][itemBytes]) {
            return (false, "Item ID already exists for this owner");
        }

        return (true, "");
    }

    function executeAddItem(address owner, string calldata itemId) external onlyAdmin {
        bytes16 itemBytes = stringToBytes16(itemId);

        require(itemOwner[itemBytes] == address(0), "Item ID already exists");
        require(!userItems[owner][itemBytes], "Item ID already exists for this owner");

        itemOwner[itemBytes] = owner;
        uint256 newIndex = userItemsList[owner].length;
        userItems[owner][itemBytes] = true;
        userItemsList[owner].push(itemBytes);
        userItemIndex[owner][itemBytes] = newIndex;

        emit ItemAdded(owner, itemId, newIndex);
    }

    function canTransferItem(address to, string calldata itemId) external view returns (bool, string memory) {
        if (!admins[msg.sender]) {
            return (false, "Caller is not registered as an admin");
        }

        bytes16 itemBytes = stringToBytes16(itemId);
        address from = itemOwner[itemBytes];

        if (to == address(0)) {
            return (false, "Receiver cannot be zero address");
        }

        if (from == address(0)) {
            return (false, "Item does not exist");
        }

        if (to == from) {
            return (false, "Cannot transfer item to the same address");
        }

        if (userItems[to][itemBytes]) {
            return (false, "Item already exists in receiver's account");
        }

        return (true, "");
    }

    function executeTransferItem(address to, string calldata itemId) external onlyAdmin {
        bytes16 itemBytes = stringToBytes16(itemId);
        address from = itemOwner[itemBytes];

        require(from != address(0), "Item does not exist");
        require(to != address(0), "Receiver cannot be zero address");
        require(to != from, "Cannot transfer item to the same address");
        require(!userItems[to][itemBytes], "Item already exists in receiver's account");

        removeFromUserItemsList(from, itemBytes);
        userItems[from][itemBytes] = false;

        itemOwner[itemBytes] = to;
        uint256 newIndex = userItemsList[to].length;
        userItems[to][itemBytes] = true;
        userItemsList[to].push(itemBytes);
        userItemIndex[to][itemBytes] = newIndex;

        emit ItemTransferred(from, to, itemId);
    }

    function canDeleteItem(address owner, string calldata itemId) external view returns (bool, string memory) {
        if (!admins[msg.sender]) {
            return (false, "Caller is not registered as an admin");
        }

        bytes16 itemBytes = stringToBytes16(itemId);

        if (!userItems[owner][itemBytes]) {
            return (false, "Item does not exist in owner's account");
        }

        return (true, "");
    }

    function executeDeleteItem(address owner, string calldata itemId) external onlyAdmin {
        bytes16 itemBytes = stringToBytes16(itemId);

        require(userItems[owner][itemBytes], "Item does not exist in owner's account");
        require(itemOwner[itemBytes] == owner, "Item owner mismatch");

        removeFromUserItemsList(owner, itemBytes);
        userItems[owner][itemBytes] = false;
        itemOwner[itemBytes] = address(0);

        emit ItemDeleted(owner, itemId);
    }


    function removeFromUserItemsList(address user, bytes16 itemId) private {
        uint256 index = userItemIndex[user][itemId];
        uint256 lastIndex = userItemsList[user].length - 1;

        if (index != lastIndex) {
            bytes16 lastItem = userItemsList[user][lastIndex];
            userItemsList[user][index] = lastItem;
            userItemIndex[user][lastItem] = index;
        }

        userItemsList[user].pop();
        delete userItemIndex[user][itemId];
    }

    function getUserItems(address user) external view returns (string[] memory) {
        bytes16[] memory items = userItemsList[user];
        string[] memory itemStrings = new string[](items.length);

        for (uint256 i = 0; i < items.length; i++) {
            itemStrings[i] = bytes16ToString(items[i]);
        }

        return itemStrings;
    }

    function hasItem(address user, string calldata itemId) external view returns (bool) {
        bytes16 itemBytes = stringToBytes16(itemId);
        return userItems[user][itemBytes];
    }

    function getUserItemCount(address user) external view returns (uint256) {
        return userItemsList[user].length;
    }

    function isAdmin(address user) external view returns (bool) {
        return admins[user];
    }

    function getItemIndex(address user, string calldata itemId) external view returns (uint256) {
        bytes16 itemBytes = stringToBytes16(itemId);
        if (!userItems[user][itemBytes]) {
            revert ItemDoesNotExistWithUser(
                user,
                itemId,
                "Item does not exist in user's account"
            );
        }
        return userItemIndex[user][itemBytes];
    }
}