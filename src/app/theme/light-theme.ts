import { Theme } from './symbols';

export const lightTheme: Theme = {
  name: 'light',
  properties: {
    '--background': '#fff',
    '--text': '#333333',
    '--grey': '#555555',
    '--secondary': '#f8f8f8',
    '--secalt': '#eee',
    '--textalt': '#777',
    '--norm': '#222',
    '--formbg': '#fafafa',
    '--link': '#007BFF',
    '--hover': '#0056b3',
    '--filter': 'invert(0%) sepia(5%) saturate(7493%) hue-rotate(217deg) brightness(105%) contrast(101%)',
    '--unread': '#e7effe',
  }
};
