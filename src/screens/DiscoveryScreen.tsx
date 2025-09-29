import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Restaurant } from '../types';

type TabType = 'friends' | 'restaurants' | 'hitlist';

export default function DiscoveryScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all restaurants
  const { data: restaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['allRestaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Deduplicate restaurants by name (keep the first occurrence)
      const uniqueRestaurants = data?.reduce((acc: Restaurant[], current: Restaurant) => {
        const existing = acc.find(restaurant => restaurant.name === current.name);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []) || [];
      
      return uniqueRestaurants;
    },
  });

  // Fetch HitList restaurants
  const { data: hitlistRestaurants, isLoading: loadingHitlist, refetch: refetchHitlist } = useQuery({
    queryKey: ['hitlist'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('hitlist')
        .select('*, restaurant:restaurants(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch users for friends tab
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const addToHitlist = async (restaurantId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('hitlist')
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
      });

    if (!error) {
      refetchHitlist();
    }
  };

  const removeFromHitlist = async (restaurantId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('hitlist')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId);

    if (!error) {
      refetchHitlist();
    }
  };

  const isOnHitlist = (restaurantId: string) => {
    return hitlistRestaurants?.some(item => item.restaurant_id === restaurantId);
  };


  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <View style={styles.restaurantImageContainer}>
        {item.hero_image ? (
          <Image
            source={{ uri: item.hero_image }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.restaurantImagePlaceholder}>
            <Ionicons name="restaurant" size={32} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantAddress} numberOfLines={1}>
          📍 {item.address}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.hitlistButton}
        onPress={(e) => {
          e.stopPropagation();
          if (isOnHitlist(item.id)) {
            removeFromHitlist(item.id);
          } else {
            addToHitlist(item.id);
          }
        }}
      >
        <Ionicons
          name={isOnHitlist(item.id) ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isOnHitlist(item.id) ? '#FF6B6B' : '#666'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: any) => (
    <TouchableOpacity style={styles.userCard}>
      <Image
        source={{ 
          uri: item.avatar || (item.name === 'Mazz' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' : 'https://via.placeholder.com/50')
        }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHitlistItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item.restaurant })}
    >
      <View style={styles.restaurantImageContainer}>
        {item.restaurant?.hero_image ? (
          <Image
            source={{ uri: item.restaurant.hero_image }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.restaurantImagePlaceholder}>
            <Ionicons name="restaurant" size={32} color="#666" />
          </View>
        )}
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
        <Text style={styles.restaurantAddress} numberOfLines={1}>
          📍 {item.restaurant?.address}
        </Text>
        <Text style={styles.addedDate}>
          Added {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.hitlistButton}
        onPress={(e) => {
          e.stopPropagation();
          removeFromHitlist(item.restaurant_id);
        }}
      >
        <Ionicons name="bookmark" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTabButton = (tab: TabType, title: string, iconName: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={iconName as any}
        size={20}
        color={activeTab === tab ? '#FF6B6B' : '#666'}
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    const filteredData = getFilteredData();

    if (activeTab === 'friends') {
      return (
        <FlatList
          data={filteredData}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#333" />
              <Text style={styles.emptyStateText}>
                {searchQuery.length > 0 ? 'No friends found' : 'No users found'}
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'restaurants') {
      return (
        <FlatList
          data={filteredData}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#333" />
              <Text style={styles.emptyStateText}>
                {searchQuery.length > 0 ? 'No restaurants found' : 'No restaurants available'}
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'hitlist') {
      return (
        <FlatList
          data={filteredData}
          renderItem={renderHitlistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={64} color="#333" />
              <Text style={styles.emptyStateText}>
                {searchQuery.length > 0 ? 'No items found in HitList' : 'Your HitList is empty'}
              </Text>
              {searchQuery.length === 0 && (
                <Text style={styles.emptyStateSubtext}>
                  Bookmark restaurants you want to try
                </Text>
              )}
            </View>
          }
        />
      );
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'friends':
        return 'Search friends...';
      case 'restaurants':
        return 'Search restaurants...';
      case 'hitlist':
        return 'Search your HitList...';
      default:
        return 'Search...';
    }
  };

  const getFilteredData = () => {
    if (activeTab === 'restaurants') {
      return restaurants?.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'friends') {
      return users?.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'hitlist') {
      return hitlistRestaurants?.filter(item =>
        item.restaurant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.restaurant?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return [];
  };

  return (
    <View style={styles.container}>
      {/* Search Bar - Always visible */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={getSearchPlaceholder()}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton('friends', 'Friends', 'people-outline')}
        {renderTabButton('restaurants', 'Restaurants', 'restaurant-outline')}
        {renderTabButton('hitlist', 'HitList', 'bookmark-outline')}
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#262626',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#FF6B6B',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  restaurantImageContainer: {
    marginRight: 12,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  restaurantImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: '#8e8e8e',
  },
  addedDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  hitlistButton: {
    padding: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
