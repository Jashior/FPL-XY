import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Player } from '../models/Player';
import { HttpClient } from '@angular/common/http';
import { Filter } from '../models/Filter';
import { Positions } from '../models/Positions';
import { ActivatedRoute } from '@angular/router';
import { GraphService } from './graph.service';

export interface Meta {
  current_year_string: string;
  possible_year_strings: string[];
}

export interface About {
  current_gameweek: number;
  max_gameweek: number;
  teams: string[];
}

export const MINIMUM_FILTER_VALUES: Omit<
  Filter,
  'teams' | 'positions' | 'excluded_players'
> = {
  min_minutes: 0,
  min_tsb: 0,
  max_tsb: 0,
  min_price: 3,
  max_price: 3,
};

export const MAXIMUM_FILTER_VALUES: Omit<
  Filter,
  'teams' | 'positions' | 'excluded_players'
> = {
  min_minutes: 3420,
  min_tsb: 100,
  max_tsb: 100,
  min_price: 15,
  max_price: 15,
};

export const DEFAULT_FILTER: Filter = {
  min_minutes: 0,
  min_tsb: 0,
  max_tsb: 100,
  min_price: 3,
  max_price: 15,
  teams: [],
  positions: Positions,
  excluded_players: [],
};

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
  private teams: string[] = [];
  private players$ = new BehaviorSubject<Player[]>([]);
  private gwRange$ = new BehaviorSubject<number[]>([-1, -1]);
  public maxMinsGWRange$ = new BehaviorSubject<number>(0);
  public filter$ = new BehaviorSubject<Filter>(this.getDefaultFilter());
  public highlightedPlayers$ = new BehaviorSubject<number[]>([]);
  public paramsSet = false;

  // Loading states
  private _loading$ = new BehaviorSubject<boolean>(true);
  private loading$ = this._loading$;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private graphService: GraphService
  ) {
    this.initData();
  }

  initData() {
    this.setLoading(true);
    this.http.get<Meta[]>(`${this.API_URL}/getMeta/`).subscribe((resp) => {
      if (resp.length === 0) {
        console.log('No meta data found');
        return;
      }
      this.currentYearString = resp[0].current_year_string;
      this.possibleYearStrings$.next(resp[0].possible_year_strings);
      this.loadYearFromParams();
      this.initDataForCurrentYear();
    });
  }

  initDataForCurrentYear() {
    this.setLoading(true);
    this.resetHighlightedPlayers();
    this.loadInfoForCurrentYear();
  }

  public getDefaultFilter(): Filter {
    return { ...DEFAULT_FILTER, teams: this.teams };
  }

  public setLoading(loadingState: boolean): void {
    this.loading$.next(loadingState);
  }

  public setYearString(yearString: string): void {
    this.currentYearString = yearString;
  }

  public loadYearFromParams(): void {
    this.route.queryParams.subscribe((params) => {
      const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
          return value.trim();
        } else if (!isNaN(value)) {
          return parseFloat(value);
        }
        return value;
      };

      if (params['year']) {
        const sanitizedValue = sanitizeValue(params['year']);
        this.setYearString(sanitizedValue);
      }
    });
  }

  public loadParams(): void {
    if (this.paramsSet) {
      return;
    }

    this.route.queryParams.subscribe((params) => {
      const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
          return value.trim();
        } else if (!isNaN(value)) {
          return parseFloat(value);
        }
        return value;
      };

      const setValue = (
        paramName: string,
        serviceFunction: (value: any) => void
      ) => {
        if (params[paramName]) {
          const sanitizedValue = sanitizeValue(params[paramName]);
          serviceFunction(sanitizedValue);
        }
      };

      setValue('price_min', (value) => this.setMinPrice(value));
      setValue('price_max', (value) => this.setMaxPrice(value));
      setValue('ownership_min', (value) => this.setMinTsb(value));
      setValue('ownership_max', (value) => this.setMaxTsb(value));
      setValue('positions', (value) => this.setPositions(value.split(',')));
      setValue('teams', (value) => this.setTeams(value.split(',')));
      setValue('mins', (value) => this.setMinMinutes(Number(value)));
      setValue('gameweek_range', (value) => this.setGwRange(value.split(',')));
      setValue('highlight_players', (value) =>
        this.setHighlightedPlayers(value.split(',').map(Number))
      );
      setValue('exclude_players', (value) =>
        this.setExcluded(value.split(',').map(Number))
      );
      setValue('x_axis', (value) => this.graphService.setXAxis(value));
      setValue('y_axis', (value) => this.graphService.setYAxis(value));
      this.paramsSet = true;
    });
  }

  public loadInfoForCurrentYear(): void {
    this.http
      .get<About[]>(`${this.API_URL}/getAbout/${this.currentYearString}`)
      .subscribe((about) => {
        // console.log(about);
        if (about[0]) {
          this.teams = about[0].teams;
          this.currentGameweek = about[0].current_gameweek;
          this.gwRange$.next([1, this.currentGameweek]);
          this.loadFilter();
          this.loadParams();
          this.loadPlayers();
        }
      });
  }

  public loadFilter(): void {
    this.filter$.next(this.getDefaultFilter());
  }

  public resetFilter(): void {
    this.filter$.next(this.getDefaultFilter());
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

  public getMaxMinsGwRange(): Observable<number> {
    return this.maxMinsGWRange$;
  }

  public getYearString(): string {
    return this.currentYearString;
  }

  public getLoadingState(): Observable<boolean> {
    return this.loading$;
  }

  public getTeams(): string[] {
    return this.teams;
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
    for (let i = 0; i < gwrange.length; i++) {
      if (gwrange[i] < 1) {
        gwrange[i] = 1;
      }
      if (gwrange[i] > this.maxGameweek) {
        gwrange[i] = this.maxGameweek;
      }
    }
    this.gwRange$.next(gwrange);
  }

  public resetGwRange(): void {
    this.gwRange$.next([1, this.currentGameweek]);
  }

  public setMaxMinsGwRange(mins: number): void {
    this.maxMinsGWRange$.next(mins);
    if (mins < this.filter$.getValue().min_minutes) {
      this.setMinMinutes(mins);
    }
  }

  public setMinPrice(val: number) {
    if (val < MINIMUM_FILTER_VALUES.min_price) {
      val = MINIMUM_FILTER_VALUES.min_price;
    }
    if (val > MAXIMUM_FILTER_VALUES.min_price) {
      val = MAXIMUM_FILTER_VALUES.min_price;
    }
    this.filter$.next({ ...this.filter$.getValue(), min_price: val });
  }

  public setMaxPrice(val: number) {
    if (val < MINIMUM_FILTER_VALUES.max_price) {
      val = MINIMUM_FILTER_VALUES.max_price;
    }
    if (val > MAXIMUM_FILTER_VALUES.max_price) {
      val = MAXIMUM_FILTER_VALUES.max_price;
    }
    this.filter$.next({ ...this.filter$.getValue(), max_price: val });
  }

  public setMinTsb(val: number) {
    if (val < MINIMUM_FILTER_VALUES.min_tsb) {
      val = MINIMUM_FILTER_VALUES.min_tsb;
    }
    if (val > MAXIMUM_FILTER_VALUES.min_tsb) {
      val = MAXIMUM_FILTER_VALUES.min_tsb;
    }
    this.filter$.next({ ...this.filter$.getValue(), min_tsb: val });
  }

  public setMaxTsb(val: number) {
    if (val < MINIMUM_FILTER_VALUES.max_tsb) {
      val = MINIMUM_FILTER_VALUES.max_tsb;
    }
    if (val > MAXIMUM_FILTER_VALUES.max_tsb) {
      val = MAXIMUM_FILTER_VALUES.max_tsb;
    }
    this.filter$.next({ ...this.filter$.getValue(), max_tsb: val });
  }

  public setMinMinutes(val: number) {
    if (val < MINIMUM_FILTER_VALUES.min_minutes) {
      val = MINIMUM_FILTER_VALUES.min_minutes;
    }
    if (val > MAXIMUM_FILTER_VALUES.min_minutes) {
      val = MAXIMUM_FILTER_VALUES.min_minutes;
    }
    this.filter$.next({ ...this.filter$.getValue(), min_minutes: val });
  }

  public setPositions(val: string[]) {
    const allPositionsExist = val.every((position) =>
      this.Positions.includes(position)
    );
    if (!allPositionsExist) return;
    this.filter$.next({ ...this.filter$.getValue(), positions: val });
  }

  public setTeams(val: string[]) {
    const allTeamsExist = val.every((team) => this.teams.includes(team));

    if (!allTeamsExist) return;
    this.filter$.next({ ...this.filter$.getValue(), teams: val });
  }

  public setExcluded(val: number[]) {
    this.filter$.next({ ...this.filter$.getValue(), excluded_players: val });
  }

  public setYear(val: string) {
    const possibleYears = this.possibleYearStrings$.getValue();
    if (!possibleYears.includes(val)) {
      return;
    }
    this.currentYearString = val;
    this.initDataForCurrentYear();
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

  public isDefaultYear(): boolean {
    return this.currentYearString == this.possibleYearStrings$.getValue()[1];
  }
}
