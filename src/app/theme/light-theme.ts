import { Theme } from './symbols';

export const lightTheme: Theme = {
  name: 'light',
  properties: {
    '--background': '#fff',
    '--text': '#333',
    '--secondary': '#f8f8f8',
    '--secalt': '#eee',
    '--textalt': '#777',
    '--filter': 'invert(0%) sepia(5%) saturate(7493%) hue-rotate(217deg) brightness(105%) contrast(101%)',
  }
};
