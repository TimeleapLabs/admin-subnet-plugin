import { Wallet, JsonRpcProvider, ethers } from "ethers";
import { Identity } from "@timeleap/client";
import { logger } from "./logging.js";

import * as sdk from "@timeleap/subnet-contracts-sdk";

import type {
  Manager,
  Linker,
  MockERC20,
  MockERC721,
} from "@timeleap/subnet-contracts-sdk/typechain";

import {
  Manager__factory,
  Linker__factory,
  MockERC20__factory,
  MockERC721__factory,
} from "@timeleap/subnet-contracts-sdk/typechain";

const privateKey = process.env.EVM_PRIVATE_KEY;

const providerAddress =
  process.env.EVM_RPC_ADDRESS || "https://arb1.arbitrum.io/rpc";

const managerAddress =
  process.env.MANAGER_CONTRACT_ADDRESS ||
  "0x402Ea6068ee561c7553f8be21C6384EC29886819";

const linkerAddress =
  process.env.LINKER_CONTRACT_ADDRESS ||
  "0x3C073B069D25FD17474E9EA9810B024fb3Cf966A";

const knsAddress =
  process.env.KNS_CONTRACT_ADDRESS ||
  "0xf1264873436A0771E440E2b28072FAfcC5EEBd01";

const katanaAddress =
  process.env.KATANA_CONTRACT_ADDRESS ||
  "0x13B8046B98c7D86D719fC34e5C3DF5E5e8da897A";

/**
 * Get the Manager contract instance.
 * @returns {Promise<Manager>} A promise that resolves to the Manager contract instance.
 * @throws {Error} If the EVM_RPC_ADDRESS or EVM_PRIVATE_KEY environment variables are not set.
 */
export const getManager = async (): Promise<Manager> => {
  if (!providerAddress || !privateKey) {
    throw new Error("EVM_RPC_ADDRESS and EVM_PRIVATE_KEY must be set");
  }

  const provider = new JsonRpcProvider(providerAddress);
  const wallet = new Wallet(privateKey, provider);

  const manager = Manager__factory.connect(managerAddress, wallet);
  return manager;
};

/**
 * Get the Linker contract instance.
 * @returns {Promise<Linker>} A promise that resolves to the Linker contract instance.
 * @throws {Error} If the EVM_RPC_ADDRESS or EVM_PRIVATE_KEY environment variables are not set.
 */
export const getLinker = async (): Promise<Linker> => {
  if (!providerAddress || !privateKey) {
    throw new Error("EVM_RPC_ADDRESS and EVM_PRIVATE_KEY must be set");
  }

  const provider = new JsonRpcProvider(providerAddress);
  const wallet = new Wallet(privateKey, provider);

  const linker = Linker__factory.connect(linkerAddress, wallet);
  return linker;
};

/**
 * Get the KNS contract instance.
 * @returns {Promise<MockERC20>} A promise that resolves to the KNS contract instance.
 * @throws {Error} If the EVM_RPC_ADDRESS or EVM_PRIVATE_KEY environment variables are not set.
 */
export const getKNS = async (): Promise<MockERC20> => {
  if (!providerAddress || !privateKey) {
    throw new Error("EVM_RPC_ADDRESS and EVM_PRIVATE_KEY must be set");
  }

  const provider = new JsonRpcProvider(providerAddress);
  const wallet = new Wallet(privateKey, provider);

  const kns = MockERC20__factory.connect(knsAddress, wallet);
  return kns;
};

/**
 * Get the Katana contract instance.
 * @returns {Promise<MockERC721>} A promise that resolves to the Katana contract instance.
 * @throws {Error} If the EVM_RPC_ADDRESS or EVM_PRIVATE_KEY environment variables are not set.
 */
export const getKatana = async (): Promise<MockERC721> => {
  if (!providerAddress || !privateKey) {
    throw new Error("EVM_RPC_ADDRESS and EVM_PRIVATE_KEY must be set");
  }

  const provider = new JsonRpcProvider(providerAddress);
  const wallet = new Wallet(privateKey, provider);

  const katana = MockERC721__factory.connect(katanaAddress, wallet);
  return katana;
};

