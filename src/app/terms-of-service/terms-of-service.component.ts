import { Component, OnInit } from "@angular/core";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: "app-terms-of-service",
  templateUrl: "./terms-of-service.component.html",
  styleUrls: ["./terms-of-service.component.sass"],
})
export class TermsOfServiceComponent {
  constructor(
    private route: ActivatedRoute,
  ) {}
  fragment = null;
  hasScrolled = false;

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });
  }

  ngAfterViewChecked(): void {
    try {
      if(this.fragment && !this.hasScrolled) {
        setTimeout(()=>{
          document.querySelector('#' + this.fragment).scrollIntoView();
          this.hasScrolled = true;
        }, 250)
      }
    } catch (e) { }
  }
}
