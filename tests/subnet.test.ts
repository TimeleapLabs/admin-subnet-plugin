import { authorize, unauthorize } from "@lib/rpc.js";
import { getSubnet } from "@lib/db.js";
import { equal } from "@lib/binary.js";
import { Authorize, UnAuthorize } from "@model/accounting.js";

import { mockSubnet } from "./setup.js";

describe("Subnet administration", () => {
  it("should authorize a user for a subnet", async () => {
    const authorizeRequest: Authorize = {
      user: new Uint8Array([3, 4, 5]),
      subnet: mockSubnet.subnet,
      proof: {
        signer: mockSubnet.delegates[0],
        signature: new Uint8Array([1, 2, 3]),
      },
    };

    await authorize(authorizeRequest);

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
      proof: {
        signer: mockSubnet.delegates[0],
        signature: new Uint8Array([1, 2, 3]),
      },
    };

    await unauthorize(unauthorizeRequest);

    const updatedSubnet = await getSubnet(mockSubnet.subnet);
    expect(updatedSubnet).toBeDefined();

    if (updatedSubnet) {
      expect(
        updatedSubnet.delegates.some((d) => equal(d, unauthorizeRequest.user)),
      ).toBe(false);
    }
  });
});
