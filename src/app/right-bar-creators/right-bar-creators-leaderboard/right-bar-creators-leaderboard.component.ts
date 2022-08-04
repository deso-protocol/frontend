import { Component, Input, OnInit } from '@angular/core';
import { GlobalVarsService } from '../../global-vars.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RightBarCreatorsComponent } from '../right-bar-creators.component';

@Component({
  selector: 'right-bar-creators-leaderboard',
  templateUrl: './right-bar-creators-leaderboard.component.html',
  styleUrls: ['./right-bar-creators-leaderboard.component.scss'],
})
export class RightBarCreatorsLeaderboardComponent implements OnInit {
  static MAX_PROFILE_ENTRIES = 10;
  @Input() activeTab: string;

  RightBarCreatorsComponent = RightBarCreatorsComponent;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit() {
    this.globalVars.updateLeaderboard();
  }
}
