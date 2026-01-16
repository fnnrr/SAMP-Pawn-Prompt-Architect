import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { purchaseAPI } from '../services/api';

interface DashboardStats {
  totalPurchases: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalRevenue: number;
}

const DashboardScreen: React.FC = () => {
  const { adminKey, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!adminKey) return;
    try {
      setIsLoading(true);
      const response = await purchaseAPI.getPendingPurchases(adminKey);
      const purchases = response.purchases || [];

      const stats: DashboardStats = {
        totalPurchases: purchases.length,
        pendingCount: purchases.filter((p: any) => p.status === 'pending').length,
        approvedCount: purchases.filter((p: any) => p.status === 'approved').length,
        rejectedCount: purchases.filter((p: any) => p.status === 'rejected').length,
        totalRevenue: purchases.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0)
      };
      setStats(stats);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!adminKey) return;
    setIsGenerating(true);
    try {
      const result = await purchaseAPI.generatePremiumKey(adminKey);
      Alert.alert(
        'Success',
        `New Premium Key Generated:\n${result.key}`,
        [
          {
            text: 'Copy',
            onPress: () => {
              // In React Native, you'd use react-native-clipboard
              Alert.alert('Info', 'Key copied to clipboard');
            }
          },
          { text: 'OK', onPress: () => {} }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate key');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
          <Text style={styles.statLabel}>Total Purchases</Text>
          <Text style={styles.statValue}>{stats.totalPurchases}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#f97316' }]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>{stats.pendingCount}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#22c55e' }]}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.approvedCount}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
          <Text style={styles.statLabel}>Rejected</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.rejectedCount}</Text>
        </View>
      </View>

      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Total Revenue</Text>
        <Text style={styles.revenueValue}>${stats.totalRevenue.toFixed(2)}</Text>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.generateButton]}
          onPress={handleGenerateKey}
          disabled={isGenerating}
        >
          <Text style={styles.actionButtonText}>
            {isGenerating ? 'Generating...' : '+ Generate Premium Key'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButtonStyle]}
          onPress={logout}
        >
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050811'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  date: {
    fontSize: 12,
    color: '#64748b'
  },
  statsGrid: {
    paddingHorizontal: 12,
    marginBottom: 16
  },
  statCard: {
    backgroundColor: '#0e1423',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold'
  },
  revenueCard: {
    marginHorizontal: 12,
    marginBottom: 24,
    backgroundColor: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    padding: 20,
    borderRadius: 12
  },
  revenueLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 8
  },
  revenueValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold'
  },
  actionsSection: {
    paddingHorizontal: 12,
    marginBottom: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  generateButton: {
    backgroundColor: '#f97316'
  },
  logoutButtonStyle: {
    backgroundColor: '#1e293b'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default DashboardScreen;
