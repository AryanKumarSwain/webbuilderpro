// ── Subscription plan grace period ───────────────────
// Single source of truth for how long a school keeps access after
// plan_end_date passes, and the one place that decides whether a plan counts
// as "active". Every plan-expiry check (public site, backend route guard,
// GET /api/school/modules) must call isPlanActive rather than duplicating
// this date math.
const PLAN_GRACE_DAYS = 3;

// Strips the time component so comparisons are date-only, matching how
// plan_end_date (a MySQL DATE column) behaves.
const startOfDay = (d) => new Date(new Date(d).toDateString());

// A school is active when it has a plan_id and today is on/before
// plan_end_date + PLAN_GRACE_DAYS. A NULL plan_end_date (legacy rows from
// before this column existed) is treated as non-expiring.
const isPlanActive = (planId, planEndDate) => {
    if (planId === null || planId === undefined) return false;
    if (!planEndDate) return true;

    const cutoff = startOfDay(planEndDate);
    cutoff.setDate(cutoff.getDate() + PLAN_GRACE_DAYS);

    return cutoff >= startOfDay(new Date());
};

module.exports = { PLAN_GRACE_DAYS, isPlanActive };
