import { PlaidLinkResult } from '../types';
import { supabase } from './supabase';

export class PlaidService {
  static async createLinkToken(userId: string): Promise<string> {
    // For development, we'll use a mock approach
    // In production, this would call your backend API
    console.log('Creating link token for user:', userId);
    
    // Return a mock token for development
    // In production, this would be a real Plaid link token from your backend
    return 'link-sandbox-mock-token-for-development';
  }

  static async exchangePublicToken(publicToken: string, metadata: any) {
    console.log('Exchanging public token:', publicToken);
    console.log('Metadata:', metadata);
    
    // For development, we'll simulate the token exchange
    // In production, this would call your backend to exchange the token
    const mockAccessToken = `access-sandbox-${Date.now()}`;
    
    // Store the access token in the database for this user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // In a real app, you'd store this in a user_tokens table
      console.log('Storing access token for user:', user.id);
    }
    
    return { access_token: mockAccessToken };
  }

  static async getTransactions(accessToken: string, startDate: string, endDate: string) {
    console.log('Fetching transactions with access token:', accessToken);
    console.log('Date range:', startDate, 'to', endDate);
    
    // For development, return mock transaction data
    const mockTransactions = [
      {
        id: 'txn-1',
        amount: 25.50,
        merchant: 'Starbucks',
        date: '2024-01-15',
        category: 'Food and Drink',
        restaurant_id: null,
      },
      {
        id: 'txn-2',
        amount: 45.00,
        merchant: 'McDonald\'s',
        date: '2024-01-14',
        category: 'Food and Drink',
        restaurant_id: null,
      },
      {
        id: 'txn-3',
        amount: 12.75,
        merchant: 'Chipotle',
        date: '2024-01-13',
        category: 'Food and Drink',
        restaurant_id: null,
      },
    ];
    
    return { transactions: mockTransactions };
  }

  static async getAccounts(accessToken: string) {
    console.log('Fetching accounts with access token:', accessToken);
    
    // For development, return mock account data
    const mockAccounts = [
      {
        id: 'acc-1',
        name: 'Checking Account',
        type: 'depository',
        subtype: 'checking',
        balance: 1250.75,
      },
    ];
    
    return { accounts: mockAccounts };
  }

  static async processTransactions(transactions: any[]) {
    console.log('Processing transactions:', transactions);
    
    // Process transactions and categorize restaurant spending
    const restaurantTransactions = transactions.filter(txn => 
      txn.category === 'Food and Drink' || 
      txn.merchant.toLowerCase().includes('restaurant') ||
      txn.merchant.toLowerCase().includes('cafe') ||
      txn.merchant.toLowerCase().includes('diner')
    );

    console.log('Restaurant transactions found:', restaurantTransactions);

    // Store transactions in the database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    console.log('Processing transactions for user:', user.id);

    // Ensure user exists in the users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('Error checking user:', userError);
      return;
    }

    if (!existingUser) {
      console.log('User not found in users table, creating user record...');
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || 'Unknown User',
          avatar: user.user_metadata?.avatar_url || null
        });

      if (createUserError) {
        console.error('Error creating user record:', createUserError);
        return;
      }
      console.log('User record created successfully');
    }

    for (const txn of restaurantTransactions) {
      try {
        console.log('Processing transaction:', txn);
        
        // Validate transaction data before storing
        if (!txn.id || !txn.amount || !txn.merchant || !txn.date || !txn.category) {
          console.error('Invalid transaction data - missing required fields:', txn);
          continue;
        }

        // Store transaction with null restaurant_id first
        const transactionData = {
          user_id: user.id,
          plaid_transaction_id: txn.id,
          amount: parseFloat(txn.amount.toString()), // Ensure it's a number
          merchant: txn.merchant.toString(),
          date: txn.date.toString(),
          category: txn.category.toString(),
          restaurant_id: null, // Start with null to avoid foreign key issues
        };

        console.log('Transaction data prepared (with null restaurant_id):', transactionData);

        // Additional validation
        if (!transactionData.user_id) {
          console.error('Missing user_id in transaction data');
          continue;
        }
        
        if (!transactionData.plaid_transaction_id) {
          console.error('Missing plaid_transaction_id in transaction data');
          continue;
        }

        // Check if transaction already exists
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('plaid_transaction_id', transactionData.plaid_transaction_id)
          .eq('user_id', transactionData.user_id)
          .maybeSingle();

        if (existingTransaction) {
          console.log('Transaction already exists, skipping:', transactionData.plaid_transaction_id);
          continue;
        }

        console.log('Inserting transaction data:', transactionData);

        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();

        if (error) {
          console.error('Error storing transaction:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Transaction data that failed:', JSON.stringify(transactionData, null, 2));
          
          // Try to identify the specific issue
          if (error.code === '23505') {
            console.error('Duplicate key error - transaction already exists');
          } else if (error.code === '23503') {
            console.error('Foreign key constraint error - invalid restaurant_id');
          } else if (error.code === '23502') {
            console.error('Not null constraint error - missing required field');
          } else if (error.code === '42501') {
            console.error('Permission denied - RLS policy blocking insert');
          } else if (error.code === 'PGRST116') {
            console.error('Row Level Security policy violation');
          }
        } else {
          console.log('Transaction stored successfully:', data);
          
          // Now try to find and associate restaurant
          console.log('Looking for restaurant for merchant:', txn.merchant);
          let restaurant = await this.findOrCreateRestaurant(txn.merchant);
          console.log('Restaurant found/created:', restaurant);
          
          if (restaurant?.id) {
            console.log('Updating transaction with restaurant_id:', restaurant.id);
            const { error: updateError } = await supabase
              .from('transactions')
              .update({ restaurant_id: restaurant.id })
              .eq('id', data.id);
            
            if (updateError) {
              console.error('Error updating restaurant_id:', updateError);
            } else {
              console.log('Restaurant_id updated successfully');
            }
          }
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
        console.error('Transaction that failed:', txn);
      }
    }
  }

  static async testDatabaseConnection() {
    try {
      console.log('Testing database connection and RLS policies...');
      
      // Test 1: Check if we can read from users table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Test 2: Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error checking user:', userError);
        return false;
      }

      if (!userData) {
        console.error('User not found in users table');
        return false;
      }

      // Test 3: Try to insert a test transaction
      const testData = {
        user_id: user.id,
        plaid_transaction_id: `test-${Date.now()}`,
        amount: 1.00,
        merchant: 'Test Merchant',
        date: '2024-01-01',
        category: 'Test',
        restaurant_id: null,
      };

      console.log('Testing transaction insert with:', testData);

      const { data, error } = await supabase
        .from('transactions')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('Database test failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return false;
      }

      console.log('Database test successful:', data);

      // Clean up test data
      await supabase
        .from('transactions')
        .delete()
        .eq('id', data.id);

      console.log('Test transaction cleaned up');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  static async findOrCreateRestaurant(merchantName: string) {
    try {
      console.log('Looking for restaurant:', merchantName);
      
      // Try to find existing restaurant
      const { data: existing, error: findError } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${merchantName}%`)
        .maybeSingle();

      if (findError) {
        console.error('Error finding restaurant:', findError);
        return null;
      }

      if (existing) {
        console.log('Found existing restaurant:', existing);
        return existing;
      }

      console.log('Creating new restaurant:', merchantName);

      // Create new restaurant
      const { data: newRestaurant, error } = await supabase
        .from('restaurants')
        .insert({
          name: merchantName,
          address: 'Unknown Address', // In production, you'd geocode this
          coordinates: null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating restaurant:', error);
        console.error('Restaurant creation failed, continuing without restaurant_id');
        return null;
      }

      console.log('Created new restaurant:', newRestaurant);
      return newRestaurant;
    } catch (error) {
      console.error('Error in findOrCreateRestaurant:', error);
      return null;
    }
  }
}
