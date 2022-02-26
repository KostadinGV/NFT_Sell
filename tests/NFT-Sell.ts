import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { token } from '@project-serum/anchor/dist/cjs/utils';
import { NftSell } from '../target/types/nft_sell';

import {Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

const PublicKey = anchor.web3.PublicKey;

const POOL_WALLET_SEED = "pool"

describe('NFT-Sell', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.NftSell as Program<NftSell>;

  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  const pool = anchor.web3.Keypair.generate();

  let nftTokenMint = null;
  let userTokenAccount = null;
  
  const GLOBAL_POOL_SIZE = 360_016;

  it('Is initialized!', async () => {
    // Add your test here.
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 9000000000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 9000000000),
      "confirmed"
    );
    console.log("admin = " admin.publicKey.toBase58());
    console.log("user = " admin.publicKey.toBase58());

    nftTokenMint = await Token.createMint(
      provider.connection,
      user,
      admin.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    )
    userTokenAccount =await nftTokenMint.createAccount(user.publicKey);
    await nftTokenMint.mintTo(
      userTokenAccount,
      admin,
      [],
      1
    )

    let ix = SystemProgram.createAccount({
      fromPubkey: admin.publicKey,
      newAccountPubkey: pool.publicKey,
      lamports : await provider.connection.getMinimumBalanceForRentExemption(GLOBAL_POOL_SIZE),
      space: GLOBAL_POOL_SIZE,
      programId: program.programId,
    })

    console.log("pool = ",pool.publicKey.toBase58());
    
    it("initialize", async() => {
      const tx = await program.rpc.initialize(
        {

      });
      console.log("Your transaction signature", tx);
    });
  });
});
