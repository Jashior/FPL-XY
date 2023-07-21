import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private xAxis$ = new BehaviorSubject<string>('price');
  private yAxis$ = new BehaviorSubject<string>('points_t');

  public setXAxis(axis: string) {
    return this.xAxis$.next(axis);
  }

  public setYAxis(axis: string) {
    return this.yAxis$.next(axis);
  }

  public getXAxis(): BehaviorSubject<string> {
    return this.xAxis$;
  }

  public getYAxis(): BehaviorSubject<string> {
    return this.yAxis$;
  }
}
