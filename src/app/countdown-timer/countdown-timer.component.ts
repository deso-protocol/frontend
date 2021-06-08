import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "countdown-timer",
  templateUrl: "./countdown-timer.component.html",
  styleUrls: ["./countdown-timer.component.scss"],
})
export class CountdownTimerComponent implements OnInit {
  // TODO: Replace with actual date and time this timer should end.
  @Input() timerEnd: number = new Date("June 12, 2021 9:00:00 PDT").getTime();
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

  constructor(private globalVars: GlobalVarsService, private router: Router) {
    const now = new Date().getTime();
    this.setDaysDiff(now);
    this.setHoursDiff(now);
    this.setMinutesDiff(now);
    this.setSecondsDiff(now);
  }

  ngOnInit() {
    if (this.timerText === undefined) {
      this.timerText = this.globalVars.timerText;
    }
    setInterval(() => {
      const now = new Date().getTime();
      this.setDaysDiff(now);
      this.setHoursDiff(now);
      this.setMinutesDiff(now);
      this.setSecondsDiff(now);
    }, 1000);
  }

  navigateToURL(): void {
    this.router.navigate([
      "/" + this.globalVars.RouteNames.POSTS + "/" + "3bc11727c5dc6721c5b5a4ce183f53a7b0bfc5e57de333a29009ad24db483149",
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

  formatNumber(val: number): string {
    // When timer expires, show all 0s.
    return (val < 0 ? 0 : val).toString();
  }
}
