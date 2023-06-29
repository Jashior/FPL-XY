import { Component, OnInit } from '@angular/core';
import { number } from 'echarts';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-player-search',
  templateUrl: './player-search.component.html',
  styleUrls: ['./player-search.component.css'],
})
export class PlayerSearchComponent implements OnInit {
  optionList: { name: string; id: number; team: string }[] = [];
  isLoading: boolean = false;
  selectedUser: any;

  constructor(private playersService: PlayersService) {
    this.isLoading = true;
    playersService.getPlayers().subscribe((data) => {
      this.optionList = [];
      for (let player of data) {
        this.optionList.push({
          name: player.name,
          id: player.fpl_id,
          team: player.team,
        });
      }
      this.isLoading = false;
    });
    playersService.getHighlightedPlayers().subscribe((data) => {
      this.selectedUser = data;
    });
  }

  ngOnInit(): void {}

  onChange(value: number[]): void {
    this.playersService.setHighlightedPlayers(value);
  }

  getIcon(team: string) {
    return `../../../assets/team-icons/${team}.svg`;
  }
}
