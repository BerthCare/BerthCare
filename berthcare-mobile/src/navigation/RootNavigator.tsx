import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthState } from '@/lib/auth';
import AlertScreen from '@screens/alert/screen';
import LoginScreen from '@screens/login/screen';
import TodayScreen from '@screens/today/screen';
import VisitScreen from '@screens/visit/screen';
import type { RootStackParamList } from '@/types/navigation';

type RootNavigatorProps = {
  authState: AuthState;
  authConfigured: boolean;
  baseUrl: string;
  onLoginSuccess: () => void;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator({
  authState,
  authConfigured,
  baseUrl,
  onLoginSuccess,
}: RootNavigatorProps) {
  const isAuthenticated = authState.isAuthenticated && !authState.requiresReauth;
  const navigatorKey = isAuthenticated ? 'auth' : 'guest';
  const initialRouteName: keyof RootStackParamList = isAuthenticated ? 'Today' : 'Login';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      key={navigatorKey}
      screenOptions={{ headerShown: false }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Today" options={{ title: 'Today' }}>
            {(props) => (
              <TodayScreen
                {...props}
                authState={authState}
                authConfigured={authConfigured}
                baseUrl={baseUrl}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Visit"
            component={VisitScreen}
            options={{
              animation: Platform.OS === 'android' ? 'fade' : 'slide_from_right',
              headerShown: true,
              title: 'Visit',
            }}
          />
          <Stack.Screen
            name="Alert"
            component={AlertScreen}
            options={{
              animation: Platform.OS === 'android' ? 'fade' : 'slide_from_bottom',
              headerShown: false,
              presentation: 'modal',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" options={{ title: 'Log In' }}>
          {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
