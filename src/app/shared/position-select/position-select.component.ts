import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';
import { Positions } from '../../models/Positions';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-position-select',
  templateUrl: './position-select.component.html',
  styleUrls: ['./position-select.component.css'],
})
export class PositionSelectComponent implements OnInit, OnDestroy {
  Positions = Positions;
  selectedPositions: string[] = [];
  subscriptions: Subscription[] = [];

  constructor(private playersService: PlayersService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.playersService.getFilter().subscribe((f) => {
        this.selectedPositions = f.positions;
        if (this.selectedPositions.length == this.Positions.length) {
          this.selectedPositions = [];
        }
      })
    );
  }

  onChange(val: any) {
    if (val.length == 0) {
      this.playersService.setPositions(Positions);
      return;
    }
    this.playersService.setPositions(val);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
