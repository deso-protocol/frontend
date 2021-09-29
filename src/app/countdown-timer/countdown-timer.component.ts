import { Component, Input, OnInit } from "@angular/core";
import { ConfettiSvg, GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "countdown-timer",
  templateUrl: "./countdown-timer.component.html",
  styleUrls: ["./countdown-timer.component.scss"],
})
export class CountdownTimerComponent implements OnInit {
  @Input() timerEnd: number = Date.now();
  @Input() fontSize: number = 13;
  @Input() borderRadiusSize: number = 0;
  @Input() fontWeight: number = 400;
  @Input() timerText: string = "";
  @Input() justifyLeft: boolean = false;
  @Input() justifyAround: boolean = false;

  static milliPerSecond: number = 1000;
  static secondsPerMinute: number = 60;
  static minutesPerHours: number = 60;
  static hoursPerDay: number = 24;

  seconds: string;
  minutes: string;
  hours: string;
  days: string;

  constructor(public globalVars: GlobalVarsService, private router: Router) {}

  ngOnInit() {
    const now = new Date().getTime();
    this.setDaysDiff(now);
    this.setHoursDiff(now);
    this.setMinutesDiff(now);
    this.setSecondsDiff(now);
    setInterval(() => {
      const now = new Date().getTime();
      this.setDaysDiff(now);
      this.setHoursDiff(now);
      this.setMinutesDiff(now);
      this.setSecondsDiff(now);
      this.celebrateIfTimeEnd(now);
    }, 1000);
  }

  navigateToURL(): void {
    this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE], { queryParams: { feedTab: "Showcase" } });
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
      this.globalVars.celebrate();
    }
  }

  formatNumber(val: number): string {
    // When timer expires, show all 0s.
    return (val < 0 ? 0 : val).toString();
  }
}
