# Project Overview: Daily Sales, Vehicle Inventory, and Revenue Tracker

## 1. Project Goal

Build a reliable web application to manage daily product distribution, sales records, remaining inventory, and revenue across multiple delivery vehicles.

The business operates multiple vehicles. Each vehicle has one assigned user who takes products from a central deposit (warehouse), sells products during the working day, and reports the remaining products when returning.

The business handles four products:

- **Queso (cheese):** One standard size with a unit cost of 9.
- **Yogurt:** Unit cost of 33.
- **Milk:** Its cost must be configurable by the admin.
- **Mote:** Its cost must be configurable by the admin.

The application must distinguish between product quantities, product costs, sales revenue, and remaining inventory.

The vehicle user records the quantities taken from the deposit and the quantities remaining at the end of the working day. The system calculates the quantities sold and the corresponding costs.

Milk and mote contribute to the business's total revenue, but their sales quantities or revenue must not be incorrectly inferred from cheese and yogurt records. Their handling must follow the business rules defined in this document.

Only authenticated users can access the application. Only administrators can manage product costs, pricing, revenue analytics, and administrative inventory information.

## 2. Technology Stack

Use the following technologies:

- Next.js with App Router
- TypeScript
- Prisma ORM
- MongoDB
- Tailwind CSS, if compatible with the existing project
- A secure authentication solution compatible with the existing project

Before implementation, inspect the existing repository, dependencies, database configuration, and authentication system. Preserve existing functionality and conventions where practical.

## 3. User Roles and Permissions

### 3.1 Administrator

The admin can:

- Manage user accounts.
- Create, edit, and deactivate vehicle assignments.
- Assign one user to each vehicle.
- Configure product costs and prices.
- Manage central deposit inventory.
- View all users' daily work records.
- View records from all vehicles.
- View business-wide inventory and revenue.
- View product costs, profitability information, and remaining stock.
- Review historical records and filter them by date, user, or vehicle.
- Correct erroneous records using an auditable process.
- Access the administrative landing page and reports.

Only administrators may view or change sensitive financial information, including product costs, profit calculations, and business-wide revenue.

### 3.2 Vehicle User

Each regular user is assigned to a vehicle.

The user can:

- Sign in securely.
- Register their daily work record.
- Record quantities of cheese and yogurt taken from the deposit.
- Record remaining cheese and yogurt at the end of the day.
- Review their own previous daily records.
- View their own work history.

Users must only be able to view and modify their own authorized records. They must not access other users' records or administrative financial information.

The assigned vehicle and authenticated user must be determined and validated on the server. Do not trust a user ID or vehicle ID supplied by the browser.

## 4. Product Management and Costs

The application must initially support these products:

| Product        | Initial unit cost | Cost configuration |
| -------------- | ----------------: | ------------------ |
| Cheese (Queso) |                 9 | Admin-configurable |
| Yogurt         |                33 | Admin-configurable |
| Milk           |     Not specified | Admin-configurable |
| Mote           |     Not specified | Admin-configurable |

The initial values of 9 and 33 are the current costs, not necessarily the final selling prices. The admin must be able to configure product costs and selling prices separately if the business uses different values.

Requirements:

- Only the admin can create or change product costs and selling prices.
- Do not hardcode product costs in UI components or business logic.
- Store the cost and price that applied at the time of a transaction.
- Changing a current cost or price must not rewrite historical records.
- Keep a history of cost and price changes, including the administrator and timestamp.
- Use a consistent currency format configured for the business.

## 5. Central Deposit and Inventory Management

The application must track stock in the central deposit and products distributed to vehicles.

For each product, track:

- Opening deposit stock.
- Stock additions.
- Quantity taken by each vehicle.
- Quantity returned or remaining at the end of the day.
- Current deposit stock.
- Current stock assigned to vehicles, where applicable.

Inventory must be updated consistently when products are transferred from the deposit to a vehicle.

The system must prevent invalid transactions, including quantities greater than available stock.

Maintain an inventory movement history that records:

- Product.
- Quantity.
- Movement type.
- Source and destination, such as deposit or vehicle.
- Responsible user.
- Date and time.
- Related work record or transaction, when applicable.
