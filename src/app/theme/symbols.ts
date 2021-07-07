import { InjectionToken } from "@angular/core";

export const THEMES = new InjectionToken("THEMES");
export const ACTIVE_THEME = new InjectionToken("ACTIVE_THEME");

export interface Theme {
  key: string;
  name: string;
  properties: {
    "--background": string;
    "--text": string;
    "--grey": string;
    "--secondary": string;
    "--secalt": string;
    "--textalt": string;
    "--norm": string;
    "--formbg": string;
    "--link": string;
    "--hover": string;
    "--border": string;
    "--mborder": string;
    "--filter": string;
    "--unread": string;
    "--topbar": string;
    "--cblue": string;
    "--cred": string;
    "--cgreen": string;
    "--button": string;
    "--loading": string;
  };
}

export interface ThemeOptions {
  themes: Theme[];
  active: string;
}
