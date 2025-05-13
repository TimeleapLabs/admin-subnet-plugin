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
} from "../types/db.js";
import type { Credit, Debit, Signature } from "../model/accounting.js";

let client: MongoClient | null = null;

/**
 * @description Connect to MongoDB
 * @param uri MongoDB connection string (default: process.env.MONGODB_URI)
 * @returns MongoDB client
 */
const connect = async (uri: string = process.env.MONGODB_URI ?? "") => {
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
  const client = await connect();
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
  session: ClientSession | undefined,
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
  session: ClientSession | undefined,
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
  session: ClientSession | undefined,
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
    throw new Error("Insufficient balance");
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
  session: ClientSession | undefined,
): Promise<InsertOneResult<Credit>> => {
  const db = await getDb();
  const collection = db.collection<Credit>("transactions");
  return await collection.insertOne(credit, { session });
};

/**
 * @description Record a debit transaction
 * @param debit Debit transaction
 * @param session MongoDB session (optional)
 * @returns Insert result
 */
export const recordDebit = async (
  debit: Debit,
  session: ClientSession | undefined,
): Promise<InsertOneResult<Debit>> => {
  const db = await getDb();
  const collection = db.collection<Debit>("transactions");
  return await collection.insertOne(debit, { session });
};

/**
 * @description Get user delegation
 * @param user User public key
 * @param session MongoDB session (optional)
 * @returns Delegate document or null if not found
 */
export const getDelegation = async (
  user: Uint8Array,
  session: ClientSession | undefined,
): Promise<DelegateDocument | null> => {
  const db = await getDb();
  const collection = db.collection<Delegate>("delegations");
  return await collection.findOne({ user }, { session });
};

/**
 * @description Add a delegation
 * @param user User public key
 * @param subnet Subnet signature
 * @param session MongoDB session (optional)
 * @returns Insert result
 * @notes You MUST define a unique index on the user field in the delegations collection
 *        to ensure that each user can only have one delegation.
 */
export const safeAddDelegation = async (
  user: Uint8Array,
  subnet: Signature,
  session: ClientSession | undefined,
): Promise<InsertOneResult<Delegate>> => {
  const db = await getDb();
  const collection = db.collection<Delegate>("delegations");
  return await collection.insertOne({ user, subnet }, { session });
};

/**
 * @description Remove a delegation
 * @param user User public key
 * @param session MongoDB session (optional)
 * @returns Delete result
 */
export const removeDelegation = async (
  user: Uint8Array,
  session: ClientSession | undefined,
): Promise<DeleteResult> => {
  const db = await getDb();
  const collection = db.collection<Delegate>("delegations");
  return await collection.deleteOne({ user }, { session });
};
