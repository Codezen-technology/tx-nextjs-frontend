import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

interface LocaleLayoutProps {
  children: React.ReactNode;
}

export default async function LocaleLayout({ children }: LocaleLayoutProps) {
  // Use middleware-resolved locale (header), not the first URL segment — avoids
  // treating `/course/[slug]` as locale=course when localePrefix is `as-needed`.
  const locale = await getLocale();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
