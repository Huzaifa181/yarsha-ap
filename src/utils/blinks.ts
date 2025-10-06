import {  Action, ActionAdapter, ActionGetResponse, ActionSupportStrategy, defaultActionSupportStrategy } from "@dialectlabs/blinks";

export const SOLANA_ACTION_PREFIX = /^(solana-action:|solana:)/;
let proxyUrl: string | null = "https://proxy.dial.to";

type IsInterstitialResult =
  | {
      isInterstitial: true;
      decodedActionUrl: string;
    }
  | {
      isInterstitial: false;
    };

interface ActionMetadata {
  blockchainIds?: string[];
  version?: string;
}

export function isInterstitial(url: string): IsInterstitialResult {
  try {
    const urlObj = new URL(url);

    const actionUrl = urlObj.searchParams.get("action");
    if (!actionUrl) {
      return { isInterstitial: false };
    }
    const urlDecodedActionUrl = decodeURIComponent(actionUrl);

    if (!SOLANA_ACTION_PREFIX.test(urlDecodedActionUrl)) {
      return { isInterstitial: false };
    }

    const decodedActionUrl = urlDecodedActionUrl.replace(
      SOLANA_ACTION_PREFIX,
      ""
    );

    // Validate the decoded action URL
    const decodedActionUrlObj = new URL(decodedActionUrl);

    return {
      isInterstitial: true,
      decodedActionUrl: decodedActionUrlObj.toString(),
    };
  } catch (e) {
    console.error(
      `[@dialectlabs/blinks] Failed to check if URL is interstitial: ${url}`,
      e
    );
    return { isInterstitial: false };
  }
}

export type ActionsJsonConfig = {
  rules: Action[];
};

export const addWWWIfMissing = (url: string) => {
  if (url.startsWith("https://") && !url.includes("www.", 8)) {
    const parts = url.split("https://");
    return `https://www.${parts[1]}`;
  }
  return url;
};

export async function IsBlinkUrl(actionUrl: string): Promise<boolean> {
  try {
    let isBlink = false;
    const url = new URL(actionUrl);
    const strUrl = actionUrl.toString();
    // case 1: if the URL is a solana action URL
    if (SOLANA_ACTION_PREFIX.test(strUrl)) {
      isBlink = true;
    }

    // case 2: if the URL is an interstitial URL
    const interstitialData = isInterstitial(actionUrl);
    if (interstitialData.isInterstitial) {
      isBlink = true;
    }

    // case 3: if the URL is a website URL which has action.json

    const actionsJsonUrl = url.origin + "/actions.json";

    try {
      const response = await fetch(proxify(actionsJsonUrl));
      const actionsJson = await response.json();
      const matchingRule = actionsJson?.rules?.find((rule: any) => {
        const pathPatternRegex = new RegExp(
          rule?.pathPattern.replace("/**", "(\\/.*)?")?.replace("**", ".*")
        );
        return (
          pathPatternRegex?.test(url.pathname) || pathPatternRegex?.test(url.href)
        );
      });
      if (matchingRule) {
        isBlink = true;
      }
    } catch (err) {
      console.log("Error fetching or processing actions.json:", err);
      isBlink = false;
    }
    return isBlink;
  } catch (err) {
    return false;
  }
}

function shouldIgnoreProxy(url: URL): boolean {
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }
  if (!proxyUrl) {
    return true;
  }
  return false;
}

export function proxify(url: string): URL {
  const baseUrl = new URL(url);
  if (shouldIgnoreProxy(baseUrl)) {
    return baseUrl;
  }
  const proxifiedUrl = new URL(proxyUrl!);
  proxifiedUrl.searchParams.set("url", url);
  return proxifiedUrl;
}


export function proxifyImage(url: string): URL {
  const baseUrl = new URL(url);
  if (shouldIgnoreProxy(baseUrl)) {
    return baseUrl;
  }
  const proxifiedUrl = new URL(`${proxyUrl!}/image`);
  proxifiedUrl.searchParams.set('url', url);
  return proxifiedUrl;
}

export const isUrlSameOrigin = (origin: string, url: string): boolean => {
  if (!url.startsWith('http')) {
    return true;
  }

  const urlObj = new URL(url);

  return urlObj.origin === origin;
};


export const getActionMetadata = (response: Response): ActionMetadata => {
  const blockchainIds = response.headers
    .get('x-blockchain-ids')
    ?.split(',')
    .map((id) => id.trim());
  const version = response.headers.get('x-action-version')?.trim();

  return {
    blockchainIds,
    version,
  };
};


// export const fetchAction = async (
//   apiUrl: string,
//   adapter?: ActionAdapter,
//   supportStrategy: ActionSupportStrategy = defaultActionSupportStrategy
// ): Promise<any> => {

//   const proxyUrl = proxify(apiUrl).toString();

//   // Native JavaScript fetch with headers
//   const response = await fetch(proxyUrl, {
//     headers: {
//       Accept: 'application/json',
//     },
//   });

//   if (!response.ok) {
//     throw new Error(
//       `Failed to fetch action ${proxyUrl}, action url: ${apiUrl}`,
//     );
//   }

//   const data = (await response.json()) as ActionGetResponse;
//   const metadata = getActionMetadata(response);

//   // Return the Action instance
//   return new Action(
//     apiUrl,
//     { ...data, type: 'action' },
//     metadata,
//     supportStrategy,
//     adapter
//   );
// };
export const createResponseFromData = (data: any): Response => {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
};