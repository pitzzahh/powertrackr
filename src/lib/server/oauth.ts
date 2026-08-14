import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$app/env/private";

export class OAuth2Tokens {
  constructor(private accessTokenValue: string) {}

  accessToken(): string {
    return this.accessTokenValue;
  }
}

export class GitHub {
  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectURI: string
  ) {}

  createAuthorizationURL(state: string, scopes: string[]): URL {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectURI);
    url.searchParams.set("scope", scopes.join(" "));
    url.searchParams.set("state", state);
    return url;
  }

  async validateAuthorizationCode(code: string): Promise<OAuth2Tokens> {
    const body = new URLSearchParams();
    body.set("client_id", this.clientId);
    body.set("client_secret", this.clientSecret);
    body.set("code", code);
    body.set("redirect_uri", this.redirectURI);

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const data = (await response.json()) as { access_token?: string; error?: string };
    if (!data.access_token) {
      throw new Error(data.error ?? "Failed to exchange code for access token");
    }
    return new OAuth2Tokens(data.access_token);
  }
}

export function createGitHub(url: URL) {
  return new GitHub(
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    `${url.protocol}//${url.host}/auth/callback?oauth=github`
  );
}
