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
      let endOfPlaythroughWeek = this.gameweekRangeValue[1];
      this.playGameweek(1, endOfPlaythroughWeek);
    } else {
      this.playGameweek(1, this.playersService.getCurrentGameweek());
    }
  }

  stopWeeks() {
    this.graphService.setPlaythroughMode(false);
  }

  playGameweek(current: number, end: number) {
    this.graphService.setPlaythroughMode(true);

    if (current <= end) {
      this.playersService.setGwRange([0, current]);
      this.playersService.setMinMinutes(0);
      setTimeout(() => {
        if (this.playthroughMode) {
          this.playGameweek(current + 1, end);
        }
      }, 900);
    } else {
      this.graphService.setPlaythroughMode(false);
    }
  }
}
