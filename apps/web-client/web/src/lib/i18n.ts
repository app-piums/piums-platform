"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import artistsEs from "../../public/locales/es/artists.json";
import bookingEs from "../../public/locales/es/booking.json";
import dashboardEs from "../../public/locales/es/dashboard.json";
import homeEs from "../../public/locales/es/home.json";
import loginEs from "../../public/locales/es/login.json";
import menuEs from "../../public/locales/es/menu.json";
import notificationsEs from "../../public/locales/es/notifications.json";
import onboardingEs from "../../public/locales/es/onboarding.json";
import profileEs from "../../public/locales/es/profile.json";
import registerEs from "../../public/locales/es/register.json";

type NamespaceMap = Record<string, Record<string, string>>;

const normalizeNamespace = (namespace: Record<string, unknown>): Record<string, string> => {
  const [onlyKey] = Object.keys(namespace);
  const value = onlyKey ? namespace[onlyKey] : undefined;
  if (onlyKey && typeof value === "object" && value !== null) {
    return value as Record<string, string>;
  }
  return namespace as Record<string, string>;
};

const buildResources = (): NamespaceMap => ({
  artists: normalizeNamespace(artistsEs),
  booking: normalizeNamespace(bookingEs),
  dashboard: normalizeNamespace(dashboardEs),
  home: normalizeNamespace(homeEs),
  login: normalizeNamespace(loginEs),
  menu: normalizeNamespace(menuEs),
  notifications: normalizeNamespace(notificationsEs),
  onboarding: normalizeNamespace(onboardingEs),
  profile: normalizeNamespace(profileEs),
  register: normalizeNamespace(registerEs),
});

const esNamespaces = buildResources();

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        es: esNamespaces,
        en: esNamespaces, // fallback translations until English copy is provided
      },
      lng: "es",
      fallbackLng: "es",
      supportedLngs: ["es", "en"],
      ns: Object.keys(esNamespaces),
      defaultNS: "menu",
      interpolation: {
        escapeValue: false,
      },
    })
    .catch((error) => {
      console.error("Failed to initialize i18n", error);
    });
}

export default i18n;
