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

Make sure you have created the `minter` identity and it is available:

```bash
dfx identity new minter
```

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
