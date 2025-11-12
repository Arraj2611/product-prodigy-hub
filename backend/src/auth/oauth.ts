import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/database.js';
import { generateAccessToken, generateRefreshToken } from './jwt.js';
import logger from '../utils/logger.js';

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export const handleOAuthCallback = async (
  provider: 'google' | 'github',
  profile: OAuthProfile
) => {
  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          emailVerified: true, // OAuth providers verify emails
        },
      });
      logger.info(`OAuth user created: ${user.email} via ${provider}`);
    } else {
      // Update user info if needed
      if (profile.name && !user.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: profile.name,
            avatar: profile.avatar || user.avatar,
            emailVerified: true,
          },
        });
      }
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`OAuth callback error for ${provider}:`, error);
    throw new AppError('OAuth authentication failed', 500);
  }
};

// Google OAuth (requires passport-google-oauth20 package)
// This is a placeholder - actual implementation would use passport.js
export const getGoogleAuthUrl = (): string => {
  if (!config.GOOGLE_CLIENT_ID) {
    throw new AppError('Google OAuth not configured', 500);
  }

  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: `${config.CORS_ORIGIN}/api/${config.API_VERSION}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// GitHub OAuth (requires passport-github2 package)
export const getGitHubAuthUrl = (): string => {
  if (!config.GITHUB_CLIENT_ID) {
    throw new AppError('GitHub OAuth not configured', 500);
  }

  const params = new URLSearchParams({
    client_id: config.GITHUB_CLIENT_ID,
    redirect_uri: `${config.CORS_ORIGIN}/api/${config.API_VERSION}/auth/github/callback`,
    scope: 'user:email',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

