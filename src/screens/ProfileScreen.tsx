import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/auth';
import PlaidLinkComponent from '../components/PlaidLink';
import { SampleDataService } from '../services/sampleData';
import { TestDbService } from '../services/testDb';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'recent' | 'spending' | 'frequency';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [showSettings, setShowSettings] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => AuthService.getCurrentUser(),
  });

  // Recent transactions query - simplified to just get transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['recentTransactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching transactions for user:', user.id);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      console.log('Fetched transactions:', data);
      return data;
    },
    enabled: !!user?.id,
  });

  // Spending analytics query - get from transactions directly
  const { data: spendingStats } = useQuery({
    queryKey: ['spendingStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', user.id)
        .not('restaurant_id', 'is', null);

      if (error) {
        console.error('Error fetching spending stats:', error);
        throw error;
      }

      // Group by restaurant and calculate totals
      const grouped = data?.reduce((acc, transaction) => {
        const restaurantId = transaction.restaurant_id;
        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurant: transaction.restaurant,
            total_spent: 0,
            visit_count: 0,
            restaurant_id: restaurantId,
          };
        }
        acc[restaurantId].total_spent += parseFloat(transaction.amount);
        acc[restaurantId].visit_count += 1;
        return acc;
      }, {});

      return Object.values(grouped || {}).sort((a: any, b: any) => b.total_spent - a.total_spent);
    },
    enabled: !!user?.id,
  });

  // Frequency analytics query - get from transactions directly
  const { data: frequencyStats } = useQuery({
    queryKey: ['frequencyStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', user.id)
        .not('restaurant_id', 'is', null);

      if (error) {
        console.error('Error fetching frequency stats:', error);
        throw error;
      }

      // Group by restaurant and calculate totals
      const grouped = data?.reduce((acc, transaction) => {
        const restaurantId = transaction.restaurant_id;
        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurant: transaction.restaurant,
            total_spent: 0,
            visit_count: 0,
            restaurant_id: restaurantId,
          };
        }
        acc[restaurantId].total_spent += parseFloat(transaction.amount);
        acc[restaurantId].visit_count += 1;
        return acc;
      }, {});

      return Object.values(grouped || {}).sort((a: any, b: any) => b.visit_count - a.visit_count);
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAddSampleData = async () => {
    try {
      await SampleDataService.addAllSampleData();
      Alert.alert('Success', 'Sample data added successfully!');
    } catch (error) {
      console.error('Error adding sample data:', error);
      Alert.alert('Error', 'Failed to add sample data');
    }
  };

  const handleTestDatabase = async () => {
    try {
      const result = await TestDbService.testConnection();
      Alert.alert('Database Test', result ? 'Connection successful!' : 'Connection failed');
    } catch (error) {
      console.error('Database test error:', error);
      Alert.alert('Error', 'Database test failed');
    }
  };

  const showSettingsMenu = () => {
    Alert.alert(
      'Settings',
      'Choose an option',
      [
        {
          text: 'Add Sample Data',
          onPress: handleAddSampleData,
        },
        {
          text: 'Test Database',
          onPress: handleTestDatabase,
        },
        {
          text: 'Sign Out',
          onPress: handleSignOut,
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const renderTabButton = (tab: TabType, title: string, iconName: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={iconName as any} 
        size={20} 
        color={activeTab === tab ? '#fff' : '#666'} 
        style={styles.tabIcon}
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderTransactionCard = (item: any, index: number) => (
    <View key={item.id} style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          {item.restaurant ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Restaurant', { restaurant: item.restaurant })}
              style={styles.restaurantNameContainer}
            >
              <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.merchantName}>{item.merchant}</Text>
          )}
          <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.transactionAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
      </View>
      <Text style={styles.transactionCategory}>{item.category}</Text>
    </View>
  );

  const renderRecentView = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Recents</Text>
      {recentTransactions && recentTransactions.length > 0 ? (
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {recentTransactions.map((item, index) => renderTransactionCard(item, index))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No recent transactions found</Text>
          <Text style={styles.emptyStateSubtext}>Connect your bank account or add sample data to see your dining history</Text>
        </View>
      )}
    </View>
  );

  const renderSpendingView = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Spend</Text>
      {spendingStats && spendingStats.length > 0 ? (
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {spendingStats.map((item: any, index: number) => (
            <View key={item.restaurant_id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.statInfo}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Restaurant', { restaurant: item.restaurant })}
                    style={styles.restaurantNameContainer}
                  >
                    <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.statSubtext}>{item.visit_count} visits</Text>
                </View>
                <Text style={styles.spendingAmount}>${item.total_spent.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No spending data available</Text>
          <Text style={styles.emptyStateSubtext}>Connect your bank account to see spending analytics</Text>
        </View>
      )}
    </View>
  );

  const renderFrequencyView = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Regular</Text>
      {frequencyStats && frequencyStats.length > 0 ? (
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {frequencyStats.map((item: any, index: number) => (
            <View key={item.restaurant_id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.statInfo}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Restaurant', { restaurant: item.restaurant })}
                    style={styles.restaurantNameContainer}
                  >
                    <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.statSubtext}>${item.total_spent.toFixed(2)} spent</Text>
                </View>
                <Text style={styles.visitCount}>{item.visit_count} visits</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No frequency data available</Text>
          <Text style={styles.emptyStateSubtext}>Connect your bank account to see visit analytics</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Please sign in</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Profile Section */}
      <View style={styles.heroSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.settingsButton} onPress={showSettingsMenu}>
              <Ionicons name="settings-outline" size={24} color="#8e8e8e" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Image
              source={{ 
                uri: user.avatar || (user.name === 'Mazz' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' : 'https://via.placeholder.com/100')
              }}
              style={styles.profileAvatar}
            />
            <Text style={styles.profileName}>{user.name}</Text>
          </View>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recentTransactions?.length || 0}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{spendingStats?.length || 0}</Text>
              <Text style={styles.statLabel}>Restaurants</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                ${spendingStats?.reduce((sum: number, item: any) => sum + item.total_spent, 0).toFixed(0) || 0}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bank Connection Section */}
      <View style={styles.bankSection}>
        <View style={styles.bankHeader}>
          <Ionicons name="card-outline" size={24} color="#FF6B6B" />
          <Text style={styles.bankTitle}>Connect Your Bank Account</Text>
        </View>
        <Text style={styles.bankSubtitle}>
          Link your bank account to automatically track your dining expenses!
        </Text>
        
        <PlaidLinkComponent
          onSuccess={(result) => {
            console.log('Bank account connected:', result);
          }}
          onExit={() => {
            console.log('Bank connection cancelled');
          }}
        />
      </View>

      {/* Enhanced Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('recent', 'Recents', 'time-outline')}
        {renderTabButton('spending', 'Spend', 'cash-outline')}
        {renderTabButton('frequency', 'Regular', 'restaurant-outline')}
      </View>

      {/* Tab Content */}
      {activeTab === 'recent' && renderRecentView()}
      {activeTab === 'spending' && renderSpendingView()}
      {activeTab === 'frequency' && renderFrequencyView()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  
  // Hero Profile Section
  heroSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e8e',
    fontWeight: '500',
  },
  
  // Bank Section
  bankSection: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  bankSubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
    lineHeight: 20,
    marginBottom: 16,
  },
  // Enhanced Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#FF6B6B',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e8e',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  // Enhanced Tab content styles
  tabContent: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  // Enhanced feed styles
  feedContainer: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  restaurantNameContainer: {
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#8e8e8e',
    fontStyle: 'italic',
  },
  // Enhanced Stat card styles
  statCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRank: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statInfo: {
    flex: 1,
  },
  statSubtext: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  spendingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  visitCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  // Enhanced Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});