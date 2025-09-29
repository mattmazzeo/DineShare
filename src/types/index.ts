export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  plaid_transaction_id: string;
  amount: number;
  merchant: string;
  date: string;
  category: string;
  restaurant_id?: string;
}

export interface Post {
  id: string;
  user_id: string;
  transaction_id: string;
  content?: string;
  images: string[];
  created_at: string;
  user?: User;
  transaction?: Transaction;
  restaurant?: Restaurant;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  hero_image?: string;
  created_at: string;
  visit_count: number;
  total_spent: number;
}

export interface UserRestaurantStats {
  user_id: string;
  restaurant_id: string;
  visit_count: number;
  total_spent: number;
  last_visit: string;
  user?: User;
  restaurant?: Restaurant;
}

export interface Friendship {
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  user?: User;
  friend?: User;
}

export interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface PlaidLinkResult {
  public_token: string;
  metadata: {
    institution: {
      name: string;
      institution_id: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      subtype: string;
    }>;
  };
}
