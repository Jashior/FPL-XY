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
  maxMinutesPossible!: number;
  loaded: boolean = false;

  constructor(private playersService: PlayersService) {
    this.playersService.getFilter().subscribe((filter) => {
      this.minMinutesValue = filter.min_minutes;
      this.maxMinutesPossible = this.playersService.getCurrentGameweek() * 90;
      this.loaded = true;
    });
  }

  ngOnInit(): void {}

  onChange(): void {
    if (!this.loaded) {
      return;
    }
    this.playersService.setMinMinutes(this.minMinutesValue);
  }
}
