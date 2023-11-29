import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import cron from "node-cron";
import { ethers } from "ethers";
import "dotenv/config";
import { Ultron } from "@thirdweb-dev/chains";

// initiate thirdwebSdk from privatekey
const sdk = ThirdwebSDK.fromPrivateKey(
  process.env.NODE_ENV_PRIVATE_KEY,
  "Ultron",
  {
    clientId: process.env.NODE_ENV_CLIENT_ID,
    secretKey: process.env.NODE_ENV_SECRET_KEY,
  }
);

async function Distribute() {
  // get the split contract using the getContract function from the sdk
  const contract = await sdk.getContract(
    process.env.NODE_ENV_CONTRACT_ADDRESS,
    "split"
  );

  // check the balance to check if the split contract has any Matic in it
  const balance = await contract.balanceOf(process.env.NODE_ENV_WALLET_ADDRESS);

  if (balance.toString() > 0) {
    // use contract.distribute to send out funds if the wallet has a share greater than 0
    console.log(
      "Current Time: " +
        new Date() +
        " LOG INFO: Contract has funds to distribute, function has been triggered"
    );
    const txResult = await contract.distribute();

    // console the result
    console.log(txResult);
  } else {
    console.log(
      "Current Time: " +
        new Date() +
        " LOG INFO: Contract is currently empty: No funds to distribute"
    );
  }
}

async function setupEventListener() {
  const contractAddress = process.env.NODE_ENV_CONTRACT_ADDRESS;
  const provider = new ethers.providers.JsonRpcProvider();
  const contract = new ethers.Contract(contractAddress, ['event PaymentReceived(address indexed from, uint256 value)'], provider);

  // Set up a listener for the "PaymentReceived" event
  contract.on("PaymentReceived", (from, value, event) => {
    console.log(
      "Current Time: " +
        new Date() +
        " LOG INFO: PaymentReceived event received. Triggering distribution."
    );

    // Trigger the distribution function when PaymentReceived event is emitted
    Distribute();
  });
}

// Set up the event listener when the script starts
setupEventListener();

// Schedule a cron job to run daily at midnight and check if the balance is more than 0, if yes, distribute the funds
cron.schedule("0 0 0 * * *", async () => {
  await Distribute();
});
