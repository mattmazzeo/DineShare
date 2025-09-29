import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Post } from '../types';
import { SampleDataService } from '../services/sampleData';
import { PlaidService } from '../services/plaid';

export default function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      console.log('Fetching posts...');
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(*),
          transaction:transactions(
            *,
            restaurant:restaurants(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      console.log('Posts fetched:', data);
      console.log('Number of posts:', data?.length || 0);
      return data as Post[];
    },
  });

  // Fetch user's hitlist
  const { data: hitlistRestaurants, refetch: refetchHitlist } = useQuery({
    queryKey: ['hitlist'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('hitlist')
        .select('restaurant_id')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching hitlist:', error);
        return [];
      }
      return data?.map(item => item.restaurant_id) || [];
    },
  });

  const isOnHitlist = (restaurantId?: string) => {
    if (!restaurantId) return false;
    return hitlistRestaurants?.includes(restaurantId);
  };

  const toggleHitlist = async (restaurantId?: string) => {
    if (!restaurantId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Please log in to add to your HitList');
      return;
    }

    if (isOnHitlist(restaurantId)) {
      // Remove from hitlist
      const { error } = await supabase
        .from('hitlist')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('Error removing from hitlist:', error);
        Alert.alert('Error', 'Failed to remove from HitList');
      } else {
        refetchHitlist();
      }
    } else {
      // Add to hitlist
      const { error } = await supabase
        .from('hitlist')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
        });

      if (error) {
        console.error('Error adding to hitlist:', error);
        Alert.alert('Error', 'Failed to add to HitList');
      } else {
        Alert.alert('Added!', 'Restaurant added to your HitList');
        refetchHitlist();
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const testSampleData = async () => {
    try {
      console.log('Adding sample data...');
      await SampleDataService.addAllSampleData();
      Alert.alert('Success', 'Sample data added successfully!');
      await refetch();
    } catch (error) {
      console.error('Error adding sample data:', error);
      Alert.alert('Error', 'Failed to add sample data');
    }
  };

  const testPlaidTransactions = async () => {
    try {
      console.log('Testing Plaid transaction processing...');
      const timestamp = Date.now();
      const mockTransactions = [
        {
          id: `test-txn-${timestamp}-1`,
          amount: 15.50,
          merchant: 'Test Restaurant',
          date: '2024-01-15',
          category: 'Food and Drink',
        },
        {
          id: `test-txn-${timestamp}-2`,
          amount: 25.00,
          merchant: 'Test Cafe',
          date: '2024-01-14',
          category: 'Food and Drink',
        },
      ];
      
      await PlaidService.processTransactions(mockTransactions);
      
      // Create posts for the transactions
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .in('plaid_transaction_id', mockTransactions.map(t => t.id))
          .limit(2);

        if (transactions && transactions.length > 0) {
          const posts = [
            {
              user_id: user.id,
              transaction_id: transactions[0].id,
              content: 'Great food at Test Restaurant! 🍽️',
              images: ['https://picsum.photos/400/300?random=4'],
            },
            {
              user_id: user.id,
              transaction_id: transactions[1]?.id,
              content: 'Love the coffee here! ☕',
              images: ['https://picsum.photos/400/300?random=5'],
            },
          ];

          for (const post of posts) {
            if (post.transaction_id) {
              await supabase.from('posts').insert(post);
            }
          }
        }
      }
      
      Alert.alert('Success', 'Test transactions and posts created!');
      await refetch();
    } catch (error) {
      console.error('Error processing test transactions:', error);
      Alert.alert('Error', 'Failed to process test transactions');
    }
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const success = await PlaidService.testDatabaseConnection();
      if (success) {
        Alert.alert('Success', 'Database connection test passed!');
      } else {
        Alert.alert('Error', 'Database connection test failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error testing database connection:', error);
      Alert.alert('Error', 'Database connection test failed');
    }
  };

  const checkPostsInDatabase = async () => {
    try {
      console.log('Checking posts in database...');
      
      // Check posts table
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*');
      
      if (postsError) {
        console.error('Error fetching posts:', postsError);
        Alert.alert('Error', 'Failed to fetch posts');
        return;
      }
      
      console.log('Posts in database:', posts);
      console.log('Number of posts:', posts?.length || 0);
      
      // Check transactions table
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*');
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        console.log('Transactions in database:', transactions);
        console.log('Number of transactions:', transactions?.length || 0);
      }
      
      Alert.alert('Database Check', `Posts: ${posts?.length || 0}, Transactions: ${transactions?.length || 0}`);
    } catch (error) {
      console.error('Error checking database:', error);
      Alert.alert('Error', 'Failed to check database');
    }
  };

  const fixImageUrls = async () => {
    try {
      console.log('Fixing image URLs...');
      
      // Get all posts first
      const { data: allPosts, error: fetchError } = await supabase
        .from('posts')
        .select('id, images');
      
      if (fetchError) {
        console.error('Error fetching posts:', fetchError);
        Alert.alert('Error', 'Failed to fetch posts');
        return;
      }
      
      // Filter posts with old Unsplash URLs
      const postsWithOldUrls = allPosts?.filter(post => 
        post.images && post.images.some((img: string) => img.includes('unsplash'))
      ) || [];
      
      console.log(`Found ${postsWithOldUrls.length} posts with old image URLs`);
      
      // Update each post with new Picsum URLs
      for (let i = 0; i < postsWithOldUrls.length; i++) {
        const post = postsWithOldUrls[i];
        const newImages = [`https://picsum.photos/400/300?random=${i + 100}`];
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ images: newImages })
          .eq('id', post.id);
        
        if (updateError) {
          console.error('Error updating post:', updateError);
        } else {
          console.log(`Updated post ${post.id} with new image URL`);
        }
      }
      
      Alert.alert('Success', `Updated ${postsWithOldUrls.length} posts with new image URLs!`);
      await refetch();
    } catch (error) {
      console.error('Error fixing image URLs:', error);
      Alert.alert('Error', 'Failed to fix image URLs');
    }
  };

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
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user?.name}</Text>
            <View style={styles.locationContainer}>
              {item.transaction?.restaurant && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Restaurant', { restaurant: item.transaction.restaurant })}
                  style={styles.restaurantNameContainer}
                >
                  <Text style={styles.restaurantName}>📍 {item.transaction.restaurant.name}</Text>
                </TouchableOpacity>
              )}
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
            onError={(error) => {
              console.log('Image load error:', error);
            }}
            defaultSource={{ uri: 'https://picsum.photos/400/300?random=999' }}
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
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleHitlist(item.transaction?.restaurant_id)}
          >
            <Ionicons
              name={isOnHitlist(item.transaction?.restaurant_id) ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isOnHitlist(item.transaction?.restaurant_id) ? '#FF6B6B' : '#8e8e8e'}
            />
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.testButtons}>
        <TouchableOpacity style={styles.testButton} onPress={testSampleData}>
          <Text style={styles.testButtonText}>Add Sample Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testButton} onPress={testPlaidTransactions}>
          <Text style={styles.testButtonText}>Test Plaid</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testButton} onPress={testDatabaseConnection}>
          <Text style={styles.testButtonText}>Test DB</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testButton} onPress={checkPostsInDatabase}>
          <Text style={styles.testButtonText}>Check DB</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testButton} onPress={fixImageUrls}>
          <Text style={styles.testButtonText}>Fix Images</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
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
  },
  listContainer: {
    paddingBottom: 20,
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
  restaurantNameContainer: {
    marginRight: 8,
  },
  restaurantName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
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
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    backgroundColor: '#000',
  },
  testButton: {
    width: '48%',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
