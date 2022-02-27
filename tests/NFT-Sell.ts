import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { token } from '@project-serum/anchor/dist/cjs/utils';
import { NftSell } from '../target/types/nft_sell';

import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

const PublicKey = anchor.web3.PublicKey;

const BN = anchor.BN;

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
  let tokenMint = null;

  let userTokenAccount = null;
  let userNFTTokenAccount = null;
  let adminTokenAccount = null;
  let adminNFTTokenAccount = null;
  
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
    console.log("admin = ", admin.publicKey.toBase58());
    console.log("user = ", admin.publicKey.toBase58());

    nftTokenMint = await Token.createMint(
      provider.connection,
      user,
      admin.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    )
    userTokenAccount = await nftTokenMint.createAccount(user.publicKey);
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
      let poolKey = await PublicKey.createWithSeed(
        user.publicKey,
        "pool",
        program.programId,
      );
      const [vault_account, vault_account_bump] = await PublicKey.findProgramAddress(
        [Buffer.from("vault-account")],
        program.programId
      );
      const tx = await program.rpc.initialize(
        new anchor.BN(vault_account_bump),
        {
          accounts: {
            admin: admin,
            pool: pool,
            vaultAccount: vault_account,
            tokenMint: tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          signers: [admin]
        }
      );
  
      console.log("Your transaction signature", tx);
    });
    it("add NFT", async() => {
      const [vault_authority, vault_authority_bump] = await PublicKey.findProgramAddress(
        [Buffer.from("vault-authority")],
        program.programId
      );
      const [vault_account, vault_account_bump] = await PublicKey.findProgramAddress(
        [Buffer.from("vault-account")],
        program.programId
      );
      const tx = await program.rpc.addNFT(
        vault_account_bump,0,100,
        {
          accounts: {
            admin: admin,
            adminTokenAccount: adminTokenAccount,
            pool: pool,
            userNFTTokenAccount: userNFTTokenAccount,
            tokenMint: nftTokenMint,
            vault_authority: vault_authority,
            vaultAccount: vault_account,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          signers: [admin]
        }
      );
  
      console.log("Your transaction signature", tx);
    });
    it("remove NFT", async() => {
      const [vault_authority, vault_authority_bump] = await PublicKey.findProgramAddress(
        [Buffer.from("vault-authority")],
        program.programId
      );
      const [vault_account, vault_account_bump] = await PublicKey.findProgramAddress(
        [Buffer.from("vault-account")],
        program.programId
      );
      const tx = await program.rpc.removeNFT(
        vault_account_bump,0,100,
        {
          accounts: {
            admin: admin,
            adminTokenAccount: adminTokenAccount,
            pool: pool,
            userNFTTokenAccount: userNFTTokenAccount,
            tokenMint: nftTokenMint,
            vault_authority: vault_authority,
            vaultAccount: vault_account,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          signers: [admin]
        }
      );
  
      console.log("Your transaction signature", tx);
    });
  });
});
