import { describe, test, expect, jest, beforeAll } from '@jest/globals'

import WalletAccountEvm from './wallet-account-evm.js'
import WalletManagerEvm from './wallet-manager-evm.js'

const RPC_URL = 'https://example-rpc-url'

let walletManager

beforeAll(() => {
  walletManager = new WalletManagerEvm(WalletManagerEvm.getRandomSeedPhrase(), { config: RPC_URL })
})

describe('WalletAccountEvm', () => {
  test('should initialize successfully with wallet provided', async () => {
    const account = walletManager.getAccount()
    expect(account).toBeInstanceOf(WalletAccountEvm)
  })

  describe('index getter', () => {
    test('returns the correct index', () => {
      const account = walletManager.getAccount()
      expect(account.index).toBe(0)

      const account5 = walletManager.getAccount(5)
      expect(account5.index).toBe(5)
    })
  })

  describe('path getter', () => {
    test('returns the correct path', () => {
      const account = walletManager.getAccount()
      expect(account.path).toBe("m/44'/60'/0'/0/0")

      const account5 = walletManager.getAccount(5)
      expect(account5.path).toBe("m/44'/60'/0'/0/5")
    })
  })

  describe('address getter', () => {
    test('returns the correct address', () => {
      const account = walletManager.getAccount()
      expect(account.address).toBeDefined()
      expect(typeof account.address).toBe('string')
    })
  })

  describe('keyPair getter', () => {
    test('returns the correct key pair', () => {
      const account = walletManager.getAccount()
      expect(account.keyPair).toEqual({
        privateKey: expect.any(String),
        publicKey: expect.any(String)
      })
    })
  })

  describe('sign method', () => {
    test('produces a unique signature for different messages', async () => {
      const account = walletManager.getAccount()

      const msg1 = 'First message'
      const msg2 = 'Second message'

      const sig1 = await account.sign(msg1)
      const sig2 = await account.sign(msg2)

      expect(sig1).not.toBe(sig2)
      expect(sig1).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(sig2).toMatch(/^0x[a-fA-F0-9]+$/)
    })

    test('produces the same signature for the same message and same key', async () => {
      const account = walletManager.getAccount()

      const message = 'Deterministic check'
      const sig1 = await account.sign(message)
      const sig2 = await account.sign(message)

      expect(sig1).toBe(sig2)
    })
  })

  describe('verify method', () => {
    test('returns false for tampered message', async () => {
      const account = walletManager.getAccount()

      const original = 'Original message'
      const altered = 'Original message with change'

      const signature = await account.sign(original)

      const isValid = await account.verify(altered, signature)

      expect(isValid).toBe(false)
    })

    test('returns false for invalid signature', async () => {
      const account = walletManager.getAccount()

      const message = 'Message to check'
      const fakeSig = '0xc8a0eac95516c7396935e903fb35bcf234c8e1df13f7126ad60fdaf0b5d3c6210a4199d49d10271aed578db911a5c2c40ff4329604f71bcd62b39324e8cc62df1b'

      const isValid = await account.verify(message, fakeSig)

      expect(isValid).toBe(false)
    })

    test('returns false for signature from another account', async () => {
      const account0 = walletManager.getAccount(0)
      const account1 = walletManager.getAccount(1)

      const message = 'Message from second account'
      const sig = await account1.sign(message)

      const isValid = await account0.verify(message, sig)

      expect(isValid).toBe(false)
    })

    test('throws on malformed signature input', async () => {
      const account = walletManager.getAccount()

      const message = 'Test message'
      const malformedSignature = 'bad-signature'

      await expect(account.verify(message, malformedSignature)).rejects.toThrow()
    })
  })

  describe('sendTransaction method', () => {
    test('sends a transaction and returns the hash', async () => {
      const mockTxHash = '0x123abc456def'

      const mockAccount = {
        index: 0,
        path: "m/44'/60'/0'/0/0",
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey: '0xprivatekey',
        publicKey: '0xpublickey',
        provider: {},
        signMessage: jest.fn(),
        sendTransaction: jest.fn().mockResolvedValue({ hash: mockTxHash })
      }

      const account = new WalletAccountEvm(mockAccount)

      const tx = {
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        value: 1_000_000
      }

      const hash = await account.sendTransaction(tx)

      expect(hash).toBe(mockTxHash)
      expect(mockAccount.sendTransaction).toHaveBeenCalledWith(tx)
    })

    test('throws if provider is missing', async () => {
      const mockAccount = {
        index: 0,
        path: "m/44'/60'/0'/0/0",
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey: '0xprivatekey',
        publicKey: '0xpublickey',
        signMessage: jest.fn(),
        sendTransaction: jest.fn()
      }

      const account = new WalletAccountEvm(mockAccount)

      const tx = {
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        value: 100
      }

      await expect(account.sendTransaction(tx)).rejects.toThrow()
    })
  })
})
