export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'scanner' : IDL.Null,
    'unassigned' : IDL.Null,
  });
  const UserProfile = IDL.Record({
    'id' : IDL.Text,
    'username' : IDL.Text,
    'role' : UserRole,
    'principal_id' : IDL.Principal,
  });
  const Err = IDL.Record({ 'code' : IDL.Nat16, 'message' : IDL.Text });
  const CreateMyUserProfileResponse = IDL.Variant({
    'ok' : UserProfile,
    'err' : Err,
  });
  const WheelAssetTokenLedgerConfig = IDL.Record({
    'decimals' : IDL.Nat8,
    'ledger_canister_id' : IDL.Principal,
  });
  const CreateWheelAssetTypeConfig = IDL.Variant({
    'token' : IDL.Record({
      'exchange_rate_symbol' : IDL.Opt(IDL.Text),
      'prize_usd_amount' : IDL.Float64,
      'ledger_config' : WheelAssetTokenLedgerConfig,
    }),
    'jackpot' : IDL.Record({ 'wheel_asset_ids' : IDL.Vec(IDL.Text) }),
    'gadget' : IDL.Record({ 'article_type' : IDL.Opt(IDL.Text) }),
  });
  const WheelAssetUiSettings = IDL.Record({
    'background_color_hex' : IDL.Text,
  });
  const CreateWheelAssetRequest = IDL.Record({
    'total_amount' : IDL.Nat32,
    'asset_type_config' : CreateWheelAssetTypeConfig,
    'name' : IDL.Text,
    'wheel_ui_settings' : IDL.Opt(WheelAssetUiSettings),
  });
  const WheelAssetTokenPrice = IDL.Record({
    'usd_price' : IDL.Float64,
    'last_fetched_at' : IDL.Text,
  });
  const WheelAssetTokenBalance = IDL.Record({
    'balance' : IDL.Nat,
    'last_fetched_at' : IDL.Text,
  });
  const WheelAssetType = IDL.Variant({
    'token' : IDL.Record({
      'usd_price' : IDL.Opt(WheelAssetTokenPrice),
      'balance' : IDL.Opt(WheelAssetTokenBalance),
      'exchange_rate_symbol' : IDL.Opt(IDL.Text),
      'prize_usd_amount' : IDL.Float64,
      'available_draws_count' : IDL.Nat32,
      'ledger_config' : WheelAssetTokenLedgerConfig,
    }),
    'jackpot' : IDL.Record({ 'wheel_asset_ids' : IDL.Vec(IDL.Text) }),
    'gadget' : IDL.Record({ 'article_type' : IDL.Opt(IDL.Text) }),
  });
  const WheelAssetState = IDL.Variant({
    'disabled' : IDL.Null,
    'enabled' : IDL.Null,
  });
  const WheelAsset = IDL.Record({
    'id' : IDL.Text,
    'asset_type' : WheelAssetType,
    'used_amount' : IDL.Nat32,
    'total_amount' : IDL.Nat32,
    'name' : IDL.Text,
    'wheel_image_path' : IDL.Opt(IDL.Text),
    'state' : WheelAssetState,
    'available_amount' : IDL.Nat32,
    'wheel_ui_settings' : WheelAssetUiSettings,
    'modal_image_path' : IDL.Opt(IDL.Text),
  });
  const CreateWheelAssetResponse = IDL.Variant({
    'ok' : WheelAsset,
    'err' : Err,
  });
  const CreateWheelPrizeExtractionRequest = IDL.Record({
    'extract_for_principal' : IDL.Principal,
  });
  const CreateWheelPrizeExtractionResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const DeleteUserProfileRequest = IDL.Record({ 'user_id' : IDL.Text });
  const DeleteUserProfileResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const DeleteWheelAssetRequest = IDL.Record({ 'id' : IDL.Text });
  const DeleteWheelAssetResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const FetchTokensDataResponse = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const WheelPrizeExtractionState = IDL.Variant({
    'completed' : IDL.Record({ 'prize_usd_amount' : IDL.Opt(IDL.Float64) }),
    'processing' : IDL.Null,
    'failed' : IDL.Record({ 'error' : Err }),
  });
  const WheelPrizeExtraction = IDL.Record({
    'id' : IDL.Text,
    'updated_at' : IDL.Text,
    'extracted_for_principal' : IDL.Principal,
    'created_at' : IDL.Text,
    'state' : WheelPrizeExtractionState,
    'extracted_by_user_id' : IDL.Text,
    'wheel_asset_id' : IDL.Opt(IDL.Text),
  });
  const GetLastWheelPrizeExtractionResponse = IDL.Variant({
    'ok' : IDL.Opt(WheelPrizeExtraction),
    'err' : Err,
  });
  const GetMyUserProfileResponse = IDL.Variant({
    'ok' : UserProfile,
    'err' : Err,
  });
  const GetWheelPrizeExtractionRequest = IDL.Record({
    'wheel_prize_extraction_id' : IDL.Text,
  });
  const GetWheelPrizeExtractionResponse = IDL.Variant({
    'ok' : WheelPrizeExtraction,
    'err' : Err,
  });
  const WheelPrizeExtractionsStats = IDL.Record({
    'total_completed_extractions' : IDL.Nat32,
    'total_spent_usd' : IDL.Float64,
  });
  const GetWheelPrizeExtractionsStatsResponse = IDL.Variant({
    'ok' : WheelPrizeExtractionsStats,
    'err' : Err,
  });
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'certificate_version' : IDL.Opt(IDL.Nat16),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'status_code' : IDL.Nat16,
  });
  const ListUsersResponse = IDL.Variant({
    'ok' : IDL.Vec(UserProfile),
    'err' : Err,
  });
  const ListWheelAssetsRequest = IDL.Record({
    'state' : IDL.Opt(WheelAssetState),
  });
  const ListWheelAssetsResponse = IDL.Variant({
    'ok' : IDL.Vec(WheelAsset),
    'err' : Err,
  });
  const ListWheelPrizeExtractionsResponse = IDL.Variant({
    'ok' : IDL.Vec(WheelPrizeExtraction),
    'err' : Err,
  });
  const WheelPrize = IDL.Record({
    'name' : IDL.Text,
    'wheel_image_path' : IDL.Opt(IDL.Text),
    'prize_usd_amount' : IDL.Opt(IDL.Float64),
    'wheel_ui_settings' : WheelAssetUiSettings,
    'wheel_asset_id' : IDL.Text,
    'modal_image_path' : IDL.Opt(IDL.Text),
  });
  const ListWheelPrizesResponse = IDL.Variant({
    'ok' : IDL.Vec(WheelPrize),
    'err' : Err,
  });
  const SetDefaultWheelAssetsResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const TransferTokenRequest = IDL.Record({
    'to' : IDL.Principal,
    'ledger_canister_id' : IDL.Principal,
    'amount' : IDL.Nat,
  });
  const TransferTokenResponse = IDL.Variant({ 'ok' : IDL.Nat, 'err' : Err });
  const UpdateMyUserProfileRequest = IDL.Record({
    'username' : IDL.Opt(IDL.Text),
  });
  const UpdateMyUserProfileResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const UpdateUserProfileRequest = IDL.Record({
    'username' : IDL.Opt(IDL.Text),
    'role' : IDL.Opt(UserRole),
    'user_id' : IDL.Text,
  });
  const UpdateWheelAssetTypeLedgerConfig = IDL.Record({
    'decimals' : IDL.Opt(IDL.Nat8),
  });
  const UpdateWheelAssetTypeConfig = IDL.Variant({
    'token' : IDL.Record({
      'exchange_rate_symbol' : IDL.Opt(IDL.Text),
      'prize_usd_amount' : IDL.Opt(IDL.Float64),
      'ledger_config' : IDL.Opt(UpdateWheelAssetTypeLedgerConfig),
    }),
    'jackpot' : IDL.Record({ 'wheel_asset_ids' : IDL.Vec(IDL.Text) }),
    'gadget' : IDL.Record({ 'article_type' : IDL.Opt(IDL.Text) }),
  });
  const UpdateWheelAssetRequest = IDL.Record({
    'id' : IDL.Text,
    'used_amount' : IDL.Opt(IDL.Nat32),
    'total_amount' : IDL.Opt(IDL.Nat32),
    'asset_type_config' : IDL.Opt(UpdateWheelAssetTypeConfig),
    'name' : IDL.Opt(IDL.Text),
    'state' : IDL.Opt(WheelAssetState),
    'wheel_ui_settings' : IDL.Opt(WheelAssetUiSettings),
  });
  const UpdateWheelAssetResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const UpdateWheelAssetImageConfig = IDL.Variant({
    'modal' : IDL.Record({
      'content_type' : IDL.Text,
      'content_bytes' : IDL.Vec(IDL.Nat8),
    }),
    'wheel' : IDL.Record({
      'content_type' : IDL.Text,
      'content_bytes' : IDL.Vec(IDL.Nat8),
    }),
  });
  const UpdateWheelAssetImageRequest = IDL.Record({
    'id' : IDL.Text,
    'image_config' : UpdateWheelAssetImageConfig,
  });
  const UpdateWheelAssetImageResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  const UpdateWheelPrizesOrderRequest = IDL.Record({
    'wheel_asset_ids' : IDL.Vec(IDL.Text),
  });
  const UpdateWheelPrizesOrderResponse = IDL.Variant({
    'ok' : IDL.Null,
    'err' : Err,
  });
  return IDL.Service({
    'create_my_user_profile' : IDL.Func([], [CreateMyUserProfileResponse], []),
    'create_wheel_asset' : IDL.Func(
        [CreateWheelAssetRequest],
        [CreateWheelAssetResponse],
        [],
      ),
    'create_wheel_prize_extraction' : IDL.Func(
        [CreateWheelPrizeExtractionRequest],
        [CreateWheelPrizeExtractionResponse],
        [],
      ),
    'delete_user_profile' : IDL.Func(
        [DeleteUserProfileRequest],
        [DeleteUserProfileResponse],
        [],
      ),
    'delete_wheel_asset' : IDL.Func(
        [DeleteWheelAssetRequest],
        [DeleteWheelAssetResponse],
        [],
      ),
    'fetch_tokens_data' : IDL.Func([], [FetchTokensDataResponse], []),
    'get_last_wheel_prize_extraction' : IDL.Func(
        [],
        [GetLastWheelPrizeExtractionResponse],
        ['query'],
      ),
    'get_my_user_profile' : IDL.Func([], [GetMyUserProfileResponse], ['query']),
    'get_wheel_prize_extraction' : IDL.Func(
        [GetWheelPrizeExtractionRequest],
        [GetWheelPrizeExtractionResponse],
        ['query'],
      ),
    'get_wheel_prize_extractions_stats' : IDL.Func(
        [],
        [GetWheelPrizeExtractionsStatsResponse],
        ['query'],
      ),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'list_users' : IDL.Func([], [ListUsersResponse], ['query']),
    'list_wheel_assets' : IDL.Func(
        [ListWheelAssetsRequest],
        [ListWheelAssetsResponse],
        ['query'],
      ),
    'list_wheel_prize_extractions' : IDL.Func(
        [],
        [ListWheelPrizeExtractionsResponse],
        ['query'],
      ),
    'list_wheel_prizes' : IDL.Func([], [ListWheelPrizesResponse], ['query']),
    'set_default_wheel_assets' : IDL.Func(
        [],
        [SetDefaultWheelAssetsResponse],
        [],
      ),
    'transfer_token' : IDL.Func(
        [TransferTokenRequest],
        [TransferTokenResponse],
        [],
      ),
    'update_my_user_profile' : IDL.Func(
        [UpdateMyUserProfileRequest],
        [UpdateMyUserProfileResponse],
        [],
      ),
    'update_user_profile' : IDL.Func(
        [UpdateUserProfileRequest],
        [UpdateMyUserProfileResponse],
        [],
      ),
    'update_wheel_asset' : IDL.Func(
        [UpdateWheelAssetRequest],
        [UpdateWheelAssetResponse],
        [],
      ),
    'update_wheel_asset_image' : IDL.Func(
        [UpdateWheelAssetImageRequest],
        [UpdateWheelAssetImageResponse],
        [],
      ),
    'update_wheel_prizes_order' : IDL.Func(
        [UpdateWheelPrizesOrderRequest],
        [UpdateWheelPrizesOrderResponse],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
