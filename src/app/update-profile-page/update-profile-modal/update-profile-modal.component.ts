import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../../backend-api.service";
import { Title } from "@angular/platform-browser";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "update-profile-modal",
  templateUrl: "./update-profile-modal.component.html",
  styleUrls: ["./update-profile-modal.component.scss"],
})
export class UpdateProfileModalComponent implements OnInit {
  @Input() loggedInUser: any;
  @Input() inTutorial: boolean = false;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private router: Router,
    private titleService: Title,
    public bsModalRef: BsModalRef
  ) {}

  ngOnInit() {
    this.titleService.setTitle("Update Profile - BitClout");
  }
}
