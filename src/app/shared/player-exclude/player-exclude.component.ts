import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayersService } from '../../services/players.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-player-exclude',
  templateUrl: './player-exclude.component.html',
  styleUrls: ['./player-exclude.component.css'],
})
export class PlayerExcludeComponent implements OnInit, OnDestroy {
  optionList: { name: string; id: number; team: string }[] = [];
  selectedExcluded: number[] = [];
  isLoading: boolean = false;
  isOpenSelect: boolean = false;
  subscriptions: Subscription[] = [];

  constructor(private playersService: PlayersService) {
    this.isLoading = true;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.playersService.getPlayers().subscribe((data) => {
        this.optionList = [];
        for (let player of data) {
          this.optionList.push({
            name: player.name,
            id: player.fpl_id,
            team: player.team,
          });
        }
        this.isLoading = false;
      }),

      this.playersService.getFilter().subscribe((filter) => {
        if (filter.excluded_players != this.selectedExcluded) {
          this.selectedExcluded = filter.excluded_players;
        }
      })
    );
  }

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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
