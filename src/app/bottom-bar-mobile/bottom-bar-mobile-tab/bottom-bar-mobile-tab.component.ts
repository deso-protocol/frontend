import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { NavigationService } from "../../../lib/services/navigation-service";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { includes } from "lodash";

@Component({
  selector: "bottom-bar-mobile-tab",
  templateUrl: "./bottom-bar-mobile-tab.component.html",
  styleUrls: ["./bottom-bar-mobile-tab.component.scss"],
})
export class BottomBarMobileTabComponent {
  @Input() link: string;
  @Input() queryParams: any = { stepNum: null };
  @ViewChild("bottomBarIcon") iconDiv: ElementRef;
  constructor(
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private globalVars: GlobalVarsService,
    private ref: ChangeDetectorRef
  ) {}

  ngOnInit() {
    setTimeout(() => {
      if (this.queryParams?.feedTab) {
        this.activatedRoute.queryParams.subscribe((params) => {
          if (
            includes(this.iconDiv.nativeElement.className, "fc-blue") &&
            this.queryParams?.feedTab === params?.feedTab
          ) {
            this.iconDiv.nativeElement.style.color = "var(--highlight)";
          } else {
            this.iconDiv.nativeElement.style.color = "var(--postsectext)";
          }
        });
      }
    }, 50);
  }

  clearNavigationHistory() {
    if (this.queryParams?.feedTab) {
      this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE], {
        queryParams: this.queryParams,
        queryParamsHandling: "merge",
      });
    }
    this.navigationService.clearHistoryAfterNavigatingToNewUrl();
  }
}
