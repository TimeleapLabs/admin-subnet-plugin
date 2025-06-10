import { debit, credit, refund } from "@lib/rpc.js";
import { getUserBalance } from "@lib/db.js";

import { mockSubnet } from "./setup.js";

describe("Accounting transactions", () => {
  it("should credit a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const proof = {
      signer: mockSubnet.delegates[0],
      signature: new Uint8Array([4, 5, 6]),
    };
    const amount = 100;
    const currency = "USD";
    const subnet = mockSubnet.subnet;

    const creditTransaction = {
      uuid,
      user,
      subnet,
      amount,
      currency,
      proof,
    };

    await credit(creditTransaction);

    const { balance } = (await getUserBalance(user, currency, subnet)) ?? {
      balance: 0,
    };

    expect(balance).toBe(100);
  });

  it("should debit a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = {
      signer: new Uint8Array([1, 2, 3]),
      signature: new Uint8Array([4, 5, 6]),
    };
    const proof = {
      signer: mockSubnet.delegates[0],
      signature: new Uint8Array([7, 8, 9]),
    };
    const amount = 50;
    const currency = "USD";
    const subnet = mockSubnet.subnet;

    const debitTransaction = {
      uuid,
      user,
      proof,
      amount,
      currency,
      subnet,
    };

    await debit(debitTransaction);

    const { balance } = (await getUserBalance(
      user.signer,
      currency,
      subnet,
    )) ?? { balance: 0 };

    expect(balance).toBe(50);
  });

  it("should refund a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 2, 3]);
    const proof = {
      signer: mockSubnet.delegates[0],
      signature: new Uint8Array([4, 5, 6]),
    };
    const subnet = mockSubnet.subnet;
    const amount = 50;
    const currency = "USD";

    const refundTransaction = {
      uuid,
      user,
      debit,
      subnet,
      amount,
      currency,
      proof,
    };

    await refund(refundTransaction);

    const { balance } = (await getUserBalance(user, currency, subnet)) ?? {
      balance: 0,
    };

    expect(balance).toBe(100);
  });

  it("should fail a refund if uuid doesn't match", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 3, 3]);
    const proof = {
      signer: mockSubnet.delegates[0],
      signature: new Uint8Array([4, 5, 6]),
    };
    const amount = 50;
    const currency = "USD";
    const subnet = mockSubnet.subnet;

    const refundTransaction = {
      uuid,
      debit,
      user,
      subnet,
      amount,
      currency,
      proof,
    };

    await expect(refund(refundTransaction)).rejects.toThrow(
      "Debit transaction not found",
    );
  });

  it("should fail a refund if currency doesn't match", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 2, 3]);
    const proof = {
      signer: mockSubnet.delegates[0],
      signature: new Uint8Array([4, 5, 6]),
    };
    const amount = 50;
    const currency = "EUR";
    const subnet = mockSubnet.subnet;

    const refundTransaction = {
      uuid,
      user,
      debit,
      subnet,
      amount,
      currency,
      proof,
    };

    await expect(refund(refundTransaction)).rejects.toThrow(
      "Debit transaction not found",
    );
  });

  it("should fail a refund if amount is bigger than the credit", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 2, 3]);
    const subnet = mockSubnet.subnet;
    const proof = {
      signer: mockSubnet.delegates[0],
      signature: new Uint8Array([4, 5, 6]),
    };
    const amount = 105;
    const currency = "USD";

    const refundTransaction = {
      uuid,
      user,
      debit,
      subnet,
      amount,
      currency,
      proof,
    };

    await expect(refund(refundTransaction)).rejects.toThrow(
      "Debit transaction not found",
    );
  });
});
