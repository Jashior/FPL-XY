import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, timer } from 'rxjs';
import { map, debounceTime, shareReplay } from 'rxjs/operators';
import { Filter } from '../models/Filter';
import { Player } from '../models/Player';
import { PlayersService } from '../services/players.service';

@Component({
  selector: 'app-visual',
  templateUrl: './visual.component.html',
  styleUrls: ['./visual.component.css'],
})
export class VisualComponent implements OnInit {
  players$?: Observable<Player[]>;
  gwrange$?: Observable<number[]>;
  playersGW$?: Observable<Player[]>;
  playersF$?: Observable<Player[]>;
  teams$?: Observable<string[]>;
  filter$?: Observable<Filter>;
  highlightedPlayers$?: Observable<number[]>;
  loadingRaw$?: Observable<boolean>; // loading data

  constructor(private playersService: PlayersService) {}

  calcPlayerStatsInGW(p: Player, gwrange: number[]): Player {
    let st = gwrange[0];
    let end = gwrange[1];
    let minutes = p.minutes.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.minutes_t = minutes;

    p.assists_t = p.assists.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.assists_90 = 90 * (p.assists_t / minutes) || 0;

    p.bonus_t = p.bonus.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.bonus_90 = 90 * (p.bonus_t / minutes) || 0;

    p.bps_t = p.bps.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.bps_90 = 90 * (p.bps_t / minutes) || 0;

    p.goals_t = p.goals.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.goals_90 = 90 * (p.goals_t / minutes) || 0;

    p.goals_assists_t = p.goals_assists
      .slice(st, end + 1)
      .reduce((ac, e) => ac + e);
    p.goals_assists_90 = 90 * (p.goals_assists_t / minutes) || 0;

    p.points_t = p.points.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.points_90 = 90 * (p.points_t / minutes) || 0;

    p.points_t = p.points.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.points_90 = 90 * (p.points_t / minutes) || 0;

    p.red_cards_t = p.red_cards.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.red_cards_90 = 90 * (p.red_cards_t / minutes) || 0;

    p.yellow_cards_t = p.yellow_cards
      .slice(st, end + 1)
      .reduce((ac, e) => ac + e);
    p.yellow_cards_90 = 90 * (p.yellow_cards_t / minutes) || 0;

    p.key_passes_t = p.key_passes.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.key_passes_90 = 90 * (p.key_passes_t / minutes) || 0;

    p.npg_t = p.npg.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.npg_90 = 90 * (p.npg_t / minutes) || 0;

    p.npxG_t = p.npxG.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.npxG_90 = 90 * (p.npxG_t / minutes) || 0;

    p.npxGxA_t = p.npxGxA.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.npxGxA_90 = 90 * (p.npxGxA_t / minutes) || 0;

    p.shots_t = p.shots.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.shots_90 = 90 * (p.shots_t / minutes) || 0;

    p.xG_t = p.xG.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.xG_90 = 90 * (p.xG_t / minutes) || 0;

    p.xA_t = p.xA.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.xA_90 = 90 * (p.xA_t / minutes) || 0;

    p.xGChain_t = p.xGChain.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.xGChain_90 = 90 * (p.xGChain_t / minutes) || 0;

    p.xGBuildup_t = p.xGBuildup.slice(st, end + 1).reduce((ac, e) => ac + e);
    p.xGBuildup_90 = 90 * (p.xGBuildup_t / minutes) || 0;

    // p.npg_difference_t = p.npg_difference
    // .slice(st, end + 1)
    // .reduce((ac, e) => ac + e);
    p.npg_difference_t = p.npg_t - p.npxG_t;

    // Didn't introduce attacking return until 22-23 season
    if (p.npxAttRet) {
      p.npxAttRet_t = p.npxAttRet.slice(st, end + 1).reduce((ac, e) => ac + e);
      p.npxAttRet_90 = 90 * (p.npxAttRet_t / minutes) || 0;
    }

    return p;
  }

  ngOnInit(): void {
    this.players$ = this.playersService.getPlayers();
    this.gwrange$ = this.playersService.getGameweekRange();
    this.teams$ = this.playersService.getTeams();
    this.filter$ = this.playersService.getFilter();
    this.highlightedPlayers$ = this.playersService.getHighlightedPlayers();
    this.loadingRaw$ = this.playersService.getLoadingState();

    this.playersGW$ = combineLatest([this.players$, this.gwrange$])
      // .pipe(debounceTime(200))
      .pipe(
        map(([players, gwrange]) => {
          this.playersService.setLoading(true);
          if (players.length == 0) return [];
          if (gwrange[0] == -1 || gwrange[1] == -1) return players;
          // console.log(
          //   `Running calcs for ${players.length} players xG_90 etc. within range ${gwrange}`
          // );
          let playersGW: Player[] = players.map((p) => {
            return this.calcPlayerStatsInGW(p, gwrange);
          });
          // console.log(`Finished calcing`);
          this.playersService.setLoading(false);
          return playersGW;
        })
      )
      .pipe(shareReplay(1));

    this.playersF$ = combineLatest([
      this.playersGW$,
      this.filter$,
      this.highlightedPlayers$,
    ])
      .pipe(debounceTime(400))
      .pipe(
        map(([players, filter, highlights]) => {
          if (players.length == 0) return players;
          if (filter.teams.length == 0) return [];
          // console.log(`Filtering players based off filter`);
          let playersF: Player[] = players
            .map((p) => {
              if (highlights.length == 0) {
                p.highlight = 1;
              } else {
                p.highlight = highlights.indexOf(p.fpl_id) >= 0 ? 2 : 0;
              }
              return p;
            })
            .filter((p) => {
              return (
                p.price >= filter.min_price &&
                p.price <= filter.max_price &&
                p.tsb <= filter.max_tsb &&
                p.tsb >= filter.min_tsb &&
                p.minutes_t >= filter.min_minutes &&
                filter.teams.indexOf(p.team) >= 0 &&
                filter.positions.indexOf(p.position) >= 0
              );
            });
          // console.log(`Finished filtering, Found ${playersF.length} players`);

          return playersF;
        })
      )
      .pipe(shareReplay(1));
  }
}
