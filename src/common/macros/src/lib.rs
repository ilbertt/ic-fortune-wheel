extern crate proc_macro;
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, ReturnType};

#[proc_macro_attribute]
pub fn log_errors(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);
    let fn_name = &input.sig.ident;
    let fn_args = &input.sig.inputs;
    let fn_return_type = &input.sig.output;
    let fn_block = &input.block;
    let fn_async = &input.sig.asyncness;

    // Ensure the function returns a Result
    let result = match fn_return_type {
        ReturnType::Type(_, _) => {
            let block = if fn_async.is_some() {
                quote! { (async { #fn_block }).await }
            } else {
                quote! { (|| #fn_block)() }
            };

            quote! {
                #fn_async fn #fn_name(#fn_args) #fn_return_type {
                    let result = #block;
                    if let common_api::ApiResult::Err(ref e) = result {
                        ic_cdk::println!("Error: {}: {}", stringify!(#fn_name), e);
                    }
                    result
                }
            }
        }
        _ => quote! {
            compile_error!("The log_errors macro can only be applied to functions that return a Result.");
        },
    };

    result.into()
}
