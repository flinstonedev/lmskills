import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up skills with dead GitHub links every 12 hours
crons.interval(
  "cleanup broken skills",
  { hours: 12 },
  internal.github.cleanupBrokenSkills
);

// Continuously process hosted skill version verification queue.
crons.interval(
  "verify hosted skill versions",
  { minutes: 5 },
  internal.skills.runPendingHostedSkillVerifications,
  { limit: 25 }
);

export default crons;
