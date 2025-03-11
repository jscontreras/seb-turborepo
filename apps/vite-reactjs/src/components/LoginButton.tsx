import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import { getConfig } from "../auth0/config";

// Required for consent
const { authorizationParams } = getConfig();

const LoginButton = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  // Render a link to /profile if the user is authenticated
  if (isAuthenticated) {
    return <Link className="p-4" to="/profile">Go to Profile</Link>;
  }

  // Render the login button if not authenticated
  return <button className="p-4" onClick={() => loginWithRedirect({authorizationParams})}>Log In</button>;
};

export default LoginButton;
