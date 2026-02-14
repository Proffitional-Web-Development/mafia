import { query } from "./_generated/server";

/**
 * Basic analytics queries for the dashboard.
 * These aggregate key metrics about game activity.
 */

/** Total and recent room/game counts */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Total rooms ever created
    const allRooms = await ctx.db.query("rooms").collect();
    const totalRooms = allRooms.length;
    const roomsLast24h = allRooms.filter((r) => r.createdAt > oneDayAgo).length;
    const roomsLast7d = allRooms.filter(
      (r) => r.createdAt > sevenDaysAgo
    ).length;

    // Games by status
    const allGames = await ctx.db.query("games").collect();
    const totalGames = allGames.length;
    const finishedGames = allGames.filter((g) => g.phase === "finished");
    const activeGames = allGames.filter((g) => g.phase !== "finished").length;

    // Winner faction breakdown
    const mafiaWins = finishedGames.filter(
      (g) => g.winnerFaction === "mafia"
    ).length;
    const citizenWins = finishedGames.filter(
      (g) => g.winnerFaction === "citizens"
    ).length;

    // Average game duration (finished games with endedAt)
    const gamesWithDuration = finishedGames.filter((g) => g.endedAt);
    const avgDurationMs =
      gamesWithDuration.length > 0
        ? gamesWithDuration.reduce(
            (sum, g) => sum + (g.endedAt! - g.startedAt),
            0
          ) / gamesWithDuration.length
        : 0;

    // Average rounds per game
    const avgRounds =
      finishedGames.length > 0
        ? finishedGames.reduce((sum, g) => sum + g.round, 0) /
          finishedGames.length
        : 0;

    // Registered users count
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const usersLast7d = allUsers.filter(
      (u) => u.createdAt && u.createdAt > sevenDaysAgo
    ).length;

    return {
      rooms: {
        total: totalRooms,
        last24h: roomsLast24h,
        last7d: roomsLast7d,
      },
      games: {
        total: totalGames,
        active: activeGames,
        finished: finishedGames.length,
        mafiaWins,
        citizenWins,
        avgDurationMinutes: Math.round(avgDurationMs / 60_000),
        avgRounds: Math.round(avgRounds * 10) / 10,
      },
      users: {
        total: totalUsers,
        last7d: usersLast7d,
      },
    };
  },
});

/** Players-per-game distribution for finished games */
export const playersPerGame = query({
  args: {},
  handler: async (ctx) => {
    const finishedGames = await ctx.db
      .query("games")
      .withIndex("by_phase", (q) => q.eq("phase", "finished"))
      .collect();

    let totalPlayers = 0;
    const distribution: Record<number, number> = {};

    for (const game of finishedGames) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_gameId", (q) => q.eq("gameId", game._id))
        .collect();
      const count = players.length;
      totalPlayers += count;
      distribution[count] = (distribution[count] || 0) + 1;
    }

    const avgPlayersPerGame =
      finishedGames.length > 0 ? totalPlayers / finishedGames.length : 0;

    return {
      avgPlayersPerGame: Math.round(avgPlayersPerGame * 10) / 10,
      distribution,
      totalFinishedGames: finishedGames.length,
    };
  },
});
