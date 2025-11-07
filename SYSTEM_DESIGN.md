
# System Design: ZenithPay

## 1. Introduction & Overview

**ZenithPay** is a modern, proof-of-concept web application designed for seamless peer-to-peer (P2P) money transfers. Built on a modern technology stack, it provides users with a clean, responsive interface to manage their finances, view transaction history, and securely send money to others using unique account numbers.

A key feature of ZenithPay is its integration of Artificial Intelligence for proactive fraud detection. The system analyzes transactions in real-time to identify and flag suspicious activity, enhancing user security.

### Core Technologies

*   **Framework**: Next.js 15 (with App Router)
*   **Language**: TypeScript
*   **UI Library**: React & ShadCN UI
*   **Styling**: Tailwind CSS
*   **Authentication**: Firebase Authentication (Google Provider)
*   **AI/Generative AI**: Google Genkit
*   **Database (Simulated)**: In-memory store using TypeScript modules (`src/lib/data.ts`)

---

## 2. System Architecture

ZenithPay follows a client-server architecture facilitated by Next.js. The design emphasizes the use of React Server Components (RSC) to separate server-side and client-side concerns, optimizing performance and security.

![System Architecture Diagram](httpss://i.imgur.com/example.png)  
*(Note: A diagram would visually represent this section, showing the flow from User -> Next.js Frontend -> Firebase/Genkit/Server Actions -> In-Memory DB)*

### 2.1. Frontend Architecture

The frontend is built as a Single Page Application (SPA) powered by Next.js and React.

*   **Routing**: The Next.js App Router (`src/app`) is used for file-system-based routing. Authenticated routes like `/dashboard` are nested under the `(app)` route group, which uses a layout (`src/app/(app)/layout.tsx`) to protect routes and provide a consistent UI shell (sidebar, header).
*   **Component Model**: Reusable UI components are built with ShadCN UI and located in `src/components`. This includes both generic UI elements (`/ui`) and feature-specific components (`/dashboard`, `/transactions`).
*   **State Management**:
    *   **Global State**: Authentication state (user, loading status) is managed globally via a React Context in `src/hooks/use-auth.tsx`.
    *   **Local State**: Component-level state is managed with React hooks (`useState`, `useEffect`, `useTransition`).
*   **Client-Server Interaction**: Client components communicate with the backend primarily through Next.js Server Actions, abstracting away the need for traditional REST API endpoints.

### 2.2. Backend Architecture

The backend logic is co-located within the Next.js application, leveraging its server-side capabilities.

*   **Server Actions (`src/lib/actions.ts`)**: All business logic, such as sending money, fetching user data, and reporting fraud, is encapsulated in Server Actions. These are `async` functions marked with the `'use server'` directive. They can be called directly from client components, simplifying data mutations and fetching.
*   **AI Integration (`src/ai/`)**: AI capabilities are managed by Google Genkit.
    *   **Flows**: Specific AI tasks, like `analyzeTransactionRisk` and `reportFraudulentTransaction`, are defined as Genkit "flows" in `src/ai/flows/`. These flows define the AI prompt, expected input/output schemas (using Zod), and interact with the underlying language model (`gemini-2.5-flash`).
    *   **Configuration**: Genkit is configured in `src/ai/genkit.ts`.

### 2.3. Database (In-Memory Simulation)

For this proof-of-concept, the database is simulated in-memory.

*   **Data Store (`src/lib/data.ts`)**: This file acts as the data access layer. It initializes empty arrays for `users` and `transactions` and exports functions (`db_findUserBy`, `db_addUser`, `db_addTransaction`, etc.) to interact with them.
*   **Data Models (`src/lib/types.ts`)**: TypeScript interfaces (`User`, `Transaction`) define the data structures, ensuring type safety throughout the application.
*   **Persistence**: Data is not persistent. It is reset every time the server restarts. In a production scenario, this in-memory store would be replaced by a real database (e.g., Firebase Firestore, PostgreSQL).

### 2.4. Authentication

Authentication is handled by **Firebase Authentication**.

*   **Provider**: Google Sign-In is the only implemented authentication method.
*   **Flow**:
    1.  A user clicks "Sign in with Google" on the login page (`src/app/page.tsx`).
    2.  The `signInWithGoogle` function from the `useAuth` hook is called, which uses the Firebase SDK to trigger the Google Auth popup.
    3.  Upon successful authentication, Firebase's `onAuthStateChanged` listener fires.
    4.  The listener in `useAuth.tsx` receives the user's Firebase profile. It then calls the `addUser` server action, which either finds the existing user in the database or creates a new one with a unique account number and a starting balance.
    5.  The authenticated user object (including the app-specific account number) is stored in the `AuthContext`, making it available globally.

---

## 3. Core Features & Data Flow

### 3.1. User Registration & Login

*   **Trigger**: User signs in via Google.
*   **Process**:
    1.  `useAuth` hook authenticates with Firebase.
    2.  `onAuthStateChanged` triggers a call to the `addUser` server action.
    3.  `db_addUser` checks if the user exists by UID.
    4.  If not, it creates a new `User` object, generates a unique 6-digit alphanumeric `accountNumber`, assigns a starting balance of $1,000, and pushes it to the in-memory `users` array.
    5.  The user is redirected to the `/dashboard`.

### 3.2. Send Money

This is the most complex flow, involving UI interaction, data validation, fraud detection, and data mutation.

*   **Trigger**: User submits the "Send Money" form in the `SendMoneyDialog` component.
*   **Process**:
    1.  The `onSubmit` handler in `SendMoneyDialog` calls the `sendMoney` server action.
    2.  **`sendMoney` Action (`src/lib/actions.ts`)**:
        a. **Validation**: Checks for valid amount, sender existence, and sufficient balance.
        b. **Receiver Lookup**: Calls `db_findUserBy('accountNumber', ...)` to find the recipient. This lookup is case-insensitive.
        c. **Fraud Detection (Proactive)**:
            i.  **Velocity Check**: Checks if the user has made too many transactions in the last minute.
            ii. **Anomaly Check**: Checks if the transaction amount is significantly larger (5x) than the user's historical average.
            iii. If any check fails, it returns a `{ warning: true, message: '...' }` object to the client, prompting the user for confirmation.
        d. **AI Risk Scoring**:
            i.  If no warnings are bypassed, it calls the `analyzeTransactionRisk` Genkit flow.
            ii. It passes transaction details and a summary of the sender's history.
            iii. The AI returns a `riskScore` (0-100) and `riskReason`.
        e. **Database Mutation**:
            i.  Updates the sender's and receiver's balances via `db_updateUserBalance`.
            ii. Creates a new transaction record, including the AI risk score, via `db_addTransaction`.
        f. **UI Invalidation**: Calls `revalidatePath` to instruct Next.js to re-fetch data for the dashboard and transactions pages.
        g. **Response**: Returns `{ success: true, message: '...' }` to the client.
    3.  The client UI displays a success or error toast message based on the response.

### 3.3. Fraud Detection & Reporting

*   **Proactive Analysis**: As described above, every transaction is analyzed by the `analyzeTransactionRisk` AI flow. The results are stored and displayed in the UI (e.g., color-coded rows in the transactions table).
*   **Reactive Reporting**:
    1.  User clicks the "Report Fraud" button for a specific transaction in `RecentTransactions` or `TransactionsTable`.
    2.  `ReportFraudDialog` opens, allowing the user to submit a reason.
    3.  `reportTransactionAsFraud` server action is called.
    4.  This action invokes the `reportFraudulentTransaction` Genkit flow, providing it with transaction details and the user's report.
    5.  The AI determines if the transaction is likely fraudulent and provides reasoning.
    6.  The result is shown to the user in an alert box, and the transaction is marked as `fraudReported` in the database.

---

## 4. Design Decisions & Trade-offs

*   **Server Actions vs. API Routes**: Server Actions were chosen to simplify the codebase by co-locating data-mutating logic with the frontend, reducing boilerplate for defining, maintaining, and calling API endpoints.
*   **In-Memory Database**: Chosen for simplicity and rapid development. It allows the entire application to run without external dependencies. The major trade-off is the lack of data persistence. The data layer is cleanly abstracted in `src/lib/data.ts`, allowing for a future swap to a real database with minimal changes to the business logic in `src/lib/actions.ts`.
*   **Genkit for AI**: Provides a structured way to define and call AI models. Using Zod schemas for input and output ensures that the data passed to and received from the LLM is strongly typed and predictable, which is crucial for reliability.
*   **ShadCN UI**: Chosen for its "copy-and-paste" component model, which gives full ownership and control over the component code, making customization and extension straightforward.

