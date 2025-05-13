import { Credit, Debit, Refund, Signature } from "@model/accounting.js";
import {
  getClient,
  incUserBalance,
  recordCredit,
  recordDebit,
  safeDecUserBalance,
  addDelegation,
  removeDelegation,
  safeRecordRefund,
  getDelegation,
} from "@lib/db.js";
import { equal } from "@lib/binary.js";

/**
 * @description Credit user balance
 * @param credit Credit transaction
 * @notes This function is used to credit a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const credit = async (credit: Credit) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await incUserBalance(
        credit.user,
        credit.currency,
        credit.subnet.signer,
        credit.amount,
        session,
      );

      await recordCredit(credit, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Debit user balance
 * @param debit Debit transaction
 * @notes This function is used to debit a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const debit = async (debit: Debit) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await safeDecUserBalance(
        debit.user.signer,
        debit.currency,
        debit.subnet.signer,
        debit.amount,
        session,
      );

      await recordDebit(debit, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Refund user balance
 * @param refund Refund transaction
 * @notes This function is used to refund a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const refund = async (refund: Refund) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await incUserBalance(
        refund.user,
        refund.currency,
        refund.subnet.signer,
        refund.amount,
        session,
      );

      await safeRecordRefund(refund, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Authorize user for a subnet
 * @param user User's public key
 * @param subnet Subnet signature
 * @notes This function is used to authorize a user for a specific subnet.
 *        It adds a delegation entry in the database.
 */
export const authorize = async (user: Uint8Array, subnet: Signature) =>
  addDelegation(user, subnet);

/**
 * @description Remove user authorization for a subnet
 * @param user User's public key
 * @notes This function is used to remove a user's authorization for a specific subnet.
 *        It removes the delegation entry from the database.
 */
export const unauthorize = async (user: Uint8Array, subnet: Signature) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const delegation = await getDelegation(user, session);
      if (!delegation || !equal(delegation.subnet.signer, subnet.signer)) {
        throw new Error("Delegation not found or subnet mismatch");
      }

      await removeDelegation(user, session);
    });
  } finally {
    session.endSession();
  }
};
