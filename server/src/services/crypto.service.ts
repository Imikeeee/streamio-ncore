import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const BCRYPT_ROUNDS = 12;

export class CryptoService {
  private static getKey(): Buffer {
    const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    return key;
  }

  /**
   * Hashes a password using bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verifies a password against a bcrypt hash.
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Encrypts a string using AES-256-GCM.
   * Returns a string in the format "iv:authTag:ciphertext" (all hex).
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts a string encrypted with AES-256-GCM.
   * Expects format "iv:authTag:ciphertext" (all hex).
   */
  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected "iv:authTag:ciphertext"');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hashes a device token using SHA-256.
   */
  static hashDeviceToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates an HMAC signature for a string.
   */
  static sign(text: string): string {
    return crypto.createHmac('sha256', env.ENCRYPTION_KEY).update(text).digest('hex');
  }

  /**
   * Verifies an HMAC signature for a string.
   */
  static verify(text: string, signature: string): boolean {
    try {
      const expected = this.sign(text);
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
