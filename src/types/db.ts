import { WithId } from "mongodb";
import type { Signature } from "../model/accounting.js";

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
