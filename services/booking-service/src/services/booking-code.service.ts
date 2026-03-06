import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Genera un código único para bookings
 * Formato: PIU-YYYY-NNNNNN
 * Ejemplo: PIU-2026-000123
 */
export const generateBookingCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `PIU-${currentYear}-`;
  
  // Obtener el último booking del año actual para continuar la secuencia
  const lastBooking = await prisma.booking.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: 'desc',
    },
    select: {
      code: true,
    },
  });

  let nextNumber = 1;
  
  if (lastBooking && lastBooking.code) {
    // Extraer el número del último código (ej: PIU-2026-000123 → 123)
    const lastNumberStr = lastBooking.code.split('-')[2];
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Generar código con padding de 6 dígitos
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  const newCode = `${prefix}${paddedNumber}`;

  // Verificar que no exista (por si acaso, doble check)
  const exists = await prisma.booking.findUnique({
    where: { code: newCode },
  });

  if (exists) {
    // Si existe (muy improbable), reintentar con el siguiente número
    return generateBookingCode();
  }

  return newCode;
};

/**
 * Valida el formato de un código de booking
 */
export const validateBookingCode = (code: string): boolean => {
  const pattern = /^PIU-\d{4}-\d{6}$/;
  return pattern.test(code);
};

/**
 * Extrae información de un código de booking
 */
export const parseBookingCode = (code: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null => {
  if (!validateBookingCode(code)) {
    return null;
  }

  const parts = code.split('-');
  return {
    prefix: parts[0], // "PIU"
    year: parseInt(parts[1], 10), // 2026
    sequence: parseInt(parts[2], 10), // 123
  };
};

/**
 * Busca un booking por su código
 */
export const findBookingByCode = async (code: string) => {
  if (!validateBookingCode(code)) {
    throw new Error(`Invalid booking code format: ${code}`);
  }

  return prisma.booking.findUnique({
    where: { code },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
};

/**
 * Genera códigos para bookings existentes que no tienen código
 * (Útil para migración de datos)
 */
export const generateCodesForExistingBookings = async () => {
  const bookingsWithoutCode = await prisma.booking.findMany({
    where: {
      code: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${bookingsWithoutCode.length} bookings without codes`);

  for (const booking of bookingsWithoutCode) {
    const code = await generateBookingCode();
    await prisma.booking.update({
      where: { id: booking.id },
      data: { code },
    });
    console.log(`Generated code ${code} for booking ${booking.id}`);
  }

  console.log('✅ All bookings now have codes');
};
