import { Queue, Worker, Job } from "bullmq";
import { bullmqConfig } from "./config";
import { enqueue } from "./redis";

const queue = new Queue("transfer-scheduler", {
  connection: bullmqConfig.redis,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
  },
});

const JOBS = {
  transferJob: "transfer-job",
};

export async function addJobWithCallback(data: Record<string, any>, delay: number): Promise<void> {
  await queue.add(JOBS.transferJob, data, { delay });
}

const callback = async (job: Job) => {
  const data = job.data;
  await enqueue(data);
};

const worker = new Worker(
  "transfer-scheduler",
  async (job) => {
    if (job.name === JOBS.transferJob) {
      await callback(job);
    }
  },
  {
    connection: bullmqConfig.redis,
    concurrency: 5,
  }
);

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

worker.on("failed", (job, err) => {
  if (job) {
    console.error("Job failed:", job.id, err);
  } else {
    console.error("Job failed: job is undefined", err);
  }
});

export { queue };
