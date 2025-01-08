from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()

class Item(BaseModel):
    # TODO : chamge the data members accordingly
    # item_id:str (to be generated)
    item_name:str
    item_description:str | None 
    seller_address:str

class Bid(BaseModel):
    item_id:str
    price:float
    is_initial_bid:bool
    incrementation:float
    bidder:str

class Transfer(BaseModel):
    item_id:str
    buyer:str

@app.get("/{item_id}")
async def similar_items(item_id:str):
    # TODO : find similar items for recommendation 
    return {"item_details":{},"similar_items_details":{{}}} 

@app.post("/item/")
async def create_item(item:Item):
    # TODO : gemerate an itemId for each new item and figure out how to add the items to database
 
    # why is seller_address not part of item_details?
    return {"item_id":-1,"msg":"Item successfully submitted, it will shortly be up for auction"}


@app.delete("/{item_id}")
async def delete_item(item_id:str):
    # TODO : remove item from the database 
    return {"msg":"Item Deleted Successfully"}

@app.post("/place")
def place_bid(bid:Bid):
    # TODO : place the bid
    return {"bid_status":"success"}

@app.get("/home")
def home_page():
    # TODO : to find top 10-15 auctions with the most participants and display them on the homepage
    return {"category1":{{}},"category2":{{}},"category3":{{}}}

@app.post("/transfer")
def transfer_item(transfer:Transfer):
    # TODO : transfer the item to buyer's account (through blockchain i am assuming)
    return None 
