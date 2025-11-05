'use server';

/**
 * @fileOverview Fraudulent transaction reporting AI agent.
 *
 * - reportFraudulentTransaction - A function that handles the process of reporting a fraudulent transaction.
 * - ReportFraudulentTransactionInput - The input type for the reportFraudulentTransaction function.
 * - ReportFraudulentTransactionOutput - The return type for the reportFraudulentTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReportFraudulentTransactionInputSchema = z.object({
  transactionDetails: z
    .string()
    .describe('Details of the transaction, including amount, date, and recipient.'),
  userReport: z
    .string()
    .describe('User provided report of why they believe the transaction is fraudulent.'),
});
export type ReportFraudulentTransactionInput = z.infer<typeof ReportFraudulentTransactionInputSchema>;

const ReportFraudulentTransactionOutputSchema = z.object({
  fraudulent: z
    .boolean()
    .describe('Whether the transaction is likely to be fraudulent based on the user report and transaction details.'),
  reason: z.string().describe('The reasoning behind the fraudulent determination.'),
});
export type ReportFraudulentTransactionOutput = z.infer<typeof ReportFraudulentTransactionOutputSchema>;

export async function reportFraudulentTransaction(
  input: ReportFraudulentTransactionInput
): Promise<ReportFraudulentTransactionOutput> {
  return reportFraudulentTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportFraudulentTransactionPrompt',
  input: {schema: ReportFraudulentTransactionInputSchema},
  output: {schema: ReportFraudulentTransactionOutputSchema},
  prompt: `You are an expert in fraud detection for financial transactions.

You will be provided with transaction details and a user report explaining why they believe the transaction is fraudulent.

Based on this information, you will determine whether the transaction is likely to be fraudulent and provide a reason for your determination.

Transaction Details: {{{transactionDetails}}}
User Report: {{{userReport}}}
\nDetermine if the transaction is fraudulent, and set the fraudulent output field appropriately.  Explain your reasoning in the reason field.
`,
});

const reportFraudulentTransactionFlow = ai.defineFlow(
  {
    name: 'reportFraudulentTransactionFlow',
    inputSchema: ReportFraudulentTransactionInputSchema,
    outputSchema: ReportFraudulentTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

