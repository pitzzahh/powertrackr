import { GitHub } from "arctic";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";
import { page } from "$app/state";

export const github = new GitHub(
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  `${page.url.protocol}//${page.url.host}/login/github/callback`,
);
