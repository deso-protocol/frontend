import {Component, Input, OnInit} from "@angular/core";
import {ConfettiSvg, GlobalVarsService} from "../global-vars.service";
import {Router} from "@angular/router";

@Component({
  selector: "countdown-timer",
  templateUrl: "./countdown-timer.component.html",
  styleUrls: ["./countdown-timer.component.scss"],
})
export class CountdownTimerComponent implements OnInit {
  // TODO: Replace with actual date and time this timer should end.
  @Input() timerEnd: number;
  @Input() fontSize: number = 13;
  @Input() borderRadiusSize: number = 0;
  @Input() fontWeight: number = 400;
  @Input() timerText: string;
  @Input() justifyLeft: boolean = false;

  static milliPerSecond: number = 1000;
  static secondsPerMinute: number = 60;
  static minutesPerHours: number = 60;
  static hoursPerDay: number = 24;

  seconds: string;
  minutes: string;
  hours: string;
  days: string;

  constructor(public globalVars: GlobalVarsService, private router: Router) {
    const now = new Date().getTime();
    const pastDeflationBomb = this.globalVars.pastDeflationBomb;
    this.timerEnd = pastDeflationBomb ? this.globalVars.announcementTimerEnd : this.globalVars.deflationBombTimerEnd;
    this.timerText = pastDeflationBomb ? this.globalVars.announcementTimerText : this.globalVars.deflationBombTimerText;
    this.setDaysDiff(now);
    this.setHoursDiff(now);
    this.setMinutesDiff(now);
    this.setSecondsDiff(now);
  }

  ngOnInit() {
    setInterval(() => {
      const now = new Date().getTime();
      this.setDaysDiff(now);
      this.setHoursDiff(now);
      this.setMinutesDiff(now);
      this.setSecondsDiff(now);
      this.timerEnd = this.globalVars.pastDeflationBomb
        ? this.globalVars.announcementTimerEnd
        : this.globalVars.deflationBombTimerEnd;
      this.timerText = this.globalVars.pastDeflationBomb
        ? this.globalVars.announcementTimerText
        : this.globalVars.deflationBombTimerText;
      this.celebrateIfTimeEnd(now);
    }, 1000);
  }

  navigateToURL(): void {
    this.router.navigate([
      "/" + this.globalVars.RouteNames.POSTS + "/" + "3a13a7e4342148e76e1de957f22775a4f6916ed809a90e77a035bb7cefaaaf44",
    ]);
  }

  setDaysDiff(start: number): void {
    this.days = this.formatNumber(
      Math.floor(
        (this.timerEnd - start) /
          (CountdownTimerComponent.milliPerSecond *
            CountdownTimerComponent.secondsPerMinute *
            CountdownTimerComponent.minutesPerHours *
            CountdownTimerComponent.hoursPerDay)
      )
    );
  }

  setHoursDiff(start: number): void {
    this.hours = this.formatNumber(
      Math.floor(
        ((this.timerEnd - start) %
          (CountdownTimerComponent.milliPerSecond *
            CountdownTimerComponent.secondsPerMinute *
            CountdownTimerComponent.minutesPerHours *
            CountdownTimerComponent.hoursPerDay)) /
          (CountdownTimerComponent.milliPerSecond *
            CountdownTimerComponent.secondsPerMinute *
            CountdownTimerComponent.minutesPerHours)
      )
    );
  }

  setMinutesDiff(start: number): void {
    this.minutes = this.formatNumber(
      Math.floor(
        ((this.timerEnd - start) %
          (CountdownTimerComponent.milliPerSecond *
            CountdownTimerComponent.secondsPerMinute *
            CountdownTimerComponent.minutesPerHours)) /
          (CountdownTimerComponent.milliPerSecond * CountdownTimerComponent.secondsPerMinute)
      )
    );
  }

  setSecondsDiff(start: number): void {
    this.seconds = this.formatNumber(
      Math.floor(
        ((this.timerEnd - start) %
          (CountdownTimerComponent.milliPerSecond * CountdownTimerComponent.secondsPerMinute)) /
          CountdownTimerComponent.milliPerSecond
      )
    );
  }

  celebrateIfTimeEnd(now: number): void {
    const diff = (now - this.timerEnd) / 1000;
    if (diff > 0 && diff < 3) {
      this.globalVars.celebrate([ConfettiSvg.ROCKET, ConfettiSvg.LAMBO]);
    }
  }

  formatNumber(val: number): string {
    // When timer expires, show all 0s.
    return (val < 0 ? 0 : val).toString();
  }
}
