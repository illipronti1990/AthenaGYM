import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsCrypto {
  private readonly logger = new Logger(SecretsCrypto.name);

  constructor(private readonly config: ConfigService) {}

  private key(): Buffer {
    const raw =
      this.config.get<string>('SECRETS_ENCRYPTION_KEY') ||
      this.config.get<string>('QR_SIGNING_SECRET') ||
      'movvo-dev-secrets-key-change-me';
    return createHash('sha256').update(raw).digest();
  }

  encrypt(plain: string): { ciphertext: string; iv: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      ciphertext: Buffer.concat([enc, tag]).toString('base64'),
      iv: iv.toString('base64'),
    };
  }

  decrypt(ciphertext: string, iv: string): string {
    const buf = Buffer.from(ciphertext, 'base64');
    const data = buf.subarray(0, buf.length - 16);
    const tag = buf.subarray(buf.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  warnIfDefaultKey() {
    if (!this.config.get<string>('SECRETS_ENCRYPTION_KEY')) {
      this.logger.warn('SECRETS_ENCRYPTION_KEY not set; using fallback key');
    }
  }
}
