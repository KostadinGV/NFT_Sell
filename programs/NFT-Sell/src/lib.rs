/**
 * Requirments
 *  1 Admin Functions (Callable by a whitelisted Wallet):
        -AddNFT(nftAddress, amount, tokenAddress[payout will use this token] )
            ->Adds this nft address to the buy list
        -RemoveNFT(nftAddress)
            ->Remove the nft with this address from the buy list if it exists on the buy list


    2 Normal Function (Callable by every user):
        -SellNFT
            ->If a user sends their NFT to the SC it needs to check if its in our buy list

            -> Yes, it is in our buy list:
                = Take NFT and send it to the whitelited Admin wallet
                && give the User the amount of SOL/SPL that was set in the buy list
                && remove NFTaddress from the buy list

            -> No, this NFT is not in our buy list:
                = Take NFT and send it to the whitelited Admin wallet
                && dont give the User any SOL/SPL (this should normally dont happen, only if a user tries to fuck with the SC)
 */

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Mint, Transfer, SetAuthority}
};

pub mod constants;
pub mod account;
pub mod utils;

use constants::*;
use account::*;
use utils::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");



#[program]
pub mod nft_sell {
    use super::*;
    

    pub fn initialize(
        ctx: Context<Initialize>,
        vault_account_bump: u8
    ) -> ProgramResult {
        ctx.accounts.pool.load_init()?;

        let (vault_authority, _vault_authority_bump) = 
            Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);
        let cpi_accounts = SetAuthority {
            account_or_mint: ctx.accounts.vault_account.to_account_info().clone(),
            current_authority: ctx.accounts.admin.to_account_info().clone(),
        };
        
        token::set_authority(
            CpiContext::new(ctx.accounts.token_program.clone(), cpi_accounts),
            AuthorityType::AccountOwner,
            Some(vault_authority)
        );
        Ok(())
    }
    pub fn addNFT(
        ctx: Context<AddNFT>,
        vault_account_bump: u8,
        buy_type: u8,
        price: u64
    ) -> ProgramResult {
        let nft = NFTInfo {
            nft_mint: ctx.accounts.token_mint.key(),
            buy_type: buy_type,
            price: price
        };
        let mut pool =  ctx.accounts.pool.load_mut()?;
        pool.add_nft(nft);
        if ( buy_type == 0 ){
            sol_transfer_with_signer(
                ctx.accounts.admin.to_account_info(),
                ctx.accounts.vault_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                &[&[VAULT_ACCOUNT_SEED.as_ref(), &[vault_account_bump]]],
                price
            )?;
        }
        else {
            let cpi_accounts = Transfer {
                from: ctx.accounts.admin_token_account.to_account_info().clone(),
                to: ctx.accounts.vault_account.to_account_info().clone(),
                authority: ctx.accounts.admin.to_account_info().clone()
            };
            token::transfer(
                CpiContext::new(ctx.accounts.token_program.to_account_info().clone(), cpi_accounts),
                price
            )?;
        }
        Ok(())
    }
    pub fn removeNFT(
        ctx: Context<RemoveNFT>,
    ) -> ProgramResult {
        let mut pool =  ctx.accounts.pool.load_mut()?;
        let item: NFTInfo = pool.remove_nft(ctx.accounts.token_mint.key());

        let (_vault_authority, vault_authority_bump) = 
            Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);

        if ( item.buy_type == 0){
            sol_transfer_with_signer(
                ctx.accounts.vault_account.to_account_info(),
                ctx.accounts.admin.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_authority_bump]]],
                item.price
            )?;
        }
        else {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_account.to_account_info().clone(),
                to: ctx.accounts.admin_token_account.to_account_info().clone(),
                authority: ctx.accounts.vault_authority.to_account_info().clone()
            };
            token::transfer(
                CpiContext::new(ctx.accounts.token_program.to_account_info().clone(), cpi_accounts),
                item.price
            )?;
        }
        Ok(())
    }
    pub fn sellNFT(ctx: Context<SellNFT>) -> ProgramResult {
        let (_vault_authority, vault_authority_bump) = 
            Pubkey::find_program_address(&[VAULT_AUTHORITY_SEED], ctx.program_id);


        let mut pool =  ctx.accounts.pool.load_mut()?;
        let item: NFTInfo = pool.remove_nft(ctx.accounts.token_mint.key());


        if item.price != 0 {
            if  item.buy_type == 0{
                sol_transfer_with_signer(
                    ctx.accounts.vault_account.to_account_info(),
                    ctx.accounts.owner.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                    &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_authority_bump]]],
                    item.price
                )?;
            }
            else{
                let cpi_accounts = Transfer {
                    from: ctx.accounts.vault_account.to_account_info().clone(),
                    to: ctx.accounts.user_token_account.to_account_info().clone(),
                    authority: ctx.accounts.vault_authority.to_account_info().clone()
                };
                token::transfer(
                    CpiContext::new(ctx.accounts.token_program.to_account_info().clone(), cpi_accounts),
                    item.price
                )?;
            }
        }
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.ata_nft.to_account_info(),
            authority: ctx.accounts.owner.to_account_info()
        };
        let token_program = ctx.accounts.token_program.to_account_info();
        let transfer_ctx = CpiContext::new(token_program, cpi_accounts);
        token::transfer(
            transfer_ctx,
            1
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction( vault_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(zero)]
    pub pool: AccountLoader<'info, GlobalPool>,
    #[account (
        init,
        seeds= [b"vault-account".as_ref()],
        bump = vault_account_bump,
        payer = admin,
        token::mint = token_mint,
        token::authority = admin
    )]
    pub vault_account: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, Mint>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct AddNFT<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub admin_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub pool: AccountLoader<'info, GlobalPool>,
    #[account(mut)]
    pub user_nft_token_account: Account<'info, TokenAccount>,
    pub token_mint: AccountInfo<'info>,
    pub vault_authority: AccountInfo<'info >,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct RemoveNFT<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub admin_token_account: Account<'info,TokenAccount>,
    #[account(mut)]
    pub pool: AccountLoader<'info, GlobalPool>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub vault_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_nft_token_account: Account<'info, TokenAccount>,
    pub token_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellNFT<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub admin: AccountInfo<'info>,    
    pub vault_authority: AccountInfo<'info>,
    pub vault_account: Account<'info,TokenAccount>,
    #[account(mut)]
    pub pool: AccountLoader<'info, GlobalPool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    #[account(
        init,
        associated_token::mint = token_mint,
        associated_token::authority = admin,
        payer = owner
    )]
    pub ata_nft: Account<'info, TokenAccount>

}

