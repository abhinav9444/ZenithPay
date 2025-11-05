# **App Name**: ZenithPay

## Core Features:

- Google Authentication: Integrate Firebase Authentication for Google Sign-In to authenticate users and fetch their profile information (name, email, profile photo, Firebase UID). Store user data in MongoDB after the first login. Issue JWT.
- Dashboard: Display the user's profile picture, name, and balance. Include buttons for 'Send Money' and 'Transactions'. List recent transactions in scrollable cards.
- Send Money: Allow users to send money to other users using their email or Firebase UID and the amount to send. Ensure back-end verification that the receiver exists and that the sender has sufficient balance. Update the balances of both sender and receiver and create a transaction record.
- Receive Money: Automatically update and reflect new deposits in the user's account balance and transaction history. Allow users to refresh the transaction list to view new transactions.
- Report Fraudulent Transaction: Enable users to report suspicious transactions by tapping a 'Report Fraud' button on each transaction card. This feature calls an API to mark the transaction as fraudulent, increment the fraud score.  Additionally, employ an AI tool to flag fraudulent transactions based on various factors such as amount, frequency, and recipient.
- Logout: Implement Firebase sign-out functionality to securely log users out of the application. Clear local storage and JWTs to ensure session termination. Redirect the user to the login screen.
- Transaction History: Display a comprehensive list of all transactions, with details like 'From' / 'To' field and amount. Provide a 'Report Fraud' button for each transaction.

## Style Guidelines:

- Primary color: Deep blue (#1A237E) to convey trust, security, and professionalism, which are vital in a banking application.
- Background color: Light blue-gray (#ECEFF1) for a clean and modern look, providing a neutral backdrop that enhances readability and focus on content.
- Accent color: Soft violet (#9FA8DA) to add a touch of sophistication, used sparingly for highlighting important actions.
- Body and headline font: 'Inter', a sans-serif font known for its readability and modern appearance.
- Use minimalist icons that clearly represent each action (send, receive, report) and are easily recognizable.
- Employ a clean and intuitive layout, prioritizing key information at the top (balance) and providing easy access to core features (send money, transactions).
- Implement smooth transitions and subtle animations when navigating between screens or confirming actions (e.g., sending money). These animations provide visual feedback without being distracting.