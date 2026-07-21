import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

export const zustandAsyncStorage: StateStorage = {
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  getItem: (name) => AsyncStorage.getItem(name),
  removeItem: (name) => AsyncStorage.removeItem(name),
};
