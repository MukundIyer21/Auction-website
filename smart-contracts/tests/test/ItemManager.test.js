const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ItemManagement", function () {
    let ItemManagement, itemManagement;
    let owner, admin, user1, user2;
    let ownerAddress, adminAddress, user1Address, user2Address;

    beforeEach(async function () {
        [owner, admin, user1, user2] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        adminAddress = await admin.getAddress();
        user1Address = await user1.getAddress();
        user2Address = await user2.getAddress();

        ItemManagement = await ethers.getContractFactory("ItemManagement");
        itemManagement = await ItemManagement.deploy();
        await itemManagement.waitForDeployment();
    });

    // Admin Management
    describe("Admin Management", function () {
        it("should set deployer as owner and admin", async function () {
            expect(await itemManagement.owner()).to.equal(ownerAddress);
            expect(await itemManagement.isAdmin(ownerAddress)).to.be.true;
        });

        it("should allow owner to add admin", async function () {
            await expect(itemManagement.addAdmin(adminAddress))
                .to.emit(itemManagement, "AdminAdded")
                .withArgs(adminAddress);
            expect(await itemManagement.isAdmin(adminAddress)).to.be.true;
        });

        it("should not allow adding zero address as admin", async function () {
            await expect(itemManagement.addAdmin(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(itemManagement, "InvalidAddress");
        });

        it("should not allow non-owner to add admin", async function () {
            await expect(itemManagement.connect(user1).addAdmin(adminAddress))
                .to.be.revertedWithCustomError(itemManagement, "NotOwner");
        });

        it("should allow owner to remove admin", async function () {
            await itemManagement.addAdmin(adminAddress);
            await expect(itemManagement.removeAdmin(adminAddress))
                .to.emit(itemManagement, "AdminRemoved")
                .withArgs(adminAddress);
            expect(await itemManagement.isAdmin(adminAddress)).to.be.false;
        });

        it("should not allow removing owner as admin", async function () {
            await expect(itemManagement.removeAdmin(ownerAddress))
                .to.be.revertedWithCustomError(itemManagement, "OwnerCannotBeRemovedAsAdmin");
        });
    });

    // Ownership Management
    describe("Ownership Management", function () {
        it("should allow owner to transfer ownership", async function () {
            await expect(itemManagement.transferOwnership(user1Address))
                .to.emit(itemManagement, "OwnershipTransferred")
                .withArgs(ownerAddress, user1Address);
            expect(await itemManagement.owner()).to.equal(user1Address);
        });

        it("should not allow transferring ownership to zero address", async function () {
            await expect(itemManagement.transferOwnership(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(itemManagement, "InvalidAddress");
        });
    });

    // Item Management
    describe("Item Management", function () {
        const itemId = "ITEM_001";

        beforeEach(async function () {
            await itemManagement.addAdmin(adminAddress);
        });

        describe("Item Addition", function () {
            it("should add item successfully", async function () {
                await expect(itemManagement.connect(admin).executeAddItem(user1Address, itemId))
                    .to.emit(itemManagement, "ItemAdded")
                    .withArgs(user1Address, itemId, 0);
                expect(await itemManagement.hasItem(user1Address, itemId)).to.be.true;
            });

            it("should revert if item ID is empty", async function () {
                await expect(itemManagement.connect(admin).executeAddItem(user1Address, ""))
                    .to.be.revertedWithCustomError(itemManagement, "InvalidItemId");
            });

            it("should revert if item ID is too long", async function () {
                const longItemId = "ThisIsAVeryLongItemIdThatExceedsSixteenBytes";
                await expect(itemManagement.connect(admin).executeAddItem(user1Address, longItemId))
                    .to.be.revertedWithCustomError(itemManagement, "InvalidItemId");
            });
        });

        describe("Item Transfer", function () {
            beforeEach(async function () {
                await itemManagement.connect(admin).executeAddItem(user1Address, itemId);
            });

            it("should transfer item successfully", async function () {
                await expect(itemManagement.connect(admin).executeTransferItem(user2Address, itemId))
                    .to.emit(itemManagement, "ItemTransferred")
                    .withArgs(user1Address, user2Address, itemId);
                expect(await itemManagement.hasItem(user1Address, itemId)).to.be.false;
                expect(await itemManagement.hasItem(user2Address, itemId)).to.be.true;
            });

            it("should not allow transfer to same address", async function () {
                await expect(itemManagement.connect(admin).executeTransferItem(user1Address, itemId))
                    .to.be.revertedWith("Cannot transfer item to the same address");
            });

            it("should prevent transfer after deletion", async function () {
                await itemManagement.connect(admin).executeDeleteItem(user1Address, itemId);
                await expect(itemManagement.connect(admin).executeTransferItem(user2Address, itemId))
                    .to.be.revertedWith("Item does not exist");
            });

            it("should handle multiple transfers correctly", async function () {
                await itemManagement.connect(admin).executeTransferItem(user2Address, itemId);
                expect(await itemManagement.hasItem(user2Address, itemId)).to.be.true;

                await itemManagement.connect(admin).executeTransferItem(user1Address, itemId);
                expect(await itemManagement.hasItem(user1Address, itemId)).to.be.true;
            });
        });

        describe("Item Deletion", function () {
            beforeEach(async function () {
                await itemManagement.connect(admin).executeAddItem(user1Address, itemId);
            });

            it("should delete item successfully", async function () {
                await expect(itemManagement.connect(admin).executeDeleteItem(user1Address, itemId))
                    .to.emit(itemManagement, "ItemDeleted")
                    .withArgs(user1Address, itemId);
                expect(await itemManagement.hasItem(user1Address, itemId)).to.be.false;
            });

            it("should prevent deletion of non-existent item", async function () {
                await expect(itemManagement.connect(admin).executeDeleteItem(user1Address, "ITEM_002"))
                    .to.be.revertedWith("Item does not exist in owner's account");
            });

            it("should prevent deletion after deletion", async function () {
                await itemManagement.connect(admin).executeDeleteItem(user1Address, itemId);
                await expect(itemManagement.connect(admin).executeDeleteItem(user1Address, itemId))
                    .to.be.revertedWith("Item does not exist in owner's account");
            })
        });

        describe("Item Listing", function () {
            const items = ["ITEM_001", "ITEM_002", "ITEM_003"];

            beforeEach(async function () {
                for (const item of items) {
                    await itemManagement.connect(admin).executeAddItem(user1Address, item);
                }
            });

            it("should return correct item list", async function () {
                const userItems = await itemManagement.getUserItems(user1Address);
                expect(userItems.length).to.equal(items.length);
                items.forEach((item) => {
                    expect(userItems).to.include(item);
                });
            });

            it("should return correct item count", async function () {
                expect(await itemManagement.getUserItemCount(user1Address)).to.equal(items.length);
            });
        });

        // Double addition tests
        describe("Double Addition Scenarios", function () {
            it("should prevent double addition by same user", async function () {
                await itemManagement.connect(admin).executeAddItem(user1Address, itemId);
                await expect(
                    itemManagement.connect(admin).executeAddItem(user1Address, itemId)
                ).to.be.revertedWith("Item ID already exists");
            });

            it("should prevent double addition by different users", async function () {
                await itemManagement.connect(admin).executeAddItem(user1Address, itemId);
                await expect(
                    itemManagement.connect(admin).executeAddItem(user2Address, itemId)
                ).to.be.revertedWith("Item ID already exists");
            });
        });

        it("should handle maximum length item IDs", async function () {
            const maxLengthId = "A123456789ABCDEF";
            await itemManagement.connect(admin).executeAddItem(user1Address, maxLengthId);
            expect(await itemManagement.hasItem(user1Address, maxLengthId)).to.be.true;
        });
    });

    describe("Access Control", function () {
        const itemId = "ITEM_001";

        beforeEach(async function () {
            await itemManagement.addAdmin(adminAddress);
        });

        it("should allow only admin to add items", async function () {
            await expect(itemManagement.connect(user1).executeAddItem(user1Address, itemId))
                .to.be.revertedWithCustomError(itemManagement, "NotAdmin");

            await expect(itemManagement.connect(admin).executeAddItem(user1Address, itemId))
                .to.emit(itemManagement, "ItemAdded")
                .withArgs(user1Address, itemId, 0);

            await expect(itemManagement.connect(owner).executeAddItem(user1Address, "ITEM_002"))
                .to.emit(itemManagement, "ItemAdded")
                .withArgs(user1Address, "ITEM_002", 1);
        });

        it("should allow only admin to transfer items", async function () {
            await itemManagement.connect(admin).executeAddItem(user1Address, itemId);

            await expect(itemManagement.connect(user1).executeTransferItem(user2Address, itemId))
                .to.be.revertedWithCustomError(itemManagement, "NotAdmin");

            await expect(itemManagement.connect(admin).executeTransferItem(user2Address, itemId))
                .to.emit(itemManagement, "ItemTransferred")
                .withArgs(user1Address, user2Address, itemId);

            await itemManagement.connect(admin).executeTransferItem(user1Address, itemId);

            await expect(itemManagement.connect(owner).executeTransferItem(user2Address, itemId))
                .to.emit(itemManagement, "ItemTransferred")
                .withArgs(user1Address, user2Address, itemId);
        });

        it("should allow only admin to delete items", async function () {
            await itemManagement.connect(admin).executeAddItem(user1Address, itemId);

            await expect(itemManagement.connect(user1).executeDeleteItem(user1Address, itemId))
                .to.be.revertedWithCustomError(itemManagement, "NotAdmin");

            await expect(itemManagement.connect(admin).executeDeleteItem(user1Address, itemId))
                .to.emit(itemManagement, "ItemDeleted")
                .withArgs(user1Address, itemId);

            await itemManagement.connect(admin).executeAddItem(user1Address, "ITEM_002");

            await expect(itemManagement.connect(owner).executeDeleteItem(user1Address, "ITEM_002"))
                .to.emit(itemManagement, "ItemDeleted")
                .withArgs(user1Address, "ITEM_002");
        });
    });
});
