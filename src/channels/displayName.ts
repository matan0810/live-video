import type { Language } from '../i18n/strings';
import type { Channel } from './index';

export function displayName(channel: Channel, language: Language) {
  return language === 'en' && channel.nameEn ? channel.nameEn : channel.name;
}
