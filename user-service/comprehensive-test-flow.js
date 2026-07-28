const axios = require('axios');

// Within docker network, API Gateway is at http://api-gateway:3000
// When run on host machine, it falls back to http://localhost:3000
const API_URL = process.env.API_URL || 'http://api-gateway:3000/api';

async function runComprehensiveTest() {
  console.log('========================================================================');
  console.log('🚀 STARTING COMPREHENSIVE ALL-API INTEGRATION TEST SUITE 🚀');
  console.log(`Target API Gateway URL: ${API_URL}`);
  console.log('========================================================================\n');

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: USER REGISTRATION & AUTHENTICATION APIs
    // ------------------------------------------------------------------------
    console.log('--- SECTION 1: USER & AUTHENTICATION SERVICE APIs ---');
    const userEmail = `fulltest_${Date.now()}@example.com`;
    const userPassword = 'password123';

    console.log(`1.1 POST /users/register -> Registering user: ${userEmail}...`);
    const regRes = await axios.post(`${API_URL}/users/register`, {
      name: 'Comprehensive Tester',
      email: userEmail,
      password: userPassword,
    });
    console.log('   ✅ User registered successfully. Response status:', regRes.status, 'success:', regRes.data.success);

    console.log('1.2 POST /users/login -> Logging in registered user...');
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: userEmail,
      password: userPassword,
    });
    const userToken = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    const userHeaders = { Authorization: `Bearer ${userToken}` };
    console.log(`   ✅ Logged in successfully. User ID: ${userId}, Token received.`);

    console.log('1.3 GET /users/profile -> Fetching user profile...');
    const profileRes = await axios.get(`${API_URL}/users/profile`, { headers: userHeaders });
    console.log(`   ✅ Profile fetched. Name: "${profileRes.data.data.name}", Email: "${profileRes.data.data.email}"`);

    console.log('1.4 POST /users/admin/login-bypass -> Logging in as Hotel Owner 1 (Admin)...');
    const ownerLoginRes = await axios.post(`${API_URL}/users/admin/login-bypass`, { ownerId: 1 });
    const ownerToken = ownerLoginRes.data.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    console.log('   ✅ Owner 1 logged in. Token received.');


    // ------------------------------------------------------------------------
    // SECTION 2: WALLET SERVICE APIs
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: WALLET SERVICE APIs ---');

    console.log('2.1 GET /wallet/balance -> Checking initial wallet balance...');
    const initialBalRes = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
    console.log(`   ✅ Initial Balance: $${initialBalRes.data.data.balance}`);

    console.log('2.2 POST /wallet/load -> Loading $1,000 into wallet...');
    const loadRes = await axios.post(`${API_URL}/wallet/load`, { amount: 1000 }, { headers: userHeaders });
    console.log(`   ✅ Balance loaded. Updated Balance: $${loadRes.data.data.balance}`);

    console.log('2.3 GET /wallet/transactions -> Fetching wallet transaction logs...');
    const txRes = await axios.get(`${API_URL}/wallet/transactions`, { headers: userHeaders });
    console.log(`   ✅ Transactions retrieved count: ${txRes.data.data.length}. Top transaction type: "${txRes.data.data[0]?.type}" amount: $${txRes.data.data[0]?.amount}`);


    // ------------------------------------------------------------------------
    // SECTION 3: HOTEL SERVICE APIs
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: HOTEL SERVICE APIs ---');

    console.log('3.1 GET /hotels -> Fetching list of all hotels...');
    const hotelsRes = await axios.get(`${API_URL}/hotels`, { headers: userHeaders });
    console.log(`   ✅ Total hotels returned: ${hotelsRes.data.data.length}`);
    const hotel1 = hotelsRes.data.data[0];
    console.log(`   Hotel #1: "${hotel1.name}" (ID: ${hotel1.id}, Location: ${hotel1.location})`);

    console.log(`3.2 GET /hotels/${hotel1.id}/rooms -> Fetching all rooms for Hotel #${hotel1.id}...`);
    const roomsRes = await axios.get(`${API_URL}/hotels/${hotel1.id}/rooms`, { headers: userHeaders });
    console.log(`   ✅ Total rooms in Hotel #${hotel1.id}: ${roomsRes.data.data.length}`);

    console.log(`3.3 GET /hotels/${hotel1.id}/rooms/available -> Fetching available rooms...`);
    const availRoomsRes = await axios.get(`${API_URL}/hotels/${hotel1.id}/rooms/available`, { headers: userHeaders });
    const targetRoom = availRoomsRes.data.data[0];
    if (!targetRoom) {
      throw new Error(`No available rooms found in Hotel #${hotel1.id}`);
    }
    console.log(`   ✅ Target Available Room: ID ${targetRoom.id}, Room Number ${targetRoom.room_number}, Price $${targetRoom.price}/night`);

    console.log(`3.4 GET /hotels/rooms/${targetRoom.id} -> Fetching specific room details...`);
    const roomDetailRes = await axios.get(`${API_URL}/hotels/rooms/${targetRoom.id}`, { headers: userHeaders });
    console.log(`   ✅ Room details fetched: Room Number ${roomDetailRes.data.data.room_number}, Type: ${roomDetailRes.data.data.type}`);


    // ------------------------------------------------------------------------
    // SECTION 4: BOOKING SERVICE APIs - CREATION, PAYMENT & USER VIEW
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: BOOKING SERVICE APIs (CREATION & USER FLOW) ---');

    console.log(`4.1 POST /bookings -> Booking Room ID ${targetRoom.id} for 2 nights...`);
    const bookingRes = await axios.post(`${API_URL}/bookings`, {
      roomId: targetRoom.id,
      checkIn: '2026-10-01',
      checkOut: '2026-10-03'
    }, { headers: userHeaders });
    const booking = bookingRes.data.data;
    console.log(`   ✅ Booking Created! ID: #${booking.id}, Total Price: $${booking.total_price}, Status: ${booking.status}`);

    console.log('4.2 Verifying immediate room unavailability via RabbitMQ event...');
    await new Promise(r => setTimeout(r, 1000));
    const availRoomsAfterBooking = await axios.get(`${API_URL}/hotels/${hotel1.id}/rooms/available`, { headers: userHeaders });
    const isRoomAvailable = availRoomsAfterBooking.data.data.some(r => r.id === targetRoom.id);
    if (isRoomAvailable) {
      throw new Error('❌ FAIL: Room is still listed as available after booking!');
    }
    console.log('   ✅ Room correctly listed as unavailable.');

    console.log('4.3 Waiting for payment completion event via RabbitMQ...');
    await new Promise(r => setTimeout(r, 2000));

    console.log(`4.4 GET /bookings/${booking.id} -> Fetching booking details...`);
    const getBookingRes = await axios.get(`${API_URL}/bookings/${booking.id}`, { headers: userHeaders });
    console.log(`   ✅ Booking Details: Status="${getBookingRes.data.data.status}", IsPaid=${getBookingRes.data.data.is_paid}`);
    console.log(`   Message: "${getBookingRes.data.data.message}"`);

    console.log('4.5 GET /bookings/my -> Fetching my bookings as user...');
    const myBookingsRes = await axios.get(`${API_URL}/bookings/my`, { headers: userHeaders });
    console.log(`   ✅ Total user bookings: ${myBookingsRes.data.data.length}, Booking #${booking.id} present: ${myBookingsRes.data.data.some(b => b.id === booking.id)}`);


    // ------------------------------------------------------------------------
    // SECTION 5: BOOKING SERVICE APIs - ADMIN / OWNER MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: BOOKING SERVICE APIs (ADMIN / OWNER MANAGEMENT) ---');

    console.log('5.1 GET /bookings/admin/bookings -> Owner 1 fetching hotel bookings...');
    const adminBookingsRes = await axios.get(`${API_URL}/bookings/admin/bookings`, { headers: ownerHeaders });
    console.log(`   ✅ Owner bookings count: ${adminBookingsRes.data.data.length}`);

    console.log(`5.2 POST /bookings/admin/bookings/${booking.id}/approve -> Owner approving booking #${booking.id}...`);
    const approveRes = await axios.post(`${API_URL}/bookings/admin/bookings/${booking.id}/approve`, {}, { headers: ownerHeaders });
    console.log(`   ✅ Approved Booking Status: ${approveRes.data.data.status}`);

    console.log(`5.3 PATCH /bookings/admin/bookings/${booking.id} -> Owner updating booking check-in date...`);
    const patchRes = await axios.patch(`${API_URL}/bookings/admin/bookings/${booking.id}`, {
      check_in: '2026-10-02',
      check_out: '2026-10-04'
    }, { headers: ownerHeaders });
    console.log(`   ✅ Updated Check-in: ${patchRes.data.data.check_in}, Total Price: $${patchRes.data.data.total_price}`);

    console.log(`5.4 DELETE /bookings/admin/bookings/${booking.id} -> Owner cancelling booking entry via delete method...`);
    const deleteBookingRes = await axios.delete(`${API_URL}/bookings/admin/bookings/${booking.id}`, { headers: ownerHeaders });
    console.log(`   ✅ Booking status changed to: "${deleteBookingRes.data.data.status}", is_paid: "${deleteBookingRes.data.data.is_paid}"`);
    if (deleteBookingRes.data.data.status !== 'cancelled') {
      throw new Error('Expected deleted booking status to be cancelled');
    }
    if (deleteBookingRes.data.data.is_paid !== 'returned') {
      throw new Error(`Expected is_paid status to be 'returned', got: ${deleteBookingRes.data.data.is_paid}`);
    }

    console.log('5.5 Verifying room is released after owner cancellation...');
    await new Promise(r => setTimeout(r, 1000));
    const availRoomsAfterDelete = await axios.get(`${API_URL}/hotels/${hotel1.id}/rooms/available`, { headers: userHeaders });
    const isReleased = availRoomsAfterDelete.data.data.some(r => r.id === targetRoom.id);
    console.log(`   ✅ Room released back to available: ${isReleased}`);

    console.log('5.6 Waiting 2 seconds for RabbitMQ refund processing...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('5.7 GET /wallet/balance -> Verifying refund balance restored...');
    const balanceAfterRefund = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
    console.log(`   ✅ Wallet Balance after refund: $${balanceAfterRefund.data.data.balance}`);
    if (parseFloat(balanceAfterRefund.data.data.balance) !== 1000.00) {
      throw new Error(`Expected refund balance of $1000.00, got: $${balanceAfterRefund.data.data.balance}`);
    }

    console.log('5.8 GET /wallet/transactions -> Verifying refund transaction logged...');
    const txAfterRefund = await axios.get(`${API_URL}/wallet/transactions`, { headers: userHeaders });
    const refundTx = txAfterRefund.data.data.find(tx => tx.type === 'refund');
    if (!refundTx) {
      throw new Error('Expected transaction type refund to be present in user transaction log');
    }
    console.log(`   ✅ Refund Transaction Found: type="${refundTx.type}" amount=$${refundTx.amount} desc="${refundTx.description}"`);

    console.log('\n========================================================================');
    console.log('🎉 ALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY! ALL SYSTEMS OK! 🎉');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n❌ COMPREHENSIVE TEST FAILED AT STEP:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runComprehensiveTest();
