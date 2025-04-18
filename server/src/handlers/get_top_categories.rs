use actix_web::{get, web, HttpResponse, Responder};
use futures::StreamExt;
use mongodb::bson::{doc, Document};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct TopCategoriesParams {
    limit: Option<usize>,
}

#[get("/api/v1/categories/top")]
pub async fn get_top_categories_handler(
    query: web::Query<TopCategoriesParams>,
    mongo_client: web::Data<crate::mongo::MongoClient>,
    redis_client: web::Data<crate::redis::RedisClient>,
) -> impl Responder {
    let limit = query.limit.unwrap_or(10);

    let cache_prefix = String::from("top_categories");
    let cache_key = limit;
    if let Ok(Some(cached_categories)) = redis_client
        .get_value::<Vec<String>>(&cache_prefix, &cache_key.to_string())
        .await
    {
        return HttpResponse::Ok().json(serde_json::json!({
            "status": "success",
            "categories": cached_categories,
        }));
    }

    let db = mongo_client.get_db();
    let pipeline = vec![
        doc! {
            "$match": {
                "status": crate::mongo::ItemStatus::ACTIVE.to_string()
            }
        },
        doc! {
            "$group": {
                "_id": "$category",
                "count": { "$sum": 1 }
            }
        },
        doc! {
            "$sort": { "count": -1 }
        },
        doc! {
            "$limit": (limit as i64)
        },
        doc! {
            "$project": {
                "_id": 0,
                "category": "$_id"
            }
        },
    ];

    let result = db
        .collection::<Document>("items")
        .aggregate(pipeline, None)
        .await;

    let categories_cursor = match result {
        Ok(cursor) => cursor,
        Err(_) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": "Failed to retrieve top categories",
            }));
        }
    };

    let top_categories: Vec<String> = categories_cursor
        .filter_map(|doc| async move {
            if let Ok(doc) = doc {
                if let Ok(category) = doc.get_str("category") {
                    return Some(category.to_string());
                }
            }
            None
        })
        .collect()
        .await;

    if !top_categories.is_empty() {
        redis_client
            .set_value(
                &cache_prefix,
                &cache_key.to_string(),
                &top_categories,
                Some(60),
            )
            .await
            .ok();
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": "success",
        "categories": top_categories,
    }))
}
