// Advances (adelantos) the admin gave sellers, grouped per seller for the panel
// header. Prisma-free, so the client component can import the types.

export interface PayAdvanceRow {
  id: string;
  userId: string;
  // The day it was given, YYYY-MM-DD.
  date: string;
  amount: number;
  description: string;
}

export interface SellerAdvances {
  userId: string;
  userName: string;
  // A current seller (can be given a new advance); false for a former one who still
  // has advances on record.
  active: boolean;
  // Advances not paid off yet (the list and its total).
  total: number;
  // Newest day first.
  advances: PayAdvanceRow[];
}

export interface AdvanceSeller {
  userId: string;
  userName: string;
}

export interface AdvanceInput extends PayAdvanceRow {
  userName: string;
}

// One entry per seller (every current seller given, plus anyone else who has
// advances; settled ones are left out before this), each with their advances newest
// first and their total. Sellers with the biggest total come first, then by name.
export function advancesBySeller(sellers: AdvanceSeller[], advances: AdvanceInput[]): SellerAdvances[] {
  const byUser = new Map<string, SellerAdvances>();
  for (const seller of sellers) {
    byUser.set(seller.userId, { userId: seller.userId, userName: seller.userName, active: true, total: 0, advances: [] });
  }
  for (const { userName, ...advance } of advances) {
    const entry = byUser.get(advance.userId) ?? { userId: advance.userId, userName, active: false, total: 0, advances: [] };
    entry.total += advance.amount;
    entry.advances.push(advance);
    byUser.set(advance.userId, entry);
  }

  const result = [...byUser.values()];
  for (const entry of result) {
    entry.advances.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  }
  return result.sort((a, b) => b.total - a.total || a.userName.localeCompare(b.userName));
}

export function totalAdvances(sellers: SellerAdvances[]): number {
  return sellers.reduce((sum, seller) => sum + seller.total, 0);
}
