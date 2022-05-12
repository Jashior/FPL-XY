import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from 'src/app/models/Player';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-min-minutes',
  templateUrl: './min-minutes.component.html',
  styleUrls: ['./min-minutes.component.css'],
})
export class MinMinutesComponent implements OnInit {
  minMinutesValue: number = 0;
  minutesMaxPossible!: number;

  constructor(private playersService: PlayersService) {
    this.playersService.getFilter().subscribe((filter) => {
      this.minMinutesValue = filter.min_minutes;
    });
  }
  ngOnInit(): void {}

  onChange(value: number): void {
    // console.log(`value: ${value}`);
    this.playersService.setMinMinutes(value);
  }
}
