import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import {
  map,
  debounceTime,
  shareReplay,
  take,
  filter,
  takeUntil,
} from 'rxjs/operators';
import { Filter } from '../models/Filter';
import { Player } from '../models/Player';
import { PlayersService } from '../services/players.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Positions } from '../models/Positions';
import { ActivatedRoute } from '@angular/router';
import { GraphService } from '../services/graph.service';
import { FplService } from '../services/fpl.service';

@Component({
  selector: 'app-visual',
  templateUrl: './visual.component.html',
  styleUrls: ['./visual.component.css'],
  animations: [
    trigger('fadeInSidePanel', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('out => in', animate('400ms ease-in')),
    ]),
    trigger('fadeInGraph', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('out => in', animate('400ms ease-in')),
    ]),
  ],
})
export class VisualComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  players$?: Observable<Player[]>;
  players: any = [];
  gwrange$?: Observable<number[]>;
  playersGW$?: Observable<Player[]>;
  playersF$?: Observable<Player[]>;
  teams: string[] = [];
  filter$?: Observable<Filter>;
  highlightedPlayers$?: Observable<number[]>;
  loadingRaw$?: Observable<boolean>; // loading data
  showSidePanel: boolean = true;
  fadeInSidePanel: boolean = false;
  fadeInGraph: boolean = false;
  fplTeamModalIsVisible = false;
  fplTeamId: string = "";
  areWeMaximumYear: boolean = true;

  constructor(
    private playersService: PlayersService,
    private route: ActivatedRoute,
    private graphService: GraphService,
    private fplService: FplService
  ) {}

  ngOnInit(): void {
    this.loadingRaw$ = this.playersService.getLoadingState();
    this.loadingRaw$.pipe(take(1)).subscribe((loadingRaw) => {
      if (!loadingRaw) {
        this.playersService.initData();
      }
    });
    this.loadingRaw$
      .pipe(
        filter((loadingRaw) => loadingRaw === false), // Changed the filter condition to false
        takeUntil(this.unsubscribe$)
      )
      .subscribe(() => {
        this.fadeInSidePanel = false;
        this.fadeInGraph = false;
        this.areWeMaximumYear = this.playersService.getAreWeMaximumYear();
        // this.parseQueryParams();
        this.load();
        setTimeout(() => {
          this.fadeInSidePanel = true;
          this.fadeInGraph = true;
        }, 500);
      });
  
  }

  load() {
    this.players$ = this.playersService.getPlayers();
    this.gwrange$ = this.playersService.getGameweekRange();
    this.teams = this.playersService.getTeams();
    this.filter$ = this.playersService.getFilter();
    this.highlightedPlayers$ = this.playersService.getHighlightedPlayers();
    this.playersGW$ = combineLatest([this.players$, this.gwrange$])
      .pipe(
        takeUntil(this.unsubscribe$),
        map(([players, gwrange]) => {
          // this.playersService.setLoading(true);
          // console.log(`players.length: ${players.length}`);
          // console.log(`gw range: ${gwrange[0]} -> ${gwrange[1]}`);
          if (players.length == 0) return [];
          if (gwrange[0] == -1 || gwrange[1] == -1) return players;
          // console.log(
          //   `Running calcs for ${players.length} players xG_90 etc. within range ${gwrange}`
          // );
          let playersGW: Player[] = players.map((p) => {
            return this.calcPlayerStatsInGW(p, gwrange);
          });

          let maxMinsPossible = playersGW.reduce(
            (max, player) => (player.minutes_t > max ? player.minutes_t : max),
            0
          );
          this.playersService.setMaxMinsGwRange(maxMinsPossible);

          // console.log(`Finished calcing`);
          // this.playersService.setLoading(false);
          return playersGW;
        })
      )
      .pipe(shareReplay(1));

    this.playersF$ = combineLatest([
      this.playersGW$,
      this.filter$,
      this.highlightedPlayers$,
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        debounceTime(400),
        map(([players, filter, highlights]) => {
          this.players = players;
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
                filter.positions.indexOf(p.position) >= 0 &&
                !filter.excluded_players.includes(p.fpl_id)
              );
            });
          // console.log(`Finished filtering, Found ${playersF.length} players`);

          return playersF;
        })
      )
      .pipe(shareReplay(1));
  }

  calcPlayerStatsInGW(p: Player, gwrange: number[]): Player {
    let st = gwrange[0];
    let end = gwrange[1];

    let minutes = p.minutes.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.minutes_t = minutes;

    p.assists_t = p.assists.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.assists_90 = 90 * (p.assists_t / minutes) || 0;

    p.bonus_t = p.bonus.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.bonus_90 = 90 * (p.bonus_t / minutes) || 0;

    p.bps_t = p.bps.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.bps_90 = 90 * (p.bps_t / minutes) || 0;

    p.goals_t = p.goals.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.goals_90 = 90 * (p.goals_t / minutes) || 0;

    p.goals_assists_t = p.goals_assists
      .slice(st, end + 1)
      .reduce((ac, e) => ac + e, 0);
    p.goals_assists_90 = 90 * (p.goals_assists_t / minutes) || 0;

    p.points_t = p.points.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.points_90 = 90 * (p.points_t / minutes) || 0;

    p.red_cards_t = p.red_cards.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
    p.red_cards_90 = 90 * (p.red_cards_t / minutes) || 0;

    p.yellow_cards_t = p.yellow_cards
      .slice(st, end + 1)
      .reduce((ac, e) => ac + e, 0);
    p.yellow_cards_90 = 90 * (p.yellow_cards_t / minutes) || 0;

    if (p.key_passes) {
      p.key_passes_t = p.key_passes
        .slice(st, end + 1)
        .reduce((ac, e) => ac + e, 0);
      p.key_passes_90 = 90 * (p.key_passes_t / minutes) || 0;
    }

    if (p.npg) {
      p.npg_t = p.npg.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.npg_90 = 90 * (p.npg_t / minutes) || 0;
    }

    if (p.npxG) {
      p.npxG_t = p.npxG.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.npxG_90 = 90 * (p.npxG_t / minutes) || 0;
    }

    if (p.npxGxA) {
      p.npxGxA_t = p.npxGxA.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.npxGxA_90 = 90 * (p.npxGxA_t / minutes) || 0;
    }

    if (p.xGI && p.xGI.length > 0) {
      p.xGI_t = p.xGI.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xGI_90 = 90 * (p.xGI_t / minutes) || 0;
    }
    if (p.xGI_FPL && p.xGI_FPL.length > 0) {
      p.xGI_FPL_t = p.xGI_FPL.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xGI_FPL_90 = 90 * (p.xGI_FPL_t / minutes) || 0;
    }

    if (p.shots) {
      p.shots_t = p.shots.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.shots_90 = 90 * (p.shots_t / minutes) || 0;
    }

    if (p.xG.length > 0) {
      p.xG_t = p.xG.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xG_90 = 90 * (p.xG_t / minutes) || 0;
    }

    if (p.xG_FPL && p.xG_FPL.length > 0) {
      p.xG_FPL_t = p.xG_FPL.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xG_FPL_90 = 90 * (p.xG_FPL_t / minutes) || 0;
    }

    if (p.xA.length > 0) {
      p.xA_t = p.xA.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xA_90 = 90 * (p.xA_t / minutes) || 0;
    }

    if (p.xA_FPL && p.xA_FPL.length > 0) {
      p.xA_FPL_t = p.xA_FPL.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xA_FPL_90 = 90 * (p.xA_FPL_t / minutes) || 0;
    }

    if (p.xGChain && p.xGChain.length > 0) {
      p.xGChain_t = p.xGChain.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xGChain_90 = 90 * (p.xGChain_t / minutes) || 0;
    }

    if (p.xGBuildup && p.xGBuildup.length > 0) {
      p.xGBuildup_t = p.xGBuildup
        .slice(st, end + 1)
        .reduce((ac, e) => ac + e, 0);
      p.xGBuildup_90 = 90 * (p.xGBuildup_t / minutes) || 0;
    }

    // p.npg_difference_t = p.npg_difference
    // .slice(st, end + 1)
    // .reduce((ac, e) => ac + e);
    p.npg_difference_t = p.npg_t - p.npxG_t;

    // Didn't introduce attacking return until 22-23 season
    if (p.npxAttRet && p.npxAttRet.length > 0) {
      p.npxAttRet_t = p.npxAttRet
        .slice(st, end + 1)
        .reduce((ac, e) => ac + e, 0);
      p.npxAttRet_90 = 90 * (p.npxAttRet_t / minutes) || 0;
    }

    if (p.npAttRet && p.npAttRet.length > 0) {
      p.npAttRet_t = p.npAttRet.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.npAttRet_90 = 90 * (p.npAttRet_t / minutes) || 0;
    }

    // Following was mostly introduced from FPL api update 22-23 season

    if (p.GC && p.GC.length > 0) {
      p.GC_t = p.GC.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.GC_90 = 90 * (p.GC_t / minutes) || 0;
    }
    if (p.xGC && p.xGC.length > 0) {
      p.xGC_t = p.xGC.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.xGC_90 = 90 * (p.xGC_t / minutes) || 0;
    }
    if (p.saves && p.saves.length > 0) {
      p.saves_t = p.saves.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.saves_90 = 90 * (p.saves_t / minutes) || 0;
    }
    if (p.pen_saves && p.pen_saves.length > 0) {
      p.pen_saves_t = p.pen_saves
        .slice(st, end + 1)
        .reduce((ac, e) => ac + e, 0);
      p.pen_saves_90 = 90 * (p.pen_saves_t / minutes) || 0;
    }
    if (p.pen_misses && p.pen_misses.length > 0) {
      p.pen_misses_t = p.pen_misses
        .slice(st, end + 1)
        .reduce((ac, e) => ac + e, 0);
      p.pen_misses_90 = 90 * (p.pen_misses_t / minutes) || 0;
    }
    if (p.OG && p.OG.length > 0) {
      p.OG_t = p.OG.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.OG_90 = 90 * (p.OG_t / minutes) || 0;
    }
    if (p.CS && p.CS.length > 0) {
      p.CS_t = p.CS.slice(st, end + 1).reduce((ac, e) => ac + e, 0);
      p.CS_90 = 90 * (p.CS_t / minutes) || 0;
    }

    return p;
  }

  playersCount(): number {
    return this.players.length;
  }

  handleScreenExpandedChanged(screenExpanded: boolean) {
    this.showSidePanel = !screenExpanded;
  }

  
  showHighlightTeamModal(): void {
    this.fplTeamModalIsVisible = true;
  }

  handleOkHighlightTeamModal(): void {
    this.fplService.getGameWeekPicks(this.fplTeamId, this.playersService.getCurrentGameweek()).subscribe((result) => {
      result.picks.forEach(pick => {
        this.playersService.addHighlightedPlayer(pick.element);
      });
    });

    this.fplTeamModalIsVisible = false;
    this.fplTeamId = '';
  }

  handleCancelHighlightTeamModal(): void {
    this.fplTeamModalIsVisible = false;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
