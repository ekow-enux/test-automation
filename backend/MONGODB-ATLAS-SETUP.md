# MongoDB Atlas Setup Guide for Tests

This guide will help you set up MongoDB Atlas for your backend tests.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project

## Step 2: Create a Cluster

1. In your project, click "Create a Cluster"
2. Choose the free tier (M0)
3. Select a region close to your location
4. Name your cluster (e.g., "test-cluster")
5. Click "Create Cluster"

## Step 3: Set Up Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" as the authentication method
4. Create a username and password for your test database
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0) for testing purposes
   - **Note**: For production, you should use specific IP addresses
4. Click "Confirm"

## Step 5: Get Connection String

1. Go back to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "3.6 or later"
5. Copy the connection string - it will look like:
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/test?retryWrites=true&w=majority
   ```

## Step 6: Set Up Test Environment

1. Copy the example environment file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Edit `.env.test` and replace the `MONGODB_TEST_URI`:
   ```env
   MONGODB_TEST_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/testdb?retryWrites=true&w=majority
   ```

3. **Important**: Replace `your-username`, `your-password`, `your-cluster`, and `testdb` with your actual values

## Step 7: Test the Connection

Run your tests to verify the connection works:

```bash
npm test
```

If everything is set up correctly, your tests should connect to MongoDB Atlas and run successfully.

## Security Best Practices

### For Development/Testing:
- Use a separate test database (not your production database)
- Use strong passwords
- Consider using environment variables for sensitive data

### For Production:
- Use IP whitelisting instead of "Allow access from anywhere"
- Use strong, unique passwords
- Enable SSL/TLS connections
- Monitor database access
- Use dedicated database users with minimal required privileges

## Troubleshooting

### Connection Issues:
1. **Check your IP address**: Make sure your current IP is allowed in Network Access
2. **Verify credentials**: Double-check username and password
3. **Check cluster status**: Ensure your cluster is not paused
4. **SSL/TLS issues**: Make sure your connection string includes the SSL parameters

### Common Error Messages:
- `Authentication failed`: Check username/password
- `Network timeout`: Check network access settings
- `Cluster not found`: Check cluster name in connection string
- `Database does not exist**: Create the database or use a database that exists

## Alternative: Use In-Memory Database

If you prefer not to set up MongoDB Atlas, the tests will automatically use an in-memory MongoDB database when `MONGODB_TEST_URI` is not set. This is great for:
- Quick local testing
- CI/CD pipelines
- Development environments

Simply don't set the `MONGODB_TEST_URI` environment variable, and the tests will use the in-memory database automatically.

## Next Steps

Once your MongoDB Atlas is set up:

1. Run the test suite: `npm test`
2. Check test coverage: `npm run test:coverage`
3. Run Cypress E2E tests: `npm run cypress:run`

Your tests are now configured to use MongoDB Atlas for realistic testing conditions!