import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PlaidService } from '../services/plaid';
import { PlaidLinkResult } from '../types';

interface PlaidLinkComponentProps {
  onSuccess?: (result: PlaidLinkResult) => void;
  onExit?: () => void;
}

export default function PlaidLinkComponent({ onSuccess, onExit }: PlaidLinkComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    setIsLoading(true);
    try {
      // Simulate the Plaid Link flow for development
      Alert.alert(
        'Connect Bank Account',
        'This would normally open Plaid Link to connect your bank account. For development, we\'ll simulate a successful connection.',
        [
          {
            text: 'Cancel',
            onPress: () => {
              setIsLoading(false);
              onExit?.();
            },
            style: 'cancel',
          },
          {
            text: 'Connect',
            onPress: async () => {
              try {
                // Simulate successful bank connection
                const mockResult: PlaidLinkResult = {
                  public_token: 'mock-public-token',
                  metadata: {
                    institution: {
                      name: 'Chase Bank',
                      institution_id: 'chase',
                    },
                    accounts: [
                      {
                        id: 'acc-1',
                        name: 'Checking Account',
                        type: 'depository',
                        subtype: 'checking',
                      },
                    ],
                  },
                };

                // Exchange the public token for an access token
                await PlaidService.exchangePublicToken(mockResult.public_token, mockResult.metadata);
                
                // Process some sample transactions
                const { transactions } = await PlaidService.getTransactions('mock-access-token', '2024-01-01', '2024-01-31');
                await PlaidService.processTransactions(transactions);
                
                Alert.alert('Success', 'Bank account connected successfully! Sample transactions have been imported.');
                onSuccess?.(mockResult);
              } catch (error) {
                console.error('Error in mock bank connection:', error);
                Alert.alert('Error', 'Failed to connect bank account');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating link token:', error);
      Alert.alert('Error', 'Failed to initialize bank connection');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Connect Bank Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
