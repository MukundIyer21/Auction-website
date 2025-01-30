use actix_web::{middleware::Logger, web, App, HttpServer};
use auction_server::{
    awss3::AWSClient,
    config::Config,
    handlers::{
        delete_item_handler, get_home_page_handler, get_item_handler, get_operation_status_handler,
        get_user_items_handler, health_check_handler, place_bid_handler, post_item_handler,
        transfer_item_handler,
    },
    mongo::MongoClient,
    redis::RedisClient,
    types::{BlockchainAPIURI, HomePageAPIURI, TransferSchedulerURI},
};
use env_logger;
use log::info;

fn initialise_logger() {
    std::env::set_var("RUST_LOG", "actix_web=info,auction_server=debug");
    env_logger::init();
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let configurations = Config::from_env().expect("Failed to load configurations");

    let redis_client = web::Data::new(
        RedisClient::new(&configurations.redis_uri, 5)
            .await
            .expect("Failed to get Redis Client"),
    );

    let mongo_client = web::Data::new(
        MongoClient::new(&configurations.mongo_uri, &configurations.db_name)
            .await
            .expect("Failed to get Mongo Client"),
    );

    let aws_client = web::Data::new(
        AWSClient::new(
            &configurations.aws_access_key,
            &configurations.aws_secret_access_key,
            &configurations.aws_bucket,
            &configurations.aws_region,
        )
        .await
        .expect("Failed to get AWS Client"),
    );

    let blockchain_base_uri = web::Data::new(BlockchainAPIURI {
        uri: configurations.blockchain_api_base_uri,
    });

    let homepage_base_uri = web::Data::new(HomePageAPIURI {
        uri: configurations.homepage_api_base_uri,
    });

    let transfer_scheduler_base_uri = web::Data::new(TransferSchedulerURI {
        uri: configurations.transfer_scheduler_base_uri,
    });

    initialise_logger();

    info!("Central server starting on port 8080...");

    let server = HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .service(health_check_handler)
            .service(post_item_handler)
            .service(get_item_handler)
            .service(get_home_page_handler)
            .service(get_operation_status_handler)
            .service(place_bid_handler)
            .service(get_user_items_handler)
            .service(delete_item_handler)
            .service(transfer_item_handler)
            .app_data(redis_client.clone())
            .app_data(mongo_client.clone())
            .app_data(aws_client.clone())
            .app_data(blockchain_base_uri.clone())
            .app_data(homepage_base_uri.clone())
            .app_data(transfer_scheduler_base_uri.clone())
    })
    .bind(("127.0.0.1", 8080))?;

    info!("✅ Central server started successfully on port 8080");

    server.run().await.expect("Error starting the server");

    Ok(())
}
