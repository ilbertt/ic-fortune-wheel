import { type WheelAssetToken } from '@/lib/wheel-asset';
import { Principal } from '@dfinity/principal';
import { WHEEL_ASSET_DEFAULT_IMAGES } from '@/constants/images';

export type DefaultTokensKey =
  | 'icp'
  | 'ckBtc'
  | 'ckEth'
  | 'ckUsdc'
  | 'ckUsdt'
  | 'ckEurc';

export const DEFAULT_TOKENS: Record<
  DefaultTokensKey,
  Pick<WheelAssetToken, 'name'> &
    Pick<
      WheelAssetToken['asset_type']['token'],
      'exchange_rate_symbol' | 'ledger_config'
    > & {
      wheelImageFileSrc?: string;
    }
> = {
  icp: {
    name: 'ICP',
    exchange_rate_symbol: ['ICP'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
      decimals: 8,
    },
    wheelImageFileSrc: WHEEL_ASSET_DEFAULT_IMAGES.ICP_TOKEN.WHEEL,
  },
  ckBtc: {
    name: 'ckBTC',
    exchange_rate_symbol: ['BTC'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('mxzaz-hqaaa-aaaar-qaada-cai'),
      decimals: 8,
    },
    wheelImageFileSrc: WHEEL_ASSET_DEFAULT_IMAGES.CKBTC_TOKEN.WHEEL,
  },
  ckEth: {
    name: 'ckETH',
    exchange_rate_symbol: ['ETH'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('ss2fx-dyaaa-aaaar-qacoq-cai'),
      decimals: 18,
    },
    wheelImageFileSrc: WHEEL_ASSET_DEFAULT_IMAGES.CKETH_TOKEN.WHEEL,
  },
  ckUsdc: {
    name: 'ckUSDC',
    exchange_rate_symbol: [],
    ledger_config: {
      ledger_canister_id: Principal.fromText('xevnm-gaaaa-aaaar-qafnq-cai'),
      decimals: 6,
    },
    wheelImageFileSrc: WHEEL_ASSET_DEFAULT_IMAGES.CKUSDC_TOKEN.WHEEL,
  },
  ckUsdt: {
    name: 'ckUSDT',
    exchange_rate_symbol: [],
    ledger_config: {
      ledger_canister_id: Principal.fromText('cngnf-vqaaa-aaaar-qag4q-cai'),
      decimals: 6,
    },
    wheelImageFileSrc: WHEEL_ASSET_DEFAULT_IMAGES.CKUSDT_TOKEN.WHEEL,
  },
  ckEurc: {
    name: 'ckEURC',
    exchange_rate_symbol: ['EUR'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('pe5t5-diaaa-aaaar-qahwa-cai'),
      decimals: 6,
    },
    wheelImageFileSrc: WHEEL_ASSET_DEFAULT_IMAGES.CKEURC_TOKEN.WHEEL,
  },
};
