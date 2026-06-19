import prisma from '../lib/prisma';

export const generateTicketEventCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `TKEV-${currentYear}-`;

  const last = await (prisma as any).ticketEvent.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;
  if (last?.code) {
    const parts = last.code.split('-');
    nextNumber = parseInt(parts[2], 10) + 1;
  }

  const code = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

  const exists = await (prisma as any).ticketEvent.findUnique({ where: { code } });
  if (exists) return generateTicketEventCode();

  return code;
};

export const generateTicketPurchaseCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `TKT-${currentYear}-`;

  const last = await (prisma as any).ticketPurchase.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;
  if (last?.code) {
    const parts = last.code.split('-');
    nextNumber = parseInt(parts[2], 10) + 1;
  }

  const code = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

  const exists = await (prisma as any).ticketPurchase.findUnique({ where: { code } });
  if (exists) return generateTicketPurchaseCode();

  return code;
};
