import {
  ClientSession,
  DeleteResult,
  InsertOneResult,
  MongoClient,
  UpdateResult,
} from "mongodb";
import type {
  User,
  UserDocument,
  DelegateDocument,
  Delegate,
  DebitTransaction,
  CreditTransaction,
  RefundTransaction,
  Transaction,
  SubnetDocument,
  Subnet,
} from "@type/db.js";
import type {
  Authorize,
  Credit,
  Debit,
  Refund,
  Signature,
  UnAuthorize,
  UpdateSubnet,
} from "@/model/admin.js";
import type { Maybe } from "@type/helpers.js";
import { ErrorCodes } from "./errors.js";

let client: MongoClient | null = null;

/**
 * @description Connect to MongoDB
 * @param uri MongoDB connection string (default: process.env.MONGODB_URI)
 * @returns MongoDB client
 */
export const getClient = async (
  uri: string = process.env.MONGODB_URI ?? "",
) => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
};

/**
 * @description Get MongoDB database
 * @param dbName Database name (default: process.env.MONGODB_DB_NAME or "timeleap")
 * @returns MongoDB database
 */
const getDb = async (
  dbName: string = process.env.MONGODB_DB_NAME ?? "timeleap",
) => {
  const client = await getClient();
  return client.db(dbName);
};

/**
 * @description Get user balance
 * @param user User public key
 * @param currency Currency name
 * @param subnet Subnet name
 * @param session MongoDB session (optional)
 * @returns User document or null if not found
 */
