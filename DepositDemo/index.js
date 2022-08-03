#! /usr/local/bin/node

// Transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@bradyjoestar/sdk")
require('dotenv').config()

const network = "ropsten"

const l1Url = process.env.TEST_URL
const l2Url = process.env.OPTI_TEST_URL


// Contract addresses for DAI tokens, taken
// from https://static.optimism.io/optimism.tokenlist.json
const daiAddrs = {
  l1Addr: "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa",
  l2Addr: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
}    // daiAddrs

// Global variable because we need them almost everywhere
let crossChainMessenger
let l1ERC20, l2ERC20    // DAI contracts to show ERC-20 transfers
let addr    // Our address

const getSigners = async () => {
    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)

    const privateKey = "0x6395A7C842A08515961888D21D72F409B61FBCE96AF1E520384E375F301A8297";
    const l1Wallet = new ethers.Wallet(privateKey,l1RpcProvider);
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider);

    return [l1Wallet, l2Wallet]
}   // getSigners


const setup = async() => {
  const [l1Signer, l2Signer] = await getSigners()
  addr = l1Signer.address
  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: 4,   // For Kovan, it's 1 for Mainnet
      l2ChainId: 1705003,
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer
  })
  console.log(crossChainMessenger.contracts.l1.AddressManager)

  l1ERC20 = new ethers.Contract(daiAddrs.l1Addr, erc20ABI, l1Signer)
  l2ERC20 = new ethers.Contract(daiAddrs.l2Addr, erc20ABI, l2Signer)
}    // setup

// The ABI fragment for an ERC20 we need to get a user's balance.
const erc20ABI = [
    // balanceOf
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ]    // erc20ABI

const gwei = 1000000000n
const eth = gwei * gwei   // 10^18
const centieth = eth/100n
const dai = eth


const reportBalances = async () => {
  const l1Balance = (await crossChainMessenger.l1Signer.getBalance()).toString().slice(0,-9)
  const l2Balance = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0,-9)

  console.log(`On L1:${l1Balance} Gwei    On L2:${l2Balance} Gwei`)
}    // reportBalances



const reportERC20Balances = async () => {
  const l1Balance = (await l1ERC20.balanceOf(addr)).toString().slice(0,-18)
  const l2Balance = (await l2ERC20.balanceOf(addr)).toString().slice(0,-18)
  console.log(`DAI on L1:${l1Balance}     DAI on L2:${l2Balance}`)
}    // reportERC20Balances


const depositETH = async () => {

  console.log("Before Deposit ETH")
  await reportBalances()
  const start = new Date()

  console.log("wenbin print begin")
  console.log(process.env.ADDRESS_MANAGER)
  console.log(crossChainMessenger.l1ChainId)
  console.log(crossChainMessenger.contracts)
  // console.log(crossChainMessenger.contracts.l1.AddressManager)
  console.log("wenbin print end")

  const response = await crossChainMessenger.depositETH(eth)
  console.log(`Transaction hash (on L1): ${response.hash}`)
  await response.wait()
  console.log("Waiting for status to change to RELAYED")
  console.log(`Time so far ${(new Date()-start)/1000} seconds`)
  await crossChainMessenger.waitForMessageStatus(response.hash,
                                                  optimismSDK.MessageStatus.RELAYED)

  console.log("After Deposit 1 gwei")
  await reportBalances()
  console.log(`depositETH took ${(new Date()-start)/1000} seconds\n\n`)
}     // depositETH()


const main = async () => {
    await setup()
    await depositETH()
}  // main

main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
