import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onProfileCompletion?: (userId: number) => void;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onProfileCompletion
}) => {
  const { googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error('Google authentication failed');
      return;
    }

    try {
      const result = await googleAuth(credentialResponse.credential);

      if (result.success) {
        if (result.requiresProfileCompletion && result.userId) {
          toast.success('Google account connected! Please complete your profile.');
          if (onProfileCompletion) {
            onProfileCompletion(result.userId);
          } else {
            navigate('/complete-profile', {
              state: { userId: result.userId }
            });
          }
        } else {
          toast.success('Successfully signed in with Google!');
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/profile');
          }
        }
      } else {
        toast.error('Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('An error occurred during Google authentication');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google authentication was cancelled or failed');
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        theme="outline"
        size="large"
        width={400}
        text="signin_with"
        shape="rectangular"
      />
    </div>
  );
};

export default GoogleOAuthButton;
