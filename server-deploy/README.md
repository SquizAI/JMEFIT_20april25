# JMEFIT API Server Deployment

This package contains the API server for JMEFIT.com. Follow these instructions to deploy it to SiteGround.

## Deployment Steps

### 1. Upload Files

Upload all files in this directory to your SiteGround subdomain directory (e.g., `/public_html/api`).

### 2. Set Up Node.js in SiteGround

1. Go to Site Tools > Devs > Node.js
2. Create a new Node.js application:
   - **App Path**: Select your api subdomain directory
   - **App URL**: api.jmefit.com
   - **Node.js Version**: Select the latest version (18.x or higher)
   - **Entry Point**: app.js
   - **Environment Variables**: Make sure to set up the environment variables from the .env file

### 3. Install Dependencies

After setting up the Node.js application, use the SiteGround terminal or SSH to:

```bash
cd /path/to/your/api/directory
npm install
```

### 4. Start the Application

Start your Node.js application from the SiteGround Node.js manager.

## Testing

After deployment, test your API by visiting:
- https://api.jmefit.com/health
- https://api.jmefit.com/api/test

## Troubleshooting

If you encounter issues:
1. Check the Node.js application logs in SiteGround
2. Verify all environment variables are set correctly
3. Make sure the .htaccess file is properly uploaded
4. Check that the DNS record for api.jmefit.com is pointing to the correct IP
