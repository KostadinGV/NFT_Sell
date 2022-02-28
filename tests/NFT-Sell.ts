import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { token } from '@project-serum/anchor/dist/cjs/utils';
import { NftSell } from '../target/types/nft_sell';

import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { SIGHASH_GLOBAL_NAMESPACE } from '@project-serum/anchor/dist/cjs/coder/instruction';

const PublicKey = anchor.web3.PublicKey;

const BN = anchor.BN;

describe('NFT-Sell', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.NftSell as Program<NftSell>;

  const admin = anchor.web3.Keypair.fromSecretKey(new Uint8Array([206,180,223,26,190,141,19,40,22,118,191,35,213,62,199,79,172,1,118,49,251,72,10,26,130,108,111,152,163,117,237,224,28,118,155,113,245,231,134,39,228,160,84,116,164,143,92,14,242,239,66,33,53,253,110,194,83,195,122,211,139,214,155,107]));
  const user = anchor.web3.Keypair.generate();
  let pool = anchor.web3.Keypair.generate();

  let nftTokenMint = null;
  let tokenMint = null;

  let userTokenAccount = null;
  let userNFTTokenAccount = null;
  let adminTokenAccount = null;
  let adminAssociatedNFTTokenAccount = null;
  
  it('Is initialized!', async () => {
    // take sols to the wallet
    // await provider.connection.confirmTransaction(
    //   await provider.connection.requestAirdrop(admin.publicKey, 5000000),
    //   "confirmed"
    // );
    await provider.connection.getBalance(admin.publicKey).then(function(value) { console.log("admin sol ",value); })
    await provider.send(
      (() => {
        const tx = new Transaction();
        tx.add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: user.publicKey,
            lamports: 300000,
          })
        );
        return tx;
      })(),
      [admin]
    );

  
    // create NFT Token mint and account
    nftTokenMint = await Token.createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    )
    
    userNFTTokenAccount = await nftTokenMint.createAccount(user.publicKey);
    await nftTokenMint.mintTo(
      userNFTTokenAccount,
      admin,
      [],
      1
    ) 

    // create token mint and account
    tokenMint = await Token.createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );
    
    adminTokenAccount = await tokenMint.createAccount(admin.publicKey);
    userTokenAccount = await tokenMint.createAccount(user.publicKey);
    await tokenMint.mintTo(
      adminTokenAccount,
      admin.publicKey,
      [admin],              // parameters?
      1000
    );
    await tokenMint.mintTo(
      userTokenAccount,
      admin.publicKey,
      [admin],
      1000
    );
    await provider.connection.getBalance(admin.publicKey).then(function(value) { console.log("admin sol ",value); });
    await provider.connection.getBalance(user.publicKey).then(function(value) { console.log("user sol ",value); });
    console.log("nft token mint: ", nftTokenMint.publicKey.toBase58());
    console.log("user nft account: ", userNFTTokenAccount.toBase58());
    console.log("token mint: ", tokenMint.publicKey.toBase58());
    console.log("admin = ", admin.publicKey.toBase58());
    console.log("user = ", user.publicKey.toBase58());
    console.log("admin token account: ", adminTokenAccount.toBase58());
    console.log("user token account: ", userTokenAccount.toBase58());
    let adminTokenInfo = await tokenMint.getAccountInfo(adminTokenAccount);
    let userTokenInfo = await tokenMint.getAccountInfo(userTokenAccount);

    console.log("admin token amount", adminTokenInfo.amount.toNumber());
    console.log("user token amount", userTokenInfo.amount.toNumber());

    await provider.connection.getBalance(admin.publicKey).then(function(value) { console.log("admin sol ",value); })
    await provider.connection.getBalance(user.publicKey).then(function(value) { console.log("user sol ",value); })
  });
//   it("initialize", async() => {
//     const [vault_account, vault_account_bump] = await PublicKey.findProgramAddress(
//       [Buffer.from("vault-account")],
//       program.programId
//     );
//     console.log("vault account: ", vault_account.toBase58());
// /*
//     let ix = SystemProgram.createAccount({
//       fromPubkey: admin.publicKey,
//       newAccountPubkey: pool.publicKey,
//       lamports : await provider.connection.getMinimumBalanceForRentExemption(GLOBAL_POOL_SIZE),
//       space: GLOBAL_POOL_SIZE,
//       programId: program.programId,
//     })
// */
//     const tx = await program.rpc.initialize(
//       vault_account_bump,
//       {
//         accounts: {
//           admin: admin.publicKey,
//           pool: pool.publicKey,
//           vaultAccount: vault_account,
//           tokenMint: tokenMint.publicKey,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//           rent: SYSVAR_RENT_PUBKEY
//         },
//         instructions: [await program.account.globalPool.createInstruction(pool)],
//         signers: [admin, pool]
//       }
//     );

