import React from 'react';
import { Text, View } from 'react-native';

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const colors = ['#EF4444', '#EF4444', '#F59E0B', '#0A84FF', '#22C55E'];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = getStrength(password);

  return (
    <View style={{ gap: 6, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: i < score ? colors[score] : '#E2E8F0' }}
          />
        ))}
      </View>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors[score] }}>
        {labels[score]}
      </Text>
    </View>
  );
}
