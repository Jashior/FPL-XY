import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-team-select',
  templateUrl: './team-select.component.html',
  styleUrls: ['./team-select.component.css'],
})
export class TeamSelectComponent implements OnInit, OnDestroy {
  Teams: string[] = [];
  selectedTeams: string[] = [];
  unsubscribe$ = new Subject<void>();
  teamsSubscription: Subscription | undefined;

  constructor(private playersService: PlayersService) {
  }
  
  ngOnInit(): void {
    this.teamsSubscription = this.playersService.getTeams().pipe(takeUntil(this.unsubscribe$)).subscribe((teams) => {
      this.Teams = teams;
      this.playersService.getFilter().pipe(takeUntil(this.unsubscribe$)).subscribe((f) => {
        this.selectedTeams = f.teams;
        if (this.selectedTeams.length == this.Teams.length) {
          this.selectedTeams = [];
        }
      });
    });
  }

  onChange(val: string[]) {
    if (val.length == 0) {
      this.playersService.setTeams(this.Teams);
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
    if (this.teamsSubscription) {
      this.teamsSubscription.unsubscribe();
    }
  }
}