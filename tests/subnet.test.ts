import { authorize, unauthorize } from "@lib/rpc.js";
import { getDelegation } from "@lib/db.js";
import { equal } from "@lib/binary.js";

import "./setup.ts";

describe("Subnet administration", () => {
  it("should authorize a user for a subnet", async () => {
    const user = new Uint8Array([1, 2, 3]);
    const signer = new Uint8Array([4, 5, 6]);
    const signature = new Uint8Array([7, 8, 9]);
    const subnet = { signer, signature };

    await authorize(user, subnet);

    const delegation = await getDelegation(user);
    expect(delegation).not.toBeNull();

    if (delegation) {
      expect(equal(delegation.user, user)).toBe(true);
      expect(equal(delegation.subnet.signer, signer)).toBe(true);
    }
  });

  it("should remove user authorization for a subnet", async () => {
    const user = new Uint8Array([1, 2, 3]);
    const signer = new Uint8Array([4, 5, 6]);
    const signature = new Uint8Array([7, 8, 9]);
    const subnet = { signer, signature };

    await unauthorize(user, subnet);

    const delegation = await getDelegation(user);
    expect(delegation).toBeNull();
  });
});
