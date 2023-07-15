import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-team-select',
  templateUrl: './team-select.component.html',
  styleUrls: ['./team-select.component.css'],
})
export class TeamSelectComponent implements OnInit, OnDestroy {
  teams: string[] = [];
  selectedTeams: string[] = [];
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private playersService: PlayersService) {}

  ngOnInit(): void {
    this.teams = this.playersService.getTeams();
    this.playersService
      .getFilter()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((filter) => {
        this.selectedTeams = filter.teams;
        if (this.selectedTeams.length === this.teams.length) {
          this.selectedTeams = [];
        }
      });
  }

  onChange(val: string[]) {
    if (val.length == 0) {
      this.playersService.setTeams(this.teams);
      return;
    }
    this.playersService.setTeams(this.selectedTeams);
  }

  getIcon(team: string) {
    return `../../../assets/team-icons/${team}.svg`;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
