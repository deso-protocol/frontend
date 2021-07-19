import { Directive, ElementRef, OnInit } from "@angular/core";
import { ThemeService } from "./theme.service";
import { Subject } from "rxjs";

@Directive({
  selector: "[app-theme]",
})
export class ThemeDirective implements OnInit {
  private unsubscribe = new Subject();
  constructor(private _elementRef: ElementRef, private _themeService: ThemeService) {}

  ngOnInit() {
    const active = this._themeService.getActiveTheme();
    let body = document.querySelector("body");
    body.classList.add(active.key);
    body.setAttribute("app-theme", "");
  }
}
