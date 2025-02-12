const AMCV_COOKIE = 'AMCV_9E1005A551ED61CA0A490D45@AdobeOrg';
const KNDCTR_COOKIE_KEYS = [
  'kndctr_9E1005A551ED61CA0A490D45_AdobeOrg_identity',
  'kndctr_9E1005A551ED61CA0A490D45_AdobeOrg_cluster',
];

function getDomainWithoutWWW() {
  const domain = window?.location?.hostname;
  return domain.replace(/^www\./, '');
}

/**
 * Generates a random UUIDv4 using cryptographically secure random values.
 * This implementation follows the RFC 4122 specification for UUIDv4.
 * It uses the `crypto` API for secure randomness without any bitwise operators.
 *
 * @returns {string} A random UUIDv4 string, e.g., 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
 * where:
 *  - 'x' is any hexadecimal digit (0-9, a-f)
 *  - 'y' is one of 8, 9, A, or B, ensuring that the UUID conforms to version 4.
 *
 * @example
 * const myUuid = generateUUIDv4();
 * console.log(myUuid);  // Outputs: 'e8b57e2f-8cb1-4d0f-804b-e1a45bce2d90'
 */
function generateUUIDv4() {
  // Generate an array of 16 random values using the crypto API for better randomness
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);

  // Set the version (4) at the 13th position
  randomValues[6] = (randomValues[6] % 16) + 64; // '4' for version 4
  // Set the variant (8, 9, A, or B) at the 17th position
  randomValues[8] = (randomValues[8] % 16) + 128; // One of 8, 9, A, or B

  // Accumulate the UUID string in a separate variable (to avoid modifying the parameter directly)
  let uuid = '';

  // Convert the random values to a UUID string (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  randomValues.forEach((byte, index) => {
    const hex = byte.toString(16).padStart(2, '0'); // Convert byte to hex
    if (index === 4 || index === 6 || index === 8 || index === 10) {
      uuid += '-'; // Add dashes at appropriate positions
    }
    uuid += hex;
  });

  return uuid;
}

/**
 * Determines the Adobe Target property value based on the page's region.
 *
 * @param {string} env - The environment (e.g., 'prod' for production, 'dev' for development).
 * @returns {string} Adobe Target property value.
 */
function getTargetPropertyBasedOnPageRegion(env) {
  const { pathname } = window.location;

  if (env !== 'prod') return 'bc8dfa27-29cc-625c-22ea-f7ccebfc6231'; // Default for non-prod environments

  // EMEA & LATAM
  if (
    pathname.search(
      /(\/africa\/|\/be_en\/|\/be_fr\/|\/be_nl\/|\/cis_en\/|\/cy_en\/|\/dk\/|\/de\/|\/ee\/|\/es\/|\/fr\/|\/gr_en\/|\/ie\/|\/il_en\/|\/it\/|\/lv\/|\/lu_de\/|\/lu_en\/|\/lu_fr\/|\/hu\/|\/mt\/|\/mena_en\/|\/nl\/|\/no\/|\/pl\/|\/pt\/|\/ro\/|\/ch_de\/|\/si\/|\/sk\/|\/ch_fr\/|\/fi\/|\/se\/|\/ch_it\/|\/tr\/|\/uk\/|\/at\/|\/cz\/|\/bg\/|\/ru\/|\/cis_ru\/|\/ua\/|\/il_he\/|\/mena_ar\/|\/lt\/|\/sa_en\/|\/ae_en\/|\/ae_ar\/|\/sa_ar\/|\/ng\/|\/za\/|\/qa_ar\/|\/eg_en\/|\/eg_ar\/|\/kw_ar\/|\/eg_ar\/|\/qa_en\/|\/kw_en\/|\/gr_el\/|\/br\/|\/cl\/|\/la\/|\/mx\/|\/co\/|\/ar\/|\/pe\/|\/gt\/|\/pr\/|\/ec\/|\/cr\/)/,
    ) !== -1
  ) {
    return '488edf5f-3cbe-f410-0953-8c0c5c323772';
  }
  if ( // APAC
    pathname.search(
      /(\/au\/|\/hk_en\/|\/in\/|\/nz\/|\/sea\/|\/cn\/|\/hk_zh\/|\/tw\/|\/kr\/|\/sg\/|\/th_en\/|\/th_th\/|\/my_en\/|\/my_ms\/|\/ph_en\/|\/ph_fil\/|\/vn_en\/|\/vn_vi\/|\/in_hi\/|\/id_id\/|\/id_en\/)/,
    ) !== -1
  ) {
    return '3de509ee-bbc7-58a3-0851-600d1c2e2918';
  }
  // JP
  if (pathname.indexOf('/jp/') !== -1) {
    return 'ba5bc9e8-8fb4-037a-12c8-682384720007';
  }

  return '4db35ee5-63ad-59f6-cec6-82ef8863b22d'; // Default
}

