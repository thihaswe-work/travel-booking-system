import prisma from '../config/database';

const APPROVAL_THRESHOLD = 5;

export function agentNeedsApproval(user: { role: string; trustLevel?: string; approvedItemsCount?: number }): boolean {
  if (user.role !== 'travel_agent') return false;
  if (user.trustLevel === 'trusted') return false;
  if ((user.approvedItemsCount ?? 0) >= APPROVAL_THRESHOLD) return false;
  return true;
}

export async function recountApprovedItems(agentId: string) {
  const [flights, hotels, tours] = await Promise.all([
    prisma.flight.count({ where: { createdById: agentId, isActive: true } }),
    prisma.hotel.count({ where: { createdById: agentId, isActive: true } }),
    prisma.tour.count({ where: { createdById: agentId, isActive: true } }),
  ]);
  const total = flights + hotels + tours;
  return prisma.user.update({
    where: { id: agentId },
    data: {
      approvedItemsCount: total,
      ...(total >= APPROVAL_THRESHOLD ? { trustLevel: 'trusted' } : {}),
    },
  });
}
