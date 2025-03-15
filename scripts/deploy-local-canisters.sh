#!/bin/bash

# Make sure we're deploying to the local network
export DFX_NETWORK=local
MINTER_IDENTITY="minter"

# If the following command fails, it means that we don't have the minter identity,
# so we return an error explaining the action to take
dfx identity --identity $MINTER_IDENTITY get-principal || {
  echo "Error: Minter identity not found. Please create one using 'dfx identity new $MINTER_IDENTITY'"
  exit 1
}

# Check if the deps/init.json file exists
if [ ! -f "deps/init.json" ]; then
  echo "Error: deps/init.json file not found. See README.md for more information. The deps/init.json.template file can be used as a starting point."
  exit 1
fi

# Deploy the dependencies
dfx deps deploy

# Deploy the backend
dfx deploy backend
# Set the default wheel assets
dfx canister call backend set_default_wheel_assets

BACKEND_CANISTER_ID=$(dfx canister id backend)

# Transfer 100 ICP (8 decimals) to the backend
dfx canister --identity $MINTER_IDENTITY call icp-ledger icrc1_transfer "(record {to = record { owner = principal \"$BACKEND_CANISTER_ID\"; }; amount = 10_000_000_000; })"

# Transfer 10 ckBTC (8 decimals) to the backend
dfx canister --identity $MINTER_IDENTITY call ckbtc-ledger icrc1_transfer "(record {to = record { owner = principal \"$BACKEND_CANISTER_ID\"; }; amount = 1_000_000_000; })"

# Transfer 10 ckETH (18 decimals) to the backend
dfx canister --identity $MINTER_IDENTITY call cketh-ledger icrc1_transfer "(record {to = record { owner = principal \"$BACKEND_CANISTER_ID\"; }; amount = 10_000_000_000_000_000_000; })"

# Update the tokens data in the backend
dfx canister call backend fetch_tokens_data
