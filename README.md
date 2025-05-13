# 💳 Timeleap Accounting Subnet Plugin

This repository implements the **Accounting Subnet Plugin** for the [Timeleap
Network](https://timeleap.swiss), as specified in
[TEP-6](https://timeleap.swiss/docs/tep/6). The accounting subnet acts as a
decentralized ledger for fee tracking, user balance management, and
signature-based billing verification across all subnets.

## 📦 Features

This plugin exposes standardized functions over Timeleap RPC for economic
coordination and billing:

### 💳 `Credit`

Adds funds to a user's balance in a specified currency.

```ts
schema Credit {
  uuid      byte8
  fee       uint64
  currency  string8(encoding = "ascii")
  user      byteN(length = 32)
  subnet    Signature
}
```

- Requires a **unique `uuid`** for each credit request.
- Signed by the **subnet** to prevent spoofing.

### 💾 `Debit`

Deducts usage fees from a user's balance.

```ts
schema Debit {
  uuid      byte8
  fee       uint64
  currency  string8(encoding = "ascii")
  user      Signature
  subnet    Signature
}
```

- Prevents overdraft or double spending.
- Fails if `uuid` has been seen before.

### 💸 `Refund`

Reverses a previously submitted `Debit`.

```ts
schema Refund {
  uuid      byte8
  fee       uint64
  currency  string8(encoding = "ascii")
  user      byteN(length = 32)
  subnet    Signature
}
```

- Can only be called by the original **subnet**.
- Fails if `uuid` is not found in historical records.

### 👥 `Authorize` / `UnAuthorize`

Manage signing delegates for a subnet.

```ts
schema Authorize {
  address   byteN(length = 32)
  subnet    Signature
}

schema UnAuthorize {
  address   byteN(length = 32)
  subnet    Signature
}
```

- Allows distributed signing across multiple trusted operators.
- Prevents unauthorized access to accounting APIs.

## ⚙️ Usage

### 🔧 Build

```bash
yarn build
```

### 🚀 Run

```bash
yarn start
```

## 💠 Environment Variables

Create a `.env` file in the project root with the following values:

```
PLUGIN_PRIVATE_KEY=         # Private key used to sign accounting responses
WORKER_PUBLIC_KEY=          # Public key of the Timeleap RPC runtime
MONGODB_URI=                # MongoDB connection string for balance and log storage
```

## 🥭 Indexes

You need the following indexes in MongoDB:

- The `delegations` collection must have a unique index on the `user` field.
- The `transactions` collection must have a unique composite index on the `user`, `uuid`, `subnet` and `type` fields.
- The `users` collection must have a unique composite index on `user`, `subnet`, and `currency` fields.

## 🧼 Code Style

This project uses:

- **TypeScript**
- **ESLint** for linting
- **Prettier** for consistent formatting

To lint the code:

```bash
yarn lint
```

To auto-format:

```bash
yarn prettier
```

## 📝 License

© 2025 [Timeleap SA](https://timeleap.swiss). All rights reserved. Usage
governed by the Timeleap Plugin Agreement.

## 🧐 About

This plugin enforces billing consistency, enables dispute resolution, and
ensures privacy-preserving fee tracking across all Timeleap subnets. For
detailed economic logic, see [TEP-6](https://timeleap.swiss/docs/tep/6).
