import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("notion sync", { minutes: 5 }, internal.notion.pull.run, {});

export default crons;
