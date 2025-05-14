import { ClientSession } from "mongodb";
import { getSubnet } from "@lib/db.js";
import { equal } from "@lib/binary.js";

import type { Maybe } from "@type/helpers.js";

export const checkSigner = async (
  subnetAccount: Uint8Array,
  signer: Uint8Array,
  session: Maybe<ClientSession> = undefined,
) => {
  const subnet = await getSubnet(subnetAccount, session);

  if (!subnet) {
    throw new Error("Subnet not found");
  }

  if (!subnet.delegates.some((d) => equal(d, signer))) {
    throw new Error("Signer not authorized for subnet");
  }
};
