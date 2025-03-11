import { useContext } from "react";
import { AuthContext } from "../App";

const LogoutButton = () => {
  const { logout, isAuthenticated } = useContext(AuthContext) as any;

  // Render nothing if the user is already authenticated
  if (!isAuthenticated) {
    return null;
  }
  return (
    <button className="p-4" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
      Log Out
    </button>
  );
};

export default LogoutButton;