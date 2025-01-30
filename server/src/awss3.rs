use aws_sdk_s3::{
    config::{Credentials, Region},
    primitives::ByteStream,
    Client as S3Client,
};
use std::{fmt, path::Path};

#[derive(Debug)]
pub enum AWSError {
    AuthenticationError(String),
    BucketAccessError(String),
    UploadError(String),
    ConfigurationError(String),
}

impl fmt::Display for AWSError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AWSError::AuthenticationError(msg) => write!(f, "Authentication Error: {}", msg),
            AWSError::BucketAccessError(msg) => write!(f, "Bucket Access Error: {}", msg),
            AWSError::UploadError(msg) => write!(f, "Upload Error: {}", msg),
            AWSError::ConfigurationError(msg) => write!(f, "Configuration Error: {}", msg),
        }
    }
}

#[derive(Clone)]
pub struct AWSClient {
    s3_client: S3Client,
    bucket_name: String,
}

impl AWSClient {
    pub async fn new(
        access_key: &str,
        secret_access_key: &str,
        bucket_name: &str,
        region: &str,
    ) -> Result<Self, AWSError> {
        let credentials = Credentials::new(access_key, secret_access_key, None, None, "custom");

        let config = aws_sdk_s3::Config::builder()
            .credentials_provider(credentials)
            .region(Region::new(region.to_string()))
            .behavior_version_latest()
            .build();

        let s3_client = S3Client::from_conf(config);

        s3_client
            .head_bucket()
            .bucket(bucket_name)
            .send()
            .await
            .map_err(|err| AWSError::BucketAccessError(err.to_string()))?;

        Ok(Self {
            s3_client,
            bucket_name: bucket_name.to_string(),
        })
    }

    pub async fn upload_image(
        &self,
        item_id: &str,
        index: usize,
        file_path: &Path,
    ) -> Result<String, AWSError> {
        let object_key = format!("{}/{}_{}.jpg", item_id, item_id, index);
        let body = ByteStream::from_path(file_path)
            .await
            .map_err(|err| AWSError::UploadError(format!("Failed to read file: {}", err)))?;

        self.s3_client
            .put_object()
            .bucket(&self.bucket_name)
            .key(&object_key)
            .body(body)
            .send()
            .await
            .map_err(|err| AWSError::UploadError(format!("S3 upload failed: {}", err)))?;

        let region = self
            .s3_client
            .config()
            .region()
            .map(|r| r.as_ref())
            .unwrap_or("unknown-region");

        Ok(format!(
            "https://{}.s3.{}.amazonaws.com/{}",
            self.bucket_name, region, object_key
        ))
    }
}
