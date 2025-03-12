import { Client, errors } from "@elastic/elasticsearch";
import { elasticSearchConfig } from "./config";

const client = new Client({
  node: elasticSearchConfig.baseUrl,
});

const indexName = elasticSearchConfig.index;

export async function removeItemFromElasticsearch(itemId: string): Promise<boolean> {
  try {
    const response = await client.delete({
      index: indexName,
      id: itemId,
      refresh: "true",
    });

    console.log(`Item ${itemId} successfully removed from Elasticsearch index`);
    return true;
  } catch (error: unknown) {
    if (error instanceof errors.ResponseError) {
      if (error.statusCode === 404) {
        console.log(`Item ${itemId} not found in Elasticsearch index, no action needed`);
        return true;
      }

      console.error(`Failed to remove item ${itemId} from Elasticsearch: ${error.message}`);
    } else {
      console.error(`Error removing item ${itemId} from Elasticsearch:`, error);
    }
    throw error;
  }
}
