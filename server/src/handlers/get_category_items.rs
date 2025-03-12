use actix_web::{get, web, HttpResponse, Responder};
use futures::StreamExt;
use mongodb::bson::doc;

#[get("/api/v1/items/category/{category_name}")]
pub async fn get_category_items_handler(
    path: web::Path<String>,
    mongo_client: web::Data<crate::mongo::MongoClient>,
    redis_client: web::Data<crate::redis::RedisClient>,
) -> impl Responder {
    let category_name = path.into_inner().to_lowercase();

    let cache_key = format!("category_items:{}", category_name);
    if let Ok(Some(cached_items)) = redis_client
        .get_value::<Vec<crate::mongo::Item>>(&cache_key, "")
        .await
    {
        return HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "items": cached_items,
        }));
    }

    let items_collection = mongo_client
        .get_db()
        .collection::<crate::mongo::Item>("items");

    let category_items_count = match items_collection
        .count_documents(
            doc! {
                "category": &category_name,
                "status": crate::mongo::ItemStatus::ACTIVE.to_string(),
            },
            None,
        )
        .await
    {
        Ok(count) => count,
        Err(_) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": "Failed to check category items",
            }));
        }
    };

    if category_items_count == 0 {
        return HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "items": [],
        }));
    }

    let pipeline = vec![
        doc! {
            "$match": {
                "category": &category_name,
                "status": crate::mongo::ItemStatus::ACTIVE.to_string(),
            }
        },
        doc! {
            "$lookup": {
                "from": "bids",
                "localField": "_id",
                "foreignField": "item_id",
                "as": "bids"
            }
        },
        doc! {
            "$addFields": {
                "bid_count": { "$size": "$bids" }
            }
        },
        doc! {
            "$project": {
                "bids": 0
            }
        },
        doc! {
            "$sort": { "bid_count": -1 }
        },
    ];

    let agg_result = items_collection.aggregate(pipeline, None).await;

    let items_cursor = match agg_result {
        Ok(cursor) => cursor,
        Err(err) => {
            eprintln!("MongoDB aggregation error: {:?}", err);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": "Failed to retrieve category items",
            }));
        }
    };

    let items: Vec<crate::mongo::Item> = items_cursor
        .filter_map(|doc| async move {
            if let Ok(doc) = doc {
                if let Ok(item) = bson::from_document::<crate::mongo::Item>(doc) {
                    return Some(item);
                }
            }
            None
        })
        .collect()
        .await;

    if !items.is_empty() {
        redis_client
            .set_value(&cache_key, "", &items, Some(60))
            .await
            .ok();
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": "success",
        "items": items,
    }))
}
