import { WheelAssetToken } from '@/lib/wheel-asset';
import { Principal } from '@dfinity/principal';

// Images
import icp from '@/assets/tokens/icp.png';
import ckBtc from '@/assets/tokens/ckbtc.png';
import ckEth from '@/assets/tokens/cketh.png';
import ckUsdc from '@/assets/tokens/ckusdc.png';
import ckUsdt from '@/assets/tokens/ckusdt.svg';
import ckEurc from '@/assets/tokens/ckeurc.svg';

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
      modalImageFileSrc?: string;
    }
> = {
  icp: {
    name: 'ICP',
    exchange_rate_symbol: ['ICP'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
      decimals: 8,
    },
    modalImageFileSrc: icp.src,
  },
  ckBtc: {
    name: 'ckBTC',
    exchange_rate_symbol: ['BTC'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('mxzaz-hqaaa-aaaar-qaada-cai'),
      decimals: 8,
    },
    modalImageFileSrc: ckBtc.src,
  },
  ckEth: {
    name: 'ckETH',
    exchange_rate_symbol: ['ETH'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('ss2fx-dyaaa-aaaar-qacoq-cai'),
      decimals: 18,
    },
    modalImageFileSrc: ckEth.src,
  },
  ckUsdc: {
    name: 'ckUSDC',
    exchange_rate_symbol: [],
    ledger_config: {
      ledger_canister_id: Principal.fromText('xevnm-gaaaa-aaaar-qafnq-cai'),
      decimals: 6,
    },
    modalImageFileSrc: ckUsdc.src,
  },
  ckUsdt: {
    name: 'ckUSDT',
    exchange_rate_symbol: [],
    ledger_config: {
      ledger_canister_id: Principal.fromText('cngnf-vqaaa-aaaar-qag4q-cai'),
      decimals: 6,
    },
    modalImageFileSrc: ckUsdt.src,
  },
  ckEurc: {
    name: 'ckEURC',
    exchange_rate_symbol: ['EUR'],
    ledger_config: {
      ledger_canister_id: Principal.fromText('pe5t5-diaaa-aaaar-qahwa-cai'),
      decimals: 6,
    },
    modalImageFileSrc: ckEurc.src,
  },
};