/**
 * Retrieves device-related information such as screen and viewport dimensions.
 *
 * @returns {Object} Object containing device and viewport information.
 */
function getDeviceInfo() {
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenOrientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

/**
 * Retrieves the value of a specific cookie by its key.
 *
 * @param {string} key - The cookie key.
 * @returns {string|null} The cookie value, or null if the cookie doesn't exist.
 */
function getCookie(key) {
  const cookie = document.cookie.split(';')
    .map((x) => decodeURIComponent(x.trim()).split(/=(.*)/s))
    .find(([k]) => k === key);

  return cookie ? cookie[1] : null;
}

/**
 * Sets a cookie with a specified expiration time (default 730 days).
 *
 * @param {string} key - The cookie key.
 * @param {string} value - The cookie value.
 * @param {Object} [options={}] - Optional settings for cookie properties.
 * Defaults to an expiration of 730 days.
 */
function setCookie(key, value, options = {}) {
  // Default expiration (24 months)
  const expires = options.expires || 730;
  const date = new Date();
  date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
  const expiresString = `expires=${date.toUTCString()}`;

  document.cookie = `${key}=${value}; ${expiresString}; path=/ ; domain=.${getDomainWithoutWWW()};`;
}

/**
 * Retrieves the ECID (Experience Cloud ID) from the browser's cookies or
 * generates a new FPID (First Party ID) if the ECID is not found. Returns
 * the ID in a structured object, depending on which ID is available.
 *
 * @returns {Object} An object containing either the ECID or FPID.
 *   - If ECID is found, the object will be:
 *     { ECID: [{ id: string, authenticatedState: string, primary: boolean }] }
 *   - If ECID is not found, the object will be:
 *     { FPID: [{ id: string, authenticatedState: string, primary: boolean }] }
 */
function getOrGenerateUserId() {
  const amcvCookieValue = getCookie(AMCV_COOKIE);

  // If ECID is not found, generate and return FPID
  if (!amcvCookieValue || (amcvCookieValue.indexOf('MCMID|') === -1)) {
    const fpidValue = generateUUIDv4();
    return {
      FPID: [{
        id: fpidValue,
        authenticatedState: 'ambiguous',
        primary: true,
      }],
    };
  }

  return {
    ECID: [{
      id: amcvCookieValue.match(/MCMID\|([^|]+)/)?.[1],
      authenticatedState: 'ambiguous',
      primary: true,
    }],
  };
}

/**
 * Retrieves the page name for analytics, modified for the current locale.
 *
 * @param {Object} params - The parameters.
 * @param {Object} params.locale - The locale object containing
 * language/region info (e.g., { ietf: 'en-US', prefix: 'us' }).
 * @returns {string} The modified page name.
 */
function getPageNameForAnalytics({ locale }) {
  const { host, pathname } = new URL(window.location.href);
  const [modifiedPath] = pathname.split('/').filter((x) => x !== locale.prefix).join(':').split('.');
  return `${host.replace('www.', '')}:${modifiedPath}`;
}

/**
 * Creates the updated context for the request payload for analytics or personalization requests.
 *
 * @param {number} screenWidth - Screen width.
 * @param {number} screenHeight - Screen height.
 * @param {string} screenOrientation - Orientation of the screen.
 * @param {number} viewportWidth - Viewport width.
 * @param {number} viewportHeight - Viewport height.
 * @param {string} localTime - The local time in ISO format.
 * @param {number} timezoneOffset - The timezone offset.
 * @returns {Object} The updated context for the request payload.
 */
function getUpdatedContext({
  screenWidth, screenHeight, screenOrientation,
  viewportWidth, viewportHeight, localTime, timezoneOffset,
}) {
  return {
    device: {
      screenHeight,
      screenWidth,
      screenOrientation,
    },
    environment: {
      type: 'browser',
      browserDetails: {
        viewportWidth,
        viewportHeight,
      },
    },
    placeContext: {
      localTime,
      localTimezoneOffset: timezoneOffset,
    },
  };
}

/**
 * Retrieves specific MarTech cookies by their keys.
 *
 * @returns {Array<Object>} List of MarTech cookies with each
 * object containing 'key' and 'value' properties.
 */
const getMartechCookies = () => document.cookie.split(';')
  .map((x) => x.trim().split('='))
  .filter(([key]) => KNDCTR_COOKIE_KEYS.includes(key))
  .map(([key, value]) => ({ key, value }));

/**
 * Determines whether a user is a "New" or "Repeat" visitor based on a cookie.
 * If the user has visited the site within the last `d` days, they are considered "Repeat".
 * Otherwise, they are considered "New".
 *
 * @param {number} [d=30] - Number of days until the cookie expires. Default is 30 days.
 * @param {string} [cn='s_nr'] - Name of the cookie. Default is "s_nr".
 * @param {string} [domain] - The domain on which to set the cookie.
 * @returns {string} - Returns "New" or "Repeat" based on the user's visit history.
 */
function getNewRepeat(d = 30, cn = 's_nr', domain) {
  const now = Date.now();
  const timeInDays = d * (24 * 60 * 60 * 1000);
  const expirationDate = new Date(now + timeInDays);

  // Get the cookie value
  const cval = getCookie(cn) || '';

  // Set cookie attributes
  const attributes = {
    expires: expirationDate.toUTCString(),
    path: '/',
  };
  if (domain) {
    attributes.domain = domain;
  }

  // If the cookie doesn't exist, set it and return "New"
  if (!cval) {
    setCookie(cn, `${now}-New`, attributes);
    return 'New';
  }

  // Split the cookie value into the timestamp and the status
  const [timestamp, status] = cval.split('-');

  // If the user's last activity was less than 30 minutes ago and they were "New",
  // update the cookie and return "New"
  if (now - parseInt(timestamp, 10) < 30 * 60 * 1000 && status === 'New') {
    setCookie(cn, `${now}-New`, attributes);
    return 'New';
  }

  // Otherwise, update the cookie to "Repeat" and return "Repeat"
  setCookie(cn, `${now}-Repeat`, attributes);
  return 'Repeat';
}

/**
 * Determines the highest-level domain on which cookies can be set.
 * This function attempts to set a test cookie on progressively higher-level domains
 * until it finds the highest domain where the cookie can be set.
 *
 * @returns {string} - The effective domain where cookies can be set,
 * or an empty string if no valid domain is found.
 */
function getDomain() {
  // Cache the effective domain to avoid recomputation
  let effectiveDomain = '';

  // If the effective domain is already determined, return it
  if (effectiveDomain) {
    return effectiveDomain;
  }

  // Split the hostname into parts (e.g., ["www", "example", "com"])
  const parts = window.location.hostname.toLowerCase().split('.');
  const domain = [];
  let part = '';
  let successfullySet = false;

  // Start from the top-level domain (TLD) and work upwards
  part = parts.pop(); // Remove the TLD (e.g., "com")
  domain.unshift(part); // Add the TLD to the domain array

  // Iterate through the remaining parts of the hostname
  while (parts.length > 0) {
    part = parts.pop(); // Remove the next part (e.g., "example")
    domain.unshift(part); // Add it to the domain array

    // Create a date 1 second in the future for the cookie expiration
    const date = new Date();
    date.setTime(date.getTime() + 1000);

    try {
      // Attempt to set a test cookie on the current domain
      setCookie('sat_domain', 'A', {
        expires: date,
        domain: domain.join('.'), // Join the domain parts (e.g., "example.com")
      });
    } catch (err) {
      // If setting the cookie fails, break out of the loop
      break;
    }

    // Check if the cookie was successfully set
    if (getCookie('sat_domain') === 'A') {
      successfullySet = true;
      effectiveDomain = domain.join('.'); // Cache the effective domain
      break;
    }
  }

  // Return the effective domain or an empty string if no valid domain was found
  return successfullySet ? effectiveDomain : '';
}

const sha256 = function (b) {
  function c(a, b) {
    return (a >>> b) | (a << (32 - b));
  }
  for (
    var d, e, f = Math.pow, g = f(2, 32), h = "length", i = "", j = [], k = 8 * b[h], l = sha256.h = sha256.h || [], m = sha256.k = sha256.k || [], n = m[h], o = {}, p = 2;
    64 > n;
    p++
  ) {
    if (!o[p]) {
      for (d = 0; 313 > d; d += p) o[d] = p;
      l[n] = f(p, 0.5) * g | 0;
      m[n++] = f(p, 1 / 3) * g | 0;
    }
  }
  for (b += "\x80"; b[h] % 64 - 56; ) b += "\x00";
  for (d = 0; d < b[h]; d++) {
    if (((e = b.charCodeAt(d)), e >> 8)) return;
    j[d >> 2] |= e << ((3 - d) % 4) * 8;
  }
  for (j[j[h]] = k / g | 0, j[j[h]] = k, e = 0; e < j[h]; ) {
    var q = j.slice(e, (e += 16)), r = l;
    for (l = l.slice(0, 8), d = 0; 64 > d; d++) {
      var s = q[d - 15],
        t = q[d - 2],
        u = l[0],
        v = l[4],
        w = l[7] + (c(v, 6) ^ c(v, 11) ^ c(v, 25)) + ((v & l[5]) ^ (~v & l[6])) + m[d] + (q[d] = 16 > d ? q[d] : (q[d - 16] + (c(s, 7) ^ c(s, 18) ^ (s >>> 3)) + q[d - 7] + (c(t, 17) ^ c(t, 19) ^ (t >>> 10))) | 0),
        x = (c(u, 2) ^ c(u, 13) ^ c(u, 22)) + ((u & l[1]) ^ (u & l[2]) ^ (l[1] & l[2]));
      l = [w + x | 0].concat(l);
      l[4] = l[4] + w | 0;
    }
    for (d = 0; 8 > d; d++) l[d] = l[d] + r[d] | 0;
  }
  for (d = 0; 8 > d; d++) {
    for (e = 3; e + 1; e--) {
      var y = (l[d] >> (8 * e)) & 255;
      i += (16 > y ? 0 : "") + y.toString(16);
    }
  }
  return i;
};


/**
 * Determines the Creative Cloud entitlement based on the user profile and scope.
 *
 * @param {Object} profile - The user profile object.
 * @param {string} scope - The scope from adobeIMS.adobeIdData.
 * @returns {string} The Creative Cloud entitlement ('paid', 'free', or 'notEntitled').
 */
function getEntitlementCreativeCloud(profile) {
  const scope = window.adobeIMS.adobeIdData.scope;
  if (
    scope &&
    scope.indexOf('creative_cloud') !== -1 &&
    profile &&
    profile.serviceAccounts
  ) {
    const serviceAccount = profile.serviceAccounts.find(
      (sa) => sa.serviceCode === 'creative_cloud'
    );

    if (!serviceAccount) {
      return 'notEntitled'; // No Creative Cloud service account found
    }

    // Check the service level
    if (serviceAccount.serviceLevel === 'CS_LVL_2') {
      return 'paid'; // Paid entitlement
    } else if (serviceAccount.serviceLevel === 'CS_LVL_1') {
      return 'free'; // Free entitlement
    } else {
      return 'notEntitled'; // Any other service level (e.g., CS_LVL_4)
    }
  }
  return 'notEntitled'; // Default if conditions are not met
}

/**
 * Determines the Creative Cloud entitlement status based on the user profile and scope.
 *
 * @param {Object} profile - The user profile object.
 * @param {string} scope - The scope from adobeIMS.adobeIdData.
 * @returns {string} The Creative Cloud entitlement status.
 */
function getEntitlementStatusCreativeCloud(profile) {
  const scope = window.adobeIMS.adobeIdData.scope;
  if (
    scope &&
    scope.indexOf('creative_cloud') !== -1 &&
    profile &&
    profile.serviceAccounts
  ) {
    const serviceAccount = profile.serviceAccounts.find(
      (sa) => sa.serviceCode === 'creative_cloud'
    );
    return serviceAccount?.serviceStatus || 'none';
  }
  return 'none';
}

/**
 * Creates the profileInfo structure based on the user profile fetched from IMS.
 *
 * @param {Object} profile - The user profile object fetched from IMS.
 * @param {string} returningStatus - The returning status of the user.
 * @returns {Object} The profileInfo object.
 */
function createProfileInfo(profile, returningStatus) {
  const scope = window.adobeIMS.adobeIdData.scope;
  const adobeIMSUserProfile = {
    account_type: profile?.account_type || 'unknown',
    preferred_languages: profile?.preferred_languages || null,
    countryCode: profile?.countryCode || 'unknown',
    toua: profile?.toua || 'unknown',
    email: sha256(profile?.email?.toLowerCase() || 'unknown'),
    first_name: sha256(profile?.first_name?.toLowerCase() || 'unknown'),
    last_name: sha256(profile?.last_name?.toLowerCase() || 'unknown'),
    phoneNumber: sha256(profile?.phoneNumber?.replace('+', '') || 'unknown'),
    roles: profile?.roles || [],
    tags: profile?.tags || [],
  };

  return {
    authState: 'authenticated', // Assuming the user is signed in
    entitlementCreativeCloud: getEntitlementCreativeCloud(profile),
    entitlementStatusCreativeCloud: getEntitlementStatusCreativeCloud(profile),
    returningStatus: returningStatus || 'Repeat',
    profileID: profile?.userId?.split('@')[0] || 'unknown',
    authID: profile?.authId?.split('@')[0] || 'unknown',
    fullProfileID: profile?.userId || 'unknown',
    fullAuthID: profile?.authId || 'unknown',
    adobeIMSUserProfile,
  };
}

/**
 * Retrieves the profile information for the current user.
 *
 * @returns {Promise<Object>} A promise that resolves to the profileInfo object.
 */
async function getProfileInfo() {
  const profile = await window.adobeIMS.getProfile(); // Fetch profile from IMS
  const returningStatus = getNewRepeat(365, 's_nr', getDomain()); // Get returning status

  return createProfileInfo(profile, returningStatus);
}

/**
 * Creates the request payload for Adobe Analytics and Target.
 *
 * @param {Object} params - Parameters required to create the payload.
 * @param {Object} params.updatedContext - The updated context for the request.
 * @param {string} params.pageName - The page name for the analytics request.
 * @param {Object} params.locale - The locale object containing language/region info.
 * @param {string} params.env - The environment (e.g., 'prod' for production).
 * @returns {Object} The request payload for Adobe Analytics and Target.
 */
function createRequestPayload({ updatedContext, pageName, locale, env, status }) {
  const prevPageName = getCookie('gpv');

  const REPORT_SUITES_ID = env === 'prod' ? ['adbadobenonacdcprod'] : ['adbadobenonacdcqa'];
  const AT_PROPERTY_VAL = getTargetPropertyBasedOnPageRegion(env);

  // Prepare the primaryUser structure based on login state
  const primaryUser = status
    ? { primaryProfile: { profileInfo: getProfileInfo() } } // Fetch profileInfo if logged in
    : { primaryProfile: { profileInfo: { authState: 'loggedOut', returningStatus: 'Repeat' } } }; // Default for logged out

  return {
    event: {
      xdm: {
        ...updatedContext,
        identityMap: getOrGenerateUserId(),
        web: {
          webPageDetails: {
            URL: window.location.href,
            siteSection: 'www.adobe.com',
            server: 'www.adobe.com',
            isErrorPage: false,
            isHomePage: false,
            name: pageName,
            pageViews: { value: 0 },
          },
          webInteraction: {
            name: 'Martech-API',
            type: 'other',
            linkClicks: { value: 1 },
          },
          webReferrer: { URL: document.referrer },
        },
        timestamp: new Date().toISOString(),
        eventType: 'decisioning.propositionFetch',
      },
      data: {
        __adobe: {
          target: {
            is404: false, authState: 'loggedOut', hitType: 'propositionFetch', isMilo: true, adobeLocale: locale.ietf, hasGnav: true,
          },
        },
        _adobe_corpnew: {
          marketingtech: { adobe: { alloy: { approach: 'martech-API' } } },
          digitalData: {
            page: { pageInfo: { language: locale.ietf } },
            diagnostic: { franklin: { implementation: 'milo' } },
            previousPage: { pageInfo: { pageName: prevPageName } },
            primaryUser, // Insert the primaryUser structure here
            
            }
            
          },
        },
      },
    },
    query: {
      identity: { fetch: ['ECID'] },
      personalization: {
        schemas: [
          'https://ns.adobe.com/personalization/default-content-item',
          'https://ns.adobe.com/personalization/html-content-item',
          'https://ns.adobe.com/personalization/json-content-item',
          'https://ns.adobe.com/personalization/redirect-item',
          'https://ns.adobe.com/personalization/dom-action',
        ],
        decisionScopes: ['__view__'],
      },
    },
    meta: {
      target: { migration: true },
      configOverrides: {
        com_adobe_analytics: { reportSuites: REPORT_SUITES_ID },
        com_adobe_target: { propertyToken: AT_PROPERTY_VAL },
      },
      state: {
        domain: getDomainWithoutWWW(),
        cookiesEnabled: true,
        entries: getMartechCookies(),
      },
    },
  };
}

