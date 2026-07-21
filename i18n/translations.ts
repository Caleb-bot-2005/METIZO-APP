// A focused dictionary covering the highest-visibility strings (bottom tab bar,
// Settings, Home). Not every screen in the app is wired to this yet — see
// hooks/use-translation.ts for how a screen opts in. Ghanaian-language entries
// are best-effort common-word translations and are worth a native-speaker review
// before shipping; French is standard.
export type LanguageName = 'English' | 'Twi' | 'Ga' | 'Ewe' | 'Hausa' | 'French';

export const languages: LanguageName[] = ['English', 'Twi', 'Ga', 'Ewe', 'Hausa', 'French'];

type Dictionary = Record<string, string>;

const en: Dictionary = {
  tab_home: 'Home',
  tab_categories: 'Categories',
  tab_jobs: 'Jobs',
  tab_messages: 'Messages',
  tab_profile: 'Profile',

  home_greeting: 'Hi',
  home_popular_categories: 'Popular Categories',
  home_nearby_artisans: 'Nearby Artisans',
  home_recommended: 'Recommended Professionals',
  home_see_all: 'See all',
  home_set_location: 'Set your location',

  settings_title: 'Settings',
  settings_preferences: 'Preferences',
  settings_push_notifications: 'Push Notifications',
  settings_language: 'Language',
  settings_appearance: 'Appearance',
  settings_theme_light: 'Light',
  settings_theme_dark: 'Dark',
  settings_theme_system: 'System',
  settings_privacy_security: 'Privacy & Security',
  settings_biometric_login: 'Biometric Login',
  settings_change_password: 'Change Password',
  settings_about_section: 'About',
  settings_about_metizo: 'About METIZO',
  settings_terms: 'Terms & Privacy Policy',
  settings_delete_account: 'Delete Account',
};

const twi: Dictionary = {
  tab_home: 'Fie',
  tab_categories: 'Nnwuma Ahodoɔ',
  tab_jobs: 'Nnwuma',
  tab_messages: 'Nkrasɛm',
  tab_profile: 'Wo Ho Nsɛm',

  home_greeting: 'Akwaaba',
  home_popular_categories: 'Nnwuma A Wɔpɛ',
  home_nearby_artisans: 'Adwumayɛfoɔ A Wɔbɛn Wo',
  home_recommended: 'Adwumayɛfoɔ A Yɛkamfo Wɔn',
  home_see_all: 'Hwɛ Nyinaa',
  home_set_location: 'Yi Wo Beaeɛ',

  settings_title: 'Nhyehyɛeɛ',
  settings_preferences: 'Nea Wopɛ',
  settings_push_notifications: 'Amanneɛbɔ',
  settings_language: 'Kasa',
  settings_appearance: 'Ne Su',
  settings_theme_light: 'Hann',
  settings_theme_dark: 'Sum',
  settings_theme_system: 'Mfiri No Nkyerɛase',
  settings_privacy_security: 'Kokoamsɛm & Ahobammɔ',
  settings_biometric_login: 'Nsateaa Nkɔhwɛ',
  settings_change_password: 'Sesa Nsɛnkyerɛnne',
  settings_about_section: 'Ɛfa',
  settings_about_metizo: 'Ɛfa METIZO Ho',
  settings_terms: 'Nhyehyɛeɛ & Kokoamsɛm',
  settings_delete_account: 'Yi Akontaabuo No',
};

const ga: Dictionary = {
  tab_home: 'Shia',
  tab_categories: 'Nitsumɔi Ahewɔi',
  tab_jobs: 'Nitsumɔi',
  tab_messages: 'Saneemɔi',
  tab_profile: 'Ohe Sane',

  home_greeting: 'Ojekoo',
  home_popular_categories: 'Nitsumɔi ni Asɔmɔ',
  home_nearby_artisans: 'Nitsulɔi ni Ebɛn',
  home_recommended: 'Nitsulɔi ni Akɛkpo Amɛ',
  home_see_all: 'Na Fɛɛ',
  home_set_location: 'Wo Ohe He',

  settings_title: 'Nifeemɔi',
  settings_preferences: 'Nɔ ni Osumɔɔ',
  settings_push_notifications: 'Shishitiemɔi',
  settings_language: 'Wiemɔ',
  settings_appearance: 'Enaa',
  settings_theme_light: 'La',
  settings_theme_dark: 'Duŋ',
  settings_theme_system: 'Masin Lɛ',
  settings_privacy_security: 'Teemɔ & Buremɔ',
  settings_biometric_login: 'Ninetɔɔ Kpeemɔ',
  settings_change_password: 'Tsake Wiemɔ Krɔŋŋ',
  settings_about_section: 'Ehe',
  settings_about_metizo: 'METIZO Ehe',
  settings_terms: 'Nifeemɔi & Teemɔ',
  settings_delete_account: 'Jie Akontabuu Lɛ',
};

