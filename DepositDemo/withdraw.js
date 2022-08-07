#! /usr/local/bin/node

// Transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@bradyjoestar/sdk")
require('dotenv').config()

const network = "goerlibn"

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
        l1ChainId: 5,   // For Kovan, it's 1 for Mainnet
        l2ChainId: 1705003,
        l1SignerOrProvider: l1Signer,
        l2SignerOrProvider: l2Signer
    })

}    // setup

const gwei = 1000000000n
const eth = gwei * gwei   // 10^18
const centieth = eth/100n
const deth = eth/10n
const dai = eth


const reportBalances = async () => {
    const l1Balance = (await crossChainMessenger.l1Signer.getBalance()).toString().slice(0,-9)
    const l2Balance = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0,-9)


    const l1BalanceWei = (await crossChainMessenger.l1Signer.getBalance()).toString()
    const l2BalanceWei = (await crossChainMessenger.l2Signer.getBalance()).toString()


    const l1BalanceEth = (await crossChainMessenger.l1Signer.getBalance()).toString().slice(0,-18)
    const l2BalanceEth = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0,-18)

    console.log(`On L1:${l1Balance} Gwei    On L2:${l2Balance} Gwei`)
    console.log(`On L1:${l1BalanceWei} wei    On L2:${l2BalanceWei} wei`)
    console.log(`On L1:${l1BalanceEth} eth    On L2:${l2BalanceEth} eth`)
}    // reportBalances


const withdrawETH = async () => {
    console.log("Withdraw ETH")
    const start = new Date()
    await reportBalances()

    const response = await crossChainMessenger.withdrawETH(centieth)
    console.log(`Transaction hash (on L2): ${response.hash}`)
    await response.wait()

    console.log("Waiting for status to change to IN_CHALLENGE_PERIOD")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)
    await crossChainMessenger.waitForMessageStatus(response.hash,
        optimismSDK.MessageStatus.IN_CHALLENGE_PERIOD)
    console.log("In the challenge period, waiting for status READY_FOR_RELAY")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)
    await crossChainMessenger.waitForMessageStatus(response.hash,
        optimismSDK.MessageStatus.READY_FOR_RELAY)
    console.log("Ready for relay, finalizing message now")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)
    await crossChainMessenger.finalizeMessage(response)
    console.log("Waiting for status to change to RELAYED")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)
    await crossChainMessenger.waitForMessageStatus(response,
        optimismSDK.MessageStatus.RELAYED)
    await reportBalances()
    console.log(`withdrawETH took ${(new Date()-start)/1000} seconds\n\n\n`)
}     // withdrawETH()



const main = async () => {
    await setup()

    console.log("----------------withdraw eth---------------------------")

    await withdrawETH()
}  // main

main().then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
