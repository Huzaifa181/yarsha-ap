import * as Keychain from 'react-native-keychain';
import {Buffer} from 'buffer';
import {SECURE_DATABASE_KEY} from '@/config';

const ENCRYPTION_KEY = SECURE_DATABASE_KEY || '';

/**
 * Retrieves or Generates a Secure Realm Encryption Key
 */
export const getRealmEncryptionKey = async (): Promise<Uint8Array> => {
  let credentials = await Keychain.getGenericPassword();

  if (!credentials) {
    console.log('🔐 Generating a new encryption key...');

    const newKey = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      newKey[i] = Math.floor(Math.random() * 256);
    }

    await Keychain.setGenericPassword(
      ENCRYPTION_KEY,
      Buffer.from(newKey).toString('hex'),
    );
    return newKey;
  }

  const keyBuffer = Buffer.from(credentials.password, 'hex');

  if (keyBuffer.length !== 64) {
    console.error('❌ Stored encryption key is invalid. Regenerating...');
    await Keychain.resetGenericPassword();
    return getRealmEncryptionKey();
  }

  console.log(`🔐 Using stored encryption key (64 bytes)`);
  return new Uint8Array(keyBuffer);
};
