import { supabase } from './supabase';

export class TestDbService {
  static async testConnection() {
    try {
      console.log('Testing database connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection error:', error);
        return false;
      }

      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database test failed:', error);
      return false;
    }
  }

  static async testTransactionInsert() {
    try {
      console.log('Testing transaction insert...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      const testTransaction = {
        user_id: user.id,
        plaid_transaction_id: `test-${Date.now()}`,
        amount: 10.00,
        merchant: 'Test Restaurant',
        date: '2024-01-01',
        category: 'Food and Drink',
        restaurant_id: null,
      };

      console.log('Inserting test transaction:', testTransaction);

      const { data, error } = await supabase
        .from('transactions')
        .insert(testTransaction)
        .select()
        .single();

      if (error) {
        console.error('Transaction insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('Transaction insert successful:', data);
      return true;
    } catch (error) {
      console.error('Transaction test failed:', error);
      return false;
    }
  }

  static async testRestaurantInsert() {
    try {
      console.log('Testing restaurant insert...');
      
      const testRestaurant = {
        name: `Test Restaurant ${Date.now()}`,
        address: 'Test Address',
        coordinates: null,
      };

      console.log('Inserting test restaurant:', testRestaurant);

      const { data, error } = await supabase
        .from('restaurants')
        .insert(testRestaurant)
        .select()
        .single();

      if (error) {
        console.error('Restaurant insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('Restaurant insert successful:', data);
      return data;
    } catch (error) {
      console.error('Restaurant test failed:', error);
      return false;
    }
  }

  static async runAllTests() {
    console.log('Running database tests...');
    
    const connectionTest = await this.testConnection();
    if (!connectionTest) {
      console.error('Database connection failed');
      return;
    }

    const restaurantTest = await this.testRestaurantInsert();
    if (!restaurantTest) {
      console.error('Restaurant insert failed');
      return;
    }

    const transactionTest = await this.testTransactionInsert();
    if (!transactionTest) {
      console.error('Transaction insert failed');
      return;
    }

    console.log('All database tests passed!');
  }
}
