import { Component, Input, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';
import { NzMarks } from 'ng-zorro-antd/slider';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';
import { Filter } from '../../models/Filter';

@Component({
  selector: 'app-min-minutes',
  templateUrl: './min-minutes.component.html',
  styleUrls: ['./min-minutes.component.css'],
})
export class MinMinutesComponent implements OnInit {
  minMinutesValue: number = 0;
  maxMinutesPossible!: number;
  loaded: boolean = false;
  marks: NzMarks = {};

  constructor(private playersService: PlayersService) {
    combineLatest([
      this.playersService.getLoadingState(),
      this.playersService.getFilter(),
      this.playersService.getMaxMinsGwRange(),
    ])
      .pipe(
        filter(([loadingState]) => !loadingState),
        debounceTime(100)
      ) // Filter when loadingState is false
      .subscribe(([_, filter, maxMinsGwRange]) => {
        console.log(`filter or max mins changed`);
        // Update minMinutesValue and maxMinutesPossible
        this.minMinutesValue = filter.min_minutes;
        this.maxMinutesPossible = maxMinsGwRange;

        // Call this.changeMarks()
        this.loadMarks();

        // Set this.loaded to true
        this.loaded = true;
        this.ngOnInit();
      });
  }

  ngOnInit(): void {}

  loadMarks(): void {
    let max = this.maxMinutesPossible.toString();
    this.marks = {
      0: '0',
      [max]: { label: max },
    };
  }

  onChange(): void {
    if (!this.loaded) {
      return;
    }
    this.playersService.setMinMinutes(this.minMinutesValue);
  }
}
