
const ethers = require("ethers")
const optimismSDK = require("@eth-optimism/sdk")
const net = require("net");
require('dotenv').config()


const network = "optimism"
const mnemonic = process.env.MNEMONIC
const l1Url = process.env.TEST_URL
const l2Url = process.env.OPTI_TEST_URL

const gwei = 1000000000n
const eth = gwei * gwei   // 10^18
const centieth = eth/100n


// Global variable because we need them almost everywhere
let crossChainMessenger
let addr    // Our address

const getSigners = async () => {
    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic)
    const privateKey = hdNode.derivePath(ethers.utils.defaultPath).privateKey
    const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)

    return [l1Wallet, l2Wallet]
}   // getSigners


const setup = async() => {
    const [l1Signer, l2Signer] = await getSigners()
    addr = l1Signer.address
    crossChainMessenger = new optimismSDK.CrossChainMessenger({
        l1ChainId: 31337,   // For Kovan, it's 1 for Mainnet
        l2ChainId: 17,
        l1SignerOrProvider: l1Signer,
        l2SignerOrProvider: l2Signer
    })
    console.log(l1Signer.address)
    console.log(l2Signer.address)
}    // setup



const reportBalances = async () => {
    const l1Balance = (await crossChainMessenger.l1Signer.getBalance()).toString().slice(0,-9)
    const l2Balance = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0,-9)

    console.log(`On L1:${l1Balance} Gwei    On L2:${l2Balance} Gwei`)
}    // reportBalances



const depositETH = async () => {
    console.log("Deposit ETH")
    await reportBalances()
    const start = new Date()

    const response = await crossChainMessenger.depositETH(eth)
    console.log(`Transaction hash (on L1): ${response.hash}`)
    await response.wait()
    console.log("Waiting for status to change to RELAYED")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)
    await crossChainMessenger.waitForMessageStatus(response.hash,
        optimismSDK.MessageStatus.RELAYED)

    await reportBalances()
    console.log(`depositETH took ${(new Date()-start)/1000} seconds\n\n`)
}     // depositETH()



const main = async () => {
    console.log("wenbin test")
    console.log(network)
    console.log(l1Url)
    console.log(l2Url)
    console.log(mnemonic)
    await setup()


    await depositETH()
    // await withdrawETH()
    // await depositERC20()
    // await withdrawERC20()

}  // main



main().then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })



