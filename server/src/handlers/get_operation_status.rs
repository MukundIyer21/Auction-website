use crate::mongo::{MongoClient, Operation};
use actix_web::{get, web, HttpResponse, Responder};
use bson::doc;
use serde::Serialize;

#[derive(Serialize)]
pub struct OperationStatusResponse {
    status: String,
    operation_status: String,
    operation: String,
    item_id: Option<String>,
}

#[get("/api/v1/status/operation/{operation_id}")]
pub async fn get_operation_status_handler(
    operation_id: web::Path<String>,
    mongo_client: web::Data<MongoClient>,
) -> impl Responder {
    let operation_id = operation_id.into_inner();

    let db = mongo_client.get_db();
    let operations_collection = db.collection::<Operation>("operations");

    match operations_collection
        .find_one(doc! {"operation_id": operation_id}, None)
        .await
    {
        Ok(Some(operation)) => HttpResponse::Ok().json(OperationStatusResponse {
            status: "success".to_string(),
            operation_status: operation.status.to_string(),
            operation: operation.r#type.to_string(),
            item_id: operation
                .params
                .get("item_id")
                .and_then(|v| v.as_str().map(ToOwned::to_owned)),
        }),
        Ok(None) => HttpResponse::NotFound().json(OperationStatusResponse {
            status: "error".to_string(),
            operation_status: "not_found".to_string(),
            operation: "".to_string(),
            item_id: None,
        }),
        Err(err) => {
            eprintln!("{}", err);
            HttpResponse::InternalServerError().json(OperationStatusResponse {
                status: "error".to_string(),
                operation_status: "server_error".to_string(),
                operation: "".to_string(),
                item_id: None,
            })
        }
    }
}
