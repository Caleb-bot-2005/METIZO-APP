import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { fontFamily } from '@/theme/typography';

type ToastType = 'success' | 'error' | 'info';
interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ show: (message: string, type?: ToastType) => void }>({
  show: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const config: Record<ToastType, { bg: string; icon: React.ComponentType<any> }> = {
  success: { bg: '#22C55E', icon: CheckCircle2 },
  error: { bg: '#EF4444', icon: XCircle },
  info: { bg: '#0A84FF', icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2600);
  }, []);

  const Icon = toast ? config[toast.type].icon : null;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          style={{ position: 'absolute', bottom: insets.bottom + 24, left: 20, right: 20 }}>
          <View style={[styles.toast, { backgroundColor: config[toast.type].bg }]}>
            {Icon ? <Icon size={18} color="#FFFFFF" /> : null}
            <Text style={styles.message}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: { flex: 1, fontFamily: fontFamily.medium, color: '#FFFFFF', fontSize: 14 },
});
