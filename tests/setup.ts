import { MongoMemoryReplSet } from "mongodb-memory-server";
import { addSubnet, getClient } from "@lib/db.js";
import { Subnet } from "@type/db.js";

let mongod: MongoMemoryReplSet;
let uri: string;

export const mockSubnet: Subnet = {
  subnet: new Uint8Array([1, 2, 3]),
  name: "test-subnet",
  delegates: [new Uint8Array([1, 2, 3])],
  stakeUser: "stake-user",
  stakeAmount: 100,
  stakeExpiration: new Date(),
};

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 3 } });
  uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB_NAME = "testdb";

  await addSubnet(mockSubnet);
});

afterAll(async () => {
  const client = await getClient();
  await client.close();
  await mongod.stop();
});
