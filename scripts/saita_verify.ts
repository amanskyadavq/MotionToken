const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    //Deployed contract address
    address: "0x11e57bB6b708588e288E72D7466166191626518d",
    //Pass arguments as string and comma seprated values
    constructorArguments: ["0x118dFC34100aE8a0B79a5D67F808C0F75f548a75","0x6E3BA8064b7Edd27389e228AA0Bd49C04166CFcf","0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db"],
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