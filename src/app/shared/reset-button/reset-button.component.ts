import { Component, OnInit } from '@angular/core';
import { PlayersService } from '../../services/players.service';

@Component({
  selector: 'app-reset-button',
  templateUrl: './reset-button.component.html',
  styleUrls: ['./reset-button.component.css'],
})
export class ResetButtonComponent implements OnInit {
  playersService: PlayersService;

  constructor(playersService: PlayersService) {
    this.playersService = playersService;
  }

  ngOnInit(): void {}

  resetSidePanelSelections(): void {
    this.playersService.resetFilter();

    // highlight player filter
    this.playersService.setHighlightedPlayers([]);

    // gameweek slider
    this.playersService.resetGwRange();
  }
}
