import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/services/players.service';
import { GraphService } from '../../services/graph.service';

@Component({
  selector: 'app-gameweek-slider',
  templateUrl: './gameweek-slider.component.html',
  styleUrls: ['./gameweek-slider.component.css'],
})
export class GameweekSliderComponent implements OnInit, OnDestroy {
  minGameweek?: number = 1;
  maxGameweek?: number = 38;
  gameweekRangeValue?: number[];
  marks = {};
  subscriptions: Subscription[] = [];
  playingThroughWeeks: boolean = false;
  playthroughMode: boolean = false;
  endOfPlaythroughWeek: number = 38;
  startOfPlaythroughWeek: number = 1;

  constructor(
    private playersService: PlayersService,
    private graphService: GraphService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.playersService.getGameweekRange().subscribe((gwrange) => {
        this.gameweekRangeValue = [gwrange[0], gwrange[1]];
      })
    );

    this.subscriptions.push(
      this.graphService.getPlaythroughMode().subscribe((mode) => {
        this.playthroughMode = mode;
      })
    );

    innerWidth = window.innerWidth;
    if (innerWidth > 600) {
      this.marks = {
        1: '1',
        38: '38',
      };
    }
  }

  onAfterChange(value: number[] | number): void {
    if (typeof value == 'number') return;
    this.playersService.setGwRange([value[0], value[1]]);
    this.playersService.setMinMinutes(0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  togglePlayWeeks() {
    if (this.playthroughMode) {
      this.stopWeeks();
    } else {
      this.playWeeks();
    }
  }

  playWeeks() {
    if (this.gameweekRangeValue && this.gameweekRangeValue[1] !== undefined) {
      this.endOfPlaythroughWeek = this.gameweekRangeValue[1];
    } else {
      this.endOfPlaythroughWeek = this.playersService.getCurrentGameweek();
    }

    if (this.gameweekRangeValue && this.gameweekRangeValue[0] !== undefined) {
      this.startOfPlaythroughWeek = this.gameweekRangeValue[0];
    } else {
      this.startOfPlaythroughWeek = 1;
    }

    this.playGameweek(
      this.startOfPlaythroughWeek,
      this.endOfPlaythroughWeek,
      this.startOfPlaythroughWeek
    );
  }

  stopWeeks() {
    this.graphService.setPlaythroughMode(false);
    this.playersService.setGwRange([
      this.startOfPlaythroughWeek,
      this.endOfPlaythroughWeek,
    ]);
  }

  playGameweek(start: number, end: number, current: number) {
    this.graphService.setPlaythroughMode(true);

    if (current <= end) {
      this.playersService.setGwRange([start, current]);
      this.playersService.setMinMinutes(0);
      setTimeout(() => {
        if (this.playthroughMode) {
          this.playGameweek(start, end, current + 1);
        }
      }, 900);
    } else {
      this.graphService.setPlaythroughMode(false);
    }
  }
}
