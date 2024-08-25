import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-price-slider',
  templateUrl: './price-slider.component.html',
  styleUrls: ['./price-slider.component.css'],
})
export class PriceSliderComponent implements OnInit, OnDestroy {
  priceRangeValue?: number[];
  marks = {};
  innerWidth: any;
  subscriptions: Subscription[] = [];

  constructor(private playersService: PlayersService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.playersService.getFilter().subscribe((filter) => {
        let min = filter.min_price;
        let max = filter.max_price;
        this.priceRangeValue = [min, max];
      })
    );

    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 1300) {
      this.marks = {
        4: `4m`,
        6: `6m`,
        8: `8m`,
        10: `10m`,
        16: `16m`,
      };
    }
  }

  onAfterChange(value: number[] | number): void {
    if (typeof value == 'number') return;
    this.playersService.setMinPrice(value[0]);
    this.playersService.setMaxPrice(value[1]);
  }

  priceRangeFormatter(value: number): string {
    return `£${value}m`;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
