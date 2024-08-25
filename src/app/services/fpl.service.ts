import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FplGameWeekPicks } from '../models/FplGameWeekPicks';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FplService {
  constructor(private http: HttpClient) { }

  getGameWeekPicks(fplTeamId: string, gameWeek: number): Observable<FplGameWeekPicks> {
    const url = `${environment.BASE_API_URL}/getFplPicks/${fplTeamId}/${gameWeek}`;
    return this.http.get<FplGameWeekPicks>(url);
  }
}