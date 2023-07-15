import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-player-search',
  templateUrl: './player-search.component.html',
  styleUrls: ['./player-search.component.css'],
})
export class PlayerSearchComponent implements OnInit, OnDestroy {
  optionList: { name: string; id: number; team: string }[] = [];
  isLoading: boolean = false;
  selectedUser: any;
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
      })
    );

    this.subscriptions.push(
      this.playersService.getHighlightedPlayers().subscribe((data) => {
        this.selectedUser = data;
      })
    );
  }

  onChange(value: number[]): void {
    this.close();
    this.playersService.setHighlightedPlayers(value);
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
