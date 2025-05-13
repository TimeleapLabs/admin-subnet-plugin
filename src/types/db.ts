import { WithId } from "mongodb";
import type { Signature, Debit, Credit, Refund } from "@model/accounting.js";

export type User = {
  user: Uint8Array;
  currency: string;
  subnet: Uint8Array;
  balance: number;
};

export type UserDocument = WithId<User>;

export type Delegate = {
  user: Uint8Array;
  subnet: Signature;
};

export type DelegateDocument = WithId<Delegate>;

export interface DebitTransaction extends Debit {
  type: "debit";
}

export interface CreditTransaction extends Credit {
  type: "credit";
}

export interface RefundTransaction extends Refund {
  type: "refund";
}

export type Transaction =
  | DebitTransaction
  | CreditTransaction
  | RefundTransaction;
