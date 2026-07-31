"use client";

import { IntlProvider } from "next-intl";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  locale: string;
  messages: Record<string, object>;
}

export const I18nProvider: React.FC<Props> = ({
  children,
  locale,
  messages,
}) => {
  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
};
