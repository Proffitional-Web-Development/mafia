# T27 — Data Cleanup & Maintenance Jobs

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | — |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T02, T03, T06 |

## Description

Implement automated data cleanup jobs to prevent stale data accumulation. Two scheduled jobs are required: (1) delete all data related to a finished game 1 hour after it ends, and (2) delete any room and all its associated data if the room's creation time exceeds 3 hours, regardless of game state.

---

## Issue 1 — Post-Game Data Cleanup (1 Hour After Finish)

**Problem:** When a game finishes, all related data (players, votes, actions, game events, chat messages) remains in the database indefinitely. Over time this causes unbounded storage growth and degrades query performance.

**Requirement:** 1 hour after a game finishes (`phase === "finished"` and `endedAt` is set), automatically delete all data associated with that game. The room record itself transitions to `"finished"` status and is also cleaned up.

### Backend Sub-Tasks

1. Create a `cleanupFinishedGame` internal mutation in a new `cleanup.ts` convex file:
   - Accepts `{ gameId: Id<"games"> }`
   - Re-fetch the game to verify it still exists and `phase === "finished"` (guard against double execution)
   - Delete all records in the following tables where `gameId` matches:
     - `players` — all player records for the game
     - `votes` — all vote records for the game
     - `actions` — all action records for the game
     - `gameEvents` — all event log records for the game
     - `chatMessages` — all chat messages for the game
   - Delete the `games` record itself
   - Look up the room via `game.roomId`:
     - Clear `room.currentGameId` (set to `undefined`)
     - If the room status is `"finished"`, proceed to delete the room and its members (see sub-task 3)
     - If the room status is `"waiting"` (owner started a new game), leave the room intact

2. Schedule the cleanup when a game finishes:
   - In the game finish logic (wherever `phase` is set to `"finished"` and `endedAt` is written — likely in `stateMachine.ts` or `endCheck` logic):
     - After writing the game result, schedule `cleanupFinishedGame` to run after 1 hour:
       ```ts
       await ctx.scheduler.runAfter(
         60 * 60 * 1000, // 1 hour in ms
         internal.cleanup.cleanupFinishedGame,
         { gameId }
       );
       ```
   - Store the scheduled function ID on the game document (optional, for cancellation if needed):
     - Add `cleanupScheduledId: v.optional(v.string())` to the `games` table (or skip if cancellation is not required)

3. Create a `deleteRoomAndRelatedData` internal helper in `cleanup.ts`:
   - Accepts `{ roomId: Id<"rooms"> }`
   - Deletes all `roomMembers` where `roomId` matches
   - Deletes the `rooms` record
   - If the room has a `currentGameId`, also clean up that game's data (call `cleanupFinishedGame` or inline the same deletion logic)
   - Guard: if the room does not exist (already deleted), return silently

---

## Issue 2 — Stale Room Cleanup (3 Hours After Creation)

**Problem:** Rooms that are created but never used (or games that hang indefinitely) accumulate in the database. The existing `cleanupStaleRooms` cron job (in `crons.ts`) cleans rooms inactive for 30+ minutes, but it may not cover all cases — particularly rooms stuck in `"in-game"` status with no activity.

**Requirement:** Any room whose `createdAt` timestamp is more than 3 hours ago must be automatically deleted along with all associated data, regardless of room status (`"waiting"`, `"in-game"`, or `"finished"`).

### Backend Sub-Tasks

