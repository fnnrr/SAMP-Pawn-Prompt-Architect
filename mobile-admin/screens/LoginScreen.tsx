import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { purchaseAPI } from '../services/api';

const LoginScreen: React.FC = () => {
  const [adminKey, setAdminKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!adminKey.trim()) {
      Alert.alert('Error', 'Please enter your admin key');
      return;
    }

    setIsLoading(true);
    try {
      // Verify admin key by trying to fetch purchases
      await purchaseAPI.getPendingPurchases(adminKey);
      await login(adminKey);
    } catch (error: any) {
      Alert.alert(
        'Authentication Failed',
        error.response?.data?.error || 'Invalid admin key. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏗️</Text>
          <Text style={styles.title}>SAMP Architect</Text>
          <Text style={styles.subtitle}>Admin Dashboard</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Admin Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your admin key"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={adminKey}
            onChangeText={setAdminKey}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Authenticating...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.info}>
            Enter your secure admin key to access the dashboard
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050811'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  logo: {
    fontSize: 60,
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#f97316'
  },
  form: {
    marginBottom: 20
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: '#0e1423',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    color: '#fff',
    fontSize: 16
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  info: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  }
});

export default LoginScreen;
