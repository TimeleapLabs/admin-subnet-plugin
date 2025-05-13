import { MongoMemoryReplSet } from "mongodb-memory-server";
import { getClient } from "@lib/db.js";

let mongod: MongoMemoryReplSet;
let uri: string;

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 3 } });
  uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB_NAME = "testdb";
});

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
});
