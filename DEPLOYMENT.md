# WashikaDAO Deployment Guide

## Vercel Deployment

### Prerequisites
- GitHub repository with your code
- Vercel account (free tier available)
- Node.js 18+ for local development

### Quick Deploy to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your WashikaDAO repository

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

3. **Environment Variables** (Optional)
   - Add environment variables in Vercel dashboard:
     - `NODE_ENV`: `production` (for mainnet) or `development` (for testnet)
   - For testnet deployment, you can leave NODE_ENV as `development`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a live URL like `https://washika-dao-xxx.vercel.app`

### Manual Deployment via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

### Build Configuration

The project is configured with:
- **Frontend**: React + Vite + TypeScript
- **Styling**: TailwindCSS
- **Blockchain**: Stacks integration
- **Build Output**: Static files in `frontend/dist`

### Network Configuration

- **Development/Testnet**: Uses Stacks Testnet
- **Production**: Uses Stacks Mainnet
- **Contract Address**: Automatically configured based on environment

### Post-Deployment

1. **Test the deployment**:
   - Visit your Vercel URL
   - Connect a Stacks wallet
   - Test basic functionality

2. **Custom Domain** (Optional):
   - Add your custom domain in Vercel dashboard
   - Configure DNS settings

3. **Analytics** (Optional):
   - Enable Vercel Analytics in dashboard
   - Monitor performance and usage

### Troubleshooting

**Build Fails**:
- Check that all dependencies are in `frontend/package.json`
- Ensure TypeScript compilation passes: `cd frontend && npm run type-check`

**Runtime Errors**:
- Check browser console for errors
- Verify Stacks wallet connection works
- Test contract interactions

**Environment Issues**:
- Verify NODE_ENV is set correctly
- Check that contract addresses are configured for the right network

### Contract Addresses

**Testnet**:
- Governance: `STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.simple-governance`
- Savings: `STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.savings-stx-v4`

**Mainnet**: 
- Deploy contracts to mainnet and update addresses in `frontend/src/utils/stacks.ts`
