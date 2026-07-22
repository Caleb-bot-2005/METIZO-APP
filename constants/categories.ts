import { ServiceCategory } from '@/types/job';

export const serviceCategories: ServiceCategory[] = [
  { id: 'plumber', name: 'Plumber', icon: 'wrench', emergencyAvailable: true },
  { id: 'electrician', name: 'Electrician', icon: 'zap', emergencyAvailable: true },
  { id: 'painter', name: 'Painter', icon: 'paintbrush' },
  { id: 'welder', name: 'Welder', icon: 'flame' },
  { id: 'carpenter', name: 'Carpenter', icon: 'hammer' },
  { id: 'cleaner', name: 'Cleaner', icon: 'sparkles' },
  { id: 'mechanic', name: 'Mechanic', icon: 'car', emergencyAvailable: true },
  { id: 'technician', name: 'Technician', icon: 'cpu', emergencyAvailable: true },
  { id: 'mason', name: 'Mason', icon: 'brick-wall' },
  { id: 'roofer', name: 'Roofer', icon: 'home', emergencyAvailable: true },
  { id: 'tiler', name: 'Tiler', icon: 'grid-2x2' },
  { id: 'ac_technician', name: 'AC Technician', icon: 'snowflake', emergencyAvailable: true },
  { id: 'generator_technician', name: 'Generator Technician', icon: 'battery-charging', emergencyAvailable: true },
  { id: 'solar_installer', name: 'Solar Installer', icon: 'sun' },
  { id: 'locksmith', name: 'Locksmith', icon: 'key-round', emergencyAvailable: true },
];
