# Hotel Booking System — Microservices Backend

A robust, enterprise-grade, microservices-based Hotel Booking System. 

## Tech Stack
* **Runtime:** Node.js (Express)
* **Databases:** PostgreSQL (independent database per service)
* **Caching:** Redis (lazy-loaded caching for hotels list, room details, and user bookings)
* **Message Broker:** RabbitMQ (decoupled topic exchange for billing transactions and status updates)
* **Containerization:** Docker & Docker Compose
* **Documentation:** Swagger (Interactive Open-API Docs per service)

---

## Architecture Overview
```
Client (Insomnia/Postman)
       │ (HTTP requests)
       ▼
 [API Gateway] (Port 3000) ── [Auth Verification (JWT)]
       │
       ├──────► [User Service] (Port 3001) ── users_db (Auth, Profile management)
       ├──────► [Hotel Service] (Port 3002) ── hotels_db (Hotels & Room availability) ── (Redis Cache)
       ├──────► [Booking Service] (Port 3003) ── bookings_db (Room Booking processing) ── (Redis Cache)
       └──────► [Wallet Service] (Port 3004) ── wallet_db (Mock currency wallets, ledger logs)
```

### Event Routing Table (RabbitMQ Topic Exchange: `hotel_booking`)
* `booking.payment.requested` (Published by `booking-service` → Consumed by `wallet-service` to process booking cost)
* `payment.success` (Published by `wallet-service` → Consumed by `booking-service` to confirm a booking)
* `payment.failed` (Published by `wallet-service` → Consumed by `booking-service` to cancel a booking)
* `room.status.update` (Published by `booking-service` → Consumed by `hotel-service` to update availability status to false)

---

## Installation & Running the System

### 1. Requirements
* Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows) or Docker/Docker-Compose package (Linux/macOS).

### 2. Start Services
From the root directory, start all database engines, queues, and microservices in detached mode:
```bash
docker compose up --build -d
```

### 3. Run Database Migrations
Run the migration commands inside container runtimes to create tables:
```bash
# Windows (CMD / PowerShell / Bash) & Linux:
docker compose exec user-service node src/db/migrate.js
docker compose exec hotel-service node src/db/migrate.js
docker compose exec booking-service node src/db/migrate.js
docker compose exec wallet-service node src/db/migrate.js
```
*Note: Hotel Service will automatically seed 3 hotels (Grand Kathmandu, Himalaya View, Pokhara Lakeside) on startup.*

---

## API & Testing Reference

You can import the provided Postman collection [`Hotel_Booking_System_API_Collection.json`](file:///Users/kiranbudachhetri/Documents/Project%20Hotel%20Management/hotel-management-backend/Hotel_Booking_System_API_Collection.json) into **Postman** or **Insomnia** to execute API commands.

### Key API Flow:
1. **Register:** `POST /api/users/register` to register a customer account.
2. **Login:** `POST /api/users/login` to login and receive a JWT.
3. **Get/Delete Profile:** `GET /api/users/profile` and `DELETE /api/users/profile` to manage user account.
4. **Load Wallet:** `POST /api/wallet/load` (Headers: `Authorization: Bearer <TOKEN>`, Body: `{"amount": 500}`) to add money.
5. **List Hotels:** `GET /api/hotels` (cached).
6. **Get Available Rooms:** `GET /api/hotels/1/rooms/available` (cached).
7. **Book a Room:** `POST /api/bookings` (Body: `{"roomId": 1, "checkIn": "2026-08-01", "checkOut": "2026-08-03"}`).
8. **User Cancel Booking:** `POST /api/bookings/:id/cancel` to cancel booking and free room availability.
9. **Check Balance & Transactions:** `GET /api/wallet/balance` & `GET /api/wallet/transactions`.
10. **Admin / Owner Booking Management:**
    - `POST /api/users/admin/login-bypass` (Body: `{"ownerId": 1}`) to log in as Hotel Owner.
    - `GET /api/bookings/admin/bookings` to view hotel bookings.
    - `POST /api/bookings/admin/bookings/:id/approve` to confirm pending bookings.
    - `PATCH /api/bookings/admin/bookings/:id` to modify check-in/check-out dates or status.
    - `DELETE /api/bookings/admin/bookings/:id` to delete booking entry and free room.
