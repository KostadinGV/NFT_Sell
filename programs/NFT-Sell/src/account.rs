use anchor_lang::prelude::*;
use crate::constants::*;

#[zero_copy]
#[derive(Default, Debug)]
#[repr(packed)]
pub struct NFTInfo {    // 48
  pub nft_mint: Pubkey, // 32
  pub price: u64,        // 8
  pub buy_type: u64,     // 8 
}

#[account(zero_copy)]
pub struct GlobalPool {                 // 
  pub nfts: [NFTInfo; NFT_TOTAL_COUNT], // 48 * 64000 
  pub nft_count: u64,                   // 8
  pub admin_wallet: Pubkey              // 32
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
    self.nfts[self.nft_count as usize] = item; 
    self.nft_count += 1;
  }
  pub fn remove_nft(&mut self, mint_key: Pubkey) -> NFTInfo{
    msg!("--remove_nft--{},{}",self.nfts[0].nft_mint,mint_key);
    let mut item: NFTInfo = NFTInfo {
      nft_mint: Pubkey::default(),
      buy_type: 5,
      price: 0,
    };
    for i in 0..self.nft_count {
      if self.nfts[i as usize].nft_mint.eq(&mint_key)  {
        if i != self.nft_count - 1 {
          item = self.nfts[i as usize];
          self.nfts[i as usize] = self.nfts[(self.nft_count - 1) as usize];
          self.nft_count -= 1;
          break;
        }
      }
    }
    //require!(removed == 1,&b"remove item not found");
    item
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