import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-year-select',
  templateUrl: './year-select.component.html',
  styleUrls: ['./year-select.component.css'],
})
export class YearSelectComponent implements OnInit, OnDestroy {
  selectedYear: string = '';
  optionList: string[] = [];
  subscriptions: Subscription[] = [];

  constructor(private playersService: PlayersService) {}

  ngOnInit(): void {
    this.selectedYear = this.playersService.getYearString();

    this.subscriptions.push(
      this.playersService.getPossibleYearStrings().subscribe((years) => {
        this.optionList = years;
      })
    );
  }

  updateYear(year: string) {
    this.playersService.setYear(year);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
