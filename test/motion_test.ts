import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { time } from "console";
import { mineBlocks, expandTo9Decimals, expandTo18Decimals, expandTo6Decimals } from "./utilities/utilities";
import { Burner, Burner__factory, CalHash, CalHash__factory, IFactory, IFactory__factory, IRouter, IRouter__factory, Motion, Motion__factory, Saitama, Saitama__factory, SaitaRealtyV2, SaitaRealtyV2__factory, UniswapV2Factory, UniswapV2Factory__factory, UniswapV2Pair, UniswapV2Pair__factory, UniswapV2Router02, UniswapV2Router02__factory, USDT, USDT__factory, WETH9, WETH9__factory } from "../typechain";
import { string } from "hardhat/internal/core/params/argumentTypes";
import { sign } from "crypto";


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

    beforeEach("Saita", async () => {

        signers = await ethers.getSigners();
        owner = signers[0];
        Weth = await new WETH9__factory(owner).deploy();
        inithash = await new CalHash__factory(owner).deploy();
        factory = await new UniswapV2Factory__factory(owner).deploy(owner.address);
        router = await new UniswapV2Router02__factory(owner).deploy(factory.address, Weth.address);
        pair = await new UniswapV2Pair__factory(owner).deploy();
        saitama = await new Saitama__factory(owner).deploy();
        motion = await new Motion__factory(owner).deploy(router.address,saitama.address);
        usdt = await new USDT__factory(owner).deploy(owner.address);

        await saitama.connect(owner).approve(router.address,expandTo18Decimals(1000000000));
        await motion.connect(owner).approve(router.address,expandTo18Decimals(1000000000));
        
        await motion.connect(owner).excludeFromFee(router.address);                
        await usdt.approve(router.address, expandTo18Decimals(120000));
        await saitama.approve(router.address,expandTo18Decimals(100000000));
        
        await router.connect(owner).addLiquidityETH(usdt.address,expandTo9Decimals(40000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
        await motion.connect(owner).updateTreasuryWallet(signers[5].address);
        await motion.connect(owner).updateMarketingWallet(signers[6].address);
        await motion.connect(owner).updateBurnWallet(signers[7].address);
        await motion.connect(owner).updateStableCoin(usdt.address);
        await motion.connect(owner).setTaxes(10,10,20,10,0);
        await motion.approve(router.address, expandTo18Decimals(1000))
        await router.connect(owner).addLiquidityETH(motion.address,expandTo9Decimals(600000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
        await router.connect(owner).addLiquidityETH(saitama.address,expandTo9Decimals(50000),1,1,owner.address,1759004587,{value: expandTo18Decimals(10)});
    })

    it("Getter Functions", async() => {
        expect(await motion.name()).to.be.eq("SaitaMotion");
        expect(await motion.symbol()).to.be.eq("STM");
        expect(await motion.decimals()).to.be.eq(9);
        expect(await motion.totalSupply()).to.be.eq(expandTo18Decimals(10));
    })

    it("Transfer Tokens", async() => {
        await motion.allowance(owner.address,signers[1].address);
        await motion.approve(signers[1].address, expandTo9Decimals(1200000000))
        await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(100)); 
        expect( await motion.balanceOf(signers[1].address)).to.be.eq(expandTo9Decimals(100));
        expect(await motion.totalMarketingAndBurn()).to.be.eq(expandTo9Decimals(0));

    })
    

    it("Transfer Check for non-whitelist user", async() => {
        
        await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(1000));
        expect( await motion.balanceOf(signers[1].address)).to.be.eq(expandTo9Decimals(1000));
        await motion.allowance(signers[1].address,signers[2].address);
        await motion.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000))
        await motion.enableSaitaTax();
        await motion.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(100));
        expect( await motion.balanceOf(signers[2].address)).to.be.eq(94000000009);
        expect(await motion.totalMarketingAndBurn()).to.be.eq(expandTo9Decimals(3));
        expect(await motion.totalSaitaTax()).to.be.eq(expandTo9Decimals(1));

      })

    it("Buy Tokens",async () => {
        const pairAddress = await factory.getPair(
            Weth.address,motion.address
            
          );
          const path = [Weth.address,motion.address];
          const pairInstance = await pair.attach(pairAddress);
          
          let reserveResult = await pairInstance.getReserves();

      
        await motion.connect(owner).enableSaitaTax();

        await router
        .connect(signers[4])
        .swapExactETHForTokensSupportingFeeOnTransferTokens(
        "1",
        path,
        signers[4].address,
        1699971655,
        { value: expandTo18Decimals(1)}
        );
        expect( await motion.balanceOf(signers[6].address)).to.be.eq(0);
        expect(await motion.balanceOf(signers[4].address)).to.be.eq(426107313368301);
    })

    it("sell of Saita Token", async()=>{
        const pairAddress = await factory.getPair(
          motion.address,
          Weth.address
        );

        const path = [motion.address, Weth.address];
        const pairInstance = await pair.attach(pairAddress);
              
        await motion.connect(owner).transfer(signers[4].address, expandTo9Decimals(100));
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
          expect(await motion.balanceOf(signers[4].address)).to.be.eq(90000000000);

      })

    it("Tax Check for Transfer",async ()=> {
        await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(100));
        expect (await motion.balanceOf(signers[1].address)).to.be.eq(100000000000);
        await motion.allowance(signers[1].address,signers[2].address);
        await motion.connect(signers[1]).approve(signers[2].address, expandTo9Decimals(1200000000));
        await motion.connect(signers[2]).transferFrom(signers[1].address,signers[2].address,expandTo9Decimals(10));
        expect(await motion.balanceOf(signers[5].address)).to.be.eq(100000000);
        expect(await motion.balanceOf(signers[2].address)).to.be.eq(9500000000);
    })

    it("Tax Check for Transfer", async() => {
              await motion.connect(owner).transfer(signers[1].address, expandTo9Decimals(1000));
              expect(await motion .balanceOf(signers[1].address)).to.be.eq(expandTo9Decimals(1000));
              await motion.connect(signers[1]).transfer(signers[2].address, expandTo9Decimals(100));
              expect(await motion.balanceOf(signers[2].address)).to.be.eq(95000000009);
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
        expect(await motion.balanceOf(signers[4].address)).to.be.eq(430640369893495);
    })

    it("Calculating Taxes for sell", async() => {
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
        expect(await motion.balanceOf(signers[4].address)).to.be.eq(90000000000);

    })

    it("Airdrop Check ",async() => {
      // await saita.connect(owner).excludeFromReward(owner.address);
      await motion.connect(owner).transfer(signers[11].address, expandTo9Decimals(100));
      await motion.connect(owner).transfer(signers[12].address, expandTo9Decimals(100));
      await motion.connect(owner).transfer(signers[13].address, expandTo9Decimals(100));
      await motion.connect(owner).airdropTokens([signers[11].address,signers[12].address,signers[14].address],[expandTo9Decimals(500),expandTo9Decimals(500),500*10**9]);
      expect (await motion.balanceOf(signers[11].address)).to.be.eq(expandTo9Decimals(600));
      expect (await motion.balanceOf(signers[12].address)).to.be.eq(expandTo9Decimals(600));
      expect (await motion.balanceOf(signers[14].address)).to.be.eq(expandTo9Decimals(500));
      expect (await motion.balanceOf(signers[13].address)).to.be.eq(expandTo9Decimals(100));

    })

    it("SWAP of MARKETING AND BURNING AMOUNT", async() => {

      await motion.connect(owner).transfer(signers[11].address,expandTo9Decimals(100000));
      await motion.connect(signers[11]).transfer(signers[12].address,expandTo9Decimals(5500));
      expect(Number(await ethers.provider.getBalance(signers[6].address))).to.be.eq(10000179502329913072228);
      expect(Number(await ethers.provider.getBalance(signers[7].address))).to.be.eq(10000087351403523243798);

    })

    it("SWAP Tokens to SAITA", async() => {
      await motion.connect(owner).transfer(signers[11].address,expandTo9Decimals(100000));
      await motion.enableSaitaTax();
      await motion.connect(signers[11]).transfer(signers[12].address,expandTo9Decimals(5500));
      expect(Number(await saitama.balanceOf(signers[7].address))).to.be.eq(447421604291);
    })
});
