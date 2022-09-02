const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    //Deployed contract address
    address: "0x157F2e5BB238B51d0cb075f9aA8FbbFb6A7fC0C5",
    //Pass arguments as string and comma seprated values
    constructorArguments: ["0x7a250d5630b4cf539739df2c5dacb4c659f2488d", "0x6f38d8D71d9B51FC5E8d2F7b5859E9e842671C7B", "0xd7d92B299A08460Fc21658Cc1AA0F802CD3F7aD0"],
    //Path of your main contract.
    contract: "contracts/Motion.sol:Motion",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
//npx hardhat run --network rinkeby  scripts/verify.ts