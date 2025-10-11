import Onboard from '@web3-onboard/core'
import injectedWalletsModule from '@web3-onboard/injected-wallets'

const injected = injectedWalletsModule()
const wallets = [injected]

const chains = [
  {
    id: 1,
    token: 'ETH',
    label: 'Ethereum Mainnet',
    rpcUrl: `https://rpc.flashbots.net`
  }
]

const appMetadata = {
  name: 'Auction App',
  icon: '<svg />',
  logo: '<svg />',
  description: 'Auction App using Onboard',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' }
  ]
}

const onboardOptions = {
  wallets,
  chains,
  appMetadata,
  accountCenter: {
    desktop: { enabled: false },
    mobile: { enabled: false }
  },
  connect: {
    autoConnectLastWallet: true
  }
}


export default onboardOptions