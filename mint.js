const { Provider, Account, CallData } = require("starknet");
const fs = require("fs");

// Function to generate a random delay between 1 minute and 5 minutes in milliseconds
function getRandomDelay() {
  const minDelay = 30000; // 1 minute in milliseconds
  const maxDelay = 200000; // 5 minutes in milliseconds
  return Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
}

async function mint() {
  const provider = new Provider({
    sequencer: { baseUrl: "https://alpha-mainnet.starknet.io" },
  });

  // Read the key pairs from a text file
  const keyPairs = fs.readFileSync("keyPairs.txt", "utf8").split("\n");

  for (const pair of keyPairs) {
    const [accountAddress, privateKey] = pair.split(":");
    
    // Create an account instance for each key pair
    const account = new Account(provider, accountAddress, privateKey);

    // Define the contract address
    const contractAddress_1 = '0x00b719f69b00a008a797dc48585449730aa1c09901fdbac1bc94b3bdc287cf76';

    try {
      // Execute a call to the contract
      const multiCall = await account.execute({
        contractAddress: contractAddress_1,
        entrypoint: "mintPublic",
        calldata: CallData.compile({
          to: account.address,
        }),
      });

      // Log the transaction hash
      console.log("Transaction Hash:", multiCall.transaction_hash);

      // Attempt to wait for a successful transaction with up to 3 tries
      let retryCount = 0;
      while (retryCount < 3) {
        const receipt = await provider.waitForTransaction(multiCall.transaction_hash);
        if (receipt && receipt.status === 1) {
          console.log("Transaction Successful!");
          break; // Exit the retry loop if successful
        } else {
          // If the transaction is not yet successful, wait for a while and try again
          console.log(`Waiting for transaction to be mined (Attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
          retryCount++;
        }
      }
      
      if (retryCount === 3) {
        console.error("Transaction did not succeed after 3 attempts.");
      }
    } catch (error) {
      // Handle the error and log it
      console.error("Error processing pair:", pair, error);
    }

    // Generate and wait for a random delay between 1 minute and 5 minutes
    const randomDelay = getRandomDelay();
    console.log(`Waiting for ${randomDelay / 60000} minutes before the next pair...`);
    await new Promise(resolve => setTimeout(resolve, randomDelay));
  }
  
  // Code continues to run, so add a message to indicate that it has ended
  console.log("Minting process has ended.");
}

mint();