4. Create a `cleanupExpiredRooms` internal mutation in `cleanup.ts`:
   - Query all rooms where `createdAt < Date.now() - (3 * 60 * 60 * 1000)` (3 hours ago)
   - Use the `by_lastActivityAt` or `by_createdAt` index (add a `by_createdAt` index to rooms if it doesn't exist — see sub-task 5)
   - For each expired room:
     - If the room has a `currentGameId`:
       - Fetch the game
       - Delete all related game data: `players`, `votes`, `actions`, `gameEvents`, `chatMessages`
       - Delete the `games` record
     - Delete all `roomMembers` for the room
     - Delete the `rooms` record
   - Log the number of rooms cleaned up (use `console.log` for Convex dashboard visibility)
   - Process in batches if needed (Convex has execution time limits): handle up to 50 rooms per invocation, and if more remain, re-schedule self

5. Add a `by_createdAt` index to the `rooms` table in `schema.ts` (if not already present):
   - `.index("by_createdAt", ["createdAt"])`
   - This enables efficient range queries for rooms older than 3 hours

6. Register the cron job in `crons.ts`:
   - Add a new cron entry alongside the existing `cleanupStaleRooms`:
     ```ts
     crons.interval(
       "cleanup expired rooms (3h)",
       { minutes: 30 },
       internal.cleanup.cleanupExpiredRooms,
     );
     ```
   - Runs every 30 minutes to catch rooms that have crossed the 3-hour threshold
   - Consider whether the existing `cleanupStaleRooms` job should be kept, removed, or merged with this one:
     - If `cleanupStaleRooms` only cleans `"waiting"` rooms inactive for 30 min, it complements this job (keep both)
     - If it overlaps entirely, remove it and rely on this job alone

---

## Issue 3 — Deletion Safety & Edge Cases

**Problem:** Deletion jobs must handle edge cases gracefully — double execution, missing records, in-progress games, and Convex execution limits.

**Requirement:** All cleanup functions must be idempotent, safe against double execution, and handle large datasets within Convex's execution time limits.

### Backend Sub-Tasks

7. Make all cleanup functions idempotent:
   - Before deleting, check if the record exists — if not, skip silently (no errors)
   - Use guard clauses at the top of each function: if the game/room is already deleted, return early
   - This prevents errors from double-scheduled cleanup or race conditions

8. Handle batch deletion for large datasets:
   - Convex mutations have execution time limits (~10 seconds)
   - If a game has many records (e.g. 500+ chat messages), the deletion may timeout
   - Strategy: query records with `.take(100)`, delete them, and if more remain, re-schedule the same cleanup function with the same args:
     ```ts
     const messages = await ctx.db
       .query("chatMessages")
       .withIndex("by_gameId_channel", q => q.eq("gameId", gameId))
       .take(100);
     for (const msg of messages) {
       await ctx.db.delete(msg._id);
     }
     if (messages.length === 100) {
       // More to delete — re-schedule
       await ctx.scheduler.runAfter(0, internal.cleanup.cleanupFinishedGame, { gameId });
       return;
     }
     ```
   - Apply the same pattern for each table being cleaned

9. Handle the case where a room is being cleaned up while a game is still in progress:
   - The 3-hour cleanup job may encounter rooms with `status === "in-game"`
   - This is intentional — games that run for 3+ hours are considered stale/abandoned
   - Before deleting, set the game `phase` to `"finished"` and room `status` to `"finished"` to maintain data consistency
   - Players currently connected will see a "game ended" state on their next query (Convex subscriptions will update reactively)

10. Add logging for all cleanup operations:
    - Log to console (visible in Convex dashboard): `"Cleaned up game ${gameId} — deleted X players, Y votes, Z events"`
    - Log room cleanups: `"Cleaned up expired room ${roomId} (created ${hoursAgo}h ago)"`
    - This aids debugging and monitoring in production

---

## Acceptance Criteria

- [ ] Finished games and all related data are automatically deleted 1 hour after the game ends
- [ ] Related data includes: `players`, `votes`, `actions`, `gameEvents`, `chatMessages`, and the `games` record
- [ ] Room record is cleaned up if its status is `"finished"` after game cleanup
- [ ] Rooms older than 3 hours are automatically deleted regardless of status (`"waiting"`, `"in-game"`, `"finished"`)
- [ ] 3-hour cleanup deletes all associated data: room members, games, players, votes, actions, events, chat messages
- [ ] Cleanup functions are idempotent — safe to run multiple times on the same target
- [ ] Batch deletion handles large datasets without hitting Convex execution time limits
- [ ] In-progress games in expired rooms are gracefully terminated before deletion
- [ ] Cron job runs every 30 minutes for expired room cleanup
- [ ] Game finish logic schedules a 1-hour delayed cleanup via `ctx.scheduler.runAfter`
- [ ] Cleanup operations are logged for monitoring in the Convex dashboard
- [ ] No regressions in existing game flow or room management
- [ ] Existing `cleanupStaleRooms` cron job is reviewed and either kept (if complementary) or merged
