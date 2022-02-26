use anchor_lang::prelude::*;
use std::vec::Vec;
use crate::constants::*;

#[zero_copy]
#[derive(Default)]
pub struct NFTInfo {
  pub nft_mint: Pubkey,
  pub buy_type: u8,
  pub price: u64
}

#[account(zero_copy)]
pub struct GlobalPool {
  pub nfts: [NFTInfo; NFT_TOTAL_COUNT],
  pub nft_count: usize,
  pub admin_wallet: Pubkey
}
impl Default for GlobalPool {
  #[inline]
  fn default() -> GlobalPool {
    GlobalPool {
      nfts: [
              NFTInfo {
                  ..Default::default()
              }; NFT_TOTAL_COUNT
          ],
          nft_count: 0,
          admin_wallet: Pubkey::default()
      }
  }
}
impl GlobalPool {
  pub fn add_nft(&mut self, item: NFTInfo) {
    let nfts = &mut self.nfts;
    nfts[self.nft_count] = item; 
    self.nft_count += 1;
  }
  pub fn remove_nft(&mut self, mint_key: Pubkey) {
    for x in &mut self.nfts {
      if ( x.nft_mint.equ== mint_key ){
        x = self.nfts[self.nft_count-1];
        let cnt = &mut self.nft_count;
        cnt = cnt - 1;
        break;
      }
    }
  }
  pub fn contain_nft(&mut self, mint_key: Pubkey) -> bool {
    for x in &self.nfts {
      if x.nft_mint == mint_key {
        return true;
      }
    }
    return false;
  }
}