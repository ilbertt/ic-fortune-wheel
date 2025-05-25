import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CreateCustomDomainRecordRequest { 'domain_name' : string }
export type CreateCustomDomainRecordResponse = { 'ok' : CustomDomainRecord } |
  { 'err' : Err };
export type CreateMyUserProfileResponse = { 'ok' : UserProfile } |
  { 'err' : Err };
export interface CreateWheelAssetRequest {
  'total_amount' : number,
  'asset_type_config' : CreateWheelAssetTypeConfig,
  'name' : string,
  'wheel_ui_settings' : [] | [WheelAssetUiSettings],
}
export type CreateWheelAssetResponse = { 'ok' : WheelAsset } |
  { 'err' : Err };
export type CreateWheelAssetTypeConfig = {
    'token' : {
      'exchange_rate_symbol' : [] | [string],
      'prize_usd_amount' : number,
      'ledger_config' : WheelAssetTokenLedgerConfig,
    }
  } |
  { 'jackpot' : { 'wheel_asset_ids' : Array<string> } } |
  { 'gadget' : { 'article_type' : [] | [string] } };
export interface CreateWheelPrizeExtractionRequest {
  'extract_for_principal' : Principal,
}
export type CreateWheelPrizeExtractionResponse = { 'ok' : null } |
  { 'err' : Err };
export interface CustomDomainRecord {
  'id' : string,
  'updated_at' : string,
  'domain_name' : string,
  'created_at' : string,
  'bn_registration_state' : CustomDomainRecordBnRegistrationState,
}
export type CustomDomainRecordBnRegistrationState = {
    'pending' : { 'bn_registration_id' : string }
  } |
  { 'not_started' : null } |
  { 'failed' : { 'bn_registration_id' : string, 'error_message' : string } } |
  { 'registered' : { 'bn_registration_id' : string } };
export interface DeleteCustomDomainRecordRequest { 'id' : string }
export type DeleteCustomDomainRecordResponse = { 'ok' : null } |
  { 'err' : Err };
export interface DeleteUserProfileRequest { 'user_id' : string }
export type DeleteUserProfileResponse = { 'ok' : null } |
  { 'err' : Err };
export interface DeleteWheelAssetRequest { 'id' : string }
export type DeleteWheelAssetResponse = { 'ok' : null } |
  { 'err' : Err };
export interface Err { 'code' : number, 'message' : string }
export type FetchTokensDataResponse = { 'ok' : null } |
  { 'err' : Err };
export type GetLastWheelPrizeExtractionResponse = {
    'ok' : [] | [WheelPrizeExtraction]
  } |
  { 'err' : Err };
export type GetMyUserProfileResponse = { 'ok' : UserProfile } |
  { 'err' : Err };
export interface GetWheelPrizeExtractionRequest {
  'wheel_prize_extraction_id' : string,
}
export type GetWheelPrizeExtractionResponse = { 'ok' : WheelPrizeExtraction } |
  { 'err' : Err };
export type GetWheelPrizeExtractionsStatsResponse = {
    'ok' : WheelPrizeExtractionsStats
  } |
  { 'err' : Err };
export type HeaderField = [string, string];
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'certificate_version' : [] | [number],
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'status_code' : number,
}
export type ListCustomDomainRecordsResponse = {
    'ok' : Array<CustomDomainRecord>
  } |
  { 'err' : Err };
export type ListUsersResponse = { 'ok' : Array<UserProfile> } |
  { 'err' : Err };
export interface ListWheelAssetsRequest { 'state' : [] | [WheelAssetState] }
export type ListWheelAssetsResponse = { 'ok' : Array<WheelAsset> } |
  { 'err' : Err };
export type ListWheelPrizeExtractionsResponse = {
    'ok' : Array<WheelPrizeExtraction>
  } |
  { 'err' : Err };
export type ListWheelPrizesResponse = { 'ok' : Array<WheelPrize> } |
  { 'err' : Err };
export type SetDefaultWheelAssetsResponse = { 'ok' : null } |
  { 'err' : Err };
export interface TransferTokenRequest {
  'to' : Principal,
  'ledger_canister_id' : Principal,
  'amount' : bigint,
}
export type TransferTokenResponse = { 'ok' : bigint } |
  { 'err' : Err };
