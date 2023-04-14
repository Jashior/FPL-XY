import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Player } from '../models/Player';
import { HttpClient } from '@angular/common/http';
import { Filter } from '../models/Filter';
import { Positions } from '../models/Positions';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface Meta {
  current_year_string: string;
  possible_year_strings: string[];
}

export interface About {
  current_gameweek: number;
  max_gameweek: number;
  teams: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PlayersService {
  Positions = Positions;
  private API_URL = environment.BASE_API_URL;
  private currentYearString: string = '2022-23';
  private maxGameweek: number = 38;
  private currentGameweek: number = 1;
  private possibleYearStrings$ = new BehaviorSubject<string[]>([
    '2021-22',
    '2022-23',
  ]);
  private teams$ = new BehaviorSubject<string[]>([]);
  private players$ = new BehaviorSubject<Player[]>([]);
  private gwRange$ = new BehaviorSubject<number[]>([-1, -1]);
  public filter$ = new BehaviorSubject<Filter>({
    min_minutes: 50,
    min_tsb: 0,
    max_tsb: 100,
    min_price: 3,
    max_price: 15,
    teams: [],
    positions: this.Positions,
  });
  public highlightedPlayers$ = new BehaviorSubject<number[]>([]);

  // Loading states
  private _loading$ = new BehaviorSubject<boolean>(false);
  private loading$ = this._loading$;

  constructor(private http: HttpClient) {
    this.initData();
    this.loading$.subscribe((x) => console.log(`Loading: ${x}`));
  }

  initData() {
    this.setLoading(true);
    this.http.get<Meta[]>(`${this.API_URL}/getMeta/`).subscribe((resp) => {
      if (this.currentYearString == '') {
        this.currentYearString == resp[0].current_year_string;
      }
      console.log(this.currentYearString);
      this.possibleYearStrings$.next(resp[0].possible_year_strings);
      // console.log(`${this.currentYearString}`);
      // console.log(`[${this.possibleYearStrings$}]`);
      this.resetHighlightedPlayers();
      this.loadInfoForCurrentYear();
      this.loadPlayers();
      this.loadFilter();
    });
  }

  public setLoading(loadingState: boolean): void {
    this.loading$.next(loadingState);
  }

  public setYearString(yearString: string): void {
    this.currentYearString = yearString;
  }

  public loadInfoForCurrentYear(): void {
    this.http
      .get<About[]>(`${this.API_URL}/getAbout/${this.currentYearString}`)
      .subscribe((about) => {
        // console.log(about);
        if (about[0]) {
          this.teams$.next(about[0].teams);
          this.currentGameweek = about[0].current_gameweek;
          this.gwRange$.next([1, this.currentGameweek]);
          this.loadFilter();
        }
      });
  }

  public loadFilter(): void {
    this.getTeams().subscribe((teams) => {
      this.filter$.next({
        min_minutes: Math.max(
          45,
          Math.floor((this.currentGameweek * 90) / 2 / 50) * 50
        ),
        min_tsb: 0,
        max_tsb: 100,
        min_price: 3,
        max_price: 15,
        teams: teams,
        positions: this.Positions,
      });
    });
  }

  public loadPlayers(): void {
    this.http
      .get<Player[]>(`${this.API_URL}/getPlayers/${this.currentYearString}`)
      .subscribe((players) => {
        // console.log(players);
        this.players$.next(players);
        this.setLoading(false);
      });
  }

  public getPlayers(): Observable<Player[]> {
    return this.players$;
  }

  public getGameweekRange(): Observable<number[]> {
    return this.gwRange$;
  }

  public getYearString(): string {
    return this.currentYearString;
  }

  public getLoadingState(): Observable<boolean> {
    return this.loading$;
  }

  public getTeams(): Observable<string[]> {
    return this.teams$;
  }

  public getFilter(): Observable<Filter> {
    return this.filter$;
  }

  public getHighlightedPlayers(): Observable<number[]> {
    return this.highlightedPlayers$;
  }

  public getPositions(): string[] {
    return this.Positions;
  }

  public getPossibleYearStrings(): Observable<string[]> {
    return this.possibleYearStrings$;
  }

  public setGwRange(gwrange: number[]): void {
    this.gwRange$.next(gwrange);
  }

  public setMinPrice(val: number) {
    this.filter$.next({ ...this.filter$.getValue(), min_price: val });
  }

  public setMaxPrice(val: number) {
    this.filter$.next({ ...this.filter$.getValue(), max_price: val });
  }

  public setMinTsb(val: number) {
    this.filter$.next({ ...this.filter$.getValue(), min_tsb: val });
  }

  public setMaxTsb(val: number) {
    this.filter$.next({ ...this.filter$.getValue(), max_tsb: val });
  }

  public setMinMinutes(val: number) {
    this.filter$.next({ ...this.filter$.getValue(), min_minutes: val });
  }

  public setPositions(val: string[]) {
    this.filter$.next({ ...this.filter$.getValue(), positions: val });
  }

  public setTeams(val: string[]) {
    this.filter$.next({ ...this.filter$.getValue(), teams: val });
  }

  public setYear(val: string) {
    this.currentYearString = val;
    this.initData();
  }

  public addHighlightedPlayer(id: number) {
    // console.log(`adding ${id}`);
    let newHighlightedPlayers = [
      ...new Set([...this.highlightedPlayers$.getValue(), id]),
    ];
    // console.log(`new ${newHighlightedPlayers}`);

    this.highlightedPlayers$.next(newHighlightedPlayers);
  }

  public removeHighlightedPlayer(id: number) {
    // console.log(`removing ${id}`);
    let newHighlightedPlayers = this.highlightedPlayers$
      .getValue()
      .filter((e) => e !== id);
    // console.log(`new ${newHighlightedPlayers}`);
    this.highlightedPlayers$.next(newHighlightedPlayers);
  }

  public toggleHighlightedPlayer(id: number) {
    if (this.highlightedPlayers$.getValue().indexOf(id) >= 0) {
      this.removeHighlightedPlayer(id);
    } else {
      this.addHighlightedPlayer(id);
    }
  }

  public resetHighlightedPlayers() {
    this.highlightedPlayers$.next([]);
  }

  public setHighlightedPlayers(ids: number[]) {
    this.highlightedPlayers$.next(ids);
  }

  public getCurrentGameweek(): number {
    return this.currentGameweek;
  }
}
