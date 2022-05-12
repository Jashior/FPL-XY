import { Component, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';
import { Positions } from '../../models/Positions';

@Component({
  selector: 'app-position-select',
  templateUrl: './position-select.component.html',
  styleUrls: ['./position-select.component.css'],
})
export class PositionSelectComponent implements OnInit {
  Positions = Positions;
  selectedPositions: string[] = [];

  constructor(private playersService: PlayersService) {}

  ngOnInit(): void {}

  onChange(val: any) {
    if (val.length == 0) {
      this.playersService.setPositions(Positions);
      return;
    }
    this.playersService.setPositions(val);
  }
}
