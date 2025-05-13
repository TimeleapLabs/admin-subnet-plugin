import { getClient } from "@lib/db.js";
import { MongoClient } from "mongodb";

import "./setup.ts";

it("should connect to MongoDB", async () => {
  const client = await getClient();
  expect(client).toBeInstanceOf(MongoClient);
});
