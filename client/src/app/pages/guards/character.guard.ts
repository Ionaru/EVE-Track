import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Globals } from '../../shared/globals';
import { Observable } from 'rxjs';

@Injectable()
export class CharacterGuard implements Resolve<boolean> {
  constructor(private globals: Globals) {}

  resolve(): Observable<boolean> {
    if (this.globals.user) {
      return Observable.of(true);
    } else {
      return this.globals.startUpObservable;
    }
  }
}