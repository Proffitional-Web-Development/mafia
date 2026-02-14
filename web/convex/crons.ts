import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 15 minutes, clean up rooms that have been inactive for 30+ minutes
crons.interval(
  "cleanup stale rooms",
  { minutes: 15 },
  internal.rooms.cleanupStaleRooms,
);

// Every 30 minutes, clean up rooms that are older than 3 hours.
crons.interval(
  "cleanup expired rooms (3h)",
  { minutes: 30 },
  internal.cleanup.cleanupExpiredRooms,
);

// Every hour, purge expired rate-limit entries to keep the table small.
crons.interval(
  "cleanup expired rate limits",
  { hours: 1 },
  internal.cleanup.cleanupExpiredRateLimits,
);

export default crons;
