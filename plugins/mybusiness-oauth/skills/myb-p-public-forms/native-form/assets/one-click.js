// One-click submission over the NATIVE path. Paste into Edit-Page-CSS-JS(jsCode) of a public page whose
// Database form carries:
//   - <div class="g-recaptcha-invisible"></div>              (invisible widget - executes on submit)
//   - <input type="hidden" name="Rating" id="Rating">       (or any field the link carries)
//   - a form rule  value-from-url  on Rating               (the URL parameter is named like the field)
// Link:  https://<tenant-host>/<Page>?Rating=<n>&c=<record objectId>
//
// Verified (KB 30-customization/15-public-forms.md §3.10): the rating is saved with zero clicks, the pointer
// to a completely closed business table is accepted, a projection trigger copies it onto the record.
// A visitor Google flags sees a challenge before the save - it still records once solved.
//
// Replace the constants. Avoid the byte sequence c-l-s-= and window-dot-open in this file (edge WAF).
(function () {
  var FORM_ID      = 'PF20';      // id of the Database form (the skeleton's default)
  var VALUE_FIELD  = 'Rating';      // the field the link fills; submit only when it has a value
  var RECORD_FIELD = 'CaseId';      // Pointer on the intake table -> business record
  var RECORD_CLASS = 'Cases';
  var RECORD_PARAM = 'c';

  var form = $('#' + FORM_ID);
  var q = new URLSearchParams(window.location.search);
  var recordId = q.get(RECORD_PARAM);

  $(document).on('simbla-object-before-save', '#' + FORM_ID, function (e, data) {
    if (recordId) data.obj.set(RECORD_FIELD, Simbla.Object.extend(RECORD_CLASS).createWithoutData(recordId));
  });

  // a reload / second open of the same link must not create a second row; the key is written only
  // after a successful save, so a failed attempt can be retried by reloading
  var sentKey = 'pf-sent:' + window.location.pathname + ':' + (recordId || '') + ':' + (q.get(VALUE_FIELD) || '');
  function alreadySent() {
    try { return !!window.sessionStorage.getItem(sentKey); } catch (e) { return false; }
  }
  $(document).on('simbla-object-saved', '#' + FORM_ID, function () {
    try { window.sessionStorage.setItem(sentKey, '1'); } catch (e) { /* private mode - at worst one extra row */ }
  });

  var tries = 0;
  (function waitAndSubmit() {
    // the platform renders the widget after its script loads and stores the id on the form;
    // submitting before that would send no token and the save is refused
    if (form.data('captcha') === undefined || !form.find('[name="' + VALUE_FIELD + '"]').val()) {
      if (++tries < 40) return setTimeout(waitAndSubmit, 250);
      return;
    }
    if (alreadySent()) { form.append('<div class="text-success simbla-form"><label>הדירוג כבר נרשם. תודה!</label></div>'); return; }
    form.trigger('submit');
  })();
})();