const ewe: Dictionary = {
  tab_home: 'Aƒe',
  tab_categories: 'Dɔwɔwɔwo Ƒomevi',
  tab_jobs: 'Dɔwɔwɔwo',
  tab_messages: 'Gbedasiwo',
  tab_profile: 'Wò Nyawo',

  home_greeting: 'Woezɔ',
  home_popular_categories: 'Dɔwɔwɔ Vevitɔwo',
  home_nearby_artisans: 'Aɖaŋuwɔlawo Le Gbɔwò',
  home_recommended: 'Aɖaŋuwɔla Kɔkɔtɔwo',
  home_see_all: 'Kpɔ Wo Katã',
  home_set_location: 'Tia Wò Nɔƒe',

  settings_title: 'Ɖoɖowo',
  settings_preferences: 'Nu Siwo Nèlɔ̃',
  settings_push_notifications: 'Nyadzɔdzɔwo',
  settings_language: 'Gbe',
  settings_appearance: 'Ale Wòdze',
  settings_theme_light: 'Kekeli',
  settings_theme_dark: 'Viviti',
  settings_theme_system: 'Ðoɖoa Ŋutɔ',
  settings_privacy_security: 'Ɣaɣlãnyawo & Dedienɔnɔ',
  settings_biometric_login: 'Asibidɛ Gegee',
  settings_change_password: 'Trɔ Ŋkɔsenya',
  settings_about_section: 'Le Ŋuti',
  settings_about_metizo: 'METIZO Ŋuti Nya',
  settings_terms: 'Ɖoɖowo & Ɣaɣlãnyawo',
  settings_delete_account: 'Tutu Akɔntabubu La',
};

const hausa: Dictionary = {
  tab_home: 'Gida',
  tab_categories: 'Rukunoni',
  tab_jobs: 'Ayyuka',
  tab_messages: 'Saƙonni',
  tab_profile: 'Bayanan Ka',

  home_greeting: 'Sannu',
  home_popular_categories: 'Sanannun Ayyuka',
  home_nearby_artisans: 'Ma’aikata Kusa Da Kai',
  home_recommended: 'Ƙwararrun Da Aka Shawarta',
  home_see_all: 'Duba Duka',
  home_set_location: 'Saita Wurinka',

  settings_title: 'Saitunan',
  settings_preferences: 'Zaɓuɓɓuka',
  settings_push_notifications: 'Sanarwa',
  settings_language: 'Harshe',
  settings_appearance: 'Kamanni',
  settings_theme_light: 'Haske',
  settings_theme_dark: 'Duhu',
  settings_theme_system: 'Na Na’urar',
  settings_privacy_security: 'Sirri & Tsaro',
  settings_biometric_login: 'Shiga Da Yatsa',
  settings_change_password: 'Canza Kalmar Sirri',
  settings_about_section: 'Game Da',
  settings_about_metizo: 'Game Da METIZO',
  settings_terms: 'Sharuɗɗa & Sirri',
  settings_delete_account: 'Share Asusu',
};

const fr: Dictionary = {
  tab_home: 'Accueil',
  tab_categories: 'Catégories',
  tab_jobs: 'Travaux',
  tab_messages: 'Messages',
  tab_profile: 'Profil',

  home_greeting: 'Bonjour',
  home_popular_categories: 'Catégories Populaires',
  home_nearby_artisans: 'Artisans à Proximité',
  home_recommended: 'Professionnels Recommandés',
  home_see_all: 'Voir tout',
  home_set_location: 'Définir votre emplacement',

  settings_title: 'Paramètres',
  settings_preferences: 'Préférences',
  settings_push_notifications: 'Notifications',
  settings_language: 'Langue',
  settings_appearance: 'Apparence',
  settings_theme_light: 'Clair',
  settings_theme_dark: 'Sombre',
  settings_theme_system: 'Système',
  settings_privacy_security: 'Confidentialité & Sécurité',
  settings_biometric_login: 'Connexion Biométrique',
  settings_change_password: 'Changer le Mot de Passe',
  settings_about_section: 'À Propos',
  settings_about_metizo: 'À Propos de METIZO',
  settings_terms: 'Conditions & Confidentialité',
  settings_delete_account: 'Supprimer le Compte',
};

export const translations: Record<LanguageName, Dictionary> = {
  English: en,
  Twi: twi,
  Ga: ga,
  Ewe: ewe,
  Hausa: hausa,
  French: fr,
};
