import { Component, OnInit } from '@angular/core';
import { PlayersService } from '../../services/players.service';

@Component({
  selector: 'app-player-exclude',
  templateUrl: './player-exclude.component.html',
  styleUrls: ['./player-exclude.component.css'],
})
export class PlayerExcludeComponent implements OnInit {
  optionList: { name: string; id: number; team: string }[] = [];
  selectedExcluded: number[] = [];
  isLoading: boolean = false;
  isOpenSelect: boolean = false;

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
  }

  ngOnInit(): void {}

  onChange(val: number[] = []) {
    this.close();
    this.playersService.setExcluded(this.selectedExcluded);
  }

  getIcon(team: string) {
    return `../../../assets/team-icons/${team}.svg`;
  }

  close(): void {
    this.isOpenSelect = false;
  }
}
