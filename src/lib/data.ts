import type { User, Transaction } from './types';

// Helper to generate a random 6-digit alphanumeric account number
const generateAccountNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


// In-memory store to simulate a database
let users: User[] = [
  {
    uid: 'user-1-uid',
    email: 'john.doe@example.com',
    name: 'John Doe',
    photoURL: 'https://picsum.photos/seed/user1/100/100',
    balance: 5000.75,
    accountNumber: generateAccountNumber(),
  },
  {
    uid: 'user-2-uid',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    photoURL: 'https://picsum.photos/seed/user2/100/100',
    balance: 1250.25,
    accountNumber: generateAccountNumber(),
  },
  {
    uid: 'user-3-uid',
    email: 'banker.bob@example.com',
    name: 'Banker Bob',
    photoURL: 'https://picsum.photos/seed/user3/100/100',
    balance: 1000000,
    accountNumber: generateAccountNumber(),
  }
];

let transactions: Transaction[] = [
  {
    id: 'txn-1',
    from: { uid: 'user-2-uid', name: 'Jane Smith', email: 'jane.smith@example.com' },
    to: { uid: 'user-1-uid', name: 'John Doe', email: 'john.doe@example.com' },
    amount: 250.0,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Coffee supplies',
    status: 'completed',
    type: 'received',
  },
  {
    id: 'txn-2',
    from: { uid: 'user-1-uid', name: 'John Doe', email: 'john.doe@example.com' },
    to: { uid: 'user-2-uid', name: 'Jane Smith', email: 'jane.smith@example.com' },
    amount: 75.5,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Dinner reimbursement',
    status: 'completed',
    type: 'sent',
  },
    {
    id: 'txn-3',
    from: { uid: 'user-3-uid', name: 'Banker Bob', email: 'banker.bob@example.com' },
    to: { uid: 'user-1-uid', name: 'John Doe', email: 'john.doe@example.com' },
    amount: 1000,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Initial deposit',
    status: 'completed',
    type: 'received',
  },
];

// --- User Functions ---

export const db_findUserBy = async (field: 'uid' | 'email' | 'accountNumber', value: string): Promise<User | undefined> => {
    let queryValue = value;
    if (field === 'email' || field === 'accountNumber') {
      queryValue = value.toLowerCase();
    }

    return users.find((user) => {
        if (field === 'email') {
            return user.email.toLowerCase() === queryValue;
        }
        if (field === 'accountNumber') {
            return user.accountNumber.toLowerCase() === queryValue;
        }
        return user[field] === queryValue;
    });
};

export const db_addUser = async (newUser: { uid: string; email: string; name: string; photoURL: string }): Promise<User> => {
  const existingUser = await db_findUserBy('uid', newUser.uid);
  if (existingUser) {
    // Ensure existing users have an account number if they don't have one.
    if (!existingUser.accountNumber) {
        existingUser.accountNumber = generateAccountNumber();
    }
    return existingUser;
  }
  const user: User = {
    ...newUser,
    balance: 1000, // Initial balance for new users
    accountNumber: generateAccountNumber(),
  };
  users.push(user);
  return user;
};

export const db_updateUserBalance = async (uid: string, newBalance: number): Promise<boolean> => {
  const userIndex = users.findIndex((user) => user.uid === uid);
  if (userIndex !== -1) {
    users[userIndex].balance = newBalance;
    return true;
  }
  return false;
};

// --- Transaction Functions ---

export const db_getTransactionsForUser = async (uid: string): Promise<Transaction[]> => {
  return transactions
    .filter((txn) => txn.from.uid === uid || txn.to.uid === uid)
    .map((txn) => ({
      ...txn,
      type: txn.from.uid === uid ? 'sent' : 'received',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const db_addTransaction = async (transaction: Omit<Transaction, 'id' | 'type'>): Promise<Transaction> => {
  const newTransaction: Transaction = {
    id: `txn-${Date.now()}-${Math.random()}`,
    ...transaction,
    type: 'sent' // type is determined by context when fetching, default to sent on creation
  };
  transactions.unshift(newTransaction);
  return newTransaction;
};

export const db_findTransactionById = async (id: string): Promise<Transaction | undefined> => {
  return transactions.find((txn) => txn.id === id);
}

export const db_updateTransactionFraudStatus = async (id: string, reason: string): Promise<boolean> => {
    const txIndex = transactions.findIndex((txn) => txn.id === id);
    if(txIndex !== -1){
        transactions[txIndex].fraudReported = true;
        transactions[txIndex].fraudReason = reason;
        return true;
    }
    return false;
}
