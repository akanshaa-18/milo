/* eslint-disable no-underscore-dangle */
import { loadArea, loadIms } from '../utils/utils.js';

const AMCV_COOKIE = 'AMCV_9E1005A551ED61CA0A490D45@AdobeOrg';
const KNDCTR_COOKIE_KEYS = [
  'kndctr_9E1005A551ED61CA0A490D45_AdobeOrg_identity',
  'kndctr_9E1005A551ED61CA0A490D45_AdobeOrg_cluster',
];

const DATA_STREAM_IDS_PROD = {
  excludeDS: '57c20bab-94c3-425e-95cb-0b9948b1fdd4',
  default: '913eac4d-900b-45e8-9ee7-306216765cd2',
};
const DATA_STREAM_IDS_STAGE = {
  excludeDS: 'a44f0037-2ada-441f-a012-243832ce5ff9',
  default: 'e065836d-be57-47ef-b8d1-999e1657e8fd',
};

let dataStreamId = '';

function getDomainWithoutWWW() {
  const domain = window?.location?.hostname;
  return domain.replace(/^www\./, '');
}

const hitTypeEventTypeMap = {
  propositionFetch: 'decisioning.propositionFetch',
  pageView: 'web.webpagedetails.pageViews',
  propositionDisplay: 'decisioning.propositionDisplay',
};

function generateUUIDv4() {
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  randomValues[6] = (randomValues[6] % 16) + 64;
  randomValues[8] = (randomValues[8] % 16) + 128;
  let uuid = '';
  randomValues.forEach((byte, index) => {
    const hex = byte.toString(16).padStart(2, '0');
    if (index === 4 || index === 6 || index === 8 || index === 10) {
      uuid += '-';
    }
    uuid += hex;
  });

  return uuid;
}

