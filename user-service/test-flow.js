const axios = require('axios');

// Within the docker network, the API Gateway is available at http://api-gateway:3000
const API_URL = 'http://api-gateway:3000/api';

async function runTest() {
  console.log('🚀 Starting end-to-end integration test inside Docker...');

  try {
    // 1. Register a regular user
    const email = `testuser_${Date.now()}@example.com`;
    console.log(`\n1. Registering test user: ${email}...`);
    const registerRes = await axios.post(`${API_URL}/users/register`, {
      name: 'Test Customer',
      email,
      password: 'password123',
    });
    console.log('✅ User registered:', registerRes.data.success);

    // 2. Login as regular user
    console.log('\n2. Logging in...');
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email,
      password: 'password123',
    });
    const userToken = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    console.log('✅ Logged in. Token received. User ID:', userId);

    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // 3. Load funds into user's wallet
    console.log('\n3. Loading $500 into wallet...');
    const walletRes = await axios.post(`${API_URL}/wallet/load`, { amount: 500 }, { headers: userHeaders });
    console.log('✅ Balance loaded. Current balance:', walletRes.data.data.balance);

    // 4. Check available rooms in hotel 1
    console.log('\n4. Checking available rooms for Hotel 1 (Grand Kathmandu Hotel)...');
    const roomsBefore = await axios.get(`${API_URL}/hotels/1/rooms/available`, { headers: userHeaders });
    const availableRoom = roomsBefore.data.data.find(r => r.is_available);
    if (!availableRoom) {
      throw new Error('No available rooms found in Hotel 1 to test with');
    }
    console.log(`✅ Available room found: Room ID ${availableRoom.id}, Room Number ${availableRoom.room_number}, Price $${availableRoom.price}`);

    // 5. Book the room
    console.log(`\n5. Creating booking for Room ID ${availableRoom.id}...`);
    const bookingRes = await axios.post(`${API_URL}/bookings`, {
      roomId: availableRoom.id,
      checkIn: '2026-08-01',
      checkOut: '2026-08-03'
    }, { headers: userHeaders });
    const booking = bookingRes.data.data;
    console.log(`✅ Booking created. ID: ${booking.id}, Status: ${booking.status}, Total Price: $${booking.total_price}`);

    // 6. Verify room immediately becomes unavailable (check availability list)
    console.log('\nWaiting 1 second for RabbitMQ room status update...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\n6. Checking available rooms again to verify room is immediately unavailable...');
    const roomsAfter = await axios.get(`${API_URL}/hotels/1/rooms/available`, { headers: userHeaders });
    const isRoomStillAvailable = roomsAfter.data.data.some(r => r.id === availableRoom.id);
    console.log('Is room still listed as available?', isRoomStillAvailable ? '❌ Yes (Bug!)' : '✅ No (Correct!)');
    if (isRoomStillAvailable) {
      throw new Error('Room did not become unavailable immediately upon booking');
    }

    // Give payment processing a moment to finish via RabbitMQ
    console.log('\nWaiting 2 seconds for RabbitMQ payment processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Verify booking status remains pending and is_paid is true
    console.log('\n7. Fetching booking details to check status and payment status...');
    const getBookingRes = await axios.get(`${API_URL}/bookings/${booking.id}`, { headers: userHeaders });
    const updatedBooking = getBookingRes.data.data;
    console.log('Booking Status:', updatedBooking.status);
    console.log('Is Paid:', updatedBooking.is_paid);
    console.log('Prompt Message:', updatedBooking.message);

    if (updatedBooking.status !== 'pending') {
      throw new Error(`Expected booking status to be pending after payment, got: ${updatedBooking.status}`);
    }
    if (!updatedBooking.is_paid) {
      throw new Error('Expected booking is_paid to be true after successful payment');
    }
    if (!updatedBooking.message) {
      throw new Error('Expected admin/user prompt message to be present');
    }
    console.log('✅ Booking successfully verified to be paid but pending admin confirmation.');

    // 8. Owner 1 login bypass
    console.log('\n8. Logging in as Hotel Owner 1 (Grand Kathmandu Hotel)...');
    const ownerLoginRes = await axios.post(`${API_URL}/users/admin/login-bypass`, { ownerId: 1 });
    const ownerToken = ownerLoginRes.data.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    console.log('✅ Owner logged in.');

    // 9. Owner confirms the booking
    console.log(`\n9. Confirming booking #${booking.id} as Owner...`);
    const approveRes = await axios.post(`${API_URL}/users/admin/bookings/${booking.id}/approve`, {}, { headers: ownerHeaders });
    console.log('✅ Approval Response Status:', approveRes.data.data.status);
    if (approveRes.data.data.status !== 'confirmed') {
      throw new Error('Expected approved booking status to be confirmed');
    }

    // 10. Check availability is still false
    console.log('\n10. Checking available rooms again to verify room is still unavailable...');
    const roomsAfterApprove = await axios.get(`${API_URL}/hotels/1/rooms/available`, { headers: userHeaders });
    const isRoomAvailableAfterApprove = roomsAfterApprove.data.data.some(r => r.id === availableRoom.id);
    console.log('Is room listed as available?', isRoomAvailableAfterApprove ? '❌ Yes (Bug!)' : '✅ No (Correct!)');

    // 11. Owner deletes the booking entry
    console.log(`\n11. Deleting booking entry #${booking.id} as Owner...`);
    const deleteRes = await axios.delete(`${API_URL}/users/admin/bookings/${booking.id}`, { headers: ownerHeaders });
    console.log('✅ Booking deleted:', deleteRes.data.success);

    // 12. Verify booking is deleted from user bookings
    console.log('\n12. Fetching my bookings as user to verify deletion...');
    const myBookingsRes = await axios.get(`${API_URL}/bookings/my`, { headers: userHeaders });
    const isDeletedFromList = !myBookingsRes.data.data.some(b => b.id === booking.id);
    console.log('Is booking deleted from user bookings list?', isDeletedFromList ? '✅ Yes' : '❌ No');

    // 13. Verify room becomes available again
    console.log('\nWaiting 1 second for RabbitMQ room status release...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\n13. Checking available rooms again to verify room is released (available)...');
    const roomsAfterDelete = await axios.get(`${API_URL}/hotels/1/rooms/available`, { headers: userHeaders });
    const isRoomAvailableAfterDelete = roomsAfterDelete.data.data.some(r => r.id === availableRoom.id);
    console.log('Is room available again?', isRoomAvailableAfterDelete ? '✅ Yes (Correct!)' : '❌ No (Bug!)');
    if (!isRoomAvailableAfterDelete) {
      throw new Error('Room was not released after booking deletion');
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTest();
