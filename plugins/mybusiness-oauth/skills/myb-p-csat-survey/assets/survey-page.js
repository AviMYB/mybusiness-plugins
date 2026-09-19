/**
 * CSAT public page — records a satisfaction rating from a one-click email link.
 *
 * Link contract (see references/url-contract.md):
 *     <page-url>?c=<recordObjectId>&p=<phone>&r=<ratingValue>
 *
 * The rating is posted ON LOAD. The visitor never presses anything to be counted;
 * the comment box is offered afterwards and is optional. This is the whole point —
 * a survey that needs a second action loses most of its respondents.
 *
 * Why web2table and not a direct write (verified platform behaviour):
 *   - anonymous Parse REST writes are CAPTCHA-gated even with an open CLP,
 *   - web2table bypasses CLP, so the intake table stays closed,
 *   - web2table CREATES only — hence a staging row + a projection trigger,
 *   - web2table hard-requires `phone`, hence `p` in the link.
 *
 * ── Replace before deploying ────────────────────────────────────────────────
 *   __APP_ID__          tenant application id
 *   __INTAKE_TABLE__    intake class name            (e.g. SatisfactionSurveys)
 *   __RECORD_FIELD__    pointer field on the intake table -> business object (e.g. CaseId)
 *   __RATING_FIELD__    Number field on the intake table  (e.g. OverallRating)
 *   __COMMENT_FIELD__   String field on the intake table  (e.g. AdditionalComments)
 *   __RESPONDED_FIELD__ Date field on the intake table    (e.g. RespondedAt)
 *   RATING_LABELS       the tenant's wording, approved by the process owner
 * ────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var APP_ID   = '__APP_ID__';
  var ENDPOINT = 'https://api.mbapps.co.il/functions/' + APP_ID + '/web2table';

  var F = {
    record:    'table___RECORD_FIELD__',
    rating:    'table___RATING_FIELD__',
    comment:   'table___COMMENT_FIELD__',
    responded: 'table___RESPONDED_FIELD__'
  };

  // Accepted rating values and the thank-you wording for each.
  // Keep the keys in sync with the `r` values used in the email links.
  var RATING_LABELS = {
    '3': 'תודה! שמחים לשמוע שהיינו לעזר.',
    '2': 'תודה על המשוב. נשמח לדעת מה היה יכול להיות טוב יותר.',
    '1': 'תודה שאמרת. המשוב הזה מגיע לאחראי ונטפל בו.'
  };

  var q       = new URLSearchParams(window.location.search);
  var recId   = q.get('c');
  var phone   = q.get('p');
  var rating  = q.get('r');

  var root = document.getElementById('csat-root') || document.body;

  // ── helpers ───────────────────────────────────────────────────────────────

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;   // textContent, never innerHTML — the query string is untrusted input
    return n;
  }

  function render(title, message, node) {
    root.textContent = '';
    var box = el('div', 'csat-box');
    box.appendChild(el('h2', 'csat-title', title));
    if (message) box.appendChild(el('p', 'csat-message', message));
    if (node) box.appendChild(node);
    root.appendChild(box);
  }

  function post(extraFields) {
    var body = {
      table: '__INTAKE_TABLE__',
      phone: phone,              // hard-required by web2table
      CampaignName: 'CSAT',      // web2table stamps this column regardless — give it a useful value
      PageName: 'csat-survey'
    };
    body[F.record] = recId;      // bare 10-char objectId, NOT a wrapped pointer object
    Object.keys(extraFields).forEach(function (k) { body[k] = extraFields[k]; });

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Parse-Application-Id': APP_ID },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) throw new Error('web2table ' + res.status);
      return res.json();
    });
  }

  // Strip c/p/r from the address bar once we have them — the phone should not
  // linger in the URL, in the browser history, or in a screenshot.
  function cleanUrl() {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) { /* non-fatal */ }
  }

  // A reload must not create a second rating row.
  function alreadySent(key) {
    try {
      if (window.sessionStorage.getItem(key)) return true;
      window.sessionStorage.setItem(key, '1');
    } catch (e) { /* private mode — fall through, at worst one extra row */ }
    return false;
  }

  // ── the comment step (optional, after the rating is already banked) ────────

  function commentForm() {
    var wrap = el('div', 'csat-comment');
    var ta = el('textarea', 'csat-textarea');
    ta.setAttribute('rows', '4');
    ta.setAttribute('placeholder', 'רוצה להוסיף משפט? (לא חובה)');
    var btn = el('button', 'csat-send', 'שליחה');
    btn.type = 'button';

    btn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { render('תודה על הדירוג!', ''); return; }
      btn.disabled = true;
      var fields = {};
      fields[F.comment]   = text;
      fields[F.rating]    = Number(rating);   // repeat the rating so the row is self-describing
      fields[F.responded] = new Date().toISOString();
      post(fields)
        .then(function () { render('תודה!', 'המשוב שלך התקבל.'); })
        .catch(function () { render('תודה על הדירוג!', 'ההערה לא נשמרה, אבל הדירוג נרשם.'); });
    });

    wrap.appendChild(ta);
    wrap.appendChild(btn);
    return wrap;
  }

  // ── main ──────────────────────────────────────────────────────────────────

  if (!recId || !phone || !RATING_LABELS.hasOwnProperty(rating)) {
    render('הקישור אינו תקין', 'נסה שוב מהקישור שנשלח במייל.');
    return;
  }

  if (alreadySent('csat:' + recId + ':' + rating)) {
    render('תודה!', 'הדירוג שלך כבר נרשם.');
    cleanUrl();
    return;
  }

  render('רגע…', 'רושמים את הדירוג שלך.');

  var first = {};
  first[F.rating]    = Number(rating);        // Number — a String here breaks every average
  first[F.responded] = new Date().toISOString();

  post(first)
    .then(function () {
      cleanUrl();
      render('תודה על הדירוג!', RATING_LABELS[rating], commentForm());
    })
    .catch(function (err) {
      cleanUrl();
      // 403 = the AcceptWebToTable Config flag is off; 422 = phone missing/invalid.
      render('משהו השתבש', 'לא הצלחנו לרשום את הדירוג. אפשר להשיב למייל ונטפל בזה.');
      if (window.console) console.error('[csat]', err);
    });
})();
