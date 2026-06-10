import { Prisma } from '@prisma/client';
import prisma from '../config/database';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'deactivate' | 'cancel' | 'process_payment' | 'refund' | 'status_change';

interface AuditInput {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action as any,
        entity: input.entity,
        entityId: input.entityId,
        oldValue: input.oldValue as Prisma.InputJsonValue | undefined,
        newValue: input.newValue as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch {
    // audit logging should never throw
  }
}
