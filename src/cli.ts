import { Command } from "commander";
import { Sia } from "@timeleap/sia";
import { config } from "dotenv";
import { Client, Identity, Wallet } from "@timeleap/client";

import { Admin, Authorize, Credit, UpdateSubnet } from "@model/admin.js";
import { logger } from "@lib/logging.js";
import { stake, unstake, link } from "@lib/blockchain.js";

const program = new Command();

config();

const uri = process.env.ADMIN_BROKER_URI!;
const publicKey = process.env.ADMIN_BROKER_PUBLIC_KEY!;

const getClient = async (): Promise<Client> => {
  const wallet = await Wallet.fromBase58(process.env.ADMIN_CLIENT_PRIVATE_KEY!);
  const client = await Client.connect(wallet, { uri, publicKey });

  return client;
};

program
  .name("tl-admin")
  .description("CLI to communicate with the TimeLeap Admin subnet")
  .version("1.0.0");

program
  .command("credit")
  .description("Credit a user's balance")
  .requiredOption("-u, --user <user>", "User's public key")
  .requiredOption("-c, --currency <currency>", "Currency to credit")
  .requiredOption("-s, --subnet <subnet>", "Subnet identifier")
  .requiredOption("-a, --amount <amount>", "Amount to credit")
  .action(async (options) => {
    const { user, currency, subnet, amount } = options;

    const client = await getClient();
    const admin = Admin.connect(client);
    const userIdentity = await Identity.fromBase58(user);
    const subnetIdentity = await Identity.fromBase58(subnet);

    const record: Credit = {
      user: userIdentity.publicKey,
      currency,
      subnet: subnetIdentity.publicKey,
      amount: parseInt(amount),
    };

    const result = await admin.credit(Sia.alloc(1024), record);

    logger.info(
      result.ok ? "Credit transaction successful" : "Credit transaction failed",
    );

    client.close();
  });

program
  .command("update-subnet")
  .description("Update subnet information")
  .requiredOption("-s, --subnet <subnet>", "Subnet identifier")
  .requiredOption("-u, --stake-user <stakeUser>", "Stake user's EVM address")
  .action(async (options) => {
    const { subnet, stakeUser } = options;

    const client = await getClient();
    const admin = Admin.connect(client);
    const subnetIdentity = await Identity.fromBase58(subnet);

    const record: UpdateSubnet = {
      subnet: subnetIdentity.publicKey,
      stakeUser: new Uint8Array(Buffer.from(stakeUser, "hex")),
    };

    const result = await admin.updateSubnet(Sia.alloc(1024), record);

    logger.info(
      result.ok
        ? "Update subnet transaction successful"
        : "Update subnet transaction failed",
    );

    client.close();
  });

program
  .command("authorize")
  .description("Add a delegate to a subnet")
  .requiredOption("-s, --subnet <subnet>", "Subnet identifier")
  .requiredOption("-u, --user <user>", "User's public key")
  .action(async (options) => {
    const { subnet, user } = options;

    const client = await getClient();
    const admin = Admin.connect(client);
    const subnetIdentity = await Identity.fromBase58(subnet);
    const userIdentity = await Identity.fromBase58(user);

    const record: Authorize = {
      subnet: subnetIdentity.publicKey,
      user: userIdentity.publicKey,
    };

    const result = await admin.authorize(Sia.alloc(1024), record);

    logger.info(
      result.ok
        ? "Authorization transaction successful"
        : "Authorization transaction failed",
    );

    client.close();
  });

program
  .command("unauthorize")
  .description("Remove a delegate from a subnet")
  .requiredOption("-s, --subnet <subnet>", "Subnet identifier")
  .requiredOption("-u, --user <user>", "User's public key")
  .action(async (options) => {
    const { subnet, user } = options;

    const client = await getClient();
    const admin = Admin.connect(client);
    const subnetIdentity = await Identity.fromBase58(subnet);
    const userIdentity = await Identity.fromBase58(user);

    const record: Authorize = {
      subnet: subnetIdentity.publicKey,
      user: userIdentity.publicKey,
    };

    const result = await admin.unAuthorize(Sia.alloc(1024), record);

    logger.info(
      result.ok
        ? "Unauthorization transaction successful"
        : "Unauthorization transaction failed",
    );

    client.close();
  });

program
  .command("stake")
  .description("Stake KNS tokens")
  .requiredOption("-a, --amount <amount>", "Amount of KNS to stake")
  .requiredOption("-d, --days <days>", "Number of days to stake")
  .option("-n, --nft-id <nftId>", "NFT ID to stake with")
  .action(async (options) => {
    const { amount, days, nftId } = options;

    try {
      await stake(amount, parseInt(days), nftId ? parseInt(nftId) : undefined);
      logger.info("Stake transaction successful");
    } catch (error) {
      logger.error("Stake transaction failed:", error);
    }
  });

program
  .command("unstake")
  .description("Unstake KNS tokens")
  .action(async () => {
    try {
      await unstake();
      logger.info("Unstake transaction successful");
    } catch (error) {
      logger.error("Unstake transaction failed:", error);
    }
  });

program
  .command("link")
  .description("Link a subnet to a staking address")
  .requiredOption("-s, --subnet <subnetId>", "Subnet identifier")
  .action(async (options) => {
    const { subnet } = options;

    try {
      await link(subnet);
      logger.info("Link transaction successful");
    } catch (error) {
      logger.error("Link transaction failed:", error);
    }
  });

program
  .command("subnet")
  .description("Run the Admin subnet")
  .action(async () => {
    await import("./index.js");
  });

program.parse();
