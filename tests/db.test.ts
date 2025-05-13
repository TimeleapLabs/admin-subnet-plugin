import { getClient } from "@lib/db.js";
import { MongoClient } from "mongodb";

import "./setup.ts";

describe("MongoDB Connection", () => {
  it("should connect to MongoDB", async () => {
    const client = await getClient();
    expect(client).toBeInstanceOf(MongoClient);
  });
});
