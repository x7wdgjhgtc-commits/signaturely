import type { BrandConfig, Staff } from "@shared/schema";

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

// Small inline SVG icons as data URIs — email clients block linked images
// less aggressively than inline <svg>, and data URIs display everywhere.
function iconDataUri(kind: string, color: string): string {
  const c = encodeURIComponent(color);
  const svg: Record<string, string> = {
    phone: `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z'/></svg>`,
    mobile: `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='2' width='14' height='20' rx='2'/><line x1='12' y1='18' x2='12' y2='18'/></svg>`,
    mail: `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'/><polyline points='22,6 12,13 2,6'/></svg>`,
    globe: `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='2' y1='12' x2='22' y2='12'/><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/></svg>`,
    pin: `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg>`,
    linkedin: `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='${color}'><path d='M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z'/></svg>`,
    twitter: `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='${color}'><path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/></svg>`,
    instagram: `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='2' width='20' height='20' rx='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'/></svg>`,
    facebook: `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='${color}'><path d='M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z'/></svg>`,
  };
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg[kind] || "")}`;
}

interface RenderArgs {
  brand: BrandConfig;
  staff: Staff;
}

export function renderSignatureHtml({ brand, staff }: RenderArgs): string {
  const {
    layout,
    logoUrl,
    logoWidth,
    primaryColor,
    textColor,
    mutedColor,
    dividerColor,
    accentColor,
    fontFamily,
    fontSize,
    nameBold,
    showPhoto,
    showDivider,
    showSocialIcons,
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

  const baseFont = `font-family:${fontFamily}, Arial, sans-serif; font-size:${fontSize}px; line-height:1.45; color:${textColor};`;
  const smallStyle = `${baseFont} color:${mutedColor}; font-size:${Math.max(10, fontSize - 1)}px;`;
  const linkStyle = `color:${accentColor}; text-decoration:none;`;

  const contactRow = (icon: string, label: string, value: string, href: string) => {
    if (!value) return "";
    const linked = href
      ? `<a href="${esc(href)}" style="${linkStyle}">${esc(value)}</a>`
      : esc(value);
    const labelPart = label
      ? `<span style="color:${mutedColor}; font-weight:600; margin-right:6px;">${esc(label)}</span>`
      : "";
    const iconImg = `<img src="${iconDataUri(icon, accentColor)}" width="14" height="14" alt="" style="vertical-align:middle; margin-right:6px; border:0;" />`;
    return `<tr><td style="${baseFont} padding:2px 0;">${iconImg}${labelPart}${linked}</td></tr>`;
  };

  const socialLink = (kind: string, url: string) => {
    if (!url) return "";
    return `<a href="${esc(normalizeUrl(url))}" style="text-decoration:none; margin-right:8px; display:inline-block;"><img src="${iconDataUri(kind, accentColor)}" width="18" height="18" alt="${kind}" style="border:0; vertical-align:middle;" /></a>`;
  };

  const contactBlock = `
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      ${contactRow("phone", phoneLabel, staff.phone || companyPhone, staff.phone ? `tel:${staff.phone.replace(/\s+/g, "")}` : "")}
      ${contactRow("mobile", mobileLabel, staff.mobile, staff.mobile ? `tel:${staff.mobile.replace(/\s+/g, "")}` : "")}
      ${contactRow("mail", emailLabel, staff.email, staff.email ? `mailto:${staff.email}` : "")}
      ${contactRow("globe", websiteLabel, staff.website || companyWebsite, normalizeUrl(staff.website || companyWebsite))}
      ${contactRow("pin", "", staff.address || companyAddress, "")}
    </table>
  `;

  const socialsHtml = showSocialIcons
    ? `<div style="margin-top:8px;">
        ${socialLink("linkedin", staff.linkedin)}
        ${socialLink("twitter", staff.twitter)}
        ${socialLink("instagram", staff.instagram)}
        ${socialLink("facebook", staff.facebook)}
      </div>`
    : "";

  const nameHtml = `<div style="${baseFont} font-size:${fontSize + 3}px; font-weight:${nameBold ? 700 : 600}; color:${primaryColor}; letter-spacing:0.2px;">${esc(staff.fullName)}${staff.pronouns ? `<span style="${smallStyle} font-weight:400; margin-left:6px;">(${esc(staff.pronouns)})</span>` : ""}</div>`;

  const titleHtml = staff.jobTitle
    ? `<div style="${baseFont} color:${textColor}; font-weight:600; margin-top:1px;">${esc(staff.jobTitle)}${staff.department ? `<span style="color:${mutedColor}; font-weight:400;"> · ${esc(staff.department)}</span>` : ""}</div>`
    : "";

  const companyHtml = companyDisplayName
    ? `<div style="${baseFont} color:${primaryColor}; font-weight:600; margin-top:2px;">${esc(companyDisplayName)}</div>${tagline ? `<div style="${smallStyle} font-style:italic;">${esc(tagline)}</div>` : ""}`
    : "";

  const ctaHtml =
    ctaText && ctaUrl
      ? `<div style="margin-top:10px;"><a href="${esc(normalizeUrl(ctaUrl))}" style="display:inline-block; background:${accentColor}; color:#ffffff; text-decoration:none; padding:6px 12px; border-radius:4px; ${baseFont} color:#ffffff; font-weight:600;">${esc(ctaText)}</a></div>`
      : "";

  const bannerHtml = bannerUrl
    ? `<tr><td style="padding-top:10px;">${bannerHref ? `<a href="${esc(normalizeUrl(bannerHref))}" style="text-decoration:none;">` : ""}<img src="${esc(bannerUrl)}" alt="" style="max-width:520px; height:auto; display:block; border:0;" />${bannerHref ? "</a>" : ""}</td></tr>`
    : "";

  const disclaimerHtml = disclaimer
    ? `<tr><td style="${smallStyle} padding-top:10px; max-width:520px;">${esc(disclaimer)}</td></tr>`
    : "";

  const photoCell =
    showPhoto && staff.photoUrl
      ? `<td valign="top" style="padding-right:16px;"><img src="${esc(staff.photoUrl)}" width="90" alt="${esc(staff.fullName)}" style="width:90px; height:90px; border-radius:50%; display:block; border:0; object-fit:cover;" /></td>`
      : "";

  const logoCell = logoUrl
    ? `<td valign="top" style="padding-right:16px; border-right:${showDivider ? `2px solid ${dividerColor}` : "0"};"><img src="${esc(logoUrl)}" width="${logoWidth}" alt="${esc(companyDisplayName || "logo")}" style="width:${logoWidth}px; height:auto; display:block; border:0;" /></td>`
    : "";

  // ---------- Layouts ----------
  let inner = "";

  if (layout === "stacked") {
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${logoUrl ? `<tr><td style="padding-bottom:10px;"><img src="${esc(logoUrl)}" width="${logoWidth}" alt="" style="width:${logoWidth}px; height:auto; border:0; display:block;" /></td></tr>` : ""}
        <tr><td>${nameHtml}${titleHtml}${companyHtml}</td></tr>
        <tr><td style="padding-top:8px;">${contactBlock}</td></tr>
        <tr><td>${socialsHtml}</td></tr>
        <tr><td>${ctaHtml}</td></tr>
        ${bannerHtml}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "compact") {
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoCell}
          <td valign="top" style="padding-left:${logoUrl ? 16 : 0}px;">
            ${nameHtml}
            <div style="${smallStyle} margin-top:2px;">${esc(staff.jobTitle)}${companyDisplayName ? ` · ${esc(companyDisplayName)}` : ""}</div>
            <div style="${baseFont} margin-top:6px;">
              ${staff.mobile ? `<a href="tel:${esc(staff.mobile)}" style="${linkStyle} margin-right:10px;">${esc(staff.mobile)}</a>` : ""}
              ${staff.email ? `<a href="mailto:${esc(staff.email)}" style="${linkStyle}">${esc(staff.email)}</a>` : ""}
            </div>
            ${socialsHtml}
          </td>
        </tr>
        ${bannerHtml}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "photo-left") {
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${photoCell}
          <td valign="top">
            ${nameHtml}${titleHtml}${companyHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${bannerHtml}
        ${disclaimerHtml}
      </table>
    `;
  } else if (layout === "banner") {
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoCell}
          <td valign="top" style="padding-left:${logoUrl ? 16 : 0}px;">
            ${nameHtml}${titleHtml}${companyHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        <tr><td colspan="2" style="padding-top:12px;">${bannerUrl ? `${bannerHref ? `<a href="${esc(normalizeUrl(bannerHref))}">` : ""}<img src="${esc(bannerUrl)}" alt="" style="max-width:560px; height:auto; display:block; border:0;" />${bannerHref ? "</a>" : ""}` : ""}</td></tr>
        ${disclaimerHtml}
      </table>
    `;
  } else {
    // horizontal (default)
    inner = `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logoCell}
          <td valign="top" style="padding-left:${logoUrl ? 16 : 0}px;">
            ${nameHtml}${titleHtml}${companyHtml}
            <div style="padding-top:8px;">${contactBlock}</div>
            ${socialsHtml}
            ${ctaHtml}
          </td>
        </tr>
        ${bannerHtml}
        ${disclaimerHtml}
      </table>
    `;
  }

  return `<div style="${baseFont}">${inner}</div>`;
}

export function renderSignaturePlain({ brand, staff }: RenderArgs): string {
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
  return lines.join("\n");
}
