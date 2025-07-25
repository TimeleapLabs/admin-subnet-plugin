import { debit, credit, refund } from "@lib/rpc.js";
import { getUserBalance } from "@lib/db.js";

import { mockSubnet } from "./setup.js";

describe("Accounting transactions", () => {
  it("should credit a user's balance", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const amount = 100;
    const currency = "USD";
    const subnet = mockSubnet.subnet;

    const creditTransaction = {
      user,
      subnet,
      amount,
      currency,
    };

    await credit(creditTransaction, uuid, mockSubnet.delegates[0]);

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
    const amount = 50;
    const currency = "USD";
    const subnet = mockSubnet.subnet;

    const debitTransaction = {
      user,
      amount,
      currency,
      subnet,
    };

    await debit(debitTransaction, uuid, mockSubnet.delegates[0]);

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
    const subnet = mockSubnet.subnet;
    const amount = 50;
    const currency = "USD";

    const refundTransaction = {
      user,
      debit,
      subnet,
      amount,
      currency,
    };

    await refund(refundTransaction, uuid, mockSubnet.delegates[0]);

    const { balance } = (await getUserBalance(user, currency, subnet)) ?? {
      balance: 0,
    };

    expect(balance).toBe(100);
  });

  it("should fail a refund if uuid doesn't match", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 3, 3]);
    const amount = 50;
    const currency = "USD";
    const subnet = mockSubnet.subnet;

    const refundTransaction = {
      debit,
      user,
      subnet,
      amount,
      currency,
    };

    await expect(
      refund(refundTransaction, uuid, mockSubnet.delegates[0]),
    ).rejects.toThrow("Debit transaction not found");
  });

  it("should fail a refund if currency doesn't match", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 2, 3]);
    const amount = 50;
    const currency = "EUR";
    const subnet = mockSubnet.subnet;

    const refundTransaction = {
      user,
      debit,
      subnet,
      amount,
      currency,
    };

    await expect(
      refund(refundTransaction, uuid, mockSubnet.delegates[0]),
    ).rejects.toThrow("Debit transaction not found");
  });

  it("should fail a refund if amount is bigger than the credit", async () => {
    const uuid = new Uint8Array([1, 2, 3]);
    const user = new Uint8Array([1, 2, 3]);
    const debit = new Uint8Array([1, 2, 3]);
    const subnet = mockSubnet.subnet;
    const amount = 105;
    const currency = "USD";

    const refundTransaction = {
      user,
      debit,
      subnet,
      amount,
      currency,
    };

    await expect(
      refund(refundTransaction, uuid, mockSubnet.delegates[0]),
    ).rejects.toThrow("Debit transaction not found");
  });
});
