import { Component, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-tsb-slider',
  templateUrl: './tsb-slider.component.html',
  styleUrls: ['./tsb-slider.component.css'],
})
export class TsbSliderComponent implements OnInit {
  tsbRangeValue?: number[];
  marks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%',
  };

  constructor(private playersService: PlayersService) {
    this.playersService.getFilter().subscribe((filter) => {
      this.tsbRangeValue = [filter.min_tsb, filter.max_tsb];
    });
  }

  ngOnInit(): void {}

  onAfterChange(value: number[] | number): void {
    if (typeof value == 'number') return;
    // console.log(`tsb slider ting`);
    this.playersService.setMinTsb(value[0]);
    this.playersService.setMaxTsb(value[1]);
  }

  tsbRangeFormatter(value: number): string {
    return `${value}%`;
  }
}