export function getTargetPropertyBasedOnPageRegion({ env, pathname }) {
  if (env !== 'prod') return 'bc8dfa27-29cc-625c-22ea-f7ccebfc6231';

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

function getDeviceInfo() {
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenOrientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

function getCookie(key) {
  const cookie = document.cookie.split(';')
    .map((x) => decodeURIComponent(x.trim()).split(/=(.*)/s))
    .find(([k]) => k === key);

  return cookie ? cookie[1] : null;
}

function setCookie(key, value, options = {}) {
  const expires = options.expires || 730;
  const date = new Date();
  date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
  const expiresString = `expires=${date.toUTCString()}`;

  document.cookie = `${key}=${value}; ${expiresString}; path=/ ; domain=.${getDomainWithoutWWW()};`;
}

export const getVisitorStatus = ({
  expiryDays = 30,
  cookieName = 's_nr',
  domain = `.${(new URL(window.location.origin)).hostname}`,
}) => {
  const currentTime = new Date().getTime();
  const cookieValue = getCookie(cookieName) || '';
  const cookieAttributes = { expires: new Date(currentTime + expiryDays * 24 * 60 * 60 * 1000) };

  if (domain) {
    cookieAttributes.domain = domain;
  }

  if (!cookieValue) {
    setCookie(cookieName, `${currentTime}-New`, cookieAttributes);
    return 'New';
  }

  const [storedTime, storedState] = cookieValue.split('-').map((value) => value.trim());

  if (currentTime - storedTime < 30 * 60 * 1000 && storedState === 'New') {
    setCookie(cookieName, `${currentTime}-New`, cookieAttributes);
    return 'New';
  }

  setCookie(cookieName, `${currentTime}-Repeat`, cookieAttributes);
  return 'Repeat';
};

function getOrGenerateUserId() {
  const amcvCookieValue = getCookie(AMCV_COOKIE);

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

function getPageNameForAnalytics({ locale }) {
  const { host, pathname } = new URL(window.location.href);
  const [modifiedPath] = pathname.split('/').filter((x) => x !== locale.prefix).join(':').split('.');
  return `${host.replace('www.', '')}:${modifiedPath}`;
}

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

const getMartechCookies = () => document.cookie.split(';')
  .map((x) => x.trim().split('='))
  .filter(([key]) => KNDCTR_COOKIE_KEYS.includes(key))
  .map(([key, value]) => ({ key, value }));

function getNewRepeat(d, cn, domain) {
  const now = Date.now();
  const timeInDays = d * (24 * 60 * 60 * 1000);
  const expirationDate = new Date(now + timeInDays);
  const cval = getCookie(cn) || '';
  const attributes = {
    expires: expirationDate.toUTCString(),
    path: '/',
  };
  if (domain) {
    attributes.domain = domain;
  }
  if (!cval) {
    setCookie(cn, `${now}-New`, attributes);
    return 'New';
  }
  const [timestamp, status] = cval.split('-');
  if (now - parseInt(timestamp, 10) < 30 * 60 * 1000 && status === 'New') {
    setCookie(cn, `${now}-New`, attributes);
    return 'New';
  }
  setCookie(cn, `${now}-Repeat`, attributes);
  return 'Repeat';
}

function getDomain() {
  let effectiveDomain = '';
  if (effectiveDomain) {
    return effectiveDomain;
  }
  const parts = window.location.hostname.toLowerCase().split('.');
  const domain = [];
  let part = '';
  let successfullySet = false;
  part = parts.pop();
  domain.unshift(part);
  while (parts.length > 0) {
    part = parts.pop();
    domain.unshift(part);
    const date = new Date();
    date.setTime(date.getTime() + 1000);

    try {
      setCookie('sat_domain', 'A', {
        expires: date,
        domain: domain.join('.'),
      });
    } catch (err) {
      break;
    }
    if (getCookie('sat_domain') === 'A') {
      successfullySet = true;
      effectiveDomain = domain.join('.');
      break;
    }
  }
  return successfullySet ? effectiveDomain : '';
}

// export async function sha256(message) {
//   const msgUint8 = new TextEncoder().encode(message);
//   const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
//   const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
//   return hashHex;
// }

const 
 = function (b) {
  function c(a, b) {
    return (a >>> b) | (a << (32 - b));
  }
  for (
    var d, e, f = Math.pow, g = 2 ** 32, h = 'length', i = '', j = [], k = 8 * b[h], l = sha256.h = sha256.h || [], m = sha256.k = sha256.k || [], n = m[h], o = {}, p = 2;
    n < 64;
    p++
  ) {
    if (!o[p]) {
      for (d = 0; d < 313; d += p) o[d] = p;
      l[n] = p ** 0.5 * g | 0;
      m[n++] = p ** (1 / 3) * g | 0;
    }
  }
  for (b += '\x80'; b[h] % 64 - 56;) b += '\x00';
  for (d = 0; d < b[h]; d++) {
    if (((e = b.charCodeAt(d)), e >> 8)) return;
    j[d >> 2] |= e << ((3 - d) % 4) * 8;
  }
  for (j[j[h]] = k / g | 0, j[j[h]] = k, e = 0; e < j[h];) {
    const q = j.slice(e, (e += 16)); const
      r = l;
    for (l = l.slice(0, 8), d = 0; d < 64; d++) {
      const s = q[d - 15];
      const t = q[d - 2];
      const u = l[0];
      const v = l[4];
      const w = l[7] + (c(v, 6) ^ c(v, 11) ^ c(v, 25)) + ((v & l[5]) ^ (~v & l[6])) + m[d] + (q[d] = d < 16 ? q[d] : (q[d - 16] + (c(s, 7) ^ c(s, 18) ^ (s >>> 3)) + q[d - 7] + (c(t, 17) ^ c(t, 19) ^ (t >>> 10))) | 0);
      const x = (c(u, 2) ^ c(u, 13) ^ c(u, 22)) + ((u & l[1]) ^ (u & l[2]) ^ (l[1] & l[2]));
      l = [w + x | 0].concat(l);
      l[4] = l[4] + w | 0;
    }
    for (d = 0; d < 8; d++) l[d] = l[d] + r[d] | 0;
  }
  for (d = 0; d < 8; d++) {
    for (e = 3; e + 1; e--) {
      const y = (l[d] >> (8 * e)) & 255;
      i += (y < 16 ? 0 : '') + y.toString(16);
    }
  }
  return i;
};

function getEntitlementCreativeCloud(profile) {
  const { scope } = window.adobeIMS.adobeIdData;
  if (
    scope
    && scope.indexOf('creative_cloud') !== -1
    && profile
    && profile.serviceAccounts
  ) {
    const serviceAccount = profile.serviceAccounts.find(
      (sa) => sa.serviceCode === 'creative_cloud',
    );

    if (!serviceAccount) {
      return 'notEntitled';
    }

    if (serviceAccount.serviceLevel === 'CS_LVL_2') {
      return 'paid';
    } if (serviceAccount.serviceLevel === 'CS_LVL_1') {
      return 'free';
    }
    return 'notEntitled';
  }
  return 'notEntitled';
}

function getEntitlementStatusCreativeCloud(profile) {
  const { scope } = window.adobeIMS.adobeIdData;
  if (
    scope
    && scope.indexOf('creative_cloud') !== -1
    && profile
    && profile.serviceAccounts
  ) {
    const serviceAccount = profile.serviceAccounts.find(
      (sa) => sa.serviceCode === 'creative_cloud',
    );
    return serviceAccount?.serviceStatus || 'none';
  }
  return 'none';
}

async function createProfileInfo(profile, returningStatus) {
  console.log(profile);
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
  console.log(adobeIMSUserProfile);

  return {
    authState: 'authenticated',
    entitlementCreativeCloud: await getEntitlementCreativeCloud(profile),
    entitlementStatusCreativeCloud: await getEntitlementStatusCreativeCloud(profile),
    returningStatus: returningStatus || 'Repeat',
    profileID: profile?.userId?.split('@')[0] || 'unknown',
    authID: profile?.authId?.split('@')[0] || 'unknown',
    fullProfileID: profile?.userId || 'unknown',
    fullAuthID: profile?.authId || 'unknown',
    adobeIMSUserProfile,
  };
}

async function getProfileInfo() {
  const profile = await window.adobeIMS.getProfile();
  console.log('hello profile', profile);
  const returningStatus = getVisitorStatus(365, 's_nr', getDomain());
  console.log(returningStatus);
  return createProfileInfo(profile, returningStatus);
}

async function createRequestPayload({
  updatedContext, pageName, locale, env, hitType, userStatus,
}) {
  // console.log('test us', userStatus);
  // if (userStatus) await loadIms();
  // if (userStatus) loadIms();

  const prevPageName = getCookie('gpv');
  const isCollectCall = hitType === 'propositionDisplay';
  const isPageViewCall = hitType === 'pageView';

  const REPORT_SUITES_ID = env === 'prod' ? ['adbadobenonacdcprod', 'adbadobeprototype'] : ['adbadobenonacdcqa'];
  const AT_PROPERTY_VAL = getTargetPropertyBasedOnPageRegion(
    { env, pathname: window.location?.pathname },
  );

  const primaryUser = userStatus
    ? { primaryProfile: { profileInfo: await getProfileInfo() } }
    : { primaryProfile: { profileInfo: { authState: 'loggedOut', returningStatus: getVisitorStatus({}) } } };

  console.log('primaryuserInfo trial', primaryUser);

  const webPageDetails = {
    URL: window.location.href,
    siteSection: window.location.hostname,
    server: window.location.hostname,
    isErrorPage: false,
    isHomePage: false,
    name: pageName,
    pageViews: { value: isPageViewCall ? 1 : 0 },
  };

  const eventObj = {
    xdm: {
      ...updatedContext,
      identityMap: getOrGenerateUserId(),
      web: { 
        webPageDetails,
        webInteraction: isPageViewCall || isCollectCall ? undefined : {
          name: 'Martech-API',
          type: 'other',
          linkClicks: { value: 1 },
        },
        webReferrer: { URL: document.referrer },
      },
      timestamp: new Date().toISOString(),
      eventType: hitTypeEventTypeMap[hitType],
    },
    data: {
      __adobe: {
        target: {
          is404: false, authState: 'loggedOut', hitType, isMilo: true, adobeLocale: locale.ietf, hasGnav: true,
        },
      },
      _adobe_corpnew: {
        digitalData: {
          page: { pageInfo: { language: locale.ietf } },
          diagnostic: { franklin: { implementation: 'milo' } },
          previousPage: { pageInfo: { pageName: prevPageName } },
          // primaryUser: { primaryProfile: { profileInfo: { authState:
          // 'loggedOut', returningStatus: getVisitorStatus({}) } } },
          primaryUser,
        },
      },
      marketingtech: {
        adobe: {
          alloy: {
            approach: 'martech-API',
            edgeConfigIdLaunch: dataStreamId,
            edgeConfigId: dataStreamId,
          },
        },
      },
    },
  };

  if (isPageViewCall) {
    const {
      href, origin, protocol, host, hostname, port, pathname, search, hash,
    } = window.location;
    const { data, xdm } = eventObj;
    const { digitalData } = data._adobe_corpnew;
    const { pageInfo } = digitalData.page;
    pageInfo.pageName = pageName;
    pageInfo.processedPageName = pageName;
    pageInfo.location = {
      href, origin, protocol, host, hostname, port, pathname, search, hash,
    };
    pageInfo.siteSection = webPageDetails.siteSection;
    digitalData.diagnostic.franklin.implementation = 'milo';
    digitalData.primaryUser.primaryProfile.profileInfo = {
      ...digitalData.primaryUser.primaryProfile.profileInfo,
      entitlementCreativeCloud: 'unknown',
      entitlementStatusCreativeCloud: 'unknown',
    };
    digitalData.target = { at_property_val: AT_PROPERTY_VAL };
    data.web = { webPageDetails };
    data.eventType = hitTypeEventTypeMap[hitType];

    xdm.implementationDetails = {
      name: 'https://ns.adobe.com/experience/alloy/reactor',
      version: '1.0',
      environment: 'serverapi',
    };
  }

  const eventValue = isCollectCall ? { events: [{ ...eventObj }] } : { event: { ...eventObj } };

  return {
    ...eventValue,
    query: {
      identity: { fetch: ['ECID'] },
      personalization: isCollectCall ? undefined : {
        schemas: [
          'https://ns.adobe.com/personalization/default-content-item',
          'https://ns.adobe.com/personalization/html-content-item',
          'https://ns.adobe.com/personalization/json-content-item',
          'https://ns.adobe.com/personalization/redirect-item',
          'https://ns.adobe.com/personalization/ruleset-item',
          'https://ns.adobe.com/personalization/message/in-app',
          'https://ns.adobe.com/personalization/message/content-card',
          'https://ns.adobe.com/personalization/dom-action',
        ],
        surfaces: [`web://${window.location.host + window.location.pathname}`],
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

function updateMartechCookies(cookieData) {
  cookieData?.forEach(({ key, value }) => {
    const currentCookie = getCookie(key);
    if (!currentCookie) {
      setCookie(encodeURIComponent(key), value);
    }
  });
}

function updateAMCVCookie(ECID) {
  const cookieValue = getCookie(AMCV_COOKIE);

  if (!cookieValue) {
    setCookie(encodeURIComponent(AMCV_COOKIE), `MCMID|${ECID}`);
  } else if (cookieValue.indexOf('MCMID|') === -1) {
    setCookie(encodeURIComponent(AMCV_COOKIE), `${cookieValue}|MCMID|${ECID}`);
  }
}

function getUrl(isCollectCall) {
  const PAGE_URL = new URL(window.location.href);
  const { host } = window.location;
  const query = PAGE_URL.searchParams.get('env');
  const url = `https://edge.adobedc.net/ee/v2/${isCollectCall ? 'collect' : 'interact'}`;

  /* c8 ignore start */
  if (query || host.includes('localhost') || host.includes('.page')
    || host.includes('.live')) {
    return url;
  }

  /* c8 ignore start */
  if (host.includes('stage.adobe')
    || host.includes('corp.adobe')
    || host.includes('graybox.adobe')) {
    return `https://www.stage.adobe.com/experienceedge/v2/${isCollectCall ? 'collect' : 'interact'}`;
  }

  const { origin } = window.location;
  return `${origin}/experienceedge/v2/${isCollectCall ? 'collect' : 'interact'}`;
}

export const createRequestUrl = ({
  env,
  hitType,
}) => {
  const TARGET_API_URL = getUrl(hitType === 'propositionDisplay');
  dataStreamId = env === 'prod' ? DATA_STREAM_IDS_PROD.default : DATA_STREAM_IDS_STAGE.default;
  if (hitType === 'pageView' || hitType === 'propositionDisplay') {
    const isFirstVisit = !getCookie(AMCV_COOKIE);
    const consentCookie = getCookie('OptanonConsent') || '';
    if (isFirstVisit || !consentCookie || consentCookie.includes('C0004:0')) {
      dataStreamId = env === 'prod' ? DATA_STREAM_IDS_PROD.excludeDS : DATA_STREAM_IDS_STAGE.excludeDS;
    }
    return `${TARGET_API_URL}?dataStreamId=${dataStreamId}&requestId=${generateUUIDv4()}`;
  }

  return `${TARGET_API_URL}?dataStreamId=${dataStreamId}&requestId=${generateUUIDv4()}`;
};

const setGpvCookie = (pageName) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + 1800000);
  setCookie('gpv', pageName, { expires });
};

const getPayloadsByType = (data, type) => data?.handle?.filter((d) => d.type === type)
  .map((d) => d.payload)
  .reduce((acc, curr) => [...acc, ...curr], []);

const setWindowAlloy = (alloyData) => {
  const get = (obj, path) => path.split('.').reduce((current, segment) => (current !== undefined && current !== null ? current[segment] : undefined), obj);

  const set = (obj, path, val) => {
    path.split('.').reduce((current, segment, index, segments) => {
      if (index === segments.length - 1) current[segment] = val;
      else current[segment] = current[segment] || {};
      return current[segment];
    }, obj);

    return obj;
  };
  window.alloy_all = window.alloy_all || { get, set };
  if (alloyData?.destinations) {
    const xlgValue = 'data._adobe_corpnew.digitalData.adobe.xlg';
    const existingXlg = window.alloy_all.get(window.alloy_all, xlgValue) || '';
    const xlgIds = existingXlg ? new Set(existingXlg.split(',')) : new Set();

    for (const destination of alloyData.destinations) {
      for (const segment of destination.segments) {
        const segmentId = segment.id;
        if (!xlgIds.has(segmentId)) xlgIds.add(segmentId);
      }
    }
    const updatedXlg = Array.from(xlgIds).join(',');
    window.alloy_all.set(window.alloy_all, xlgValue, updatedXlg);
  }
};

const setTTMetaAndAlloyTarget = (propositions) => {
  const regex = /,|:/;
  const isEmpty = (val) => !val || val?.length === 0;
  const offerNames = [];
  const activityNames = [];
  let targetResponse = window.alloy_all.get(window.alloy_all, 'data._adobe_corpnew.digitalData.adobe.target.response') || '';
  const clean = (str) => (str || '').replace(regex, '');

  propositions.forEach((proposition) => {
    proposition.items?.forEach(({ meta }) => {
      if (isEmpty(meta)) return;

      const offerName = meta['option.name'];
      const activityName = meta['activity.name'];
      window.ttMETA = window.ttMETA || [];
      if (offerNames.indexOf(offerName) === -1 || activityNames.indexOf(activityName) === -1) {
        offerNames.push(offerName);
        activityNames.push(activityName);
        const data = {
          CampaignName: activityName,
          RecipeName: meta['experience.name'],
          CampaignId: meta['activity.id'],
          RecipeId: meta['experience.id'],
          OfferId: meta['option.id'],
          OfferName: offerName,
          TrafficId: meta['experience.trafficAllocationId'],
          TrafficType: meta['experience.trafficAllocationType'],
        };

        window.ttMETA.push(data);

        const activityId = data.CampaignId;
        if (targetResponse.indexOf(activityId) === -1) {
          // If there is already a response string, append a comma
          if (targetResponse) targetResponse += ',';

          targetResponse += `T:${[activityId, activityName, data.OfferId, offerName, data.RecipeId, data.RecipeName, data.TrafficId, data.TrafficType].map(clean).join(':')}`;
        }
      }
    });
  });
  window.alloy_all.set(window.alloy_all, 'data._adobe_corpnew.digitalData.adobe.target.response', targetResponse);
};

function filterPropositionInJson(payloads) {
  return payloads
    .filter((item) => item?.items?.some((i) => i?.data?.format === 'application/json'))
    .map(({ items, ...rest }) => ({
      ...rest,
      items: items.map(({ data, ...itemRest }) => itemRest),
    }));
}

function sendPropositionDisplayRequest(filteredPayload, env, requestPayload) {
  const reqUrl = createRequestUrl({ env, hitType: 'propositionDisplay' });
  const reqBody = createRequestPayload({ ...requestPayload, hitType: 'propositionDisplay' });

  const decisioning = {
    propositions: filteredPayload,
    propositionEventType: { display: 1 },
  };

  reqBody.events[0].xdm._experience = { decisioning };
  reqBody.events[0].data._experience = { decisioning };

  reqBody.events[0].xdm.documentUnloading = true;
  reqBody.events[0].data.documentUnloading = true;

  fetch(reqUrl, {
    method: 'POST',
    body: JSON.stringify(reqBody),
  });
}

export const loadAnalyticsAndInteractionData = async (
  { locale, env, calculatedTimeout, hybridPersEnabled, userStatus },
) => {
  // if (userStatus === window.adobeIMS?.isSignedInUser()) {
  //   loadIms();
  // }
  // if (userStatus) await loadIms();
  if (userStatus) await loadIms();
  // console.log('helpers IMS loading', loadIms());

  const value = getCookie('kndctr_9E1005A551ED61CA0A490D45_AdobeOrg_consent');

  if (value === 'general=out') {
    return {};
  }

  const CURRENT_DATE = new Date();
  const localTime = CURRENT_DATE.toISOString();

  const timezoneOffset = CURRENT_DATE.getTimezoneOffset();
  if (hybridPersEnabled) {
    window.hybridPers = true;
  }
  const hitType = hybridPersEnabled ? 'pageView' : 'propositionFetch';

  const pageName = getPageNameForAnalytics({ locale });

  const updatedContext = getUpdatedContext({ ...getDeviceInfo(), localTime, timezoneOffset });

  const requestUrl = createRequestUrl({
    env,
    hitType,
  });

  const requestPayload = {
    updatedContext, pageName, locale, env, hitType, userStatus,
  };
  const requestBody = await createRequestPayload(requestPayload);
  console.log("Request URL:", requestUrl);
  console.log("Request Payload:", JSON.stringify(requestBody, null, 2));

  try {
    const targetResp = await Promise.race([
      fetch(requestUrl, {
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

    const resultPayload = getPayloadsByType(targetRespJson, 'personalization:decisions');
    if (hybridPersEnabled) {
      const filteredPayload = filterPropositionInJson(resultPayload);
      if (filteredPayload.length) {
        sendPropositionDisplayRequest(filteredPayload, env, requestPayload);
      }
      const alloyData = {
        destinations: getPayloadsByType(targetRespJson, 'activation:pull'),
        propositions: resultPayload,
        inferences: getPayloadsByType(targetRespJson, 'rtml:inferences'),
        decisions: [],
      };
      window.dispatchEvent(new CustomEvent('alloy_sendEvent', { detail: alloyData }));
      setWindowAlloy(alloyData);
      setTTMetaAndAlloyTarget(resultPayload);
    }

    updateAMCVCookie(ECID);
    updateMartechCookies(extractedData);

    if (resultPayload?.length === 0) throw new Error('No propositions found');

    setGpvCookie(pageName);
    return {
      type: hitType,
      result: { propositions: resultPayload },
    };
  } catch (err) {
    if (err.message !== 'No propositions found') {
      console.log(err);
    }
    setGpvCookie(pageName);
    // console.log('helpers IMS loading', loadIms());
    return {};
  }
};

export default { loadAnalyticsAndInteractionData };
