import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { time } from "console";
import { mineBlocks, expandTo9Decimals, expandTo18Decimals } from "./utilities/utilities";
import { CalHash, CalHash__factory, IFactory, IFactory__factory, IRouter, IRouter__factory, SaitaRealtyV2, SaitaRealtyV2__factory, UniswapV2Factory, UniswapV2Factory__factory, UniswapV2Pair, UniswapV2Pair__factory, UniswapV2Router02, UniswapV2Router02__factory, USDT, USDT__factory, WETH9, WETH9__factory } from "../typechain";
import { string } from "hardhat/internal/core/params/argumentTypes";
// import { SaitaRealtyV2 } from "../typechain-types/SaitaRealtyV2";
// import { IFactory } from "../typechain-types/IFactory";
// import { IRouter } from "../typechain-types/IRouter";

describe("Testing", function () {
    let factory: UniswapV2Factory;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let saita: SaitaRealtyV2;
    let Weth: WETH9;
    let router: UniswapV2Router02;
    let pair: UniswapV2Pair;
    let inithash : CalHash;
    let usdt : USDT;


    beforeEach("Saita", async () => {

        signers = await ethers.getSigners();
        owner = signers[0];
        Weth = await new WETH9__factory(owner).deploy();
        console.log("weth", Weth.address);
        inithash = await new CalHash__factory(owner).deploy();
        console.log("cal hash",await inithash.getInitHash());
        factory = await new UniswapV2Factory__factory(owner).deploy(owner.address);
        // console.log("Factory in Testcase",factory.address);
        router = await new UniswapV2Router02__factory(owner).deploy(factory.address, Weth.address);
        pair = await new UniswapV2Pair__factory(owner).deploy();
        saita = await new SaitaRealtyV2__factory(owner).deploy(router.address);
        usdt = await new USDT__factory(owner).deploy(owner.address);
        // await saita.setAddress(
        //     signers[5].address,//treasury
        //     signers[6].address,//marketing
        //     signers[7].address,//burn
        //     signers[8].address,
        //     usdt.address,
        //     )
        await saita.connect(owner).updateTreasuryWallet(signers[5].address);
        await saita.connect(owner).updateMarketingWallet(signers[6].address);
        await saita.connect(owner).updateBurnWallet(signers[6].address);
        await saita.connect(owner).updateStableCoin(usdt.address);
        await saita.connect(owner).setTaxes(10,10,10,10,50);
        await saita.approve(router.address, expandTo18Decimals(1000))
        await router.connect(owner).addLiquidityETH(saita.address,expandTo9Decimals(100),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
        console.log(String(await router.connect(owner).getAmountsOut("500000000",[saita.address,Weth.address])));
        await usdt.approve(router.address, expandTo18Decimals(1200))
        await router.connect(owner).addLiquidityETH(usdt.address,expandTo9Decimals(1000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
        console.log("After before");
        await saita.connect(owner).updateCoolDownSettings(false,0);
    })

    it("Getter Functions", async() => {
        const name = await saita.name();
        const sym = await saita.symbol();
        const deci = await saita.decimals();
        const tspl = await saita.totalSupply();
        console.log("Name, Symbol, Decimals, TotalSupply :", name, sym, deci, tspl);
        const bal = await saita.balanceOf(owner.address);
        console.log("Balance",bal);
        console.log("treasury add",await saita.treasuryAddress());
    })

    it("Transfer Tokens", async() => {
        console.log("BAlance of owner before Transfer: ", await saita.balanceOf(owner.address));
        console.log("Balance of account 1 before Transfer ", await saita.balanceOf(signers[1].address));
        await saita.allowance(owner.address,signers[1].address);
        await saita.approve(signers[1].address, expandTo9Decimals(1200000000))
        // await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        await expect (await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100))).to.emit(saita, 'Transfer').withArgs(owner.address,signers[1].address,expandTo9Decimals(100)) ;      
         console.log("BAlance of owner after Transfer: ", await saita.balanceOf(owner.address));
        console.log("Balance of account 1 after Transfer ", await saita.balanceOf(signers[1].address));
    })
    

    it("Transfer Check for non-whitelist user", async() => {
        
        // await saita.allowance(owner.address,signers[1].address);
        // await saita.approve(signers[1].address, expandTo9Decimals(1200000000))
        await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        console.log("Balance of account 1 after Transfer-- ", await saita.balanceOf(signers[1].address));
        // await saita.excludeFromFee(signers[1].address);
        console.log("Balance of 2nd signers Before",await saita.balanceOf(signers[2].address));
        console.log(String(await ethers.provider.getBalance(signers[5].address)),String(await ethers.provider.getBalance(signers[6].address)),"before tr===mr");
        await saita.allowance(signers[1].address,signers[2].address);
        await saita.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        await saita.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(100))
        // await saita.connect(signers[1]).transfer(signers[2].address, expandTo9Decimals(10));
        console.log("Balance of 2nd signers",await saita.balanceOf(signers[2].address));
        console.log(String(await ethers.provider.getBalance(signers[5].address)),String(await ethers.provider.getBalance(signers[6].address)),"after tr===mr");
        
    })

    it("Setting Taxes",async () => {
        await saita.setTaxes(1,1,1,1,5);
        console.log("New Taxes are : ",await saita.taxes())
    })

    it("Buy Tokens",async () => {
        const pairAddress = await factory.getPair(
            Weth.address,saita.address
            
          );
          const path = [Weth.address,saita.address];
          const pairInstance = await pair.attach(pairAddress);
          
          let reserveResult = await pairInstance.getReserves();

          console.log(
            "previous reserves",
            String(reserveResult._reserve0),
            String(reserveResult._reserve1)
          );

        console.log("treasuryAddress Amount Before ", String(await saita.balanceOf(signers[5].address)));
        console.log("marketingAddress Amount Before ", String(await saita.balanceOf(signers[6].address)));
        console.log("burnAddress Amount Before ", String(await saita.balanceOf(signers[7].address)));
        // console.log("burnAddress Amount Before ", String(await saita.valuesFrom()));
        // console.log("burnAddress Amount Before ", String(await saita.balanceOf(signers[7].address)));

        console.log("signer 4 balance: ",String(await saita.balanceOf(signers[4].address)));

        await router
        .connect(signers[4])
        .swapExactETHForTokensSupportingFeeOnTransferTokens(
        "1",
        path,
        signers[4].address,
        1699971655,
        { value: expandTo18Decimals(1)}
        );
        console.log("signer 4 balance: ",String(await saita.balanceOf(signers[4].address)));

        let newReserveResult = await pairInstance.getReserves();
        console.log(
            "after reserves",
            String(newReserveResult._reserve0),
            String(newReserveResult._reserve1)
          );

        console.log("treasuryAddress Amount After ", String(await saita.balanceOf(signers[5].address)));
        console.log("marketingAddress Amount After ", String(await saita.balanceOf(signers[6].address)));
        console.log("burnAddress Amount After ", String(await saita.balanceOf(signers[7].address)));

    })

    it("sell of Saita Token", async()=>{
        const pairAddress = await factory.getPair(
          saita.address,
          Weth.address
        );

        const path = [saita.address, Weth.address];
        const pairInstance = await pair.attach(pairAddress);
  
  
        console.log(
          "Saita at pairAddress",
          String(await saita.balanceOf(pairAddress))
        );
  
        let reserveResult = await pairInstance.getReserves();
        console.log(
          "previous reserves",
          String(reserveResult._reserve0),
          String(reserveResult._reserve1)
        );
        await saita.connect(owner).transfer(signers[4].address, expandTo9Decimals(100));

        console.log("Sign 4 Wallet amount before Sell:", String(await saita.balanceOf(signers[4].address)));

        await saita.connect(signers[4]).approve(router.address, expandTo9Decimals(1200000000))

        // await saita.excludeFromFee(signers[4].address);
  
        await router
          .connect(signers[4])
          .swapExactTokensForETHSupportingFeeOnTransferTokens(
            expandTo9Decimals(10),
            1,
            path,
            signers[4].address,
            1781718114
          );
  
          console.log("Sign 4 Wallet amount after Sell:", String(await saita.balanceOf(signers[4].address)));
  
  
        let newReserveResult = await pairInstance.getReserves();
        console.log(
          "new reserves",
          String(newReserveResult._reserve0),
          String(newReserveResult._reserve1)
        );
       
        console.log(
            "Saita at pairAddress",
            String(await saita.balanceOf(pairAddress))
          );
      })

    it("Tax Check for Transfer",async ()=> {
        // console.log("Taxes Before: ",await saita.taxes());

        await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        console.log("Balance of account 1 after Transfer-- ", await saita.balanceOf(signers[1].address));
        // await saita.excludeFromFee(signers[1].address);
        console.log("Balance of 2nd signers Before",await saita.balanceOf(signers[2].address));

        await saita.allowance(signers[1].address,signers[2].address);
        await saita.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        await saita.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(10))

    })

    it("Tax Check for Transfer", async() => {
              await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
                console.log("Balance of account 1 after Transfer-- ", await saita.balanceOf(signers[1].address));
                // await saita.excludeFromFee(signers[1].address);
                console.log("Balance of 2nd signers Before",await saita.balanceOf(signers[2].address));
                await saita.connect(signers[1]).transfer(signers[2].address, expandTo9Decimals(10));
                console.log("Balance of 2nd signers",await saita.balanceOf(signers[2].address));
                
    })


    it("Calculating Taxes for buy", async() => {
        const path = [Weth.address,saita.address];
        await router
            .connect(signers[4])
            .swapExactETHForTokensSupportingFeeOnTransferTokens(
            "10",
            path,
            signers[4].address,
            1699971655,
            { value: expandTo18Decimals(1)}
            );
        
    })

    it("Calculating Taxes for sell", async() => {
        console.log("Marketing Address before: ",await saita.balanceOf(signers[6].address));
        console.log("Burn Address before: ",await saita.balanceOf(signers[7].address));
        console.log("SR Address before: ",await saita.balanceOf(saita.address));


        await saita.connect(owner).transfer(signers[4].address,expandTo9Decimals(100));
        const path = [saita.address, Weth.address];
        await saita.connect(signers[4]).approve(router.address, expandTo9Decimals(1200000000))

        await router
        .connect(signers[4])
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          expandTo9Decimals(10),
          1,
          path,
          signers[4].address,
          1781718114
        );
        console.log("Marketing Address after: ",await saita.balanceOf(signers[6].address));
        console.log("Burn Address after: ",await saita.balanceOf(signers[7].address));
        console.log("SR Address after: ",await saita.balanceOf(saita.address));

    })

    it("Calculating Taxes on Transfer", async () =>{
        console.log("Marketing Address before: ",await saita.balanceOf(signers[6].address));
        console.log("Burn Address before: ",await saita.balanceOf(signers[7].address));
        console.log("SR Address before: ",await saita.balanceOf(saita.address));

        await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        console.log("Balance of account 1 after Transfer-- ", await saita.balanceOf(signers[1].address));
        console.log("Balance of 2nd signers Before",await saita.balanceOf(signers[2].address));
        console.log(String(await ethers.provider.getBalance(signers[5].address)),String(await ethers.provider.getBalance(signers[6].address)),"before tr===mr");
        await saita.allowance(signers[1].address,signers[2].address);
        await saita.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        await saita.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(100))
        console.log("Balance of 2nd signers",await saita.balanceOf(signers[2].address));
        console.log("Marketing Address after: ",await saita.balanceOf(signers[6].address));
        console.log("Burn Address after: ",await saita.balanceOf(signers[7].address));
        console.log("SR Address after: ",await saita.balanceOf(saita.address));

    
    })

    it("Airdrop Check ",async() => {
      // await saita.connect(owner).excludeFromReward(owner.address);
      await saita.connect(owner).transfer(signers[11].address, expandTo9Decimals(100));
      await saita.connect(owner).transfer(signers[12].address, expandTo9Decimals(100));
      await saita.connect(owner).transfer(signers[13].address, expandTo9Decimals(100));
      console.log("BAlances 11: ",await saita.balanceOf(signers[11].address));
      console.log("BAlances 12: ",await saita.balanceOf(signers[12].address));
      console.log("BAlances 13: ",await saita.balanceOf(signers[13].address));



      await saita.connect(owner).airdropTokens([signers[11].address,signers[12].address,signers[14].address],[expandTo9Decimals(500),expandTo9Decimals(500),500*10**9]);
      console.log("BAlances 11: ",await saita.balanceOf(signers[11].address));
      console.log("BAlances 12: ",await saita.balanceOf(signers[12].address));
      console.log("BAlances 14: ",await saita.balanceOf(signers[14].address));

      console.log("BAlances 13: ",await saita.balanceOf(signers[13].address));

    })
});
