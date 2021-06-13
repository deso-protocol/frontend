import { InjectionToken } from "@angular/core";

export const THEMES = new InjectionToken("THEMES");
export const ACTIVE_THEME = new InjectionToken("ACTIVE_THEME");

export interface Theme {
  key: string;
  name: string;
  properties: any;
}

export interface ThemeOptions {
  themes: Theme[];
  active: string;
}
