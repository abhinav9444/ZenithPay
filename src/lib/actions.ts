'use server';

import { revalidatePath } from 'next/cache';
import {
  db_findUserBy,
  db_addUser,
  db_getTransactionsForUser,
  db_addTransaction,
  db_updateUserBalance,
  db_findTransactionById,
  db_updateTransactionFraudStatus,
} from './data';
import type { User, Transaction } from './types';
import { reportFraudulentTransaction } from '@/ai/flows/report-fraudulent-transaction';

export async function getUser(uid: string): Promise<User | null> {
  const user = await db_findUserBy('uid', uid);
  return user || null;
}

export async function getTransactions(uid: string): Promise<Transaction[]> {
  return await db_getTransactionsForUser(uid);
}

export async function addUser(user: { uid: string; email: string; name: string; photoURL: string }): Promise<User> {
  return await db_addUser(user);
}

export async function sendMoney(
  senderUid: string,
  receiverIdentifier: string, // Can be email or UID
  amount: number,
  description: string
): Promise<{ success: boolean; message: string }> {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be positive.' };
  }

  const sender = await db_findUserBy('uid', senderUid);
  if (!sender) {
    return { success: false, message: 'Sender not found.' };
  }

  if (sender.balance < amount) {
    return { success: false, message: 'Insufficient balance.' };
  }

  // The db_findUserBy now handles both email and UID, so we just call it once.
  const receiver = await db_findUserBy('emailOrUid', receiverIdentifier);
  
  if (!receiver) {
    return { success: false, message: 'Receiver not found.' };
  }

  if (sender.uid === receiver.uid) {
    return { success: false, message: "You cannot send money to yourself." };
  }

  await db_updateUserBalance(sender.uid, sender.balance - amount);
  await db_updateUserBalance(receiver.uid, receiver.balance + amount);

  await db_addTransaction({
    from: { uid: sender.uid, name: sender.name, email: sender.email },
    to: { uid: receiver.uid, name: receiver.name, email: receiver.email },
    amount,
    date: new Date().toISOString(),
    description,
    status: 'completed',
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  
  return { success: true, message: 'Transaction successful.' };
}


export async function reportTransactionAsFraud(transactionId: string, userReport: string): Promise<{
    success: boolean,
    message: string,
    fraudulent?: boolean;
    reason?: string;
}> {
  const transaction = await db_findTransactionById(transactionId);
  if(!transaction) {
    return { success: false, message: 'Transaction not found.' };
  }

  const transactionDetails = `Amount: ${transaction.amount}, To: ${transaction.to.name}, From: ${transaction.from.name}, Date: ${transaction.date}, Description: ${transaction.description}`;

  try {
    const aiResult = await reportFraudulentTransaction({
      transactionDetails,
      userReport,
    });
    
    await db_updateTransactionFraudStatus(transactionId, aiResult.reason);

    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, message: 'Fraud report submitted and analyzed.', ...aiResult };
  } catch (error) {
    console.error("AI Fraud Analysis Failed:", error);
    return { success: false, message: 'Failed to analyze fraud report.' };
  }
}
