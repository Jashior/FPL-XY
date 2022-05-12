import { Component, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-team-select',
  templateUrl: './team-select.component.html',
  styleUrls: ['./team-select.component.css'],
})
export class TeamSelectComponent implements OnInit {
  Teams: string[] = [];
  selectedTeams: string[] = [];

  constructor(private playersService: PlayersService) {
    this.playersService.getTeams().subscribe((teams) => {
      this.Teams = teams;
    });
  }

  ngOnInit(): void {}

  onChange(val: string[]) {
    if (val.length == 0) {
      this.playersService.setTeams(this.Teams);
      return;
    }
    this.playersService.setTeams(this.selectedTeams);
  }

  getIcon(team: string) {
    return `../../../assets/team-icons/${team}.png`;
  }
}
