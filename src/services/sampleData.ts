import { supabase } from './supabase';

export class SampleDataService {
  static async addSampleRestaurants() {
    const restaurants = [
      {
        name: 'Starbucks',
        address: '123 Main St, San Francisco, CA',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        hero_image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
      },
      {
        name: 'McDonald\'s',
        address: '456 Market St, San Francisco, CA',
        coordinates: { lat: 37.7849, lng: -122.4094 },
        hero_image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
      },
      {
        name: 'Chipotle',
        address: '789 Mission St, San Francisco, CA',
        coordinates: { lat: 37.7849, lng: -122.4094 },
        hero_image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      },
      {
        name: 'Blue Bottle Coffee',
        address: '321 Valencia St, San Francisco, CA',
        coordinates: { lat: 37.7549, lng: -122.4294 },
        hero_image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
      },
      {
        name: 'In-N-Out Burger',
        address: '654 Castro St, San Francisco, CA',
        coordinates: { lat: 37.7649, lng: -122.4194 },
        hero_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      },
    ];

    for (const restaurant of restaurants) {
      // Check if restaurant already exists
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('name', restaurant.name)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('restaurants')
          .insert(restaurant)
          .select()
          .single();

        if (error) {
          console.error('Error adding restaurant:', error);
        }
      }
    }
  }

  static async addSampleTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name');

    if (!restaurants || restaurants.length === 0) {
      console.log('No restaurants found, adding sample restaurants first');
      await this.addSampleRestaurants();
      return;
    }

    const transactions = [
      {
        user_id: user.id,
        plaid_transaction_id: 'sample-txn-1',
        amount: 25.50,
        merchant: 'Starbucks',
        date: '2024-01-15',
        category: 'Food and Drink',
        restaurant_id: restaurants.find(r => r.name === 'Starbucks')?.id,
      },
      {
        user_id: user.id,
        plaid_transaction_id: 'sample-txn-2',
        amount: 45.00,
        merchant: 'McDonald\'s',
        date: '2024-01-14',
        category: 'Food and Drink',
        restaurant_id: restaurants.find(r => r.name === 'McDonald\'s')?.id,
      },
      {
        user_id: user.id,
        plaid_transaction_id: 'sample-txn-3',
        amount: 12.75,
        merchant: 'Chipotle',
        date: '2024-01-13',
        category: 'Food and Drink',
        restaurant_id: restaurants.find(r => r.name === 'Chipotle')?.id,
      },
      {
        user_id: user.id,
        plaid_transaction_id: 'sample-txn-4',
        amount: 8.50,
        merchant: 'Blue Bottle Coffee',
        date: '2024-01-12',
        category: 'Food and Drink',
        restaurant_id: restaurants.find(r => r.name === 'Blue Bottle Coffee')?.id,
      },
      {
        user_id: user.id,
        plaid_transaction_id: 'sample-txn-5',
        amount: 15.25,
        merchant: 'In-N-Out Burger',
        date: '2024-01-11',
        category: 'Food and Drink',
        restaurant_id: restaurants.find(r => r.name === 'In-N-Out Burger')?.id,
      },
    ];

    for (const transaction of transactions) {
      const { error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error && !error.message.includes('duplicate')) {
        console.error('Error adding transaction:', error);
      }
    }
  }

  static async addSamplePosts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        *,
        restaurant:restaurants(*)
      `)
      .eq('user_id', user.id)
      .limit(3);

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found, adding sample transactions first');
      await this.addSampleTransactions();
      return;
    }

    const posts = [
      {
        user_id: user.id,
        transaction_id: transactions[0].id,
        content: 'Great coffee and atmosphere! ☕️',
        images: ['https://picsum.photos/400/300?random=1'],
      },
      {
        user_id: user.id,
        transaction_id: transactions[1].id,
        content: 'Quick lunch, always reliable 🍔',
        images: ['https://picsum.photos/400/300?random=2'],
      },
      {
        user_id: user.id,
        transaction_id: transactions[2].id,
        content: 'Love the burrito bowls here! 🌯',
        images: ['https://picsum.photos/400/300?random=3'],
      },
    ];

    for (const post of posts) {
      const { error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();

      if (error && !error.message.includes('duplicate')) {
        console.error('Error adding post:', error);
      }
    }
  }

  static async updateUserRestaurantStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('Updating user restaurant stats...');

    // Get all transactions for the user
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .not('restaurant_id', 'is', null);

    if (!transactions || transactions.length === 0) {
      console.log('No transactions with restaurant_id found');
      return;
    }

    // Group by restaurant and calculate stats
    const stats = transactions.reduce((acc, transaction) => {
      const restaurantId = transaction.restaurant_id;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          user_id: user.id,
          restaurant_id: restaurantId,
          visit_count: 0,
          total_spent: 0,
          last_visit: transaction.date,
        };
      }
      acc[restaurantId].visit_count += 1;
      acc[restaurantId].total_spent += parseFloat(transaction.amount);
      if (new Date(transaction.date) > new Date(acc[restaurantId].last_visit)) {
        acc[restaurantId].last_visit = transaction.date;
      }
      return acc;
    }, {});

    // Insert or update stats
    for (const [restaurantId, stat] of Object.entries(stats)) {
      const { error } = await supabase
        .from('user_restaurant_stats')
        .upsert(stat, { onConflict: 'user_id,restaurant_id' });

      if (error) {
        console.error('Error updating stats for restaurant:', restaurantId, error);
      }
    }

    console.log('User restaurant stats updated successfully!');
  }

  static async addAllSampleData() {
    console.log('Adding sample data...');
    await this.addSampleRestaurants();
    await this.addSampleTransactions();
    await this.addSamplePosts();
    await this.updateUserRestaurantStats();
    console.log('Sample data added successfully!');
  }
}
