import htm from "htm";
import vhtml from "vhtml";
import { formatDistanceToNowStrict } from "date-fns";
import { URL } from "url";
import DOMPurify from "isomorphic-dompurify";

import { commentCounts } from "../../store.mjs";
import ShareIcon from "./shareicon.mjs";
import CopyIcon from "./copyicon.mjs";
import FCIcon from "./farcastericon.mjs";
import theme from "../../theme.mjs";

const html = htm.bind(vhtml);

export function extractDomain(link) {
  const parsedUrl = new URL(link);
  const parts = parsedUrl.hostname.split(".");
  const tld = parts.slice(-2).join(".");
  return tld;
}

export function addOrUpdateReferrer(link, address) {
  if (!address) return link;

  const url = new URL(link);
  if (url.hostname.endsWith("mirror.xyz")) {
    url.searchParams.set("referrerAddress", address);
  } else if (
    url.hostname.endsWith("paragraph.xyz") ||
    url.hostname.endsWith("zora.co") ||
    url.hostname.endsWith("manifold.xyz")
  ) {
    url.searchParams.set("referrer", address);
  } else if (url.hostname.endsWith("foundation.app")) {
    url.searchParams.set("ref", address);
  }
  return url.toString();
}

const truncateLongWords = (text, maxLength = 20) => {
  const words = text.split(" ");
  const truncatedWords = words.map((word) =>
    word.length > maxLength ? `${word.substring(0, maxLength)}...` : word,
  );
  return truncatedWords.join(" ");
};

