const app = require('./server');
const http = require('http');

const server = http.createServer(app);
const TEST_PORT = 5099;

server.listen(TEST_PORT, async () => {
  const base = `http://localhost:${TEST_PORT}/api`;
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  console.log('\n========================================================');
  console.log('🧪 RUNNING FULL-STACK INTEGRATION TEST SUITE (PHASE 9)');
  console.log('========================================================\n');

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: HEALTH & SYSTEM CHECK
    // ----------------------------------------------------
    console.log('▶ [1/6] Testing System Health & Database Connectivity...');
    const healthRes = await fetch(`${base}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.database === 'Connected', 'GET /api/health verifies MySQL connection');

    // ----------------------------------------------------
    // TEST SUITE 2: AUTHENTICATION & JWT SECURITY
    // ----------------------------------------------------
    console.log('\n▶ [2/6] Testing Authentication & Authorization Pipeline...');
    const uniqueEmail = `qa_user_${Date.now()}@example.com`;

    // 2.1 Register
    const regRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'QA Tester', email: uniqueEmail, password: 'password123' })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token, 'POST /api/auth/register creates user and issues JWT');

    // 2.2 Duplicate Email
    const dupRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'QA Tester', email: uniqueEmail, password: 'password123' })
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // 2.3 Invalid Password Login
    const badLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 2.4 Valid Login
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'password123' })
    });
    const loginData = await loginRes.json();
    const userToken = loginData.token;
    assert(loginRes.status === 200 && Boolean(userToken), 'Valid login issues signed JWT');

    // 2.5 Authenticated Profile Check
    const meRes = await fetch(`${base}/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === uniqueEmail, 'GET /api/auth/me returns authenticated profile');

    // 2.6 Seed User Login (Kenji Sato)
    const kenjiLogin = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kenji.sato@example.com', password: 'password123' })
    }).then(r => r.json());
    const kenjiToken = kenjiLogin.token;
    assert(Boolean(kenjiToken), 'Login with seeded user (Kenji Sato) successful');

    // ----------------------------------------------------
    // TEST SUITE 3: HOTEL CATALOG & DYNAMIC FILTERS
    // ----------------------------------------------------
    console.log('\n▶ [3/6] Testing Hotel Discovery & Combined Filters...');

    // 3.1 All Hotels
    const allHotels = await fetch(`${base}/hotels`).then(r => r.json());
    assert(allHotels.count === 20, 'GET /api/hotels returns all 20 curated properties');

    // 3.2 Tokyo Filter
    const tokyoHotels = await fetch(`${base}/hotels?city=Tokyo`).then(r => r.json());
    assert(tokyoHotels.count === 8 && tokyoHotels.data.every(h => h.city === 'Tokyo'), 'City filter (Tokyo) returns exactly 8 hotels');

    // 3.3 Combined Filters
    const combinedHotels = await fetch(`${base}/hotels?city=Kyoto&minRating=4.5&breakfast=true`).then(r => r.json());
    assert(combinedHotels.count >= 2 && combinedHotels.data.every(h => h.city === 'Kyoto' && h.rating >= 4.5 && h.breakfast_available), 'Combined filter (Kyoto + rating >= 4.5 + breakfast) works accurately');

    // 3.4 Price Cap Filter
    const cheapHotels = await fetch(`${base}/hotels?maxPrice=9500`).then(r => r.json());
    assert(cheapHotels.count > 0 && cheapHotels.data.every(h => h.min_price <= 9500), 'Max price filter (<= ¥9,500) works accurately');

    // 3.5 Single Hotel Details
    const singleHotel = await fetch(`${base}/hotels/1`).then(r => r.json());
    assert(singleHotel.data.id === 1 && singleHotel.data.rooms.length === 4, 'GET /api/hotels/1 returns hotel with 4 room categories');

    // ----------------------------------------------------
    // TEST SUITE 4: ROOM AVAILABILITY LOGIC
    // ----------------------------------------------------
    console.log('\n▶ [4/6] Testing Room Availability & Date Overlap Mathematics...');

    // 4.1 Check overlapping dates on Room 2 (Shinjuku Superior Double - total 6 units, 2 active bookings on June 12-14)
    const availRes = await fetch(`${base}/hotels/1/rooms?checkIn=2026-06-12&checkOut=2026-06-14`).then(r => r.json());
    const room2 = availRes.data.find(r => r.id === 2);
    assert(room2.booked_count === 2 && room2.available_rooms === 4 && room2.is_available === true, 'Availability calculation handles multi-unit inventory (6 total - 2 booked = 4 available)');

    // 4.2 Non-overlapping future dates
    const futureRes = await fetch(`${base}/hotels/1/rooms?checkIn=2027-04-10&checkOut=2027-04-15`).then(r => r.json());
    const room2Future = futureRes.data.find(r => r.id === 2);
    assert(room2Future.booked_count === 0 && room2Future.available_rooms === 6, 'Non-overlapping future dates return full inventory (6 available)');

    // 4.3 Invalid Date Range (checkOut <= checkIn)
    const invalidDateRes = await fetch(`${base}/hotels/1/rooms?checkIn=2026-06-15&checkOut=2026-06-10`);
    assert(invalidDateRes.status === 400, 'Invalid date range rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST SUITE 5: BOOKING TRANSACTION & OWNERSHIP
    // ----------------------------------------------------
    console.log('\n▶ [5/6] Testing Transactional Booking & Ownership Protection...');

    // 5.1 Create Valid Booking (Room 1: ¥9,500 * 3 nights = ¥28,500)
    const createBookingRes = await fetch(`${base}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        roomId: 1,
        checkIn: '2026-10-20',
        checkOut: '2026-10-23',
        guests: 1
      })
    });
    const newBookingData = await createBookingRes.json();
    const createdBookingId = newBookingData.data?.id;
    assert(createBookingRes.status === 201 && newBookingData.data.total_price === 28500 && newBookingData.data.nights === 3, 'Create booking calculates 3 nights * ¥9,500 = ¥28,500 with 201 Created');

    // 5.2 Exceed Capacity Rejection
    const capRes = await fetch(`${base}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        roomId: 1, // capacity is 1
        checkIn: '2026-10-25',
        checkOut: '2026-10-27',
        guests: 4
      })
    });
    assert(capRes.status === 400, 'Booking with guests > room.capacity rejected with 400 Bad Request');

    // 5.3 View My Bookings
    const myBookings = await fetch(`${base}/bookings`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    assert(myBookings.data.some(b => b.id === createdBookingId), 'GET /api/bookings returns newly created reservation for the user');

    // 5.4 Ownership Protection: Kenji attempts to access QA user's booking
    const forbidView = await fetch(`${base}/bookings/${createdBookingId}`, {
      headers: { 'Authorization': `Bearer ${kenjiToken}` }
    });
    assert(forbidView.status === 403, 'Cross-user booking access rejected with 403 Forbidden');

    // 5.5 Ownership Protection: Kenji attempts to cancel QA user's booking
    const forbidCancel = await fetch(`${base}/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${kenjiToken}` }
    });
    assert(forbidCancel.status === 403, 'Cross-user booking cancellation rejected with 403 Forbidden');

    // 5.6 Owner Cancels Booking
    const cancelRes = await fetch(`${base}/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(cancelRes.status === 200, 'Owner cancelling own booking succeeds with 200 OK');

    // 5.7 Repeat Cancel Rejection
    const repeatCancel = await fetch(`${base}/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(repeatCancel.status === 400, 'Repeat cancellation on cancelled booking rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST SUITE 6: AI RECOMMENDATION ASSISTANT
    // ----------------------------------------------------
    console.log('\n▶ [6/6] Testing Multilingual AI Travel Assistant...');

    // 6.1 English Prompt
    const aiEnRes = await fetch(`${base}/ai/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'I need a hotel in Tokyo for two people, under ¥15,000 per night, near a train station, with breakfast.'
      })
    }).then(r => r.json());
    assert(aiEnRes.preferences.city === 'Tokyo' && aiEnRes.preferences.guests === 2 && aiEnRes.data.length > 0, 'English AI prompt extracts structured preferences and returns real MySQL hotels');

    // 6.2 Japanese Prompt
    const aiJaRes = await fetch(`${base}/ai/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: '東京で2人で泊まれる、駅に近くて朝食付き、1泊1万5千円以下のホテルを探してください。'
      })
    }).then(r => r.json());
    assert(aiJaRes.preferences.city === 'Tokyo' && aiJaRes.preferences.guests === 2 && aiJaRes.data.length > 0, 'Japanese AI prompt extracts structured preferences and returns real MySQL hotels');

    console.log('\n========================================================');
    console.log(`🏁 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Integration Test Crash:', err);
    server.close();
    process.exit(1);
  }
});
