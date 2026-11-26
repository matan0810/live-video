import { isStreamRequest, MAX_STREAM_LINKS } from '../../shared/streamLinks';
import { isRecord } from '../../shared/isRecord';

/** What the bookmark sends to the admin page from a channel's page. */
export interface BookmarkletPayload {
  links: string[];
  title: string;
  page: string;
}

const PARAM = 'add';
const MAX_TITLE = 80;

/**
 * The bookmark's code. It runs on the channel's page, in the owner's own browser: it lists
 * the HLS playlists the page has already loaded (the same list as the Network tab) and any
 * playing <video>, then opens the admin page with them in the address. Nothing goes to a
 * server; the admin page reads them from its own address.
 */
export function buildBookmarklet(adminUrl: string): string {
  const code = `(()=>{
const seen=new Set();
const isHls=u=>/^https:\\/\\//.test(u)&&/\\.m3u8($|[?#])/i.test(u);
for(const e of performance.getEntriesByType('resource'))if(isHls(e.name))seen.add(e.name);
for(const v of document.querySelectorAll('video')){const s=v.currentSrc||v.src;if(isHls(s))seen.add(s)}
const links=[...seen].slice(0,${MAX_STREAM_LINKS});
if(!links.length){alert('OnAir: לא נמצא קישור שידור בדף הזה. הפעילו את השידור, חכו כמה שניות ולחצו שוב.');return}
const data={links,title:document.title.slice(0,${MAX_TITLE}),page:location.href.slice(0,500)};
window.open(${JSON.stringify(adminUrl)}+'?${PARAM}='+encodeURIComponent(JSON.stringify(data)),'_blank');
})()`;
  return `javascript:${encodeURIComponent(code.replace(/\n/g, ''))}`;
}

/** Reads and validates what the bookmark put in the admin page's address, if anything. */
export function readBookmarkletPayload(hash: string): BookmarkletPayload | null {
  const query = hash.split('?')[1];
  if (!query) return null;
  const raw = new URLSearchParams(query).get(PARAM);
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return null;
    const { links, title, page } = data;
    if (!Array.isArray(links)) return null;
    const valid = [
      ...new Set(
        links.filter((link): link is string => typeof link === 'string' && isStreamRequest(link)),
      ),
    ].slice(0, MAX_STREAM_LINKS);
    if (valid.length === 0) return null;
    return {
      links: valid,
      title: typeof title === 'string' ? title.slice(0, MAX_TITLE).trim() : '',
      page: typeof page === 'string' ? page.slice(0, 500) : '',
    };
  } catch {
    return null;
  }
}