//     console.log("Your transaction signature", tx);
//   });
  it("add NFT", async() => {
    const [vault_authority, vault_authority_bump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault-authority")],
      program.programId
    );
    console.log("vault authority: ", vault_authority.toBase58());
    const [vault_account, vault_account_bump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault-account")],
      program.programId
    );
    console.log("vault account: ", vault_account.toBase58());
    const tx = await program.rpc.addNft(
      new anchor.BN(0),new anchor.BN(160000),
      {
        accounts: {
          admin: admin.publicKey,
          adminTokenAccount: adminTokenAccount,
          pool: pool.publicKey,
          userNftTokenAccount: userNFTTokenAccount,
          nftTokenMint: nftTokenMint.publicKey,
          vaultAuthority: vault_authority,
          vaultAccount: vault_account,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        },
        signers: [admin]
      }
    );
    console.log("Your transaction signature", tx);
    let adminTokenInfo = await tokenMint.getAccountInfo(adminTokenAccount);
    let vaultInfo = await tokenMint.getAccountInfo(vault_account);
    let userTokenInfo = await tokenMint.getAccountInfo(userTokenAccount);

    console.log("admin token amount", adminTokenInfo.amount.toNumber());
    console.log("user token amount", userTokenInfo.amount.toNumber());
    console.log("vault account amount", vaultInfo.amount.toNumber());
    
    await provider.connection.getBalance(admin.publicKey).then(function(value) { console.log("admin sol ",value); })
    await provider.connection.getBalance(user.publicKey).then(function(value) { console.log("user sol ",value); })
    await provider.connection.getBalance(vault_authority).then(function(value) { console.log("vault sol ",value); })
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
    const tx = await program.rpc.removeNft(
      {
        accounts: {
          admin: admin.publicKey,
          adminTokenAccount: adminTokenAccount,
          pool: pool.publicKey,
          userNftTokenAccount: userNFTTokenAccount,
          tokenMint: nftTokenMint.publicKey,
          vaultAuthority: vault_authority,
          vaultAccount: vault_account,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        },
        signers: [admin]
      }
    );

    console.log("Your transaction signature", tx);
    let adminTokenInfo = await tokenMint.getAccountInfo(adminTokenAccount);
    let vaultInfo = await tokenMint.getAccountInfo(vault_account);
    let userTokenInfo = await tokenMint.getAccountInfo(userTokenAccount);

    console.log("admin token amount", adminTokenInfo.amount.toNumber());
    console.log("user token amount", userTokenInfo.amount.toNumber());
    console.log("vault account amount", vaultInfo.amount.toNumber());
    
    await provider.connection.getBalance(admin.publicKey).then(function(value) { console.log("admin sol ",value); })
    await provider.connection.getBalance(user.publicKey).then(function(value) { console.log("user sol ",value); })
    await provider.connection.getBalance(vault_authority).then(function(value) { console.log("vault sol ",value); })
  });
  it("sell NFT", async() => {
    const [vault_authority, vault_authority_bump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault-authority")],
      program.programId
    );
    const [vault_account, vault_account_bump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault-account")],
      program.programId
    );
    const nftToken = new Token(
      provider.connection,
      nftTokenMint.publicKey,
      TOKEN_PROGRAM_ID,
      user // the wallet owner will pay to transfer and to create recipients associated token account if it does not yet exist.
    );
          
    const ata = await nftToken.getOrCreateAssociatedAccountInfo(
      admin.publicKey
    );
      
    console.log("associated token account: ", ata.address.toBase58());
    const tx = await program.rpc.sellNft(
      {
        accounts: {
          owner: user.publicKey,
          admin: admin.publicKey,
          vaultAuthority: vault_authority,
          vaultAccount: vault_account,
          pool: pool.publicKey,
          userTokenAccount: userTokenAccount,
          userNftTokenAccount: userNFTTokenAccount,
          nftTokenMint: nftTokenMint.publicKey,
          ataNft: ata.address,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        },
        signers: [user]
      }
    );

    console.log("Your transaction signature", tx);
    let adminTokenInfo = await tokenMint.getAccountInfo(adminTokenAccount);
    let vaultInfo = await tokenMint.getAccountInfo(vault_account);
    let userTokenInfo = await tokenMint.getAccountInfo(userTokenAccount);

    console.log("admin token amount", adminTokenInfo.amount.toNumber());
    console.log("user token amount", userTokenInfo.amount.toNumber());
    console.log("vault account amount", vaultInfo.amount.toNumber());
    await provider.connection.getBalance(admin.publicKey).then(function(value) { console.log("admin sol ",value); })
    await provider.connection.getBalance(user.publicKey).then(function(value) { console.log("user sol ",value); })
    await provider.connection.getBalance(vault_authority).then(function(value) { console.log("vault sol ",value); })
  });
  
});
