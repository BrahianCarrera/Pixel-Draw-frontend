import React, { createContext, useContext } from 'react';

export type ScreenName = 'home' | 'draw' | 'gallery';

export interface RouterContextType {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName) => void;
  push: (route: string) => void;
  replace: (route: string) => void;
  back: () => void;
}

export const RouterContext = createContext<RouterContextType>({
  currentScreen: 'home',
  navigate: () => {},
  push: () => {},
  replace: () => {},
  back: () => {},
});

export const useRouter = () => useContext(RouterContext);
