import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BackendApiService } from '../backend-api.service';
import { GlobalVarsService } from '../global-vars.service';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-cloutcast-page',
  templateUrl: './cloutcast-page.component.html',
  styleUrls: ['./cloutcast-page.component.scss']
})
export class CloutCastPageComponent implements OnInit {
  needsApproval: boolean;
  selectedTab: any;
  selectedCast: any; 
  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private identityService: IdentityService,
    private router: Router,
    private titleService: Title
  ) { }

  async ngOnInit(): Promise<void> {
    
    this.titleService.setTitle("Casts powered by CloutCast - BitClout");
    try {
      // get logged in user
      let currentUser = this.globalVars.loggedInUser;

      if (typeof currentUser == 'undefined') {
        // 'protected route'
        this.router.navigateByUrl("/");
        return;
      }

      // start get JWT
      // get localStorage.
      // const sUser = localStorage.getItem("identityUsers");
      
      // // parse it
      // const jUser = JSON.parse(sUser) || {};
      
      // // scope to currentUser
      // const cUser = jUser[currentUser.PublicKeyBase58Check] || null;

      // if (cUser == null) {
      //   // somehow, cUser is null. 
      //   console.warn("cloutcast -- cUser was null for some reason.");
      //   this.router.navigateByUrl("/");
      // }

      const tokenReq = await this.identityService.jwt({
        ...this.identityService.identityServiceParamsForKey(currentUser.PublicKeyBase58Check)
      }).toPromise();

      let {approvalRequired = false, jwt = ""} = tokenReq;

      if (approvalRequired == true || jwt == "") {
        console.warn("we need approval");
        // TODO 
        this.router.navigateByUrl("/");
        return;
      }

      console.log(jwt);
      let ccToken = await fetch(`https://cloutcastapimgtdev.azure-api.net/v0-bitclout/auth?publicKey=${currentUser.PublicKeyBase58Check}.json`, {
        headers: {
          'authorization' : `Bearer ${jwt}`
        },
  
      });

      console.log(ccToken);


      


      // lets get the list of promotions available. 

      console.log("yay it continued");
      return;
    } catch (ex) {
      alert(ex.message || "Unspecified Error.");
    }
    

    
    
  }

}
