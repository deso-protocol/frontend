// This service is tracking urlHistory so that we can clear the history when the
// user navigates to a new tab (so that the user doesn't see the back button on the new tab)
//
// Twitter's mobile web UI does this, altho their UI's behavior is kinda buggy / unpredictable
// if you use a combo of the browser back button and the in-app back button.
//
// The code below is copy pasted from https://nils-mehlhorn.de/posts/angular-navigate-back-previous-page#dynamic-back-navigation-with-browser-history
// ... but their solution doesn't seem to include browser-induced back/forward events, so
// it's not going to work ... I added some hacks to it to get it to kinda work
//
// There's a more complex version here https://semanticbits.com/route-history-service-in-angular/
// I didn't read it so not sure what the differences are
//
// Overall, we should find a more robust way to do this. The code below probably has bugs
// or handles edge cases poorly.

import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private urlHistory: string[] = [];

  constructor(private router: Router, private location: Location) {
    // push the current URL
    this.urlHistory.push(router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (
          event.navigationTrigger === 'popstate' ||
          event.navigationTrigger === 'imperative'
        ) {
          let currentUrl = this.urlHistory[this.urlHistory.length - 1];
          let previousUrl = this.urlHistory[this.urlHistory.length - 2];
          // if a click merely changed query params, we want to pop the previous URL (which
          // is identical to the current URL, except for query params) and push the new
          // URL (which contains the query param change)
          //
          // this is to match the anecdotal browser behavior I observed in my browser
          // TODO: i'm not sure this anecdotal behavior is correct, see for example the "sign up"
          // flow. it'd probably be safer not to do this
          let clickChangedQueryParams =
            currentUrl.split('?')[0] == event.url.split('?')[0];

          if (clickChangedQueryParams) {
            this.urlHistory.pop();
            this.urlHistory.push(event.url);
            return;
          }

          let userClickedBack = previousUrl && previousUrl == event.url;

          if (userClickedBack) {
            this.urlHistory.pop();
          } else {
            this.urlHistory.push(event.url);
          }
        }
      } else if (event instanceof NavigationEnd) {
        // When we navigate to any route other than browse, start at the top of the page.
        window.scrollTo(0, 0);
      }
    });
  }

  // this gets called after the new URL is added to the history in the subscribe above
  clearHistoryAfterNavigatingToNewUrl() {
    let newUrl = this.urlHistory[this.urlHistory.length - 1];
    this.urlHistory = [newUrl];
  }

  isHistoryEmpty() {
    // only the initial page is history
    return this.urlHistory.length == 1;
  }

  back(): void {
    if (this.isHistoryEmpty()) {
      // TODO: rollbar
      console.error(
        "Attempting to go back when there's nothing in the history"
      );
      return;
    }

    this.location.back();
  }
}
