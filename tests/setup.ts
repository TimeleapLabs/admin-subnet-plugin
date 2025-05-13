import { MongoMemoryServer } from "mongodb-memory-server";
import { credit, debit, refund, authorize, unauthorize } from "@lib/rpc.js";
import { getClient } from "@lib/db.js";

let mongod: MongoMemoryServer;
let uri: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB_NAME = "testdb";

  // Force client reinitialization if using module-level `client` cache
  const client = await getClient(uri);
  await client.db().dropDatabase();
});

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
});