/**
 * Updates the specified cookies with new values if they don't already exist.
 *
 * @param {Array<Object>} cookieData - An array of objects containing
 * `key` and `value` pairs for the cookies.
 *
 */
function updateMartechCookies(cookieData) {
  cookieData?.forEach(({ key, value }) => {
    const currentCookie = getCookie(key);
    if (!currentCookie) {
      setCookie(encodeURIComponent(key), value);
    }
  });
}

/**
 * Updates the AMCV cookie with the new ECID.
 *
 * @param {string} ECID - The Experience Cloud ID (ECID).
 */
function updateAMCVCookie(ECID) {
  const cookieValue = getCookie(AMCV_COOKIE);

  if (!cookieValue) {
    setCookie(encodeURIComponent(AMCV_COOKIE), `MCMID|${ECID}`);
  } else if (cookieValue.indexOf('MCMID|') === -1) {
    setCookie(encodeURIComponent(AMCV_COOKIE), `${cookieValue}|MCMID|${ECID}`);
  }
}

function getUrl() {
  const PAGE_URL = new URL(window.location.href);
  const { host } = window.location;
  const query = PAGE_URL.searchParams.get('env');
  const url = 'https://edge.adobedc.net/ee/v2/interact';

  /* c8 ignore start */
  if (query || host.includes('localhost') || host.includes('.page')
    || host.includes('.live')) {
    return url;
  }

  /* c8 ignore start */
  if (host.includes('stage.adobe')
    || host.includes('corp.adobe')
    || host.includes('graybox.adobe')) {
    return 'https://www.stage.adobe.com/experienceedge/v2/interact';
  }

  const { origin } = window.location;
  return `${origin}/experienceedge/v2/interact`;
}

