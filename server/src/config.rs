use config::ConfigError;
use dotenv::dotenv;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub mongo_uri: String,
    pub redis_uri: String,
    pub db_name: String,
    pub blockchain_api_base_uri: String,
    pub transfer_scheduler_base_uri: String,
    pub aws_access_key: String,
    pub aws_secret_access_key: String,
    pub aws_bucket: String,
    pub aws_region: String,
    pub elasticsearch_uri: String,
    pub app: Application,
}

#[derive(Debug, Deserialize)]
pub struct Application {
    pub port: u16,
    pub host: String,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        dotenv().ok();
        let mut cfg = config::Config::default();
        cfg.merge(config::Environment::default())?;
        cfg.try_into()
    }
}
