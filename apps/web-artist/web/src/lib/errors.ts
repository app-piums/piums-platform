export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Error desconocido";
};

export const isUnauthorizedError = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  return message.includes("No autenticado") || message.includes("401");
};
