import { WithId } from "mongodb";
import type {
  Expire,
  Debit,
  Credit,
  Refund,
  Authorize,
  UnAuthorize,
  UpdateSubnet,
} from "@/model/admin.js";

export type User = {
  user: Uint8Array;
  currency: string;
  subnet: Uint8Array;
  balance: number;
};

export type UserDocument = WithId<User>;

export interface Audited {
  uuid: Uint8Array;
  signer: Uint8Array;
  signature: Uint8Array;
  createdAt: Date;
}

export interface DebitTransaction extends Debit, Audited {
  type: "debit";
}

export interface CreditTransaction extends Credit, Audited {
  type: "credit";
}

export interface RefundTransaction extends Refund, Audited {
  type: "refund";
}

export interface ExpireTransaction extends Expire, Audited {
  type: "expire";
}

export type Transaction =
  | DebitTransaction
  | CreditTransaction
  | RefundTransaction
  | ExpireTransaction;

export interface AuthorizeRequest extends Authorize, Audited {
  type: "authorize";
  createdAt: Date;
}

export interface UnAuthorizeRequest extends UnAuthorize, Audited {
  type: "unauthorize";
  createdAt: Date;
}

export type Delegate = AuthorizeRequest | UnAuthorizeRequest;
export type DelegateDocument = WithId<Delegate>;

export type Subnet = {
  subnet: Uint8Array;
  name: string;
  delegates: Uint8Array[];
  stakeUser: Uint8Array;
  stakeAmount: number;
  stakeExpiration: Date;
};

export type SubnetDocument = WithId<Subnet>;

export interface UpdateSubnetRecord extends UpdateSubnet, Audited {}
