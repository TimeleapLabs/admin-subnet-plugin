export const ErrorCodes: Record<string, number> = {
  INSUFFICIENT_BALANCE: 1001,
};

export type ErrorType = Error & {
  cause?: {
    code?: number;
  };
};
