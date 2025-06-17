import { Auth, WithId } from "mongodb";
import type {
  Signature,
  Debit,
  Credit,
  Refund,
  Authorize,
  UnAuthorize,
} from "@model/accounting.js";

export type User = {
  user: Uint8Array;
  currency: string;
  subnet: Uint8Array;
  balance: number;
};

export type UserDocument = WithId<User>;

export interface DebitTransaction extends Debit {
  type: "debit";
  uuid: Uint8Array;
  createdAt: Date;
}

export interface CreditTransaction extends Credit {
  type: "credit";
  uuid: Uint8Array;
  createdAt: Date;
}

export interface RefundTransaction extends Refund {
  type: "refund";
  uuid: Uint8Array;
  createdAt: Date;
}

export type Transaction =
  | DebitTransaction
  | CreditTransaction
  | RefundTransaction;

export interface AuthorizeRequest extends Authorize {
  type: "authorize";
  createdAt: Date;
}

export interface UnAuthorizeRequest extends UnAuthorize {
  type: "unauthorize";
  createdAt: Date;
}

export type Delegate = AuthorizeRequest | UnAuthorizeRequest;
export type DelegateDocument = WithId<Delegate>;

export type Subnet = {
  subnet: Uint8Array;
  name: string;
  delegates: Uint8Array[];
  stakeUser: string;
  stakeAmount: number;
  stakeExpiration: Date;
};

export type SubnetDocument = WithId<Subnet>;
