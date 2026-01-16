import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from './screens/DashboardScreen';
import PurchasesScreen from './screens/PurchasesScreen';
import LoginScreen from './screens/LoginScreen';
import { useAuth } from './context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#050811' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
  </Stack.Navigator>
);

const PurchasesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#050811' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen name="Purchases" component={PurchasesScreen} />
  </Stack.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any = 'home';
        if (route.name === 'DashboardStack') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        if (route.name === 'PurchasesStack') iconName = focused ? 'wallet' : 'wallet-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#f97316',
      tabBarInactiveTintColor: '#64748b',
      tabBarStyle: { backgroundColor: '#0b1121', borderTopColor: '#1e293b' }
    })}
  >
    <Tab.Screen 
      name="DashboardStack" 
      component={DashboardStack}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="PurchasesStack" 
      component={PurchasesStack}
      options={{ title: 'Purchases' }}
    />
  </Tab.Navigator>
);

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <AdminTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}
