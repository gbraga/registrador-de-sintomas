import { Injectable } from '@angular/core';
import { IdGenerator } from '../../domain/ports/id-generator';

@Injectable()
export class CryptoIdGenerator extends IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