export const getUserBalance = async (
  user: Uint8Array,
  currency: string,
  subnet: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<UserDocument | null> => {
  const db = await getDb();
  const collection = db.collection<User>("users");
  return await collection.findOne({ user, currency, subnet }, { session });
};

/**
 * @description Increment user balance
 * @param user User public key
 * @param currency Currency name
 * @param subnet Subnet name
 * @param amount Amount to increment
 * @param session MongoDB session (optional)
 * @returns Update result
 */
export const incUserBalance = async (
  user: Uint8Array,
  currency: string,
  subnet: Uint8Array,
  amount: number,
  session: Maybe<ClientSession> = undefined,
): Promise<UpdateResult<User>> => {
  const db = await getDb();
  const collection = db.collection<User>("users");
  return await collection.updateOne(
    { user, currency, subnet },
    { $inc: { balance: amount } },
    { upsert: true, session },
  );
};

/**
 * @description Decrement user balance
 * @param user User public key
 * @param currency Currency name
 * @param subnet Subnet name
 * @param amount Amount to decrement
 * @param session MongoDB session (optional)
 * @param check Check if balance is sufficient (default: true)
 * @returns Update result
 * @throws Error if balance is insufficient
 */
export const safeDecUserBalance = async (
  user: Uint8Array,
  currency: string,
  subnet: Uint8Array,
  amount: number,
  session: Maybe<ClientSession> = undefined,
  check: boolean = true,
): Promise<UpdateResult<User>> => {
  const db = await getDb();
  const collection = db.collection<User>("users");

  const result = await collection.updateOne(
    { user, currency, subnet, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { upsert: true, session },
  );

  if ((check && result.matchedCount === 0) || result.modifiedCount === 0) {
    throw new Error("Insufficient balance", {
      cause: { code: ErrorCodes.INSUFFICIENT_BALANCE },
    });
  }

  return result;
};

/**
 * @description Record a credit transaction
 * @param credit Credit transaction
 * @param session MongoDB session (optional)
 * @returns Insert result
 */
export const recordCredit = async (
  credit: Credit,
  uuid: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<InsertOneResult<CreditTransaction>> => {
  const db = await getDb();
  const collection = db.collection<CreditTransaction>("transactions");
  return await collection.insertOne(
    { ...credit, uuid, type: "credit", createdAt: new Date() },
    { session },
  );
};

/**
 * @description Record a debit transaction
 * @param debit Debit transaction
 * @param session MongoDB session (optional)
 * @returns Insert result
 */
export const recordDebit = async (
  debit: Debit,
  uuid: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<InsertOneResult<DebitTransaction>> => {
  const db = await getDb();
  const collection = db.collection<DebitTransaction>("transactions");
  return await collection.insertOne(
    { ...debit, uuid, type: "debit", createdAt: new Date() },
    { session },
  );
};

/**
 * @description Record a refund transaction
 * @param refund Refund transaction
 * @param session MongoDB session (optional)
 * @param check Check if credit transaction exists (default: true)
 * @returns Insert result
 */
export const safeRecordRefund = async (
  refund: Refund,
  uuid: Uint8Array,
  session: Maybe<ClientSession> = undefined,
  check: boolean = true,
): Promise<InsertOneResult<RefundTransaction>> => {
  const db = await getDb();
  const collection = db.collection<Transaction>("transactions");

  const debit = await collection.findOne(
    {
      uuid: refund.debit,
      subnet: refund.subnet,
      type: "debit",
      amount: { $gte: refund.amount },
      currency: refund.currency,
    },
    { session },
  );

  if (check && !debit) {
    throw new Error("Debit transaction not found");
  }

  return await collection.insertOne(
    { ...refund, uuid, type: "refund", createdAt: new Date() },
    { session },
  );
};

/**
 * @description Get user delegation
 * @param user User public key
 * @param session MongoDB session (optional)
 * @returns Delegate document or null if not found
 */
export const getDelegation = async (
  user: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<DelegateDocument | null> => {
  const db = await getDb();
  const collection = db.collection<Delegate>("delegations");
  return await collection.findOne({ user }, { session });
};

/**
 * @description Add a delegation
 * @param authorize Authorize transaction
 * @param session MongoDB session (optional)
 * @returns Insert result
 * @notes You MUST define a unique index on the user field in the delegations collection
 *        to ensure that each user can only have one delegation.
 */
export const addAuthorizeDelegationRecord = async (
  authorize: Authorize,
  session: Maybe<ClientSession> = undefined,
): Promise<InsertOneResult<Delegate>> => {
  const db = await getDb();
  const collection = db.collection<Delegate>("delegations");
  return await collection.insertOne(
    { ...authorize, type: "authorize", createdAt: new Date() },
    { session },
  );
};

/**
 * @description Remove a delegation
 * @param unauthorize UnAuthorize transaction
 * @param session MongoDB session (optional)
 * @returns Delete result
 */
export const addUnAuthorizeDelegationRecord = async (
  unauthorize: UnAuthorize,
  session: Maybe<ClientSession> = undefined,
): Promise<InsertOneResult<Delegate>> => {
  const db = await getDb();
  const collection = db.collection<Delegate>("delegations");
  return await collection.insertOne(
    { ...unauthorize, type: "unauthorize", createdAt: new Date() },
    { session },
  );
};

/**
 * @description Add a subnet
 * @param subnet Subnet information
 * @param session MongoDB session (optional)
 * @returns Insert result
 */
export const addSubnet = async (
  subnet: Subnet,
  session: Maybe<ClientSession> = undefined,
): Promise<InsertOneResult<Subnet>> => {
  const db = await getDb();
  const collection = db.collection<Subnet>("subnets");
  return collection.insertOne(subnet, { session });
};

/**
 * @description Get subnet information
 * @param subnet Subnet signature
 * @param session MongoDB session (optional)
 * @returns Subnet document or null if not found
 */
export const getSubnet = async (
  subnet: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<SubnetDocument | null> => {
  const db = await getDb();
  const collection = db.collection<Subnet>("subnets");
  return await collection.findOne({ subnet }, { session });
};

/**
 * @description Add a subnet
 * @param subnet Subnet information
 * @param session MongoDB session (optional)
 * @returns Insert result
 */
export const addDelegateToSubnet = async (
  subnet: Uint8Array,
  user: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<UpdateResult<Subnet>> => {
  const db = await getDb();
  const collection = db.collection<Subnet>("subnets");
  return await collection.updateOne(
    { subnet },
    { $addToSet: { delegates: user } },
    { session },
  );
};

/**
 * @description Remove a subnet
 * @param subnet Subnet signature
 * @param session MongoDB session (optional)
 * @returns Delete result
 */
export const removeDelegateFromSubnet = async (
  subnet: Uint8Array,
  user: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<UpdateResult<Subnet>> => {
  const db = await getDb();
  const collection = db.collection<Subnet>("subnets");
  return await collection.updateOne(
    { subnet },
    { $pull: { delegates: user } },
    { session },
  );
};

export const upsertSubnet = async (
  update: UpdateSubnet,
  user: Uint8Array,
  session: Maybe<ClientSession> = undefined,
): Promise<UpdateResult<Subnet>> => {
  const db = await getDb();
  const collection = db.collection<Subnet>("subnets");
  return await collection.updateOne(
    { subnet: update.subnet },
    {
      $set: { stakeUser: update.stakeUser, updatedAt: new Date() },
      $addToSet: { delegates: user },
    },
    { session, upsert: true },
  );
};
