import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 15 minutes, clean up rooms that have been inactive for 30+ minutes
crons.interval(
  "cleanup stale rooms",
  { minutes: 15 },
  internal.rooms.cleanupStaleRooms,
);

export default crons;
