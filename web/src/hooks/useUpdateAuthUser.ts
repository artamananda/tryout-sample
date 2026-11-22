import { useSignIn } from 'react-auth-kit';
import { getToken, getTokenRemainingMinutes } from '../helpers/auth';
import { UserProperties } from '../types/user.type';

/**
 * react-auth-kit keeps the logged-in user in its auth state, which is only set
 * at sign-in. This re-signs in with the same token so screens such as the
 * sidebar show the updated profile right away.
 */
export default function useUpdateAuthUser() {
  const signIn = useSignIn();

  return (user: UserProperties) => {
    const token = getToken();
    const expiresIn = getTokenRemainingMinutes(token);
    if (!token || expiresIn <= 0) return false;
    return signIn({
      token,
      expiresIn,
      tokenType: 'Bearer',
      authState: user
    });
  };
}
