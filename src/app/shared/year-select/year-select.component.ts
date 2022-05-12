import { Component, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-year-select',
  templateUrl: './year-select.component.html',
  styleUrls: ['./year-select.component.css'],
})
export class YearSelectComponent implements OnInit {
  selectedYear;
  optionList: string[] = [];

  constructor(private playersService: PlayersService) {
    this.selectedYear = playersService.getYearString();
    this.playersService.getPossibleYearStrings().subscribe((years) => {
      this.optionList = years;
    });
  }

  ngOnInit(): void {}

  updateYear(year: string) {
    this.playersService.setYear(year);
  }
}
