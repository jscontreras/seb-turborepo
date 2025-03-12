import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Auth0ContextInterface, User } from "@auth0/auth0-react";

const LogoutButton = () => {
  const { logout, isAuthenticated } = useContext(
    AuthContext,
  ) as Auth0ContextInterface<User>;

  // Render nothing if the user is already authenticated
  if (!isAuthenticated) {
    return null;
  }
  return (
    <button
      className="p-4"
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    >
      Log Out
    </button>
  );
};

export default LogoutButton;
