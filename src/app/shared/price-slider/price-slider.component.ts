import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Filter } from 'src/app/models/Filter';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-price-slider',
  templateUrl: './price-slider.component.html',
  styleUrls: ['./price-slider.component.css'],
})
export class PriceSliderComponent implements OnInit {
  priceRangeValue?: number[];
  marks = {};
  innerWidth: any;

  constructor(private playersService: PlayersService) {
    this.playersService.getFilter().subscribe((filter) => {
      let min = filter.min_price;
      let max = filter.max_price;
      this.priceRangeValue = [min, max];
    });
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 1300) {
      this.marks = {
        5: `5m`,
        7.5: `7.5m`,
        10: `10m`,
        12.5: `12.5m`,
        15: `15m`,
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
}