export interface UpdateCustomDomainRecordRequest {
  'id' : string,
  'bn_registration_state' : CustomDomainRecordBnRegistrationState,
}
export type UpdateCustomDomainRecordResponse = { 'ok' : null } |
  { 'err' : Err };
export interface UpdateMyUserProfileRequest { 'username' : [] | [string] }
export type UpdateMyUserProfileResponse = { 'ok' : null } |
  { 'err' : Err };
export interface UpdateUserProfileRequest {
  'username' : [] | [string],
  'role' : [] | [UserRole],
  'user_id' : string,
}
export type UpdateUserProfileResponse = { 'ok' : null } |
  { 'err' : Err };
export type UpdateWheelAssetImageConfig = {
    'modal' : {
      'content_type' : string,
      'content_bytes' : Uint8Array | number[],
    }
  } |
  {
    'wheel' : {
      'content_type' : string,
      'content_bytes' : Uint8Array | number[],
    }
  };
export interface UpdateWheelAssetImageRequest {
  'id' : string,
  'image_config' : UpdateWheelAssetImageConfig,
}
export type UpdateWheelAssetImageResponse = { 'ok' : null } |
  { 'err' : Err };
export interface UpdateWheelAssetRequest {
  'id' : string,
  'used_amount' : [] | [number],
  'total_amount' : [] | [number],
  'asset_type_config' : [] | [UpdateWheelAssetTypeConfig],
  'name' : [] | [string],
  'state' : [] | [WheelAssetState],
  'wheel_ui_settings' : [] | [WheelAssetUiSettings],
}
export type UpdateWheelAssetResponse = { 'ok' : null } |
  { 'err' : Err };
export type UpdateWheelAssetTypeConfig = {
    'token' : {
      'exchange_rate_symbol' : [] | [string],
      'prize_usd_amount' : [] | [number],
      'ledger_config' : [] | [UpdateWheelAssetTypeLedgerConfig],
    }
  } |
  { 'jackpot' : { 'wheel_asset_ids' : Array<string> } } |
  { 'gadget' : { 'article_type' : [] | [string] } };
export interface UpdateWheelAssetTypeLedgerConfig { 'decimals' : [] | [number] }
export interface UpdateWheelPrizesOrderRequest {
  'wheel_asset_ids' : Array<string>,
}
export type UpdateWheelPrizesOrderResponse = { 'ok' : null } |
  { 'err' : Err };
export interface UserProfile {
  'id' : string,
  'username' : string,
  'role' : UserRole,
  'principal_id' : Principal,
}
export type UserRole = { 'admin' : null } |
  { 'scanner' : null } |
  { 'unassigned' : null };
export interface WheelAsset {
  'id' : string,
  'asset_type' : WheelAssetType,
  'used_amount' : number,
  'total_amount' : number,
  'name' : string,
  'wheel_image_path' : [] | [string],
  'state' : WheelAssetState,
  'available_amount' : number,
  'wheel_ui_settings' : WheelAssetUiSettings,
  'modal_image_path' : [] | [string],
}
export type WheelAssetState = { 'disabled' : null } |
  { 'enabled' : null };
export interface WheelAssetTokenBalance {
  'balance' : bigint,
  'last_fetched_at' : string,
}
export interface WheelAssetTokenLedgerConfig {
  'decimals' : number,
  'ledger_canister_id' : Principal,
}
export interface WheelAssetTokenPrice {
  'usd_price' : number,
  'last_fetched_at' : string,
}
export type WheelAssetType = {
    'token' : {
      'usd_price' : [] | [WheelAssetTokenPrice],
      'balance' : [] | [WheelAssetTokenBalance],
      'exchange_rate_symbol' : [] | [string],
      'prize_usd_amount' : number,
      'available_draws_count' : number,
      'ledger_config' : WheelAssetTokenLedgerConfig,
    }
  } |
  { 'jackpot' : { 'wheel_asset_ids' : Array<string> } } |
  { 'gadget' : { 'article_type' : [] | [string] } };
