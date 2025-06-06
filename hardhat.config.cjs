require('@nomicfoundation/hardhat-ethers')

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'cook voyage document eight skate token alien guide drink uncle term abuse',
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 1,
        accountsBalance: '1000000000000000000'
      }
    }
  }
}
