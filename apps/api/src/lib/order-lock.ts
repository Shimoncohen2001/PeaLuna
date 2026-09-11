import type { Prisma } from '@velure/database';

export function versionConflictError() {
  return Object.assign(new Error('Order was modified by another request'), {
    statusCode: 409,
    code: 'VERSION_CONFLICT',
  });
}

/** Atomic optimistic lock: increment version only if it still matches. */
export async function updateOrderIfVersion(
  tx: Prisma.TransactionClient,
  orderId: string,
  expectedVersion: number,
  data: Prisma.RepairOrderUpdateManyMutationInput,
) {
  const result = await tx.repairOrder.updateMany({
    where: { id: orderId, version: expectedVersion },
    data: { ...data, version: { increment: 1 } },
  });
  if (result.count === 0) {
    throw versionConflictError();
  }
}
