import environment from "../config/environment";
import { Button } from "antd";

const TikTokConnector = () => {
  const clientKey = environment.tiktokClientKey;
  const redirectUri = encodeURIComponent(
    "https://platform-app-452833261444.us-central1.run.app"
  );
  const scope = encodeURIComponent("user.info.profile, user.info.stats");
  const state = encodeURIComponent(Math.random().toString(36).substring(7));
  const authUrl =
    `https://www.tiktok.com/v2/auth/authorize?` +
    `client_key=${clientKey}&` +
    `scope=${scope}&` +
    `response_type=code&` +
    `redirect_uri=${redirectUri}&` +
    `state=${state}`;

  const handleLogin = () => {
    window.location.href = authUrl;
  };

  return (
    <Button style={{ height: 40 }} onClick={handleLogin}>
      Connect TikTok Account
    </Button>
  );
};

export default TikTokConnector;