export interface WheelAssetUiSettings { 'background_color_hex' : string }
export interface WheelPrize {
  'name' : string,
  'wheel_image_path' : [] | [string],
  'prize_usd_amount' : [] | [number],
  'wheel_ui_settings' : WheelAssetUiSettings,
  'wheel_asset_id' : string,
  'modal_image_path' : [] | [string],
}
export interface WheelPrizeExtraction {
  'id' : string,
  'updated_at' : string,
  'extracted_for_principal' : Principal,
  'created_at' : string,
  'state' : WheelPrizeExtractionState,
  'extracted_by_user_id' : string,
  'wheel_asset_id' : [] | [string],
}
export type WheelPrizeExtractionState = {
    'completed' : { 'prize_usd_amount' : [] | [number] }
  } |
  { 'processing' : null } |
  { 'failed' : { 'error' : Err } };
export interface WheelPrizeExtractionsStats {
  'total_completed_extractions' : number,
  'total_spent_usd' : number,
}
export interface _SERVICE {
  'create_custom_domain_record' : ActorMethod<
    [CreateCustomDomainRecordRequest],
    CreateCustomDomainRecordResponse
  >,
  'create_my_user_profile' : ActorMethod<[], CreateMyUserProfileResponse>,
  'create_wheel_asset' : ActorMethod<
    [CreateWheelAssetRequest],
    CreateWheelAssetResponse
  >,
  'create_wheel_prize_extraction' : ActorMethod<
    [CreateWheelPrizeExtractionRequest],
    CreateWheelPrizeExtractionResponse
  >,
  'delete_custom_domain_record' : ActorMethod<
    [DeleteCustomDomainRecordRequest],
    DeleteCustomDomainRecordResponse
  >,
  'delete_user_profile' : ActorMethod<
    [DeleteUserProfileRequest],
    DeleteUserProfileResponse
  >,
  'delete_wheel_asset' : ActorMethod<
    [DeleteWheelAssetRequest],
    DeleteWheelAssetResponse
  >,
  'fetch_tokens_data' : ActorMethod<[], FetchTokensDataResponse>,
  'get_last_wheel_prize_extraction' : ActorMethod<
    [],
    GetLastWheelPrizeExtractionResponse
  >,
  'get_my_user_profile' : ActorMethod<[], GetMyUserProfileResponse>,
  'get_wheel_prize_extraction' : ActorMethod<
    [GetWheelPrizeExtractionRequest],
    GetWheelPrizeExtractionResponse
  >,
  'get_wheel_prize_extractions_stats' : ActorMethod<
    [],
    GetWheelPrizeExtractionsStatsResponse
  >,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'list_custom_domain_records' : ActorMethod<
    [],
    ListCustomDomainRecordsResponse
  >,
  'list_users' : ActorMethod<[], ListUsersResponse>,
  'list_wheel_assets' : ActorMethod<
    [ListWheelAssetsRequest],
    ListWheelAssetsResponse
  >,
  'list_wheel_prize_extractions' : ActorMethod<
    [],
    ListWheelPrizeExtractionsResponse
  >,
  'list_wheel_prizes' : ActorMethod<[], ListWheelPrizesResponse>,
  'set_default_wheel_assets' : ActorMethod<[], SetDefaultWheelAssetsResponse>,
  'transfer_token' : ActorMethod<[TransferTokenRequest], TransferTokenResponse>,
  'update_custom_domain_record' : ActorMethod<
    [UpdateCustomDomainRecordRequest],
    UpdateCustomDomainRecordResponse
  >,
  'update_my_user_profile' : ActorMethod<
    [UpdateMyUserProfileRequest],
    UpdateMyUserProfileResponse
  >,
  'update_user_profile' : ActorMethod<
    [UpdateUserProfileRequest],
    UpdateMyUserProfileResponse
  >,
  'update_wheel_asset' : ActorMethod<
    [UpdateWheelAssetRequest],
    UpdateWheelAssetResponse
  >,
  'update_wheel_asset_image' : ActorMethod<
    [UpdateWheelAssetImageRequest],
    UpdateWheelAssetImageResponse
  >,
  'update_wheel_prizes_order' : ActorMethod<
    [UpdateWheelPrizesOrderRequest],
    UpdateWheelPrizesOrderResponse
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
