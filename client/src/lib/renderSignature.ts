import type { BrandConfig, Staff } from "@shared/schema";
import { contactIconById, socialById, PIN_SVG, renderSocialIconSvg } from "./iconLibrary";

// Renders an email-safe signature as an HTML table with inline styles.
// Uses tables + inline CSS so Outlook, Gmail, Apple Mail all render it faithfully.
// Returns a full HTML string; the copy-to-clipboard flow copies both text/html
// and text/plain so pasting into a mail client keeps the styling.

function esc(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeUrl(u: string): string {
  if (!u) return "";
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  return `https://${u}`;
}

// Icons come from the shared iconLibrary so the picker and renderer stay in sync.
// Everything ships as an inline SVG data URI so emails render the same in Gmail,
// Outlook, and Apple Mail (which all sanitise raw <svg> tags).
function contactIconUri(row: "phone" | "mobile" | "email" | "website", id: string, color: string): string {
  const def = contactIconById(row, id);
  const svg = def ? def.svg(color) : "";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function pinIconUri(color: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(PIN_SVG(color))}`;
}

function socialIconUri(id: string, style: string, accent: string, muted: string): string {
  const def = socialById(id);
  if (!def) return "";
  const svg = renderSocialIconSvg(def, style as any, accent, muted);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface RenderArgs {
  brand: BrandConfig;
  staff: Staff;
  // If provided and === "free", we append a subtle "Signature by Signaturely"
  // footer so free-plan customers have an incentive to upgrade. Any other
  // plan (including undefined during preview) suppresses the watermark.
  plan?: string;
}

export function renderSignatureHtml({ brand, staff, plan }: RenderArgs): string {
  const {
    layout,
    logoUrl,
    logoWidth,
    logoAlign,
    logoHAlign,
    primaryColor,
    textColor,
    mutedColor,
    dividerColor,
    accentColor,
    fontFamily,
    fontSize,
    nameSize,
    nameBold,
    titleBold,
    showPhoto,
    photoShape,
    photoSize,
    photoAlign,
    showDivider,
    showSocialIcons,
    showPhone,
    showMobile,
    showWebsite,
    showAddress,
    showPronouns,
    socialLinkedin,
    socialTwitter,
    socialInstagram,
    socialFacebook,
    phoneLabel,
    mobileLabel,
    emailLabel,
    websiteLabel,
    companyDisplayName,
    tagline,
    companyAddress,
    companyWebsite,
    companyPhone,
    disclaimer,
    ctaText,
    ctaUrl,
    bannerUrl,
    bannerHref,
  } = brand;

  const photoRadius =
    photoShape === "circle" ? "50%" : photoShape === "rounded" ? "12px" : "0";

  const baseFont = `font-family:${fontFamily}, Arial, sans-serif; font-size:${fontSize}px; line-height:1.45; color:${textColor};`;
  const smallStyle = `${baseFont} color:${mutedColor}; font-size:${Math.max(10, fontSize - 1)}px;`;
  const linkStyle = `color:${accentColor}; text-decoration:none;`;

  // A contact row shows EITHER a custom text label OR an icon, never both.
  const contactRow = (
    row: "phone" | "mobile" | "email" | "website",
    iconId: string,
    label: string,
    value: string,
    href: string,
  ) => {
    if (!value) return "";
    const linked = href
      ? `<a href="${esc(href)}" style="${linkStyle}">${esc(value)}</a>`
      : esc(value);
    const indicator = label.trim()
      ? `<span style="color:${mutedColor}; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; font-size:${Math.max(10, fontSize - 2)}px;">${esc(label)}</span>`
      : `<img src="${contactIconUri(row, iconId, accentColor)}" width="14" height="14" alt="" style="display:inline-block; border:0; vertical-align:middle;" />`;
    return `<tr>
      <td width="22" valign="middle" align="left" style="padding:2px 8px 2px 0; white-space:nowrap; line-height:1;">${indicator}</td>
      <td valign="middle" style="${baseFont} padding:2px 0; line-height:1.35;">${linked}</td>
    </tr>`;
  };

  // Icon dimensions vary per style so outlined badges and minimal glyphs sit
  // at visually equivalent sizes next to filled icons.
  const socialSize =
    brand.socialIconStyle === "outlined" ? 20 : brand.socialIconStyle === "minimal" ? 16 : 18;
  const socialLink = (id: string, url: string) => {
    if (!url) return "";
    return `<a href="${esc(normalizeUrl(url))}" style="text-decoration:none; margin-right:8px; display:inline-block;"><img src="${socialIconUri(id, brand.socialIconStyle, accentColor, mutedColor)}" width="${socialSize}" height="${socialSize}" alt="${id}" style="border:0; vertical-align:middle;" /></a>`;
  };

  const phoneVal = staff.phone || companyPhone;
  const websiteVal = staff.website || companyWebsite;
  const addressVal = staff.address || companyAddress;

  const contactBlock = `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      ${showPhone ? contactRow("phone", brand.phoneIcon, phoneLabel, phoneVal, phoneVal ? `tel:${phoneVal.replace(/\s+/g, "")}` : "") : ""}
      ${showMobile ? contactRow("mobile", brand.mobileIcon, mobileLabel, staff.mobile, staff.mobile ? `tel:${staff.mobile.replace(/\s+/g, "")}` : "") : ""}
      ${contactRow("email", brand.emailIcon, emailLabel, staff.email, staff.email ? `mailto:${staff.email}` : "")}
      ${showWebsite ? contactRow("website", brand.websiteIcon, websiteLabel, websiteVal, normalizeUrl(websiteVal)) : ""}
      ${showAddress ? (addressVal ? `<tr><td width="22" valign="middle" align="left" style="padding:2px 8px 2px 0; white-space:nowrap; line-height:1;"><img src="${pinIconUri(accentColor)}" width="14" height="14" alt="" style="display:inline-block; border:0; vertical-align:middle;" /></td><td valign="middle" style="${baseFont} padding:2px 0; line-height:1.35;">${esc(addressVal)}</td></tr>` : "") : ""}
    </table>
  `;

  // Merge legacy staff-level social URLs with the new brand.socials[] list so
  // existing configs keep rendering while new networks show up automatically.
  const legacySocials: { network: string; url: string }[] = [];
  if (socialLinkedin && staff.linkedin) legacySocials.push({ network: "linkedin", url: staff.linkedin });
  if (socialTwitter && staff.twitter) legacySocials.push({ network: "twitter", url: staff.twitter });
  if (socialInstagram && staff.instagram) legacySocials.push({ network: "instagram", url: staff.instagram });
  if (socialFacebook && staff.facebook) legacySocials.push({ network: "facebook", url: staff.facebook });

  const extraSocials = ((brand.socials as { network: string; url: string }[]) || []).filter(
    (s) => s.network && s.url,
  );

  // Dedupe: brand list wins over legacy per network.
  const seen = new Set<string>();
  const allSocials: { network: string; url: string }[] = [];
  for (const s of [...extraSocials, ...legacySocials]) {
    if (seen.has(s.network)) continue;
    seen.add(s.network);
    if (socialById(s.network)) allSocials.push(s);
  }

  const socialsHtml =
    showSocialIcons && allSocials.length > 0
      ? `<div style="margin-top:8px;">${allSocials.map((s) => socialLink(s.network, s.url)).join("")}</div>`
      : "";

  const pronounsHtml =
    showPronouns && staff.pronouns
      ? `<span style="${smallStyle} font-weight:400; margin-left:6px;">(${esc(staff.pronouns)})</span>`
      : "";

  const nameHtml = `<div style="${baseFont} font-size:${nameSize}px; font-weight:${nameBold ? 700 : 500}; color:${primaryColor}; letter-spacing:0.2px;">${esc(staff.fullName)}${pronounsHtml}</div>`;

  const titleHtml = staff.jobTitle
    ? `<div style="${baseFont} color:${textColor}; font-weight:${titleBold ? 700 : 500}; margin-top:1px;">${esc(staff.jobTitle)}${staff.department ? `<span style="color:${mutedColor}; font-weight:400;"> · ${esc(staff.department)}</span>` : ""}</div>`
    : "";

  const companyHtml = companyDisplayName
    ? `<div style="${baseFont} color:${primaryColor}; font-weight:600; margin-top:2px;">${esc(companyDisplayName)}</div>${tagline ? `<div style="${smallStyle} font-style:italic;">${esc(tagline)}</div>` : ""}`
    : "";

  // Merge legacy single CTA with the new ctas[] array so existing configs keep working.
  const allCtas = [
    ...(ctaText && ctaUrl ? [{ text: ctaText, url: ctaUrl, style: "solid" as const }] : []),
    ...((brand.ctas as { text: string; url: string; style: "solid" | "outline" | "link" }[]) || []).filter(
      (c) => c.text && c.url
    ),
  ];

  const renderCta = (c: { text: string; url: string; style: string }) => {
    const href = esc(normalizeUrl(c.url));
    const text = esc(c.text);
    if (c.style === "link") {
      return `<a href="${href}" style="${linkStyle} font-weight:600; margin-right:14px; display:inline-block;">${text} →</a>`;
    }
    if (c.style === "outline") {
      return `<a href="${href}" style="display:inline-block; background:transparent; color:${accentColor}; text-decoration:none; padding:5px 11px; border:1.5px solid ${accentColor}; border-radius:4px; ${baseFont} color:${accentColor}; font-weight:600; margin-right:8px;">${text}</a>`;
    }
    return `<a href="${href}" style="display:inline-block; background:${accentColor}; color:#ffffff; text-decoration:none; padding:6px 12px; border-radius:4px; ${baseFont} color:#ffffff; font-weight:600; margin-right:8px;">${text}</a>`;
  };

  const ctaHtml =
    allCtas.length > 0
      ? `<div style="margin-top:10px; line-height:1.9;">${allCtas.map(renderCta).join("")}</div>`
      : "";

  // Banner stretches across the full signature width; the slider caps its max width
  // so users can still keep it narrow if they prefer.
  const bw = brand.bannerWidth || 520;
  const bannerImg = bannerUrl
    ? `<img src="${esc(bannerUrl)}" alt="" style="display:block; border:0; width:100%; max-width:${bw}px; height:auto;" />`
    : "";
  const bannerCellInner = bannerUrl
    ? `${bannerHref ? `<a href="${esc(normalizeUrl(bannerHref))}" style="text-decoration:none;">` : ""}${bannerImg}${bannerHref ? "</a>" : ""}`
    : "";
  // Banner colspan matches the widest row in the layout. We compute it below
  // after we know whether the photo cell was included alongside the logo.
  const makeBannerHtml = (cols: number) =>
    bannerUrl
      ? `<tr><td colspan="${cols}" style="padding-top:12px;">${bannerCellInner}</td></tr>`
      : "";

  // Certification / accreditation badges: small 1:1 squares in a horizontal row.
  // Rendered inside a nested table so widths stay predictable across email clients.
  const badgeSize = Math.max(32, Math.min(96, brand.certBadgeSize || 56));
  const badges = (brand.certBadges || []).filter((b) => b && b.url);
  const makeBadgesHtml = (cols: number) => {
    if (badges.length === 0) return "";
    const cells = badges
      .map((b) => {
        const img = `<img src="${esc(b.url)}" alt="${esc(b.alt || "")}" width="${badgeSize}" height="${badgeSize}" style="display:block; border:0; width:${badgeSize}px; height:${badgeSize}px; object-fit:contain; border-radius:6px;" />`;
        const wrapped = b.href
          ? `<a href="${esc(normalizeUrl(b.href))}" style="text-decoration:none;" title="${esc(b.alt || "")}">${img}</a>`
          : img;
        return `<td style="padding-right:8px; vertical-align:middle;">${wrapped}</td>`;
      })
      .join("");
    return `<tr><td colspan="${cols}" style="padding-top:10px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
  };

  const disclaimerHtml = disclaimer
    ? `<tr><td style="${smallStyle} padding-top:10px; max-width:520px;">${esc(disclaimer)}</td></tr>`
    : "";

  // Cell valign controls where the image sits when the text column is taller.
  // `middle` centres a small logo/photo against a long bio; `top` keeps the
  // classic “anchored to the top” look.
  const photoValign = photoAlign === "middle" ? "middle" : "top";
  const logoValign = logoAlign === "middle" ? "middle" : "top";

  // Horizontal alignment of the logo inside its cell. `display:block` images
  // need auto margins to center/right in a cell wider than the image.
  const logoHAttr = logoHAlign === "center" ? "center" : logoHAlign === "right" ? "right" : "left";
  const logoImgMargin =
    logoHAlign === "center"
      ? "margin:0 auto;"
      : logoHAlign === "right"
        ? "margin-left:auto; margin-right:0;"
        : "margin:0;";

  const photoCell =
    showPhoto && staff.photoUrl
      ? `<td valign="${photoValign}" style="padding-right:16px; vertical-align:${photoValign};"><img src="${esc(staff.photoUrl)}" width="${photoSize}" alt="${esc(staff.fullName)}" style="width:${photoSize}px; height:${photoSize}px; border-radius:${photoRadius}; display:block; border:0; object-fit:cover;" /></td>`
      : "";

  // Pin the logo cell to exactly logoWidth so the browser can’t steal space
  // from the text column when the logo is large. width= plus inline width
  // handles both Gmail and Outlook.
  // A very pale user-set divider color (default #e5e7eb on white) is almost
  // invisible. When the divider is turned ON we bump thin/pale values to a
  // 2px slate rule so the toggle actually shows something. Users can still
  // pick a darker color in Advanced to override.
  const isPaleDivider = /^#(e|f)/i.test((dividerColor || "").trim());
  const effectiveDividerColor = showDivider && isPaleDivider ? "#94a3b8" : dividerColor;
  const dividerRule = showDivider
    ? `2px solid ${effectiveDividerColor}`
    : "0";

  const logoCell = logoUrl
    ? `<td valign="${logoValign}" align="${logoHAttr}" width="${logoWidth}" style="width:${logoWidth}px; min-width:${logoWidth}px; padding-right:16px; vertical-align:${logoValign}; text-align:${logoHAttr}; border-right:${dividerRule};"><img src="${esc(logoUrl)}" width="${logoWidth}" alt="${esc(companyDisplayName || "logo")}" style="width:${logoWidth}px; height:auto; display:block; border:0; ${logoImgMargin}" /></td>`
    : "";

  // ---------- Layouts ----------
  let inner = "";

  const hasPhoto = showPhoto && !!staff.photoUrl;

  // Inline photo sits IMMEDIATELY to the left of the name/title/company text
  // (inside the text column). Wrapping the name block in a small nested table
  // keeps it email-client safe.
  const photoInlineImg = hasPhoto
    ? `<img src="${esc(staff.photoUrl)}" width="${photoSize}" alt="${esc(staff.fullName)}" style="width:${photoSize}px; height:${photoSize}px; border-radius:${photoRadius}; display:block; border:0; object-fit:cover;" />`
    : "";

  const nameBlockHtml = hasPhoto
    ? `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
        <td valign="${photoValign}" style="vertical-align:${photoValign}; padding-right:12px;">${photoInlineImg}</td>
        <td valign="${photoValign}" style="vertical-align:${photoValign};">${nameHtml}${titleHtml}${companyHtml}</td>
      </tr></table>`
    : `${nameHtml}${titleHtml}${companyHtml}`;

  // Compact layout uses a slightly different text block (title + inline links).
  const compactTextHtml = `
    ${nameHtml}
    <div style="${smallStyle} margin-top:2px;">${esc(staff.jobTitle)}${companyDisplayName ? ` · ${esc(companyDisplayName)}` : ""}</div>
    <div style="${baseFont} margin-top:6px;">
      ${staff.mobile ? `<a href="tel:${esc(staff.mobile)}" style="${linkStyle} margin-right:10px;">${esc(staff.mobile)}</a>` : ""}
      ${staff.email ? `<a href="mailto:${esc(staff.email)}" style="${linkStyle}">${esc(staff.email)}</a>` : ""}
    </div>
    ${socialsHtml}
  `;
  const compactBlockHtml = hasPhoto
    ? `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
        <td valign="${photoValign}" style="vertical-align:${photoValign}; padding-right:12px;">${photoInlineImg}</td>
        <td valign="${photoValign}" style="vertical-align:${photoValign};">${compactTextHtml}</td>
      </tr></table>`
    : compactTextHtml;

  if (layout === "stacked") {
    // Stacked = true single column: logo row → photo row → name/title/company
    // row → contact rows → socials → CTA. Everything is left-aligned inside
    // its own row (respecting logoHAlign for the logo). We deliberately do NOT
    // use nameBlockHtml here because that inlines the photo next to the name,
    // which would make Stacked visually identical to Horizontal.
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${logoUrl ? `<tr><td align="${logoHAttr}" style="padding-bottom:10px; text-align:${logoHAttr};"><img src="${esc(logoUrl)}" width="${logoWidth}" alt="" style="width:${logoWidth}px; height:auto; border:0; display:block; ${logoImgMargin}" /></td></tr>` : ""}
        ${hasPhoto ? `<tr><td style="padding-bottom:10px;"><img src="${esc(staff.photoUrl)}" width="${photoSize}" alt="${esc(staff.fullName)}" style="width:${photoSize}px; height:${photoSize}px; border-radius:${photoRadius}; display:block; border:0; object-fit:cover;" /></td></tr>` : ""}
        <tr><td>${nameHtml}${titleHtml}${companyHtml}</td></tr>
        <tr><td style="padding-top:8px;">${contactBlock}</td></tr>
        <tr><td>${socialsHtml}</td></tr>
        <tr><td>${ctaHtml}</td></tr>
        ${makeBannerHtml(1)}
        ${makeBadgesHtml(1)}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "compact") {
    const compactCols = (logoUrl ? 1 : 0) + 1;
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoCell}
          <td valign="${logoValign}" style="vertical-align:${logoValign}; padding-left:${logoUrl && showDivider ? 20 : logoUrl ? 16 : 0}px;">
            ${compactBlockHtml}
          </td>
        </tr>
        ${makeBannerHtml(compactCols)}
        ${makeBadgesHtml(compactCols)}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "photo-left") {
    // photo-left keeps the old “portrait leads, contact stack below” shape:
    // photo on the far left, name/title/contact/socials/CTA all in the right
    // column. This is the one place we intentionally do NOT inline the photo
    // next to just the name.
    const photoLeftCols = (hasPhoto ? 1 : 0) + 1;
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${photoCell}
          <td valign="${photoValign}" style="vertical-align:${photoValign};">
            ${nameHtml}${titleHtml}${companyHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${makeBannerHtml(photoLeftCols)}
        ${makeBadgesHtml(photoLeftCols)}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "banner") {
    // Banner-first: banner image sits ABOVE the signature and is the loudest
    // element. Falls back to a normal horizontal shape if no banner is set.
    const bannerCols = (logoUrl ? 1 : 0) + 1;
    const bannerAbove = bannerUrl
      ? `<tr><td colspan="${bannerCols}" style="padding-bottom:14px;">${bannerCellInner}</td></tr>`
      : "";
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${bannerAbove}
        <tr>
          ${logoCell}
          <td valign="${logoValign}" style="vertical-align:${logoValign}; padding-left:${logoUrl && showDivider ? 20 : logoUrl ? 16 : 0}px;">
            ${nameBlockHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "card") {
    // Card: whole signature wrapped in a rounded bordered box so it visually
    // sits apart from the email body. Uses `border` on the outer table for
    // Outlook compatibility instead of CSS box-shadow.
    const horizCols = (logoUrl ? 1 : 0) + 1;
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate; border:1px solid ${dividerColor}; border-radius:12px; padding:16px 18px; background:#ffffff;">
        <tr>
          ${logoCell}
          <td valign="${logoValign}" style="vertical-align:${logoValign}; padding-left:${logoUrl && showDivider ? 20 : logoUrl ? 16 : 0}px;">
            ${nameBlockHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${makeBannerHtml(horizCols)}
        ${makeBadgesHtml(horizCols)}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "divided") {
    // Divided: force a vertical rule between logo column and text column and
    // add subtle horizontal separators between the name block and contact rows
    // regardless of the showDivider setting (the whole point of this layout).
    const dividedCols = (logoUrl ? 1 : 0) + 1;
    // Rebuild logo cell with a mandatory strong vertical rule.
    const dividedLogoCell = logoUrl
      ? `<td valign="${logoValign}" align="${logoHAttr}" width="${logoWidth}" style="width:${logoWidth}px; min-width:${logoWidth}px; padding-right:20px; vertical-align:${logoValign}; text-align:${logoHAttr}; border-right:2px solid ${dividerColor};"><img src="${esc(logoUrl)}" width="${logoWidth}" alt="${esc(companyDisplayName || "logo")}" style="width:${logoWidth}px; height:auto; display:block; border:0; ${logoImgMargin}" /></td>`
      : "";
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${dividedLogoCell}
          <td valign="${logoValign}" style="vertical-align:${logoValign}; padding-left:${logoUrl ? 20 : 0}px;">
            ${nameBlockHtml}
            <div style="height:1px; background:${dividerColor}; margin:10px 0;"></div>
            ${contactBlock}
            ${socialsHtml || ctaHtml ? `<div style="height:1px; background:${dividerColor}; margin:10px 0;"></div>` : ""}
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${makeBannerHtml(dividedCols)}
        ${makeBadgesHtml(dividedCols)}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "centered") {
    // Centered: everything center-aligned in one column. Photo (if present)
    // sits at the top as a portrait, then logo, name, contact, socials, CTA.
    // Nested tables use `align="center"` + `margin:0 auto` so the whole block
    // centers, not just the text inside each cell. Contact rows are rebuilt
    // as a single centered line each (icon+value inline) instead of a left-
    // anchored two-column table.
    const centeredContactLine = (
      row: "phone" | "mobile" | "email" | "website",
      iconId: string,
      label: string,
      value: string,
      href: string,
    ) => {
      if (!value) return "";
      const linked = href
        ? `<a href="${esc(href)}" style="${linkStyle}">${esc(value)}</a>`
        : esc(value);
      const indicator = label.trim()
        ? `<span style="color:${mutedColor}; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; font-size:${Math.max(10, fontSize - 2)}px; margin-right:6px;">${esc(label)}</span>`
        : `<img src="${contactIconUri(row, iconId, accentColor)}" width="14" height="14" alt="" style="display:inline-block; border:0; vertical-align:middle; margin-right:6px;" />`;
      return `<div style="${baseFont} padding:2px 0; text-align:center; line-height:1.5;">${indicator}${linked}</div>`;
    };
    const centeredContact = `
      ${showPhone ? centeredContactLine("phone", brand.phoneIcon, phoneLabel, phoneVal, phoneVal ? `tel:${phoneVal.replace(/\s+/g, "")}` : "") : ""}
      ${showMobile ? centeredContactLine("mobile", brand.mobileIcon, mobileLabel, staff.mobile, staff.mobile ? `tel:${staff.mobile.replace(/\s+/g, "")}` : "") : ""}
      ${centeredContactLine("email", brand.emailIcon, emailLabel, staff.email, staff.email ? `mailto:${staff.email}` : "")}
      ${showWebsite ? centeredContactLine("website", brand.websiteIcon, websiteLabel, websiteVal, normalizeUrl(websiteVal)) : ""}
      ${showAddress && addressVal ? `<div style="${baseFont} padding:2px 0; text-align:center; line-height:1.5;"><img src="${pinIconUri(accentColor)}" width="14" height="14" alt="" style="display:inline-block; border:0; vertical-align:middle; margin-right:6px;" />${esc(addressVal)}</div>` : ""}
    `;
    // Rebuild socials without the trailing right-margin so the row is truly centred.
    const centeredSocials =
      showSocialIcons && allSocials.length > 0
        ? `<div style="margin-top:8px; text-align:center; line-height:0;">${allSocials
            .map(
              (s, i) =>
                `<a href="${esc(normalizeUrl(s.url))}" style="text-decoration:none; display:inline-block; ${i === allSocials.length - 1 ? "" : "margin-right:8px;"}"><img src="${socialIconUri(s.network, brand.socialIconStyle, accentColor, mutedColor)}" width="${socialSize}" height="${socialSize}" alt="${esc(s.network)}" style="border:0; vertical-align:middle;" /></a>`,
            )
            .join("")}</div>`
        : "";
    // CTA row: strip trailing margin-right by centring the container.
    const centeredCta =
      allCtas.length > 0
        ? `<div style="margin-top:10px; line-height:1.9; text-align:center;">${allCtas.map(renderCta).join("")}</div>`
        : "";
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse; margin:0 auto;">
        ${hasPhoto ? `<tr><td align="center" style="padding-bottom:10px; text-align:center;"><img src="${esc(staff.photoUrl)}" width="${photoSize}" alt="${esc(staff.fullName)}" style="width:${photoSize}px; height:${photoSize}px; border-radius:${photoRadius}; display:inline-block; border:0; object-fit:cover; margin:0 auto;" /></td></tr>` : ""}
        ${logoUrl ? `<tr><td align="center" style="padding-bottom:10px; text-align:center;"><img src="${esc(logoUrl)}" width="${logoWidth}" alt="" style="width:${logoWidth}px; height:auto; border:0; display:inline-block; margin:0 auto;" /></td></tr>` : ""}
        <tr><td align="center" style="text-align:center;">${nameHtml}${titleHtml}${companyHtml}</td></tr>
        <tr><td align="center" style="padding-top:8px; text-align:center;">${centeredContact}</td></tr>
        <tr><td align="center" style="text-align:center;">${centeredSocials}</td></tr>
        <tr><td align="center" style="text-align:center;">${centeredCta}</td></tr>
        ${makeBannerHtml(1)}
        ${makeBadgesHtml(1)}
        ${disclaimerHtml}
      </table>
    `;
  } else {
    // horizontal (default): logo | [photo + name/title/company] over contact rows
    const horizCols = (logoUrl ? 1 : 0) + 1;
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoCell}
          <td valign="${logoValign}" style="vertical-align:${logoValign}; padding-left:${logoUrl && showDivider ? 20 : logoUrl ? 16 : 0}px;">
            ${nameBlockHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${makeBannerHtml(horizCols)}
        ${makeBadgesHtml(horizCols)}
        ${disclaimerHtml}
      </table>
    `;
  }

  // Free-plan watermark. Sits below the disclaimer, faded and small.
  const watermark =
    plan === "free"
      ? `<div style="margin-top:14px;font-family:${brand.fontFamily},sans-serif;font-size:10px;color:#94a3b8;">Signature by <a href="https://signaturely.app" style="color:#94a3b8;text-decoration:none;">Signaturely</a></div>`
      : "";

  return `<div style="${baseFont}">${inner}${watermark}</div>`;
}

export function renderSignaturePlain({ brand, staff, plan }: RenderArgs): string {
  const lines: string[] = [];
  lines.push(staff.fullName);
  if (staff.jobTitle) lines.push([staff.jobTitle, staff.department].filter(Boolean).join(" · "));
  if (brand.companyDisplayName) lines.push(brand.companyDisplayName);
  if (staff.phone) lines.push(`${brand.phoneLabel}: ${staff.phone}`);
  if (staff.mobile) lines.push(`${brand.mobileLabel}: ${staff.mobile}`);
  if (staff.email) lines.push(`${brand.emailLabel}: ${staff.email}`);
  const web = staff.website || brand.companyWebsite;
  if (web) lines.push(`${brand.websiteLabel}: ${web}`);
  const addr = staff.address || brand.companyAddress;
  if (addr) lines.push(addr);
  if (brand.disclaimer) lines.push("", brand.disclaimer);
  if (plan === "free") lines.push("", "Signature by Signaturely — signaturely.app");
  return lines.join("\n");
}
