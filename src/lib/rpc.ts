import {
  Authorize,
  Credit,
  Debit,
  Refund,
  Signature,
  UnAuthorize,
} from "@model/accounting.js";
import {
  getClient,
  incUserBalance,
  recordCredit,
  recordDebit,
  safeDecUserBalance,
  safeRecordRefund,
  getDelegation,
  addDelegateToSubnet,
  removeDelegateFromSubnet,
  addAuthorizeDelegationRecord,
  addUnAuthorizeDelegationRecord,
  getSubnet,
} from "@lib/db.js";
import { checkSigner } from "@lib/check.js";

/**
 * @description Credit user balance
 * @param credit Credit transaction
 * @param uuid Unique identifier for the transaction
 * @notes This function is used to credit a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const credit = async (credit: Credit, uuid: Uint8Array) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(credit.subnet, credit.proof.signer, session);

      await incUserBalance(
        credit.user,
        credit.currency,
        credit.subnet,
        credit.amount,
        session,
      );

      await recordCredit(credit, uuid, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Debit user balance
 * @param debit Debit transaction
 * @param uuid Unique identifier for the transaction
 * @notes This function is used to debit a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const debit = async (debit: Debit, uuid: Uint8Array) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(debit.subnet, debit.proof.signer, session);

      await safeDecUserBalance(
        debit.user.signer,
        debit.currency,
        debit.subnet,
        debit.amount,
        session,
      );

      await recordDebit(debit, uuid, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Refund user balance
 * @param refund Refund transaction
 * @param uuid Unique identifier for the transaction
 * @notes This function is used to refund a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const refund = async (refund: Refund, uuid: Uint8Array) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(refund.subnet, refund.proof.signer, session);
      await safeRecordRefund(refund, uuid, session);

      await incUserBalance(
        refund.user,
        refund.currency,
        refund.subnet,
        refund.amount,
        session,
      );
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Authorize user for a subnet
 * @param request Authorize request
 * @notes This function is used to authorize a user for a specific subnet.
 *        It adds a delegation entry in the database.
 */
export const authorize = async (request: Authorize) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(request.subnet, request.proof.signer, session);
      await addDelegateToSubnet(request.subnet, request.user, session);
      await addAuthorizeDelegationRecord(request, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Remove user authorization for a subnet
 * @param unauthorize UnAuthorize request
 * @notes This function is used to remove a user's authorization for a specific subnet.
 *        It removes the delegation entry from the database.
 */
export const unauthorize = async (unauthorize: UnAuthorize) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(unauthorize.subnet, unauthorize.proof.signer, session);
      await removeDelegateFromSubnet(
        unauthorize.subnet,
        unauthorize.user,
        session,
      );
      await addUnAuthorizeDelegationRecord(unauthorize, session);
    });
  } finally {
    session.endSession();
  }
};
