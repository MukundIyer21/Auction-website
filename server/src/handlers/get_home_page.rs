use actix_web::{get, web, HttpResponse, Responder};
use futures::StreamExt;
use mongodb::bson::{doc, Document};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct HomeCategory {
    category: String,
    items: Vec<crate::mongo::Item>,
}

#[get("/api/v1/home")]
pub async fn get_home_page_handler(
    mongo_client: web::Data<crate::mongo::MongoClient>,
    redis_client: web::Data<crate::redis::RedisClient>,
) -> impl Responder {
    let cache_key = "homepage";
    if let Ok(Some(cached_categories)) = redis_client
        .get_value::<Vec<HomeCategory>>(cache_key, "")
        .await
    {
        return HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "home": cached_categories,
        }));
    }

    let db = mongo_client.get_db();

    let items_collection = db.collection::<crate::mongo::Item>("items");
    let active_count = match items_collection
        .count_documents(
            doc! { "status": crate::mongo::ItemStatus::ACTIVE.to_string() },
            None,
        )
        .await
    {
        Ok(count) => count,
        Err(_) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": "Failed to check for active items",
            }));
        }
    };

    if active_count == 0 {
        return HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "home": [],
        }));
    }

    let pipeline = vec![
        doc! {
            "$match": {
                "status": crate::mongo::ItemStatus::ACTIVE.to_string()
            }
        },
        doc! {
            "$group": {
                "_id": "$category",
                "count": { "$sum": 1 },
                "items": { "$push": "$$ROOT" }
            }
        },
        doc! {
            "$match": {
                "count": { "$gt": 0 }
            }
        },
        doc! {
            "$sort": { "count": -1 }
        },
        doc! {
            "$limit": 10
        },
        doc! {
            "$lookup": {
                "from": "bids",
                "localField": "items._id",
                "foreignField": "item_id",
                "as": "all_bids"
            }
        },
        doc! {
            "$addFields": {
                "items": {
                    "$map": {
                        "input": "$items",
                        "as": "item",
                        "in": {
                            "$mergeObjects": [
                                "$$item",
                                {
                                    "bid_count": {
                                        "$size": {
                                            "$filter": {
                                                "input": "$all_bids",
                                                "as": "bid",
                                                "cond": { "$eq": ["$$bid.item_id", { "$toString": "$$item._id" }] }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        doc! {
            "$project": {
                "_id": 0,
                "category": "$_id",
                "items": {
                    "$slice": [
                        { "$sortArray": {
                            "input": "$items",
                            "sortBy": { "bid_count": -1 }
                        }},
                        5
                    ]
                }
            }
        },
    ];

    let result = db
        .collection::<Document>("items")
        .aggregate(pipeline, None)
        .await;

    let categories_cursor = match result {
        Ok(cursor) => cursor,
        Err(err) => {
            eprintln!("MongoDB aggregation error: {:?}", err);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": "Failed to aggregate home data",
            }));
        }
    };

    let mut home_categories = Vec::new();
    let categories_docs: Vec<Document> = categories_cursor
        .filter_map(|doc| async move { doc.ok() })
        .collect()
        .await;

    if categories_docs.is_empty() {
        return HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "home": [],
        }));
    }

    for doc in categories_docs {
        if let Ok(category_str) = doc.get_str("category") {
            let category = category_str.to_string();

            if let Some(items_array) = doc.get_array("items").ok() {
                let mut category_items = Vec::new();

                for item_bson in items_array {
                    if let Some(item_doc) = item_bson.as_document() {
                        if let Ok(item) =
                            bson::from_document::<crate::mongo::Item>(item_doc.clone())
                        {
                            category_items.push(item);
                        }
                    }
                }

                if !category_items.is_empty() {
                    home_categories.push(HomeCategory {
                        category,
                        items: category_items,
                    });
                }
            }
        }
    }

    if !home_categories.is_empty() {
        redis_client
            .set_value(cache_key, "", &home_categories, Some(60))
            .await
            .ok();
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": "success",
        "home": home_categories,
    }))
}