const row = (
  start = 0,
  path,
  style = "border-bottom: 1px solid rgba(0,0,0,0.1);",
  interactive,
  hideCast,
  period,
  recentJoiners,
) => {
  const size = 12;
  return (story, i) => {
    const commentCount = commentCounts.get(`kiwi:0x${story.index}`) || 0;
    return html`
      <tr>
        <td>
          <div
            style="${style}${i === 0
              ? "border-top: 1px solid rgba(0,0,0,0.1);"
              : ""}"
          >
            <div style="display: flex; align-items: center;">
              <div
                data-title="${DOMPurify.sanitize(story.title)}"
                data-href="${DOMPurify.sanitize(story.href)}"
                data-upvoters="${JSON.stringify(story.upvoters)}"
                class="vote-button-container"
                style="display: flex; align-self: stretch;"
              >
                <div>
                  <div
                    class="interaction-element"
                    style="border-radius: 2px; padding: 5px 0; background-color: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; min-width: 40px; margin: 5px 6px; align-self: stretch;"
                  >
                    <div style="min-height: 40px; display:block;">
                      <div class="votearrowcontainer">
                        <div>
                          <div
                            class="${interactive
                              ? "votearrow"
                              : "votearrow pulsate"}"
                            style="color: rgb(130, 130, 130); cursor: pointer;"
                            title="upvote"
                          >
                            ▲
                          </div>
                          <div style="font-size: 8pt; text-align: center;">
                            ${story.upvotes ? story.upvotes : "..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                style="min-height: 55px; display:flex; justify-content: center; flex-direction: column; flex-grow: 1; line-height: 1.3; padding: 8px 3px 5px 0;"
              >
                <span>
                  <span class="story-link-container">
                    <a
                      href="${interactive || story.image
                        ? ""
                        : `/outbound?url=${encodeURIComponent(
                            addOrUpdateReferrer(
                              DOMPurify.sanitize(story.href),
                              story.identity,
                            ),
                          )}`}"
                      target="_blank"
                      class="story-link"
                      style="line-height: 13pt; font-size: 13pt;"
                    >
                      ${story.isOriginal
                        ? html`<mark
                            style="background-color: rgba(255,255,0, 0.05); padding: 0px 2px;"
                            >${truncateLongWords(
                              DOMPurify.sanitize(story.title),
                            )}</mark
                          >`
                        : truncateLongWords(DOMPurify.sanitize(story.title))}
                      <span> </span>
                    </a>
                  </span>
                  <span> </span>
                  <span class="story-domain" style="white-space: nowrap;"
                    >(${!interactive && (path === "/" || path === "/best")
                      ? html`<a
                          href="${path}?domain=${extractDomain(
                            DOMPurify.sanitize(story.href),
                          )}${period ? `&period=${period}` : ""}"
                          style="color: #828282;"
                          >${extractDomain(DOMPurify.sanitize(story.href))}</a
                        >`
                      : extractDomain(DOMPurify.sanitize(story.href))})</span
                  >
                </span>
                <div style="font-size: 10pt;">
                  <span>
                    ${path !== "/stories" &&
                    story.avatars.length > 3 &&
                    html`
                      <span>
                        <div
                          style="margin-left: ${size /
                          2}; top: 2px; display: inline-block; position:relative;"
                        >
                          ${story.avatars.slice(0, 5).map(
                            (avatar, index) => html`
                              <img
                                loading="lazy"
                                src="${avatar}"
                                alt="avatar"
                                style="z-index: ${index}; width: ${size}px; height:
 ${size}px; border: 1px solid #828282; border-radius: 2px; margin-left: -${size /
                                2}px;"
                              />
                            `,
                          )}
                        </div>
                        <span> • </span>
                      </span>
                    `}
                    ${story.index
                      ? html`
                          <a
                            class="meta-link"
                            href="/stories?index=0x${story.index}"
                          >
                            ${formatDistanceToNowStrict(
                              new Date(story.timestamp * 1000),
                            )}
                            <span> ago</span>
                          </a>
                        `
                      : html`
                          ${formatDistanceToNowStrict(
                            new Date(story.timestamp * 1000),
                          )}
                          <span> ago</span>
                        `}
                    <span> by </span>
                    ${story.identity
                      ? html`<a
                          href="${interactive
                            ? ""
                            : story.submitter && story.submitter.ens
                            ? `/${story.submitter.ens}`
                            : `/upvotes?address=${story.identity}`}"
                          class="meta-link"
                          style="${recentJoiners &&
                          recentJoiners.includes(story.identity)
                            ? `color: ${theme.color};`
                            : ""}"
                        >
                          ${story.displayName}
                        </a>`
                      : story.displayName}
                    ${interactive || hideCast || !story.index
                      ? null
                      : html`
                          <span> • </span>
                          <a
                            target="_blank"
                            href="https://warpcast.com/~/compose?embeds[]=${encodeURIComponent(
                              `https://news.kiwistand.com/stories?index=0x${story.index}`,
                            )}"
                            style="white-space: nowrap;"
                            class="caster-link"
                          >
                            ${FCIcon("height: 10px; width: 10px;")}
                            <span> </span>
                            Cast
                          </a>
                        `}
                    ${interactive || hideCast
                      ? null
                      : html`
                          <span class="share-container">
                            <span> • </span>
                            <a
                              href="#"
                              class="caster-link share-link"
                              title="Share"
                              style="white-space: nowrap;"
                              onclick="event.preventDefault(); navigator.share({url: 'https://news.kiwistand.com/stories?index=0x${story.index}' });"
                            >
                              ${ShareIcon(
                                "padding: 0 3px 1px 0; vertical-align: bottom; height: 13px; width: 13px;",
                              )}
                              Share
                            </a>
                          </span>
                        `}
                    ${interactive || hideCast || story.displayName === "Feedbot"
                      ? null
                      : html`
                          <span class="inverse-share-container">
                            <span> • </span>
                            <a
                              href="#"
                              class="meta-link share-link"
                              title="Share"
                              style="white-space: nowrap;"
                              onclick="event.preventDefault(); navigator.clipboard.writeText('https://news.kiwistand.com/stories?index=0x${story.index}'); window.toast.success('Link copied!');"
                            >
                              ${CopyIcon(
                                "padding: 0 3px 1px 0; vertical-align: bottom; height: 13px; width: 13px;",
                              )}
                              Link
                            </a>
                          </span>
                        `}
                  </span>
                </div>
              </div>
              ${story.index && path !== "/stories"
                ? html`<div
                    data-story-index="0x${story.index}"
                    data-comment-count="${commentCount}"
                    class="chat-bubble-container"
                    style="display: flex; align-self: stretch;"
                  >
                    <a
                      class="chat-bubble interaction-element"
                      id="chat-bubble-${story.index}"
                      href="/stories?index=0x${story.index}"
                      style="margin: 5px; background-color: #e6e6df; border-radius: 2px; display: ${path ===
                      "/stories"
                        ? "none"
                        : "flex"}; justify-content: center; min-width: 40px; align-items: center; flex-direction: column;"
                    >
                      <${ChatsSVG} />
                      <span
                        id="comment-count-${story.index}"
                        style="color: rgba(0,0,0,0.65); font-size: 8pt;"
                        >${commentCount}</span
                      >
                    </a>
                  </div>`
                : ""}
            </div>
            ${path !== "/stories"
              ? html`<div
                  class="comment-section"
                  data-comment-count="${commentCount}"
                  data-story-index="0x${story.index}"
                ></div>`
              : null}
          </div>
        </td>
      </tr>
    `;
  };
};

const ChatsSVG = () => html`
  <svg
    style="color: rgba(0,0,0,0.65); width: 25px;"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
  >
    <rect width="256" height="256" fill="none" />
    <path
      d="M71.58,144,32,176V48a8,8,0,0,1,8-8H168a8,8,0,0,1,8,8v88a8,8,0,0,1-8,8Z"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="16"
    />
    <path
      d="M80,144v40a8,8,0,0,0,8,8h96.42L224,224V96a8,8,0,0,0-8-8H176"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="16"
    />
  </svg>
`;
export default row;
