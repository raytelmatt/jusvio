import { Query } from '@/react-app/lib/backend';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/backend';
import type { DashboardStats } from '@/shared/types';

function isoNow(): string {
  return new Date().toISOString();
}

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function count(collection: string, queries: string[]): Promise<number> {
  try {
    // Use small limit to reduce payload; rely on total
    const res = await databases.listDocuments(DATABASE_ID, collection, [
      ...queries,
      Query.limit(1),
    ]);
    return res.total ?? (res.documents?.length ?? 0);
  } catch (err) {
    // If attribute isn't indexed or permissions block access, default to 0
    console.warn('[dashboard] count fallback for', collection, '->', 0, err);
    return 0;
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const now = isoNow();
  const in7 = isoInDays(7);
  const in30 = isoInDays(30);

  const [openCriminal, openPI, openSSD, hearings7, deadlines7, deadlines30, unpaidInvoices] = await Promise.all([
    count(COLLECTIONS.matters, [Query.equal('practice_area', 'Criminal'), Query.equal('status', 'Open')]),
    count(COLLECTIONS.matters, [Query.equal('practice_area', 'PersonalInjury'), Query.equal('status', 'Open')]),
    count(COLLECTIONS.matters, [Query.equal('practice_area', 'SSD'), Query.equal('status', 'Open')]),
    count(COLLECTIONS.hearings, [Query.greaterThanEqual('start_at', now), Query.lessThanEqual('start_at', in7)]),
    count(COLLECTIONS.deadlines, [Query.equal('status', 'Open'), Query.greaterThanEqual('due_at', now), Query.lessThanEqual('due_at', in7)]),
    count(COLLECTIONS.deadlines, [Query.equal('status', 'Open'), Query.greaterThanEqual('due_at', now), Query.lessThanEqual('due_at', in30)]),
    count(COLLECTIONS.invoices, [Query.in('status', ['Sent', 'Overdue'])]),
  ]);

  const stats: DashboardStats = {
    open_matters_by_practice: {
      Criminal: openCriminal,
      PersonalInjury: openPI,
      SSD: openSSD,
    },
    upcoming_hearings: hearings7,
    deadlines_7_days: deadlines7,
    deadlines_30_days: deadlines30,
    unpaid_invoices: unpaidInvoices,
    new_portal_messages: 0,
  } as DashboardStats;

  return stats;
}
