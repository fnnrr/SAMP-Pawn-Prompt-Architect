import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  Pressable
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { purchaseAPI } from '../services/api';

interface Purchase {
  id: string;
  purchase_id: string;
  amount: number;
  buyer_email: string;
  gcash_ref: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string;
}

const PurchasesScreen: React.FC = () => {
  const { adminKey, logout } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    if (!adminKey) return;
    try {
      setIsLoading(true);
      const response = await purchaseAPI.getPendingPurchases(adminKey);
      setPurchases(response.purchases || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPurchases();
    setRefreshing(false);
  };

  const handleApprove = async (purchaseId: string) => {
    if (!adminKey) return;
    Alert.alert(
      'Approve Purchase',
      'Generate premium code for this purchase?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const result = await purchaseAPI.approvePurchase(adminKey, purchaseId);
              Alert.alert('Success', `Premium code generated: ${result.key}`);
              fetchPurchases();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve purchase');
            }
          }
        }
      ]
    );
  };

  const handleReject = async (purchaseId: string) => {
    if (!adminKey) return;
    Alert.prompt(
      'Reject Purchase',
      'Enter rejection reason:',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            try {
              await purchaseAPI.rejectPurchase(adminKey, purchaseId, reason);
              Alert.alert('Success', 'Purchase rejected');
              fetchPurchases();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject purchase');
            }
          }
        }
      ]
    );
  };

  const filteredPurchases = filterStatus === 'all'
    ? purchases
    : purchases.filter(p => p.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f97316';
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderPurchase = ({ item }: { item: Purchase }) => (
    <View style={styles.purchaseCard}>
      <Pressable
        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
        style={styles.purchaseHeader}
      >
        <View style={styles.purchaseInfo}>
          <Text style={styles.purchaseId}>{item.purchase_id}</Text>
          <Text style={styles.purchaseEmail}>{item.buyer_email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </Pressable>

      {expandedId === item.id && (
        <View style={styles.expandedContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>${item.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GCash Ref:</Text>
            <Text style={styles.detailValue}>{item.gcash_ref || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item.purchase_id)}
              >
                <Text style={styles.actionButtonText}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.purchase_id)}
              >
                <Text style={styles.actionButtonText}>✗ Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.rejection_reason && (
            <View style={styles.rejectionReason}>
              <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
              <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive
              ]}
            >
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredPurchases.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No purchases found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPurchases}
          renderItem={renderPurchase}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050811'
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0e1423',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  filterButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316'
  },
  filterButtonText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold'
  },
  filterButtonTextActive: {
    color: '#fff'
  },
  listContent: {
    padding: 12
  },
  purchaseCard: {
    backgroundColor: '#0e1423',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden'
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  purchaseInfo: {
    flex: 1
  },
  purchaseId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  purchaseEmail: {
    color: '#64748b',
    fontSize: 12
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  detailValue: {
    color: '#cbd5e1',
    fontSize: 12
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  approveButton: {
    backgroundColor: '#22c55e'
  },
  rejectButton: {
    backgroundColor: '#ef4444'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  rejectionReason: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8
  },
  rejectionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4
  },
  rejectionText: {
    color: '#fff',
    fontSize: 11
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14
  },
  logoutButton: {
    margin: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center'
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default PurchasesScreen;
