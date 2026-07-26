const { execSync } = require('child_process');

try {
  execSync('git add docker-compose.yml', { cwd: '/Users/kiranbudachhetri/Downloads/hotel-management-backend' });
  execSync('git commit -m "feat(docker): automate database migrations on microservice container startup"', { cwd: '/Users/kiranbudachhetri/Downloads/hotel-management-backend' });
  execSync('git push origin main', { cwd: '/Users/kiranbudachhetri/Downloads/hotel-management-backend' });
  console.log('Successfully pushed docker-compose updates to GitHub!');
} catch (e) {
  console.log('Git commit notice:', e.message);
}
