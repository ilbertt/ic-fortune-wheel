use backend_api::{
    ApiError, CreateCustomDomainRecordRequest, CreateCustomDomainRecordResponse,
    DeleteCustomDomainRecordRequest, ListCustomDomainRecordsResponse,
    UpdateCustomDomainRecordRequest,
};
use lazy_static::lazy_static;
use regex::Regex;

use crate::{
    mappings::map_custom_domain_record,
    repositories::{
        static_assets, CustomDomainRecord, CustomDomainRecordBnRegistrationState,
        CustomDomainRecordId, CustomDomainRecordRepository, CustomDomainRecordRepositoryImpl,
        HttpAssetRepository, HttpAssetRepositoryImpl, TimestampFields,
    },
};

const DOMAIN_NAME_MAX_CHARACTERS_COUNT: usize = 253;
lazy_static! {
    static ref DOMAIN_NAME_REGEX: Regex =
        Regex::new(r"^([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9]\.)+[A-Za-z]{2,63}$").unwrap();
}
const BN_REGISTRATION_ID_MAX_CHARACTERS_COUNT: usize = 255;
const BN_REGISTRATION_STATE_FAILED_ERROR_MESSAGE_MAX_CHARACTERS_COUNT: usize = 1000;

#[cfg_attr(test, mockall::automock)]
pub trait CustomDomainRecordService {
    fn create_custom_domain_record(
        &self,
        request: CreateCustomDomainRecordRequest,
    ) -> Result<CreateCustomDomainRecordResponse, ApiError>;

    fn update_custom_domain_record(
        &self,
        request: UpdateCustomDomainRecordRequest,
    ) -> Result<(), ApiError>;

    fn delete_custom_domain_record(
        &self,
        request: DeleteCustomDomainRecordRequest,
    ) -> Result<(), ApiError>;

    fn list_custom_domain_records(&self) -> Result<ListCustomDomainRecordsResponse, ApiError>;
}

pub struct CustomDomainRecordServiceImpl<C: CustomDomainRecordRepository, H: HttpAssetRepository> {
    custom_domain_record_repository: C,
    http_asset_repository: H,
}

impl Default
    for CustomDomainRecordServiceImpl<CustomDomainRecordRepositoryImpl, HttpAssetRepositoryImpl>
{
    fn default() -> Self {
        Self::new(
            CustomDomainRecordRepositoryImpl::default(),
            HttpAssetRepositoryImpl::default(),
        )
    }
}

impl<C: CustomDomainRecordRepository, H: HttpAssetRepository> CustomDomainRecordService
    for CustomDomainRecordServiceImpl<C, H>
{
    fn create_custom_domain_record(
        &self,
        request: CreateCustomDomainRecordRequest,
    ) -> Result<CreateCustomDomainRecordResponse, ApiError> {
        self.validate_create_custom_domain_record_request(&request)?;

        if self
            .custom_domain_record_repository
            .get_custom_domain_record_count()
            > 0
        {
            return Err(ApiError::conflict("Custom domain record already exists"));
        }

        let custom_domain_record = CustomDomainRecord {
            domain_name: request.domain_name,
            bn_registration_state: CustomDomainRecordBnRegistrationState::NotStarted,
            timestamps: TimestampFields::new(),
        };

        self.create_well_known_http_assets(&custom_domain_record.domain_name)?;

        let custom_domain_record_id = self
            .custom_domain_record_repository
            .create_custom_domain_record(custom_domain_record.clone())?;

        Ok(map_custom_domain_record(
            custom_domain_record_id,
            custom_domain_record,
        ))
    }

    fn update_custom_domain_record(
        &self,
        request: UpdateCustomDomainRecordRequest,
    ) -> Result<(), ApiError> {
        self.validate_update_custom_domain_record_request(&request)?;

        let custom_domain_record_id = CustomDomainRecordId::try_from(request.id.as_str())?;

        let mut custom_domain_record = self
            .custom_domain_record_repository
            .get_custom_domain_record(&custom_domain_record_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Custom domain record with id {} not found",
                    custom_domain_record_id
                ))
            })?;

        custom_domain_record.bn_registration_state = request.bn_registration_state.into();

        self.custom_domain_record_repository
            .update_custom_domain_record(custom_domain_record_id, custom_domain_record)?;

        Ok(())
    }

    fn delete_custom_domain_record(
        &self,
        request: DeleteCustomDomainRecordRequest,
    ) -> Result<(), ApiError> {
        let custom_domain_record_id = CustomDomainRecordId::try_from(request.id.as_str())?;

        self.delete_well_known_http_assets()?;

        self.custom_domain_record_repository
            .delete_custom_domain_record(custom_domain_record_id)?;

        Ok(())
    }

    fn list_custom_domain_records(&self) -> Result<ListCustomDomainRecordsResponse, ApiError> {
        let custom_domain_records = self
            .custom_domain_record_repository
            .list_custom_domain_records()?;

        Ok(custom_domain_records
            .into_iter()
            .map(|(id, record)| map_custom_domain_record(id, record))
            .collect())
    }
}

