import { ApplicationRef, ChangeDetectorRef, Component, OnInit, Input, ViewEncapsulation } from "@angular/core";
import { AnimationOptions } from "ngx-lottie";

@Component({
  selector: "simple-center-loader",
  templateUrl: "./simple-center-loader.component.html",
  styleUrls: ["./simple-center-loader.component.scss"],
})
export class SimpleCenterLoaderComponent {
  @Input() titleLoadingText: string = "Loading";
  @Input() subtitleLoadingText: string = "";
  @Input() spinnerColor: string = "gray";
  @Input() textColor: string = "gray";
  @Input() height = 400;

  options: AnimationOptions = {
    path: "./assets/img/cloutLoader.json",
  };
  constructor() {}

  getHeight() {
    return `${this.height.toString()}px`;
  }

  getLoaderHeight() {
    return `${(this.height / 4).toString()}px`;
  }
}
