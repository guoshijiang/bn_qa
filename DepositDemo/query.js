#! /usr/local/bin/node

// Transfers between L1 and L2 using the Optimism SDK

const ethers = require("ethers")
const optimismSDK = require("@bradyjoestar/sdk")
require('dotenv').config()

const network = "goerlibn"

const l1Url = process.env.TEST_URL
const l2Url = process.env.OPTI_TEST_URL

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


const query = async () => {
    console.log("----------query balance--------------------")
    await reportBalances()
}



const main = async () => {
    await setup()
    await query()

}  // main

main().then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
