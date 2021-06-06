import { Theme } from './symbols';

export const darkTheme: Theme = {
  name: 'dark',
  properties: {
    '--background': '#000',
    '--text': 'white',
    '--secondary': '#222',
    '--secalt': '#111',
    '--textalt': '#eee',
    '--filter': 'invert(98%) sepia(1%) saturate(264%) hue-rotate(181deg) brightness(116%) contrast(100%)',
  }
} 