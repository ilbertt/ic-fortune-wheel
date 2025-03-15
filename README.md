# `ic-fortune-wheel`

The Fortune Wheel is a simple, fun, and engaging game that allows you to showcase the main features of the Internet Computer while providing a fun and engaging experience for your audience.

In fact, the Fortune Wheel helps you effectively showcasing the following features:

- Full-stack apps deployed on the Internet Computer ([Web access](https://internetcomputer.org/how-it-works#Web-access))
- [Onchain randomness](https://internetcomputer.org/docs/building-apps/network-features/randomness/)
- Multi-chain assets management ([Chain Fusion](https://internetcomputer.org/chainfusion/))
- Fast and cheap transactions ([Chain Fusion](https://internetcomputer.org/chainfusion/))
- Frictionless user authentication ([Internet Identity](https://internetcomputer.org/internet-identity))

Your audience can enjoy the best experience by signing up on [Oisy](https://oisy.com) and using their wallets' principals in the extractions.

Brought to you by [ICP HUB Italy & Ticino](https://github.com/icp-hub-itti).

## Usage as admin

### First time login after deployment

After logging in with your Internet Identity for the first time after the deployment, you can copy your user ID from the dashboard and call the backend canister to give you the admin role:

```bash
dfx canister call backend update_user_profile '(record { username = null; role = opt variant { admin }; user_id = "<your-user-id>"; })'
```

> Note: Set the `--network ic` flag to use the mainnet backend.

For any other admin that you want to add, you can directly change their role in the UI at the **/team** page after they've logged in with their Internet Identity.

## Running the project locally

### Prerequisites

- [dfx](https://internetcomputer.org/docs/building-apps/getting-started/install)
- [Node.js](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/installation)

Make sure you have the `minter` identity created and available:

```bash
dfx identity new minter
```

### Initializing the dependencies

You must create the `deps/init.json` file before deploying the dependencies. You can copy the [`deps/init.json.template`](./deps/init.json.template) file and change the following values:

- all the occurrences of `49c7466d17db093b0d15b00b189501b0e126141264a38d89d5024d5bf4f863e3` must be replaced with the account id of your `minter` identity:
  ```bash
  dfx --identity minter ledger account-id
  ```
- all the occurrences of `g5wwd-66hws-uktxg-tpmef-ff2kq-bcz3p-ouyrt-vhqla-bm2rs-4dkwv-aqe` must be replaced with the principal of your `minter` identity:
  ```bash
  dfx identity --identity minter get-principal
  ```

Then, for each entry in the `canisters` JSON object, you must copy the `arg_str` value and run the following command:

```bash
dfx deps init <canister-id-entry> --argument "<arg_str>"
```

> Note: You can skip executing this command for the Internet Identity (`rdmx6-jaaaa-aaaaa-aaadq-cai`) and Exchange Rate (`uf6dk-hyaaa-aaaaq-qaaaq-cai`) canisters.

This process will create the `deps/init.json` file with the correct values.

### Deploying the dependencies and the backend

```bash
./scripts/deploy-local-canisters.sh
```

This script deploys the dependencies, taking care of initializing them properly, and transfers the initial tokens to the backend canister **locally**.

### Starting the frontend

```bash
pnpm dev
```

## Development

### Formatting

```bash
pnpm format
```

### Linting

```bash
pnpm lint
```

## Acknowledgements

The project started in May 2024. The first MVP version can be found at [ilbertt/fortune-wheel-booth](https://github.com/ilbertt/fortune-wheel-booth).
