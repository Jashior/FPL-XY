import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';
import { NzMarks } from 'ng-zorro-antd/slider';
import { Subscription, combineLatest } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

@Component({
  selector: 'app-min-minutes',
  templateUrl: './min-minutes.component.html',
  styleUrls: ['./min-minutes.component.css'],
})
export class MinMinutesComponent implements OnInit, OnDestroy {
  minMinutesValue: number = 0;
  maxMinutesPossible!: number;
  loaded: boolean = false;
  marks: NzMarks = {};
  subscriptions: Subscription[] = [];

  constructor(private playersService: PlayersService) {
    this.loaded = false;
  }

  ngOnInit() : void {
    this.subscriptions.push(
      this.playersService.getGameweekRange().subscribe((data) => {
        this.playersService.setMinMinutes(0);
      }
    ));

    this.subscriptions.push(
      combineLatest([
        this.playersService.getLoadingState(),
        this.playersService.getFilter(),
        this.playersService.getMaxMinsGwRange()
      ])
      .pipe(
        filter(([loadingState]) => !loadingState),
        debounceTime(100)
      ) // Filter when loadingState is false
      .subscribe(([_, filter, maxMinsGwRange]) => {
        // Update minMinutesValue and maxMinutesPossible
        this.minMinutesValue = filter.min_minutes;
        this.maxMinutesPossible = maxMinsGwRange;

        // Call this.changeMarks()
        this.loadMarks();

        // Set this.loaded to true
        this.loaded = true;
      })
    );
  }

  loadMarks(): void {
    let max = this.maxMinutesPossible.toString();
    this.marks = {};

    const quarter = Math.floor(Number(max) * 0.25);
    const half = Math.floor(Number(max) * 0.5);
    const threeQuarters = Math.floor(Number(max) * 0.75);

    this.marks[0] = '0';
    this.marks[quarter] = '25%';
    this.marks[half] = '50%';
    this.marks[threeQuarters] = '75%';
    this.marks[max] = '100%';
  }

  onChange(): void {
    if (this.loaded) {
      this.playersService.setMinMinutes(this.minMinutesValue);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
