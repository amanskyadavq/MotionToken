const BN = require("ethers").BigNumber;
import { ethers } from "hardhat";

const {
  time, // time
  constants,
} = require("@openzeppelin/test-helpers");
const { factory } = require("typescript");
const ether = require("@openzeppelin/test-helpers/src/ether");

function sleep(ms : any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { token } from "../typechain/@openzeppelin/contracts";
async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();

  const owner = "0xd7d92B299A08460Fc21658Cc1AA0F802CD3F7aD0";
  const router = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
  /**
   @dev const for deployed addresses
   */
  const testnet = {
    saita : "0xd7d92B299A08460Fc21658Cc1AA0F802CD3F7aD0",
    // weth : "0xce6286746CBf9C2c3B3A9FdA37F3b86906c05794",
    // router : "0xA76f69fc3340c2b5772Ae894955Ac4C11Cd5B17F",
    // factory : "0x0E69Ac1682d0c32CdC9175352BD500Ef7C7BBfec",
  }
  /**
 @dev Getting contracts for deployment via "ethers.getContractFactory" as we require ethers for deployment
 */
  let Saita = await ethers.getContractFactory("Motion");
//   let WETH = await ethers.getContractFactory("WETH9");
//   let Factory = await ethers.getContractFactory("UniswapV2Factory");
//   let Router = await ethers.getContractFactory("UniswapV2Router02"); 
  


  let saita = await Saita.deploy(router, "0x6f38d8D71d9B51FC5E8d2F7b5859E9e842671C7B", owner);
  // let saita = await Saita.attach(testnet.saita);
  console.log("Motion",saita.address);

  // let weth = await WETH.deploy();
  // let weth = await WETH.attach(testnet.weth);
  // console.log("WETH",weth.address);

  // let factory = await Factory.deploy(owner);
  // let factory = await Factory.attach(testnet.factory);
  // console.log("Factory",factory.address);

  // let router = await Router.deploy(factory.address,weth.address);
  // let router = await Router.attach(testnet.router);
  // console.log("Router",router.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
//npx hardhat run --network <network name> scripts/deploy.ts