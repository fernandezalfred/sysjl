import type { Prisma } from "@prisma/client";

// Advances created before settledAt existed have the field unset (not null) in
// MongoDB, so "not settled" must match both.
export const NOT_SETTLED: Prisma.PayAdvanceWhereInput = { OR: [{ settledAt: null }, { settledAt: { isSet: false } }] };
