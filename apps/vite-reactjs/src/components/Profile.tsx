import { Auth0ContextInterface, useAuth0 } from "@auth0/auth0-react";

interface User {
  picture: string;
  name: string;
  email: string;
}

const Profile = () => {
  const { user, isAuthenticated, isLoading }: Auth0ContextInterface<User> = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated && (
      <div>
        <h1 className="text-xl font-bold uppercase mb-8">Profile (authenticated)</h1>
      <div className="flex  justify-center">
        <div className="min-w-28	mr-10">
          <img src={user?.picture} alt={user?.name} />
        </div>
        <div className="text-left justify-between items-center">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
      </div>
      </div>
    )
  );
};

export default Profile;