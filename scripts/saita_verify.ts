const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    //Deployed contract address
    address: "0xC4d551eBAefdb62a24Ee7Ed33Bf5048964E11fdc",
    //Pass arguments as string and comma seprated values
    constructorArguments: ["0x7a250d5630b4cf539739df2c5dacb4c659f2488d", "0x8B8E4FEc079b1f0e0ccBc047dce027092b7C237e"],
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