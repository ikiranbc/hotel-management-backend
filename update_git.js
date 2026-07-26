const { execSync } = require('child_process');

try {
  execSync('git add Hotel_Booking_System_API_Collection.json', { cwd: '/Users/kiranbudachhetri/Downloads/hotel-management-backend' });
  execSync('git commit -m "docs: add root Postman collection with automatic token authentication"', { cwd: '/Users/kiranbudachhetri/Downloads/hotel-management-backend' });
  execSync('git push origin main', { cwd: '/Users/kiranbudachhetri/Downloads/hotel-management-backend' });
  console.log('Successfully pushed Postman collection to GitHub!');
} catch (e) {
  console.log('Git commit notice:', e.message);
}
