
import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
require('hardhat-contract-sizer');

dotenv.config();
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);                                                                                           
  }
});

export default {

  // contractSizer: {
  //   alphaSort: true,
  //   disambiguatePaths: false,
  //   runOnCompile: true,
  //   strict: true,
    
  // },


  networks: {
    hardhat: {
      // gas: 10000000000,
      allowUnlimitedContractSize: true,
      
    },
    // mumbaitest: {
    //   url: "https://matic-mumbai.chainstacklabs.com",
    //   accounts: [`0x${process.env.PVTKEY}`],
    //   // gasPrice: 500000000
    // },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    rinkeby:{
      url:process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  
    // testnet: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    //   chainId: 97,
    //   gasPrice: 20000000000,
    //   accounts: {
    //     mnemonic: process.env.TESTNET_MNEMONIC,
    //   },
    // },

  //   bsctestnet: {
  //     url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  //     accounts: [`0x${process.env.PRIVATE_KEY}`],
  //     // gasPrice: 500000000
  //   },
  // },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
  compilers: [
    {
      version: "0.8.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  ],
},
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

  gasReporter: {
    enabled: false,
  }

  // settings: {
  //   optimizer: {
  //     enabled: true,
  //     runs: 200,
  //   }
  // },


};