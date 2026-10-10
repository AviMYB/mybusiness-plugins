/**
 * CSAT public page - NATIVE variant: no phone in the link, no web2table, no Config flag.
 *
 * Link contract (references: url-contract.md §1b):
 *     <page-url>?<RATING_FIELD>=<value>&c=<record objectId>
 *
 * Page markup (GUIDE.md Step 4, native variant) - two Database forms on the INTAKE table, each with
 * an invisible reCAPTCHA (<div class="g-recaptcha-invisible"></div>), data-success="":
 *     form#csatRate     <input type="hidden" name="<RATING_FIELD>">            - submitted automatically
 *     form#csatComment  <textarea name="<COMMENT_FIELD>"> + a Send button     - optional, shown after the rating
 *     <p id="csatStatus"></p> outside the forms
 * Form rule on #csatRate:  value-from-url  on <RATING_FIELD>   (the URL parameter is named like the field)
 * cssCode:                 #csatComment { display: none; }
 *
 * The rating is saved ON LOAD through the native save - the platform verifies the invisible reCAPTCHA,
 * the intake CLP lets "*" create, the pointer to the business record is set here (the business table
 * stays completely closed), and the projection trigger copies the answer onto the record.
 * The comment is a SECOND intake row (rating repeated) - the intake table stays create-only.
 *
 * ── Replace before deploying ─────────────────────────────────────────────────────────────────────
 *   __RECORD_FIELD__     Pointer on the intake table -> business object   (e.g. CaseId)
 *   __RECORD_CLASS__     the business class                               (e.g. Cases)
 *   __RATING_FIELD__     Number field on the intake table                 (e.g. OverallRating)
 *   __RESPONDED_FIELD__  Date field on the intake table, or '' to skip    (e.g. RespondedAt)
 *   LABELS               the tenant's wording, approved by the process owner; keys = the rating values
 * Avoid the byte sequence c-l-s-= and window-dot-open in this file (edge WAF on page JS).
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var RECORD_FIELD    = '__RECORD_FIELD__';
  var RECORD_CLASS    = '__RECORD_CLASS__';
  var RATING_FIELD    = '__RATING_FIELD__';
  var RESPONDED_FIELD = '__RESPONDED_FIELD__';

  var LABELS = {
    '3': 'תודה! שמחים לשמוע שהיינו לעזר.',
    '2': 'תודה על המשוב. נשמח לדעת מה היה יכול להיות טוב יותר.',
    '1': 'תודה שאמרת. המשוב הזה מגיע לאחראי ונטפל בו.'
  };

  var rate = $('#csatRate'), comment = $('#csatComment'), status = $('#csatStatus');
  var q = new URLSearchParams(window.location.search);
  var recId = q.get('c');
  var rating = q.get(RATING_FIELD);

  function say(text) { status.text(text); }          // .text(), never .html() - the query string is untrusted

  // both forms: link to the business record (createWithoutData - nothing is read) + stamp the time
  $(document).on('simbla-object-before-save', '#csatRate, #csatComment', function (e, data) {
    data.obj.set(RECORD_FIELD, Simbla.Object.extend(RECORD_CLASS).createWithoutData(recId));
    if (RESPONDED_FIELD) data.obj.set(RESPONDED_FIELD, new Date());
  });
  // the comment row repeats the rating so it is self-describing
  $(document).on('simbla-object-before-save', '#csatComment', function (e, data) {
    data.obj.set(RATING_FIELD, Number(rating));
  });
  var sentKey = 'csat:' + recId + ':' + rating;
  $(document).on('simbla-object-saved', '#csatRate', function () {
    try { window.sessionStorage.setItem(sentKey, '1'); } catch (e) { /* private mode */ }
    say(LABELS[rating]);
    comment.show();
  });
  $(document).on('simbla-object-saved', '#csatComment', function () {
    comment.hide();
    say('תודה! המשוב שלך התקבל.');
  });
  $(document).on('simbla-object-saved-error', '#csatRate, #csatComment', function () {
    say('לא הצלחנו לרשום את התשובה. אפשר להשיב למייל ונטפל בזה.');
  });

  if (!recId || !LABELS.hasOwnProperty(rating)) {
    rate.hide(); comment.hide();
    say('הקישור אינו תקין. נסו שוב מהקישור שנשלח אליכם.');
    return;
  }

  // a reload / second open of the same link must not create a second rating row
  // (the key is written only after a successful save - a failed attempt can be retried by reloading)
  try {
    if (window.sessionStorage.getItem(sentKey)) { say('הדירוג שלך כבר נרשם. תודה!'); comment.show(); return; }
  } catch (e) { /* private mode - at worst one extra row */ }

  say('רושמים את הדירוג שלך...');
  var tries = 0;
  (function waitAndSubmit() {
    // the platform renders the widget after its script loads and stores its id on the form;
    // submitting earlier would send no token and the save would be refused
    if (rate.data('captcha') === undefined || !rate.find('[name="' + RATING_FIELD + '"]').val()) {
      if (++tries < 40) return setTimeout(waitAndSubmit, 250);
      return say('לא הצלחנו לרשום את הדירוג. נסו לרענן את הדף.');
    }
    rate.trigger('submit');
  })();
})();
