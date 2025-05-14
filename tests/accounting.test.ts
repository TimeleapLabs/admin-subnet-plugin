import { debit, credit, refund } from "@lib/rpc.js";
import { getUserBalance } from "@lib/db.js";
import { equal } from "@lib/binary.js";

import "./setup.ts";

describe("Accounting transactions", () => {
  it("should credit a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const subnet = {
      signer: new Uint8Array([4, 5, 6]),
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 100;
    const currency = "USD";

    const creditTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
    };

    await credit(creditTransaction);

    const { balance } = (await getUserBalance(
      user,
      currency,
      subnet.signer,
    )) ?? { balance: 0 };

    expect(balance).toBe(100);
  });

  it("should debit a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = {
      signer: new Uint8Array([1, 2, 3]),
      signature: new Uint8Array([4, 5, 6]),
    };
    const subnet = {
      signer: new Uint8Array([4, 5, 6]),
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 50;
    const currency = "USD";

    const debitTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
    };

    await debit(debitTransaction);

    const { balance } = (await getUserBalance(
      user.signer,
      currency,
      subnet.signer,
    )) ?? { balance: 0 };

    expect(balance).toBe(50);
  });

  it("should refund a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const subnet = {
      signer: new Uint8Array([4, 5, 6]),
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 50;
    const currency = "USD";

    const refundTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
    };

    await refund(refundTransaction);

    const { balance } = (await getUserBalance(
      user,
      currency,
      subnet.signer,
    )) ?? { balance: 0 };

    expect(balance).toBe(100);
  });

  it("should fail a refund if uuid doesn't match", async () => {
    const uuid = new Uint8Array([1, 3, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const subnet = {
      signer: new Uint8Array([4, 5, 6]),
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 50;
    const currency = "USD";

    const refundTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
    };

    await expect(refund(refundTransaction)).rejects.toThrow(
      "Credit transaction not found",
    );
  });

  it("should fail a refund if currency doesn't match", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const subnet = {
      signer: new Uint8Array([4, 5, 6]),
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 50;
    const currency = "EUR";

    const refundTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
    };

    await expect(refund(refundTransaction)).rejects.toThrow(
      "Credit transaction not found",
    );
  });

  it("should fail a refund if amount is bigger than the credit", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const subnet = {
      signer: new Uint8Array([4, 5, 6]),
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 105;
    const currency = "USD";

    const refundTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
    };

    await expect(refund(refundTransaction)).rejects.toThrow(
      "Credit transaction not found",
    );
  });
});
