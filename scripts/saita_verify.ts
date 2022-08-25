const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    //Deployed contract address
    address: "0xEB19ec5b002E7BEfc3ED25138127bA69283786da",
    //Pass arguments as string and comma seprated values
    constructorArguments: ["0x7a250d5630b4cf539739df2c5dacb4c659f2488d", "0x6f38d8D71d9B51FC5E8d2F7b5859E9e842671C7B"],
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