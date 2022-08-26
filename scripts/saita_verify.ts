const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    //Deployed contract address
    address: "0x5408edF527B92022108267202Fca1e9bc5E76bA1",
    //Pass arguments as string and comma seprated values
    constructorArguments: ["0x7a250d5630b4cf539739df2c5dacb4c659f2488d", "0x02FC3837B3D0602Fb8A8f597b684fC723Ac7d67A"],
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