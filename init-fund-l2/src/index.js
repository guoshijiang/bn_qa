const ethers = require('ethers')
const chalk = require('chalk')
const optimismSDK = require("@eth-optimism/sdk")
const loadContract =  require("@eth-optimism/contracts")
require('dotenv').config()



const main = async () => {
  const env = process.env

  const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
  const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL
  const ADDRESS_MANAGER_ADDRESS = env.ADDRESS_MANAGER_ADDRESS
  const PRIVATE_KEY = env.PRIVATE_KEY
  const L2_GAS_LIMIT = 1300000
  /*****************************************************/
  /******************** ENTER AMOUNT *******************/
  /*****************************************************/
  const TRANSFER_AMOUNT = ethers.utils.parseEther('0.0001')

  const L1Provider = new ethers.providers.StaticJsonRpcProvider(
    L1_NODE_WEB3_URL
  )
  const L2Provider = new ethers.providers.StaticJsonRpcProvider(
    L2_NODE_WEB3_URL
  )
  const L1Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L1Provider)
  const L2Wallet = new ethers.Wallet(PRIVATE_KEY).connect(L2Provider)

  console.log("wenbin test begin==============")
  console.log(L1_NODE_WEB3_URL)
  console.log(L2_NODE_WEB3_URL)
  console.log("wenbin test end  ==============")


  console.log("wenbin timepoint begin ------------------")
  const messenger = new optimismSDK.CrossChainMessenger({
    l1SignerOrProvider: L1Wallet,
    l2SignerOrProvider: L2Wallet,
    l1ChainId: 4,
    l2ChainId: 1705003,
    fastRelayer: false,
  })
  console.log("wenbin timepoint 1------------------")

  const Lib_AddressManager = loadContract(
    'Lib_AddressManager',
    ADDRESS_MANAGER_ADDRESS,
    L1Provider
  )

  console.log("wenbin timepoint 2------------------")

  const Proxy__L1CrossDomainMessengerAddress =
    await Lib_AddressManager.getAddress('Proxy__L1CrossDomainMessenger')
  const L2CrossDomainMessengerAddress = await Lib_AddressManager.getAddress(
    'L2CrossDomainMessenger'
  )
  const Proxy__L1StandardBridgeAddress = await Lib_AddressManager.getAddress(
    'Proxy__L1StandardBridge'
  )
  console.log(
    `⭐️ ${chalk.blue('Proxy__L1CrossDomainMessenger address:')} ${chalk.green(
      Proxy__L1CrossDomainMessengerAddress
    )}`
  )
  console.log(
    `⭐️ ${chalk.blue('L2CrossDomainMessenger address:')} ${chalk.green(
      L2CrossDomainMessengerAddress
    )}`
  )
  console.log(
    `⭐️ ${chalk.blue('Proxy__L1StandardBridge address:')} ${chalk.green(
      Proxy__L1StandardBridgeAddress
    )}`
  )
  console.log("wenbin timepoint 3------------------")

  const Proxy__L1StandardBridge = loadContract(
    'L1StandardBridge',
    Proxy__L1StandardBridgeAddress,
    L1Wallet
  )

  const depositTx = await Proxy__L1StandardBridge.depositETH(
    L2_GAS_LIMIT,
    ethers.utils.formatBytes32String(new Date().getTime().toString()),
    {
      value: TRANSFER_AMOUNT,
    }
  )

  const receiptL1Tx = await depositTx.wait()
  console.log(' got L1->L2 message hash:', receiptL1Tx.transactionHash)

  const currentBlock = await L2Provider.getBlockNumber()
  const fromBlock = currentBlock - 1000 > 0 ? currentBlock - 1000 : 0

  const receiptL2Tx = await messenger.waitForMessageReceipt(depositTx, {
    fromBlock,
  })
  console.log(
    ' completed Deposit! L2 tx hash:',
    receiptL2Tx.transactionReceipt.transactionHash
  )
}

try {
  main()
} catch (error) {
  console.log(error)
}
