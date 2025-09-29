import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PostDetailScreen({ route }: any) {
  const { post } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <Image
            source={{ uri: post.user?.avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.user?.name}</Text>
            <View style={styles.locationContainer}>
              {post.transaction?.restaurant && (
                <Text style={styles.restaurantName}>📍 {post.transaction.restaurant.name}</Text>
              )}
              <Text style={styles.timestamp}>
                {new Date(post.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${post.transaction?.amount}</Text>
        </View>
      </View>

      {/* Post Image */}
      {post.images && post.images.length > 0 && (
        <Image source={{ uri: post.images[0] }} style={styles.postImage} />
      )}

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
          <Text style={styles.boldText}>{post.likes_count}</Text> likes
        </Text>
        
        {post.content && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.boldText}>{post.user?.name}</Text> {post.content}
            </Text>
          </View>
        )}
        
        {post.comments_count > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentCount}>
              View all {post.comments_count} comments
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
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
  restaurantName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
    marginRight: 8,
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
  commentsSection: {
    marginTop: 4,
  },
  commentCount: {
    fontSize: 14,
    color: '#8e8e8e',
  },
});