/**
 * Approve KNS tokens for staking.
 * This function allows the manager contract to spend KNS tokens on behalf of the user.
 * @param amount - The amount of KNS tokens to approve for staking.
 * @returns {Promise<void>} A promise that resolves when the approval is complete.
 * @throws {Error} If the amount is invalid or the approval transaction fails.
 */
export const approveKNS = async (amount: string): Promise<void> => {
  const kns = await getKNS();
  const stakeAmount = ethers.parseUnits(amount, 18);
  const tx = await kns.approve(managerAddress, stakeAmount);
  await tx.wait();
  logger.info(`Approved ${amount} KNS for staking`);
};

/**
 * Approve a Katana NFT for staking.
 * This function allows the manager contract to stake the specified Katana NFT.
 * @param tokenId - The ID of the Katana NFT to approve for staking.
 * @returns {Promise<void>} A promise that resolves when the approval is complete.
 * @throws {Error} If the token ID is invalid or the approval transaction fails.
 */
export const approveKatana = async (tokenId: number): Promise<void> => {
  const katana = await getKatana();
  const tx = await katana.approve(managerAddress, BigInt(tokenId));
  await tx.wait();
  logger.info(`Approved Katana NFT with ID ${tokenId} for staking`);
};

/**
 * Stake KNS tokens for a specified duration.
 * @param amount - The amount of KNS tokens to stake.
 * @param days - The duration in days for which to stake the tokens.
 * @param nftId - Optional NFT ID to stake with. If provided, the tokens will be staked with the specified NFT.
 * @returns {Promise<void>} A promise that resolves when the staking is complete.
 * @throws {Error} If the amount is invalid or the duration is less than 60 days.
 */
export const stake = async (
  amount: string,
  days: number,
  nftId?: number,
): Promise<void> => {
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error("Invalid stake amount");
  }

  if (!days || isNaN(Number(days)) || Number(days) <= 60) {
    throw new Error("Invalid stake duration in days");
  }

  const manager = await getManager();

  const stakeAmount = ethers.parseUnits(amount, 18);
  const stakeDuration = days * 24 * 60 * 60; // Convert days to seconds
  const params = { amount: stakeAmount, duration: stakeDuration };

  await approveKNS(amount);

  if (nftId) {
    await approveKatana(nftId);
    await sdk.stakeWithNft(manager, { ...params, nftId: BigInt(nftId) });
  } else {
    await sdk.stake(manager, params);
  }

  logger.info(
    `Successfully staked ${amount} KNS for ${days} days${
      nftId ? ` with NFT ID ${nftId}` : ""
    }`,
  );
};

/**
 * Unstake KNS tokens.
 * This function withdraws the staked tokens from the manager contract.
 * @returns {Promise<void>} A promise that resolves when the unstaking is complete.
 */
export const unstake = async (): Promise<void> => {
  const manager = await getManager();
  await sdk.unstake(manager);
  logger.info("Successfully withdrew staked tokens");
};

/**
 * Link the current subnet to another subnet.
 * @param subnetId - The ID of the subnet to link to.
 * @returns {Promise<void>} A promise that resolves when the linking is complete.
 * @throws {Error} If the subnet ID is invalid or the linking fails.
 */
export const link = async (subnetId: string): Promise<void> => {
  const linker = await getLinker();
  const subnet = await Identity.fromBase58(subnetId);

  if (subnet.publicKey.length !== 32) {
    throw new Error("Invalid subnet ID length");
  }

  await sdk.link(linker, { to: subnet.publicKey });
  logger.info(`Successfully linked to subnet ${subnetId}`);
};

/**
 * Get the link for a user.
 * @param user - The user's EVM address.
 * @returns {Promise<string>} A promise that resolves to the link for the user.
 * @throws {Error} If the user address is invalid or the link retrieval fails.
 */
export const getLink = async (user: string): Promise<string> => {
  const linker = await getLinker();
  const link = await sdk.getLink(linker, user);
  return link;
};