/**
 * Loads analytics and interaction data based on the user and page context.
 * Sends the data to Adobe Analytics and Adobe Target for personalization.
 *
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.locale - The locale object containing language/region info.
 * @param {string} params.env - The environment (e.g., 'prod' for production).
 * @param {string} [params.calculatedTimeout] - timeout value for the request in milliseconds.
 *
 * @returns {Promise<Object>} A promise that resolves to the
 * personalization propositions fetched from Adobe Target.
 */
export const loadAnalyticsAndInteractionData = async ({ locale, env, calculatedTimeout, status }) => {
  if (status)
   loadIms();

  const value = getCookie('kndctr_9E1005A551ED61CA0A490D45_AdobeOrg_consent');

  if (value === 'general=out') {
    return {};
  }

  // Define constants based on environment
  const DATA_STREAM_ID = env === 'prod' ? '913eac4d-900b-45e8-9ee7-306216765cd2' : 'e065836d-be57-47ef-b8d1-999e1657e8fd';
  const TARGET_API_URL = getUrl();

  // Device and viewport information
  const {
    screenWidth, screenHeight,
    screenOrientation, viewportWidth, viewportHeight,
  } = getDeviceInfo();

  // Date and Time Constants
  const CURRENT_DATE = new Date();
  const LOCAL_TIME = CURRENT_DATE.toISOString();
  const LOCAL_TIMEZONE_OFFSET = CURRENT_DATE.getTimezoneOffset();

  const pageName = getPageNameForAnalytics({ locale });

  const updatedContext = getUpdatedContext({
    screenWidth,
    screenHeight,
    screenOrientation,
    viewportWidth,
    viewportHeight,
    LOCAL_TIME,
    LOCAL_TIMEZONE_OFFSET,
  });

  // Prepare the body for the request
  const requestBody = createRequestPayload({
    updatedContext,
    pageName,
    locale,
    env,
    status,
  });

  try {
    const targetResp = await Promise.race([
      fetch(`${TARGET_API_URL}?dataStreamId=${DATA_STREAM_ID}&requestId=${generateUUIDv4()}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      new Promise((_, reject) => { setTimeout(() => reject(new Error('Request timed out')), calculatedTimeout); }),
    ]);

    if (!targetResp.ok) {
      throw new Error('Failed to fetch interact call');
    }
    const targetRespJson = await targetResp.json();
    const ECID = targetRespJson.handle
      .flatMap((item) => item.payload)
      .find((p) => p.namespace?.code === 'ECID')?.id || null;
    updateAMCVCookie(ECID);

    const extractedData = [];
    targetRespJson?.handle?.forEach((item) => {
      if (item?.type === 'state:store') {
        item?.payload?.forEach((payload) => {
          if (payload?.key === KNDCTR_COOKIE_KEYS[0] || payload?.key === KNDCTR_COOKIE_KEYS[1]) {
            extractedData.push({ ...payload });
          }
        });
      }
    });

    updateMartechCookies(extractedData);

    // Resolve or reject based on propositions
    const resultPayload = targetRespJson?.handle?.find((d) => d.type === 'personalization:decisions')?.payload;
    if (resultPayload.length === 0) throw new Error('No propositions found');
    return {
      type: 'propositionFetch',
      result: { propositions: resultPayload },
    };
  } catch (err) {
    return {};
  }
};

export default { loadAnalyticsAndInteractionData };
