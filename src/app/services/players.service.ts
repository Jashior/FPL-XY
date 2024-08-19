import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Player } from '../models/Player';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Filter } from '../models/Filter';
import { Positions } from '../models/Positions';
import { ActivatedRoute } from '@angular/router';
import { GraphService } from './graph.service';
import { first, tap } from 'rxjs/operators';
import * as pako from 'pako';

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
  private currentYearString: string = '2024-25';
  private maxGameweek: number = 38;
  private currentGameweek: number = 1;
  private possibleYearStrings$ = new BehaviorSubject<string[]>([
    '2024-25',
    '2023-24',
    '2022-23',
    '2021-22',
  ]);
  private teams: string[] = [];
  private players$ = new BehaviorSubject<Player[]>([]);
  private gwRange$ = new BehaviorSubject<number[]>([-1, -1]);
  public maxMinsGWRange$ = new BehaviorSubject<number>(0);
  public filter$ = new BehaviorSubject<Filter>(this.getDefaultFilter());
  public highlightedPlayers$ = new BehaviorSubject<number[]>([]);
  public paramsSet = false;
  public areWeMaximumYear: boolean = true;

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

    const cacheKey = 'meta-data';
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const expiryTimestamp = parsedData?.expiry;

      if (expiryTimestamp && expiryTimestamp > Date.now()) {
        // Data is not expired, use it
        this.processMetaData(parsedData.data);
        return;
      } else {
        // Data has expired, clear it
        localStorage.removeItem(cacheKey);
      }
    }
    this.http.get<Meta[]>(`${this.API_URL}/getMeta/`).subscribe((resp) => {
      if (resp.length === 0) {
        console.log('No meta data found');
        return;
      }

      this.processMetaData(resp[0]);

      // Cache the meta data with expiry timestamp
      const expiryTimestamp = Date.now() + this.getCacheMaxAge() * 1000; // Convert seconds to milliseconds
      const cachedDataWithExpiry = {
        data: resp[0],
        expiry: expiryTimestamp,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedDataWithExpiry));
    });
  }

  private processMetaData(meta: Meta): void {
    this.currentYearString = meta.current_year_string;
    this.possibleYearStrings$.next(meta.possible_year_strings);
    this.loadYearFromParams();
    this.initDataForCurrentYear();
    this.setAreWeMaximumYear(meta.possible_year_strings, this.currentYearString);
  }

  setAreWeMaximumYear(yearStrings: string[], currentYearString: string){
    this.areWeMaximumYear = currentYearString == yearStrings[yearStrings.length - 1];
  }

  getAreWeMaximumYear(): boolean{
    return this.areWeMaximumYear
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
    const cacheKey = `about-${this.currentYearString}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const expiryTimestamp = parsedData?.expiry;

      if (expiryTimestamp && expiryTimestamp > Date.now()) {
        // Data is not expired, use it
        this.processAboutData(parsedData.data);
        return;
      } else {
        // Data has expired, clear it
        localStorage.removeItem(cacheKey);
      }
    }

    this.http
      .get<About[]>(`${this.API_URL}/getAbout/${this.currentYearString}`)
      .pipe(
        first(),
        tap((about) => {
          if (about[0]) {
            this.processAboutData(about[0]);
          }
        })
      )
      .subscribe();
  }

  private processAboutData(about: About): void {
    this.teams = about.teams;
    this.currentGameweek = about.current_gameweek;
    this.gwRange$.next([1, this.currentGameweek]);
    this.loadFilter();
    this.loadParams();
    this.loadPlayers();

    // Cache the about data with expiry timestamp
    const cacheKey = `about-${this.currentYearString}`;
    const expiryTimestamp = Date.now() + this.getCacheMaxAge() * 1000; // Convert seconds to milliseconds
    const cachedDataWithExpiry = {
      data: about,
      expiry: expiryTimestamp,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cachedDataWithExpiry));
  }

  public loadFilter(): void {
    this.filter$.next(this.getDefaultFilter());
  }

  public resetFilter(): void {
    this.filter$.next(this.getDefaultFilter());
  }

  public loadPlayers(): void {
    const cacheKey = `players-${this.currentYearString}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const decompressedData = this.decompressData(cachedData);
      const parsedData = JSON.parse(decompressedData);
      const expiryTimestamp = parsedData?.expiry;

      if (expiryTimestamp && expiryTimestamp > Date.now()) {
        // Data is not expired, use it
        console.log(
          `Player Data not expired, using it. Now: ${Date.now()}, Expires: ${expiryTimestamp}`
        );
        this.players$.next(parsedData.data);
        this.setLoading(false);
        return;
      } else {
        // Data has expired, clear it
        console.log(
          `Player data expired, deleting it. Now: ${Date.now()}, Expires: ${expiryTimestamp}`
        );
        localStorage.removeItem(cacheKey);
      }
    }

    this.http
      .get<Player[]>(`${this.API_URL}/getPlayers/${this.currentYearString}`, {
        observe: 'response',
        responseType: 'json',
        headers: {
          'Cache-Control': `max-age=${this.getCacheMaxAge()}`,
        },
      })
      .pipe(
        tap((response: HttpResponse<Player[]>) => {
          // Cache the response data with expiry timestamp
          const expiryTimestamp = Date.now() + this.getCacheMaxAge() * 1000; // Convert seconds to milliseconds
          // const expiryTimestamp = Date.now() + 10 * 1000; // Convert seconds to milliseconds
          const compressedData = this.compressData({
            data: response.body,
            expiry: expiryTimestamp,
          });
          console.log(`New player data set with expiry: ${expiryTimestamp}`);
          localStorage.setItem(cacheKey, compressedData);
        })
      )
      .subscribe(
        (response) => {
          this.players$.next(response.body!);
          this.setLoading(false);
        },
        (error) => {
          // Handle error
          console.error(error);
          this.setLoading(false);
        }
      );
  }

  compressData(data: any): string {
    const json = JSON.stringify(data);
    const compressed = pako.deflate(json);

    // Convert compressed data to a Uint8Array
    const uint8Compressed = new Uint8Array(compressed);

    // Convert Uint8Array to base64
    const base64 = this.arrayBufferToBase64(uint8Compressed.buffer);
    return base64;
  }

  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  decompressData(data: string): any {
    const binaryString = atob(data);
    const binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i);
    }
    const decompressed = pako.inflate(binaryData, { to: 'string' });
    return decompressed;
  }

  getCacheMaxAge() {
    // Get current date in UTC
    const currentDateUTC = new Date();

    // Get current date in London time (GMT/UTC+0)
    const londonOffset = 0; // London is in GMT/UTC+0
    const currentDateLondon = new Date(
      currentDateUTC.getTime() + londonOffset * 60 * 1000
    );

    // Calculate time until midnight in London time
    const midnightLondon = new Date(
      currentDateLondon.getFullYear(),
      currentDateLondon.getMonth(),
      currentDateLondon.getDate() + 1,
      0,
      0,
      0,
      0
    );
    const msUntilMidnightLondon =
      midnightLondon.getTime() - currentDateLondon.getTime();

    // Convert milliseconds to seconds for cache max-age
    return Math.floor(msUntilMidnightLondon / 1000);
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
    this.setAreWeMaximumYear(possibleYears, this.currentYearString);
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
