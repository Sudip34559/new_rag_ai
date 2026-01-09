import { Queue } from "bullmq";

export const queue1 = new Queue("file-upload-queue");
export const queue2 = new Queue("web-load-queue");
export const queue3 = new Queue("youtube-video-load-queue");
export const queue4 = new Queue("git-repo-analize");
