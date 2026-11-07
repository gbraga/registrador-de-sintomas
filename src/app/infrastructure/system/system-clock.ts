import { Injectable } from '@angular/core';
import { Clock } from '../../domain/ports/clock';

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
