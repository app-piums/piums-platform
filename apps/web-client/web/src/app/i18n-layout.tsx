import { appWithTranslation } from 'next-i18next';
import type { ReactNode } from 'react';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return children;
};

export default appWithTranslation(RootLayout);
