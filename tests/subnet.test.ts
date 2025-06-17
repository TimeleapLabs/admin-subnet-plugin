import { authorize, unauthorize } from "@lib/rpc.js";
import { getSubnet } from "@lib/db.js";
import { equal } from "@lib/binary.js";
import { Authorize, UnAuthorize } from "@/model/admin.js";

import { mockSubnet } from "./setup.js";

describe("Subnet administration", () => {
  it("should authorize a user for a subnet", async () => {
    const authorizeRequest: Authorize = {
      user: new Uint8Array([3, 4, 5]),
      subnet: mockSubnet.subnet,
    };

    await authorize(authorizeRequest, mockSubnet.delegates[0]);

    const subnet = await getSubnet(mockSubnet.subnet);
    expect(subnet).toBeDefined();

    if (subnet) {
      expect(
        subnet.delegates.some((d) => equal(d, authorizeRequest.user)),
      ).toBe(true);
    }
  });

  it("should remove user authorization for a subnet", async () => {
    const unauthorizeRequest: UnAuthorize = {
      user: new Uint8Array([3, 4, 5]),
      subnet: mockSubnet.subnet,
    };

    await unauthorize(unauthorizeRequest, mockSubnet.delegates[0]);

    const updatedSubnet = await getSubnet(mockSubnet.subnet);
    expect(updatedSubnet).toBeDefined();

    if (updatedSubnet) {
      expect(
        updatedSubnet.delegates.some((d) => equal(d, unauthorizeRequest.user)),
      ).toBe(false);
    }
  });
});