impl<C: CustomDomainRecordRepository, H: HttpAssetRepository> CustomDomainRecordServiceImpl<C, H> {
    fn new(custom_domain_record_repository: C, http_asset_repository: H) -> Self {
        Self {
            custom_domain_record_repository,
            http_asset_repository,
        }
    }

    fn validate_create_custom_domain_record_request(
        &self,
        req: &CreateCustomDomainRecordRequest,
    ) -> Result<(), ApiError> {
        if req.domain_name.chars().count() > DOMAIN_NAME_MAX_CHARACTERS_COUNT {
            return Err(ApiError::invalid_argument(&format!(
                "Domain name must be at most {DOMAIN_NAME_MAX_CHARACTERS_COUNT} characters"
            )));
        }

        if !DOMAIN_NAME_REGEX.is_match(&req.domain_name) {
            return Err(ApiError::invalid_argument("Invalid domain name"));
        }

        Ok(())
    }

    fn validate_update_custom_domain_record_request(
        &self,
        req: &UpdateCustomDomainRecordRequest,
    ) -> Result<(), ApiError> {
        let bn_registration_id = match &req.bn_registration_state {
            backend_api::CustomDomainRecordBnRegistrationState::NotStarted => {
                return Err(ApiError::invalid_argument(
                    "BN registration state cannot be set to \"not_started\"",
                ));
            }
            backend_api::CustomDomainRecordBnRegistrationState::Pending { bn_registration_id } => {
                bn_registration_id
            }
            backend_api::CustomDomainRecordBnRegistrationState::Registered {
                bn_registration_id,
            } => bn_registration_id,
            backend_api::CustomDomainRecordBnRegistrationState::Failed {
                bn_registration_id,
                error_message,
            } => {
                // it's fine to have an empty error message

                if error_message.chars().count()
                    > BN_REGISTRATION_STATE_FAILED_ERROR_MESSAGE_MAX_CHARACTERS_COUNT
                {
                    return Err(ApiError::invalid_argument(&format!(
                        "Error message must be at most {BN_REGISTRATION_STATE_FAILED_ERROR_MESSAGE_MAX_CHARACTERS_COUNT} characters"
                    )));
                }

                bn_registration_id
            }
        };

        if bn_registration_id.is_empty() {
            return Err(ApiError::invalid_argument(
                "BN registration id cannot be empty",
            ));
        }

        if bn_registration_id.chars().count() > BN_REGISTRATION_ID_MAX_CHARACTERS_COUNT {
            return Err(ApiError::invalid_argument(&format!(
                "BN registration id must be at most {BN_REGISTRATION_ID_MAX_CHARACTERS_COUNT} characters"
            )));
        }

        Ok(())
    }

    fn create_well_known_ic_domains_file(&self, domain_name: &str) -> Result<(), ApiError> {
        let (ic_domains_path, ic_domains) =
            static_assets::create_well_known_ic_domains_file(domain_name)?;

        self.http_asset_repository
            .create_http_asset(ic_domains_path, ic_domains)?;

        Ok(())
    }

    fn delete_well_known_ic_domains_file(&self) -> Result<(), ApiError> {
        self.http_asset_repository
            .delete_http_asset(&static_assets::well_known_ic_domains_path())
    }

    fn create_well_known_ii_alternative_origins_file(
        &self,
        domain_name: &str,
    ) -> Result<(), ApiError> {
        let (ii_alternative_origins_path, ii_alternative_origins) =
            static_assets::create_well_known_ii_alternative_origins_file(domain_name)?;

        self.http_asset_repository
            .create_http_asset(ii_alternative_origins_path, ii_alternative_origins)?;

        Ok(())
    }

    fn delete_well_known_ii_alternative_origins_file(&self) -> Result<(), ApiError> {
        self.http_asset_repository
            .delete_http_asset(&static_assets::well_known_ii_alternative_origins_path())
    }

    fn create_well_known_http_assets(&self, domain_name: &str) -> Result<(), ApiError> {
        self.create_well_known_ic_domains_file(domain_name)?;
        self.create_well_known_ii_alternative_origins_file(domain_name)?;

        self.http_asset_repository.certify_all_assets()?;

        Ok(())
    }

    fn delete_well_known_http_assets(&self) -> Result<(), ApiError> {
        self.delete_well_known_ic_domains_file()?;
        self.delete_well_known_ii_alternative_origins_file()?;

        self.http_asset_repository.certify_all_assets()?;

        Ok(())
    }
}
