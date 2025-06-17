import { Command } from "commander";
import { Sia } from "@timeleap/sia";
import { config } from "dotenv";
import { Client, Identity, Wallet } from "@timeleap/client";

import {
  Admin,
  Credit,
  encodeCredit,
  encodeUpdateSubnet,
  UpdateSubnet,
} from "@model/admin.js";
import { logger } from "./lib/logging.js";

const program = new Command();

config();

const uri = process.env.ADMIN_BROKER_URI!;
const publicKey = process.env.ADMIN_BROKER_PUBLIC_KEY!;

const wallet = await Wallet.fromBase58(process.env.ADMIN_CLIENT_PRIVATE_KEY!);
const client = await Client.connect(wallet, { uri, publicKey });

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
    const admin = Admin.connect(client);
    const subnetIdentity = await Identity.fromBase58(subnet);

    const record: Credit = {
      user: new Uint8Array(Buffer.from(user, "hex")),
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

program.parse();
