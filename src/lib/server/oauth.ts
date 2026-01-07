import { GitHub } from "arctic";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

export function createGitHub(url: URL) {
  return new GitHub(
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    `${url.protocol}//${url.host}/auth/callback?oauth=github`
  );
}
