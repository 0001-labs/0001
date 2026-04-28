import { query } from "./_generated/server";
import { requireAdmin } from "./admin";

export const summary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [clients, projects, sows, contracts, backOffice] = await Promise.all([
      ctx.db.query("clients").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("sows").collect(),
      ctx.db.query("contracts").collect(),
      ctx.db.query("backOffice").collect(),
    ]);

    const lastRuns = await ctx.db
      .query("syncRuns")
      .withIndex("by_startedAt")
      .order("desc")
      .take(20);

    return {
      counts: {
        clients: clients.length,
        projects: projects.length,
        sows: sows.length,
        contracts: contracts.length,
        backOffice: backOffice.length,
      },
      lastRuns: lastRuns.filter((run) => run.database !== "tasks").slice(0, 10),
    };
  },
});
