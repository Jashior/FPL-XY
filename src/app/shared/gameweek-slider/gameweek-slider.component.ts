import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/services/players.service';

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

  constructor(private playersService: PlayersService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.playersService.getGameweekRange().subscribe((gwrange) => {
        this.gameweekRangeValue = [gwrange[0], gwrange[1]];
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
}
