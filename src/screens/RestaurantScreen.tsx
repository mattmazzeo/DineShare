import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  LinearGradient,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Post } from '../types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type TabType = 'customers' | 'spending' | 'posts';

export default function RestaurantScreen({ route, navigation }: any) {
  const { restaurant } = route.params;
  const [activeTab, setActiveTab] = useState<TabType>('customers');

  // Simple restaurant stats query - similar to ProfileScreen pattern
  const { data: restaurantStats } = useQuery({
    queryKey: ['restaurantStats', restaurant.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_restaurant_stats')
        .select(`
          *,
          user:users(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('total_spent', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id, // Only run when restaurant data is available
  });

  // Posts query with immediate rendering
  const { data: posts } = useQuery({
    queryKey: ['restaurantPosts', restaurant.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          transaction:transactions(*),
          restaurant:restaurants(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!restaurant?.id,
  });

  // Simple restaurant data - no complex aggregations
  const { data: restaurantData } = useQuery({
    queryKey: ['restaurantData', restaurant.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurant.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id,
  });

  // Calculate stats from existing data (like ProfileScreen does)
  const totalVisits = restaurantStats?.reduce((sum, stat) => sum + (stat.visit_count || 0), 0) || 0;
  const totalRevenue = restaurantStats?.reduce((sum, stat) => sum + parseFloat(stat.total_spent || 0), 0) || 0;
  const frequencyStats = restaurantStats?.sort((a, b) => b.visit_count - a.visit_count);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => navigation.navigate('PostDetail', { post: item })}
        >
          <Image
            source={{ 
              uri: item.user?.avatar || (item.user?.name === 'Mazz' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' : 'https://via.placeholder.com/40')
            }}
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/40' }}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user?.name}</Text>
            <View style={styles.locationContainer}>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${item.transaction?.amount}</Text>
        </View>
      </View>
      
      {/* Post Image */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PostDetail', { post: item })}
        activeOpacity={0.9}
      >
        {item.images && item.images.length > 0 && (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.postImage}
            resizeMode="cover"
            loadingIndicatorSource={{ uri: 'https://via.placeholder.com/200' }}
          />
        )}
      </TouchableOpacity>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={24} color="#8e8e8e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#8e8e8e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="#8e8e8e" />
        </TouchableOpacity>
        <View style={styles.bookmarkContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color="#8e8e8e" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Post Content */}
      <View style={styles.postContentContainer}>
        <Text style={styles.likeCount}>
          <Text style={styles.boldText}>{item.likes_count}</Text> likes
        </Text>
        
        {item.content && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.boldText}>{item.user?.name}</Text> {item.content}
            </Text>
          </View>
        )}
        
        {item.comments_count > 0 && (
          <TouchableOpacity 
            style={styles.commentsPreview}
            onPress={() => navigation.navigate('PostDetail', { post: item })}
          >
            <Text style={styles.commentCount}>
              View all {item.comments_count} comments
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const renderCustomerRanking = (customer: any, index: number) => (
    <View key={customer.user_id} style={styles.customerCard}>
      <View style={styles.customerRank}>
        <Text style={styles.rankIcon}>{getRankIcon(index)}</Text>
      </View>
      <Image
        source={{ 
          uri: customer.user?.avatar || (customer.user?.name === 'Mazz' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' : 'https://via.placeholder.com/50')
        }}
        style={styles.customerAvatar}
        defaultSource={{ uri: 'https://via.placeholder.com/50' }}
        resizeMode="cover"
      />
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{customer.user?.name}</Text>
      </View>
      <View style={styles.customerStats}>
        <View style={styles.statBadge}>
          <Ionicons name="restaurant" size={16} color="#FF6B6B" />
          <Text style={styles.statText}>{customer.visit_count} visits</Text>
        </View>
        <View style={styles.statBadge}>
          <Ionicons name="cash" size={16} color="#4ECDC4" />
          <Text style={styles.statText}>${customer.total_spent.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  // Render immediately like ProfileScreen - no blocking loading state

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

  const renderCustomersView = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Regulars</Text>
      {restaurantStats && restaurantStats.length > 0 ? (
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {restaurantStats.slice(0, 10).map((customer: any, index: number) => 
            renderCustomerRanking(customer, index)
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No customer data yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Customer rankings will appear as people visit and spend at this restaurant
          </Text>
        </View>
      )}
    </View>
  );

  const renderSpendingView = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Spenders</Text>
      {restaurantStats && restaurantStats.length > 0 ? (
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {restaurantStats.slice(0, 10).map((customer: any, index: number) => 
            renderCustomerRanking(customer, index)
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cash" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No spending data yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Spending data will appear as customers make purchases
          </Text>
        </View>
      )}
    </View>
  );

  const renderPostsView = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Recents</Text>
      {posts && posts.length > 0 ? (
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {renderPost({ item: post })}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="camera" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No posts yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Posts will appear here when customers share their dining experiences
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Restaurant Section */}
      <View style={styles.heroSection}>
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#8e8e8e" />
            </TouchableOpacity>
          </View>
          <View style={styles.restaurantInfo}>
            {restaurant.hero_image ? (
              <Image 
                source={{ uri: restaurant.hero_image }} 
                style={styles.restaurantImage}
                resizeMode="cover"
                defaultSource={{ uri: 'https://via.placeholder.com/80' }}
              />
            ) : (
              <View style={styles.restaurantImagePlaceholder}>
                <Ionicons name="restaurant" size={40} color="#FF6B6B" />
              </View>
            )}
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.restaurantMeta}>
              <Ionicons name="location" size={16} color="#8e8e8e" />
              <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
            </View>
          </View>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalVisits}</Text>
              <Text style={styles.statLabel}>Total Visits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>${totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts?.length || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('customers', 'Regulars', 'people-outline')}
        {renderTabButton('spending', 'Spenders', 'cash-outline')}
        {renderTabButton('posts', 'Recents', 'camera-outline')}
      </View>

      {/* Tab Content */}
      {activeTab === 'customers' && renderCustomersView()}
      {activeTab === 'spending' && renderSpendingView()}
      {activeTab === 'posts' && renderPostsView()}
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
  loadingText: {
    fontSize: 16,
    color: '#8e8e8e',
    marginTop: 16,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  // Hero Restaurant Section
  heroSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  restaurantCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  restaurantImage: {
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
  restaurantImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantAddress: {
    fontSize: 16,
    color: '#8e8e8e',
    marginLeft: 6,
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

  // Enhanced Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: -10,
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
  feedContainer: {
    flex: 1,
  },
  rankingsList: {
    gap: 12,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerRank: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: '#000',
    marginBottom: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  amountContainer: {
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  bookmarkContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  postContentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likeCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '600',
  },
  captionContainer: {
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  commentsPreview: {
    marginTop: 4,
  },
  commentCount: {
    fontSize: 14,
    color: '#8e8e8e',
  },

  // Enhanced Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e8e',
    marginTop: 16,
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
