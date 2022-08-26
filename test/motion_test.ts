import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { time } from "console";
import { mineBlocks, expandTo9Decimals, expandTo18Decimals } from "./utilities/utilities";
import { Burner, Burner__factory, CalHash, CalHash__factory, IFactory, IFactory__factory, IRouter, IRouter__factory, Motion, Motion__factory, Saitama, Saitama__factory, SaitaRealtyV2, SaitaRealtyV2__factory, UniswapV2Factory, UniswapV2Factory__factory, UniswapV2Pair, UniswapV2Pair__factory, UniswapV2Router02, UniswapV2Router02__factory, USDT, USDT__factory, WETH9, WETH9__factory } from "../typechain";
import { string } from "hardhat/internal/core/params/argumentTypes";


describe("Testing", function () {
    let factory: UniswapV2Factory;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let motion : Motion;
    let Weth: WETH9;
    let router: UniswapV2Router02;
    let pair: UniswapV2Pair;
    let inithash : CalHash;
    let usdt : USDT;
    let saitama : Saitama;
    let saitaBurner : Burner;


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
        saitama = await new Saitama__factory(owner).deploy();
        saitaBurner = await new Burner__factory(owner).deploy();
        motion = await new Motion__factory(owner).deploy(router.address,saitama.address);
        usdt = await new USDT__factory(owner).deploy(owner.address);

        await saitama.connect(owner).approve(router.address,expandTo18Decimals(1000000000));
        await motion.connect(owner).approve(router.address,expandTo18Decimals(1000000000));
        
        await motion.connect(owner).excludeFromFee(router.address);

        await saitaBurner.connect(owner).initialize(router.address,saitama.address,motion.address,usdt.address);
        await motion.connect(owner).updateCoolDownSettings(false,0);
        
        await router.connect(owner).addLiquidity(saitama.address,motion.address,expandTo9Decimals(10000000),expandTo9Decimals(10000000),1,1,owner.address,1759004587);
        
        await usdt.approve(router.address, expandTo18Decimals(120000));
        await saitama.approve(router.address,expandTo18Decimals(100000000));
        
        await router.connect(owner).addLiquidityETH(usdt.address,expandTo9Decimals(1000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
        console.log("After before");
        await motion.connect(owner).updateTreasuryWallet(signers[5].address);
        await motion.connect(owner).updateMarketingWallet(signers[6].address);
        await motion.connect(owner).updateBurnWallet(signers[7].address);
        await motion.connect(owner).updateStableCoin(usdt.address);
        await motion.connect(owner).setTaxes(10,10,20,10,0);
        await motion.approve(router.address, expandTo18Decimals(1000))
        await router.connect(owner).addLiquidityETH(motion.address,expandTo9Decimals(5000000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
        await router.connect(owner).addLiquidityETH(saitama.address,expandTo9Decimals(5000000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});

    })

    it("Getter Functions", async() => {
        const name = await motion.name();
        const sym = await motion.symbol();
        const deci = await motion.decimals();
        const tspl = await motion.totalSupply();
        console.log("Name, Symbol, Decimals, TotalSupply :", name, sym, deci, tspl);
        const bal = await motion.balanceOf(owner.address);
        console.log("Balance",bal);
        console.log("treasury add",await motion.treasuryAddress());
    })

    it("Transfer Tokens", async() => {
        console.log("BAlance of owner before Transfer: ", await motion.balanceOf(owner.address));
        console.log("Balance of account 1 before Transfer ", await motion.balanceOf(signers[1].address));
        await motion.allowance(owner.address,signers[1].address);
        await motion.approve(signers[1].address, expandTo9Decimals(1200000000))
        await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(100)); 
        expect( await motion.balanceOf(signers[1].address)).to.be.eq(expandTo9Decimals(100));
        const test = await motion.totalMarketingAndBurn();
        console.log("test",test)
    })
    

    it("Transfer Check for non-whitelist user", async() => {
        
        // await motion.connect(owner).setTaxes(10,10,10,10,50,0);
        await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(1000));
        expect( await motion.balanceOf(signers[1].address)).to.be.eq(expandTo9Decimals(1000));

        await motion.connect(owner).excludeFromFee(saitaBurner.address);
        console.log("Balance of account 1 after Transfer-- ", await motion.balanceOf(signers[1].address));
        // await saita.excludeFromFee(signers[1].address);
        console.log("Balance of 2nd signers Before",await motion.balanceOf(signers[2].address));
        console.log(String(await ethers.provider.getBalance(signers[5].address)),String(await ethers.provider.getBalance(signers[6].address)),"before tr===mr");
        await motion.allowance(signers[1].address,signers[2].address);
        await motion.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        // await motion.enableSaitaTax();
        await motion.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(100));
        let balance_signer2 =  await motion.balanceOf(signers[2].address);
        expect( await motion.balanceOf(signers[2].address)).to.be.eq(95000000009);
        const test = await motion.totalMarketingAndBurn();
        console.log("test",test)
        const Saitatest = await motion.totalSaitaTax();
        console.log("Saitatest",Saitatest)
      })

    it("Buy Tokens",async () => {
        const pairAddress = await factory.getPair(
            Weth.address,motion.address
            
          );
          const path = [Weth.address,motion.address];
          const pairInstance = await pair.attach(pairAddress);
          
          let reserveResult = await pairInstance.getReserves();

          console.log(
            "previous reserves",
            String(reserveResult._reserve0),
            String(reserveResult._reserve1)
          );

        console.log("treasuryAddress Amount Before ", String(await motion.balanceOf(signers[5].address)));
        console.log("marketingAddress Amount Before ", String(await motion.balanceOf(signers[6].address)));
        console.log("burnAddress Amount Before ", String(await motion.balanceOf(signers[7].address)));
        console.log("Saita TAX Amount Before ", String(await motion.balanceOf(motion.address)));

        await motion.connect(owner).enableSaitaTax();

        console.log("signer 4 balance: ",String(await motion.balanceOf(signers[4].address)));

        await router
        .connect(signers[4])
        .swapExactETHForTokensSupportingFeeOnTransferTokens(
        "1",
        path,
        signers[4].address,
        1699971655,
        { value: expandTo18Decimals(1)}
        );
        console.log("signer 4 balance: ",String(await motion.balanceOf(signers[4].address)));

        let newReserveResult = await pairInstance.getReserves();
        console.log(
            "after reserves",
            String(newReserveResult._reserve0),
            String(newReserveResult._reserve1)
          );

        console.log("treasuryAddress Amount After ", String(await motion.balanceOf(signers[5].address)));
        expect( await motion.balanceOf(signers[5].address)).to.be.eq(0);


    })

    it("sell of Saita Token", async()=>{
        const pairAddress = await factory.getPair(
          motion.address,
          Weth.address
        );

        const path = [motion.address, Weth.address];
        const pairInstance = await pair.attach(pairAddress);
        console.log(
          "Saita at pairAddress",
          String(await motion.balanceOf(pairAddress))
        );
  
        let reserveResult = await pairInstance.getReserves();
        console.log(
          "previous reserves",
          String(reserveResult._reserve0),
          String(reserveResult._reserve1)
        );
        await motion.connect(owner).transfer(signers[4].address, expandTo9Decimals(100));

        console.log("Sign 4 Wallet amount before Sell:", String(await motion.balanceOf(signers[4].address)));

        await motion.connect(signers[4]).approve(router.address, expandTo9Decimals(1200000000))

        await router
          .connect(signers[4])
          .swapExactTokensForETHSupportingFeeOnTransferTokens(
            expandTo9Decimals(10),
            1,
            path,
            signers[4].address,
            1781718114
          );
  
          console.log("Sign 4 Wallet amount after Sell:", String(await motion.balanceOf(signers[4].address)));
  
  
        let newReserveResult = await pairInstance.getReserves();
        console.log(
          "new reserves",
          String(newReserveResult._reserve0),
          String(newReserveResult._reserve1)
        );
       
        console.log(
            "Saita at pairAddress",
            String(await motion.balanceOf(pairAddress))
          );
      })

    it("Tax Check for Transfer",async ()=> {
        // console.log("Taxes Before: ",await saita.taxes());

        await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        console.log("Balance of account 1 after Transfer-- ", await motion.balanceOf(signers[1].address));
        // await saita.excludeFromFee(signers[1].address);
        console.log("Balance of 2nd signers Before",await motion.balanceOf(signers[2].address));

        await motion.allowance(signers[1].address,signers[2].address);
        await motion.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        await motion.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(10))
        console.log("Balance of 2nd signers After",await motion.balanceOf(signers[2].address));
        await motion.balanceOf(signers[5].address)

    })

    it("Tax Check for Transfer", async() => {
              // await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
              //   console.log("Balance of account 1 after Transfer-- ", await saita.balanceOf(signers[1].address));
              //   // await saita.excludeFromFee(signers[1].address);
              //   console.log("Balance of 2nd signers Before",await saita.balanceOf(signers[2].address));
              //   await saita.connect(signers[1]).transfer(signers[2].address, expandTo9Decimals(10));
              //   console.log("Balance of 2nd signers",await saita.balanceOf(signers[2].address));
                
    })


    it("Calculating Taxes for buy", async() => {
        const path = [Weth.address,motion.address];
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
        // console.log("Marketing Address before: ",await saita.balanceOf(signers[6].address));
        // console.log("Burn Address before: ",await saita.balanceOf(signers[7].address));
        // console.log("SR Address before: ",await saita.balanceOf(saita.address));


        await motion.connect(owner).transfer(signers[4].address,expandTo9Decimals(100));
        const path = [motion.address, Weth.address];
        await motion.connect(signers[4]).approve(router.address, expandTo9Decimals(1200000000))

        await router
        .connect(signers[4])
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          expandTo9Decimals(10),
          1,
          path,
          signers[4].address,
          1781718114
        );
        // console.log("Marketing Address after: ",await saita.balanceOf(signers[6].address));
        // console.log("Burn Address after: ",await saita.balanceOf(signers[7].address));
        // console.log("SR Address after: ",await saita.balanceOf(saita.address));

    })

    it("Calculating Taxes on Transfer", async () =>{
        // console.log("Marketing Address before: ",await saita.balanceOf(signers[6].address));
        // console.log("Burn Address before: ",await saita.balanceOf(signers[7].address));
        // console.log("SR Address before: ",await saita.balanceOf(saita.address));

        // await saita.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        // console.log("Balance of account 1 after Transfer-- ", await saita.balanceOf(signers[1].address));
        // console.log("Balance of 2nd signers Before",await saita.balanceOf(signers[2].address));
        // console.log(String(await ethers.provider.getBalance(signers[5].address)),String(await ethers.provider.getBalance(signers[6].address)),"before tr===mr");
        // await saita.allowance(signers[1].address,signers[2].address);
        // await saita.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        // await saita.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(100))
        // console.log("Balance of 2nd signers",await saita.balanceOf(signers[2].address));
        // console.log("Marketing Address after: ",await saita.balanceOf(signers[6].address));
        // console.log("Burn Address after: ",await saita.balanceOf(signers[7].address));
        // console.log("SR Address after: ",await saita.balanceOf(saita.address));

    
    })

    it("Airdrop Check ",async() => {
      // await saita.connect(owner).excludeFromReward(owner.address);
      await motion.connect(owner).transfer(signers[11].address, expandTo9Decimals(100));
      await motion.connect(owner).transfer(signers[12].address, expandTo9Decimals(100));
      await motion.connect(owner).transfer(signers[13].address, expandTo9Decimals(100));
      console.log("BAlances 11: ",await motion.balanceOf(signers[11].address));
      console.log("BAlances 12: ",await motion.balanceOf(signers[12].address));
      console.log("BAlances 13: ",await motion.balanceOf(signers[13].address));



      await motion.connect(owner).airdropTokens([signers[11].address,signers[12].address,signers[14].address],[expandTo9Decimals(500),expandTo9Decimals(500),500*10**9]);
      console.log("BAlances 11: ",await motion.balanceOf(signers[11].address));
      console.log("BAlances 12: ",await motion.balanceOf(signers[12].address));
      console.log("BAlances 14: ",await motion.balanceOf(signers[14].address));

      console.log("BAlances 13: ",await motion.balanceOf(signers[13].address));

    })
});
