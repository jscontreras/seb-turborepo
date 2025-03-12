import { Link } from "react-router-dom";
import { getConfig } from "../auth0/config";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Auth0ContextInterface, User } from "@auth0/auth0-react";

// Required for consent
const { authorizationParams } = getConfig();
const LoginButton = () => {
  const { isAuthenticated, loginWithRedirect, user } = useContext(
    AuthContext,
  ) as Auth0ContextInterface<User>;

  // Render a link to /profile if the user is authenticated
  if (isAuthenticated && user) {
    return (
      <Link className="p-4" to="/profile">
        Go to {user.name}'s' Profile
      </Link>
    );
  }

  // Render the login button if not authenticated
  return (
    <button
      className="p-4"
      onClick={() => loginWithRedirect({ authorizationParams })}
    >
      Log In
    </button>
  );
};

export default LoginButton;
