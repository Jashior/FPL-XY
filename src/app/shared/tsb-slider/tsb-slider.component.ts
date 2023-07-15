import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-tsb-slider',
  templateUrl: './tsb-slider.component.html',
  styleUrls: ['./tsb-slider.component.css'],
})
export class TsbSliderComponent implements OnInit, OnDestroy {
  tsbRangeValue?: number[];
  marks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%',
  };
  subscriptions: Subscription[] = [];

  constructor(private playersService: PlayersService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.playersService.getFilter().subscribe((filter) => {
        this.tsbRangeValue = [filter.min_tsb, filter.max_tsb];
      })
    );
  }

  onAfterChange(value: number[] | number): void {
    if (typeof value == 'number') return;
    this.playersService.setMinTsb(value[0]);
    this.playersService.setMaxTsb(value[1]);
  }

  tsbRangeFormatter(value: number): string {
    return `${value}%`;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
